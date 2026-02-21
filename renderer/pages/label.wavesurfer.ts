import WaveSurfer from "wavesurfer.js";
import SpectrogramPlugin from "wavesurfer.js/dist/plugins/spectrogram";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline";
import { Region } from "wavesurfer.js/dist/plugins/regions";

import { Recording, RegionOfInterest, Species } from "../../main/schema";
import { ColormapOption, computeColormap } from "../utils/colormaps";
import styles from "./label.module.css";

export interface Entry {
  recording: Recording;
  regions: RegionOfInterest[];
  id: string;
}

export interface RegionWithData extends Region {
  species: Species | null;
  confidence: number;
  loop: boolean;
  isNew: boolean;
}

export interface WavesurferInstanceDependencies {
  sampleRate: string;
  playbackRate: number;
  colormap: ColormapOption;
  zoomX: number;
  zoomY: number;
  fftSamplesForZoom: (zoom: number) => 256 | 512 | 1024;
  BASE_SPECTRO_HEIGHT: number;
  stageRef: React.MutableRefObject<HTMLDivElement>;
  timelineDotRef: React.MutableRefObject<HTMLDivElement | null>;
  instances: React.MutableRefObject<Record<string, WavesurferInstance>>;

  // Region callbacks — set by the parent after creation so the class can
  // call back into React state without circular deps.
  regionListRef: React.MutableRefObject<Record<string, RegionWithData>>;
  selectedRegionRef: React.MutableRefObject<RegionWithData | null>;
  removeListRef: React.MutableRefObject<Set<string>>;
  wipeRegions: () => void;
  assignSpeciesToRegion: (region: RegionWithData, species: Species) => void;

  playingRef: React.MutableRefObject<boolean>;
  selectedSpeciesIdRef: React.MutableRefObject<number>;
  speciesMap: Record<number, Species>;

  setPlaying: (v: boolean) => void;
  setSpeciesDropdownState: (state: { region: any; top: number; left: number } | null) => void;
}

export class WavesurferInstance {
  id: string;
  audioURL: string = "";
  entry: Entry;

  container!: HTMLDivElement;
    waveformWrapper!: HTMLDivElement;
      waveformContainer!: HTMLDivElement;
    spectrogramWrapper!: HTMLDivElement;
      spectrogramContainer!: HTMLDivElement;

  wavesurfer: WaveSurfer;
  spectrogramPlugin: SpectrogramPlugin;
  regionsPlugin: RegionsPlugin | null = null;
  timelinePlugin: TimelinePlugin | null = null;

  isMounted: boolean = false;
  isLoading: boolean = false;
  toBeCleanedUp: boolean = false;

  private deps: WavesurferInstanceDependencies;

  private constructor(entry: Entry, deps: WavesurferInstanceDependencies) {
    this.id = entry.id;
    this.entry = entry;
    this.deps = deps;

    // -------------------------------------------------------------------------
    // DOM nodes

    const container = document.createElement("div");
    container.className = `${styles.wavesurferContainer} ${styles.prefetchWave}`;

    const waveformWrapper = document.createElement("div");
    waveformWrapper.classList.add(styles.waveContainerWrapper);
    container.appendChild(waveformWrapper);

    const waveformContainer = document.createElement("div");
    waveformContainer.id = `waveform-${this.id}`;
    waveformContainer.classList.add(styles.waveContainer);
    waveformWrapper.appendChild(waveformContainer);

    const spectrogramWrapper = document.createElement("div");
    spectrogramWrapper.classList.add(styles.spectrogramContainerWrapper);
    container.appendChild(spectrogramWrapper);

    const spectrogramContainer = document.createElement("div");
    spectrogramContainer.id = `spectrogram-${this.id}`;
    spectrogramContainer.classList.add(styles.spectrogramContainer);
    spectrogramWrapper.appendChild(spectrogramContainer);

    this.container = container;
    this.waveformWrapper = waveformWrapper;
    this.waveformContainer = waveformContainer;
    this.spectrogramWrapper = spectrogramWrapper;
    this.spectrogramContainer = spectrogramContainer;
    document.body.appendChild(container);

    // -------------------------------------------------------------------------
    // WaveSurfer core

    const ws = WaveSurfer.create({
      container: this.waveformContainer,
      waveColor: "violet",
      progressColor: "purple",
      sampleRate: parseInt(deps.sampleRate),
      height: 128,
    });
    ws.setPlaybackRate(deps.playbackRate, false);
    this.wavesurfer = ws;
  }

  // Create: "preloads" wavesurfer instance, doesn't mount yet, stores in instances map
  public static async create(
    entry: Entry,
    deps: WavesurferInstanceDependencies,
  ): Promise<WavesurferInstance> {
    const { instances } = deps;

    if (instances.current[entry.id]) {
      console.warn(`Entry ${entry.id} already exists. Create aborted.`);
      return instances.current[entry.id];
    }

    const instance = new WavesurferInstance(entry, deps);
    instances.current[entry.id] = instance;
    instance.isLoading = true;

    // Spectrogram plugin
    const spectrogramPlugin = SpectrogramPlugin.create({
      container: instance.spectrogramContainer,
      colorMap: computeColormap(deps.colormap),
      fftSamples: deps.fftSamplesForZoom(deps.zoomX),
      height: deps.BASE_SPECTRO_HEIGHT * deps.zoomY,
      labels: true,
    });
    instance.wavesurfer.registerPlugin(spectrogramPlugin);
    instance.spectrogramPlugin = spectrogramPlugin;

    const audioFile = await window.ipc.invoke(
      "read-file-for-verification",
      entry.recording.url,
    );
    instance.audioURL = URL.createObjectURL(new Blob([audioFile.data]));
    await instance.wavesurfer.load(instance.audioURL);

    if (instance.toBeCleanedUp) {
      instance.isLoading = false;
      instance.cleanup();
      return instance;
    }

    // Expand the clickable shadow-dom wrapper to cover waveform + spectrogram
    const shadowHost = instance.waveformContainer.querySelector<HTMLElement>("div");
    if (shadowHost?.shadowRoot) {
      const wrapper = shadowHost.shadowRoot.querySelector<HTMLElement>(".wrapper");
      if (wrapper) wrapper.style.height = "384px";
    }

    // Scroll forwarding
    const handleScroll = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.deltaX !== 0) {
        instance.waveformWrapper.scrollLeft += e.deltaX;
        instance.spectrogramWrapper.scrollLeft += e.deltaX;
      }
      if (e.deltaY !== 0) {
        instance.spectrogramWrapper.scrollTop += e.deltaY;
      }
    };
    instance.container.addEventListener("wheel", handleScroll as EventListener, {
      passive: false,
    });

    instance.isLoading = false;
    return instance;
  }

  // Mount: attaches to the live DOM stage and registers per-session plugins
  public mount() {
    if (this.isMounted) return;

    const {
      stageRef,
      timelineDotRef,
      regionListRef,
      selectedRegionRef,
      removeListRef,
      wipeRegions,
      playingRef,
      selectedSpeciesIdRef,
      speciesMap,
      setPlaying,
      setSpeciesDropdownState,
      assignSpeciesToRegion,
    } = this.deps;

    // Move container into the visible stage
    this.container.parentElement?.removeChild(this.container);
    this.container.className = `${styles.wavesurferContainer} ${styles.activeWave}`;
    stageRef.current.appendChild(this.container);

    const ws = this.wavesurfer;

    // -------------------------------------------------------------------------
    // Timeline plugin

    const timelineContainer = document.getElementById("wave-timeline");
    if (!timelineContainer) {
      console.error("Missing timeline container, abort mount");
      return;
    }

    this.timelinePlugin = TimelinePlugin.create({
      container: "#wave-timeline",
      height: 20,
    });
    ws.registerPlugin(this.timelinePlugin);

    timelineContainer.style.position = "relative";
    timelineContainer.style.overflow = "visible";

    // Remove any leftover dot from a previous mount
    timelineContainer
      .querySelectorAll("div[data-timeline-dot]")
      .forEach((d) => timelineContainer.removeChild(d));

    const dot = document.createElement("div");
    dot.setAttribute("data-timeline-dot", "true");
    Object.assign(dot.style, {
      position: "absolute",
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      backgroundColor: "black",
      top: "50%",
      transform: "translateY(-50%)",
      left: "0px",
    });
    timelineContainer.appendChild(dot);
    timelineDotRef.current = dot;

    ws.on("audioprocess", (currentTime) => {
      const duration = ws.getDuration();
      if (!duration) return;
      const fraction = currentTime / duration;
      dot.style.left = fraction * (timelineContainer.offsetWidth || 0) + "px";
    });

    const clickHandler = (event: MouseEvent) => {
      const rect = timelineContainer.getBoundingClientRect();
      const clickX =
        event.clientX - rect.left + this.waveformWrapper.scrollLeft;
      const fraction = clickX / this.waveformWrapper.scrollWidth;
      dot.style.left = fraction * (timelineContainer.offsetWidth || 0) + "px";
    };
    this.waveformContainer.addEventListener("click", clickHandler);
    ws.on("destroy", () =>
      this.waveformContainer.removeEventListener("click", clickHandler),
    );

    // -------------------------------------------------------------------------
    // Regions plugin

    this.regionsPlugin = (RegionsPlugin as any).create({
      name: "regions",
      regions: [],
      drag: true,
      resize: true,
      color: "rgba(0, 255, 0, 0.3)",
      dragSelection: true,
    }) as RegionsPlugin;
    ws.registerPlugin(this.regionsPlugin);

    wipeRegions();
    this.regionsPlugin.enableDragSelection({ color: "rgba(0,255,0,0.3)" }, 3);

    const redraw = (region: Region) => {
      const waveHeight = this.waveformContainer.offsetHeight;
      const spectroHeight = this.spectrogramContainer.offsetHeight;
      region.element.style.position = "absolute";
      region.element.style.top = "0px";
      region.element.style.height = `${waveHeight + spectroHeight}px`;
      region.element.style.zIndex = "99";
    };

    let createdInitialRegions = false;

    const selectRegion = (region: RegionWithData | null) => {
      if (!createdInitialRegions || !region) return;
      const current = selectedRegionRef.current as RegionWithData;
      if (current === region) {
        region.setOptions({ color: "rgba(0,255,0,0.3)" });
        region.loop = false;
        selectedRegionRef.current = null;
      } else {
        if (current) {
          current.setOptions({ color: "rgba(0,255,0,0.3)" });
          current.loop = false;
        }
        region.setOptions({ color: "rgba(255,0,0,0.3)" });
        region.loop = true;
        selectedRegionRef.current = region;
      }
    };

    const populateRegionData = (region: Region): RegionWithData => {
      (region as RegionWithData).species = null;
      (region as RegionWithData).confidence = 0;
      (region as RegionWithData).loop = false;
      (region as RegionWithData).isNew = createdInitialRegions;
      return region as RegionWithData;
    };

    this.regionsPlugin.on("region-created", (region: RegionWithData) => {
      const populated = populateRegionData(region);
      regionListRef.current[region.id] = populated;
      selectRegion(populated);
      setTimeout(() => redraw(region), 50);
    });

    this.regionsPlugin.on("region-removed", (region: RegionWithData) => {
      selectRegion(null);
      if (!region.isNew) removeListRef.current.add(region.id);
      delete regionListRef.current[region.id];
    });

    this.regionsPlugin.on("region-updated", (region: any) => {
      redraw(region);
      selectRegion(region);
    });

    this.regionsPlugin.on("region-clicked", (region: any) => selectRegion(region));

    this.regionsPlugin.on("region-out", (region: any) => {
      if (playingRef.current && region.loop) region.play();
    });

    this.regionsPlugin.on("region-double-clicked", (region: any) => {
      assignSpeciesToRegion(region, speciesMap[selectedSpeciesIdRef.current]);
      const rect = region.element.getBoundingClientRect();
      setSpeciesDropdownState({
        region,
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
      });
    });

    // Restore pre-existing regions from DB
    this.entry.regions.forEach((r) => {
      this.regionsPlugin!.addRegion({
        start: r.starttime,
        end: r.endtime,
        color: "rgba(0, 255, 0, 0.3)",
        id: String(r.regionId),
      });
    });
    createdInitialRegions = true;

    ws.on("finish", () => setPlaying(false));

    this.isMounted = true;
  }
  
  // Unmount: detaches from live DOM, destroys per-session plugins
  public unmount() {
    if (!this.isMounted) return;

    const { timelineDotRef } = this.deps;

    try {
      this.wavesurfer.unAll();

      this.regionsPlugin?.unAll();
      this.regionsPlugin?.destroy();
      this.regionsPlugin = null;
      this.deps.wipeRegions();

      this.timelinePlugin?.unAll();
      this.timelinePlugin?.destroy();
      this.timelinePlugin = null;

      const timelineContainer = document.getElementById("wave-timeline");
      if (timelineContainer && timelineDotRef.current) {
        try {
          timelineContainer.removeChild(timelineDotRef.current);
        } catch (_) {}
        timelineDotRef.current = null;
      }

      this.isMounted = false;
    } catch (e) {
      console.warn("Error destroying plugins:", e);
    }

    this.container.parentElement?.removeChild(this.container);
    this.container.className = `${styles.wavesurferContainer} ${styles.prefetchWave}`;
    document.body.appendChild(this.container);
  }

  // Cleanup: full destroy, removes from instances map
  public cleanup() {
    this.toBeCleanedUp = true;
    if (this.isLoading) return;
    if (this.isMounted) this.unmount();

    const { timelineDotRef, instances } = this.deps;

    try {
      this.wavesurfer.destroy();

      if (timelineDotRef.current) {
        const timelineContainer = document.getElementById("wave-timeline");
        if (timelineContainer) {
          try {
            timelineContainer.removeChild(timelineDotRef.current);
          } catch (_) {}
        }
        timelineDotRef.current = null;
      }
    } catch (e) {
      console.warn("Error destroying wavesurfer:", e);
    }

    URL.revokeObjectURL(this.audioURL);
    this.container.remove();
    delete instances.current[this.id];
  }
}