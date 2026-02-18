import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from 'react-dom'
import Head from "next/head";
import Image from "next/image";
import styles from "./label.module.css";

import WaveSurfer from "wavesurfer.js";
import SpectrogramPlugin from "wavesurfer.js/dist/plugins/spectrogram";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline";
import { Region } from "wavesurfer.js/src/plugin/regions";
import {
  Annotation,
  Recording,
  RegionOfInterest,
  Species,
} from "../../main/schema";

import { SelectRecordingsButton } from "../components/SelectRecordingsButton";
import { Slider, LogSlider } from "../components/Slider";
import { COLORMAP_OPTIONS, ColormapOption, computeColormap } from "../utils/colormaps";
import { SpeciesDropdown } from "../components/SpeciesDropdown";

type Entry = {
  recording: Recording;
  regions: RegionOfInterest[];
  id: string;
};

const DEFAULT_ZOOM_X = 1;
const DEFAULT_ZOOM_Y = 1;
const ZOOM_STEP = 0.25;

const AudioPlayer: React.FC = () => {
  // Settings
  const [useConfidence, setUseConfidence] = useState(false);
  const [useAdditional, setUseAdditional] = useState(false);
  const [maxConfidence, setMaxConfidence] = useState(10);
  useEffect(() => {
    setUseConfidence(localStorage.getItem('disableConfidence') === 'false');
    setUseAdditional(localStorage.getItem('disableAdditional') === 'false');
    setSampleRate(localStorage.getItem('sampleRate') || sampleRate);
    setMaxConfidence(Number(localStorage.getItem('confidenceRange') || maxConfidence));
    setConfidence(Number(localStorage.getItem('confidenceRange')));
    setColormap(localStorage.getItem('labelColorScheme') as ColormapOption);
  }, []);

  // UI state
  const [showSpec, setShowSpec] = useState(false);
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(playing);
  playingRef.current = playing; // we need this ref since wavesurfer region's capture stale playing state
  const [index, setIndex] = useState(0);

  // Annotation state
  const [confidence, setConfidence] = useState(10);
  const [callType, setCallType] = useState("");
  const [notes, setNotes] = useState("");

  // Playback controls
  const [playbackRate, setPlaybackRate] = useState(1);
  const [sampleRate, setSampleRate] = useState('44100');

  // Region & species
  const regionListRef = useRef<any[]>([]);
  const activeRegionRef = useRef<any>(null);
  const [speciesMap, setSpeciesMap] = useState<Record<number, Species>>({});
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<number>(0);
  const selectedSpeciesIdRef = useRef(0);
  const [speciesDropdownState, setSpeciesDropdownState] = useState<{
    region: any;
    top: number;
    left: number;
  } | null>(null);

  selectedSpeciesIdRef.current = selectedSpeciesId;

  // Data entries
  const [entries, _setEntries] = useState<Entry[]>([]);
  const setEntries = useCallback(
    (
      valueOrUpdater:
        | Entry[]
        | ((prev: Entry[]) => Entry[]),
    ) => {
      _setEntries((prevMetas) => {
        const nextMetas =
          typeof valueOrUpdater === "function"
            ? (valueOrUpdater as (prev: Entry[]) => Entry[])(prevMetas)
            : valueOrUpdater;

        return nextMetas;
      });
    },
    [],
  );

  // Wavesurfers
  class WavesurferInstance {
    id: string; // entry id
    audioURL: string = "";
    entry: Entry;

    container!: HTMLDivElement;
      waveformWrapper!: HTMLDivElement;
        waveformContainer!: HTMLDivElement;
      spectrogramWrapper!: HTMLDivElement;
        spectrogramContainer!: HTMLDivElement;

    wavesurfer: WaveSurfer;
    spectrogramPlugin: SpectrogramPlugin;
    regionsPlugin: RegionsPlugin | null; // exists only when mounted
    timelinePlugin: TimelinePlugin | null; // exists only when mounted

    isMounted: boolean = false;
    isLoading: boolean = false;
    toBeCleanedUp: boolean = false;

    public constructor(entry: Entry) {
      const id = entry.id;
      this.id = id;
      this.entry = entry;

      // ===================================================================================
      // Setup DOM Nodes

      // container
      const container = document.createElement('div');
      container.className = `
        ${styles.wavesurferContainer} 
        ${styles.prefetchWave}
      `;

      // waveform container
      const waveformWrapper = document.createElement("div");
      waveformWrapper.classList.add(styles.waveContainerWrapper);
      container.appendChild(waveformWrapper);

      const waveformContainer = document.createElement("div");
      waveformContainer.id = `waveform-${id}`;
      waveformContainer.classList.add(styles.waveContainer);
      waveformWrapper.appendChild(waveformContainer);

      // spectrogram container
      const spectrogramWrapper = document.createElement("div");
      spectrogramWrapper.classList.add(styles.spectrogramContainerWrapper);
      container.appendChild(spectrogramWrapper);

      const spectrogramContainer = document.createElement("div");
      spectrogramContainer.id = `spectrogram-${id}`;
      spectrogramContainer.classList.add(styles.spectrogramContainer);
      spectrogramWrapper.appendChild(spectrogramContainer);
      
      // final
      this.container = container;
      this.waveformWrapper = waveformWrapper;
      this.waveformContainer = waveformContainer;
      this.spectrogramWrapper = spectrogramWrapper;
      this.spectrogramContainer = spectrogramContainer;
      document.body.appendChild(container);

      // ===================================================================================
      // Wavesurfer

      const ws = WaveSurfer.create({
        container: this.waveformContainer,
        waveColor: "violet",
        progressColor: "purple",
        sampleRate: parseInt(sampleRate),
        height: 128,
      });
      ws.setPlaybackRate(playbackRate, false);
      this.wavesurfer = ws;
    }

    public static async create(entry: Entry): Promise<WavesurferInstance> {
      const id = entry.id;
      const filePath = entry.recording.url;

      if (instances.current[id]) {
        console.warn(`Entry ${id} already exists. Create aborted`); // shouldn't happen since we always check before create()
        return instances.current[id];
      }

      const instance = new WavesurferInstance(entry);
      instances.current[id] = instance;

      instance.isLoading = true;

      const ws = instance.wavesurfer;

      const audioFile = await window.ipc.invoke('read-file-for-verification', filePath);
      instance.audioURL = URL.createObjectURL(new Blob([audioFile.data]));
      await ws.load(instance.audioURL); 

      if (instance.toBeCleanedUp) {
        instance.isLoading = false;
        instance.cleanup(); // early cleanup
      }

      // ===================================================================================
      // Spectrogram Plugin

      const spectrogramPlugin = SpectrogramPlugin.create({
        container: instance.spectrogramContainer,
        colorMap: computeColormap(colormap),
        fftSamples: fftSamplesForZoom(zoomX),
        height: BASE_SPECTRO_HEIGHT * zoomY,
        labels: true,
      })
      ws.registerPlugin(spectrogramPlugin);

      // ===================================================================================
      // Resize Clickable Area to Combined Height Of Waveform + Spectrogram

      const shadowHost = instance.waveformContainer.querySelector<HTMLElement>('div');

      if (shadowHost?.shadowRoot) {
        const wrapper =
          shadowHost.shadowRoot.querySelector<HTMLElement>('.wrapper');
        if (wrapper) {
          wrapper.style.height = '384px';
        }
      }

      // ===================================================================================
      // Scroll Forwarding (For Zoom)

      const handleScroll = (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey) return;

        e.preventDefault();
        e.stopPropagation();

        const dx = e.deltaX;
        const dy = e.deltaY;

        // Forward x-scroll to waveContainerWrapper and spectrogramContainer
        if (dx !== 0) {
          instance.waveformWrapper.scrollLeft += dx;
          instance.spectrogramWrapper.scrollLeft += dx;
        }

        // Forward y-scroll to spectrogramContainer only
        if (dy !== 0) {
          instance.spectrogramWrapper.scrollTop += dy;
        }
      };
      instance.container.addEventListener("wheel", handleScroll as EventListener, { passive: false });
      instance.isLoading = false;

      return instance;
    }
  
    public mount() {
      if (this.isMounted) return;

      this.container.parentElement.removeChild(this.container);
      this.container.className = `
        ${styles.wavesurferContainer} 
        ${styles.activeWave}
      `;
      stageRef.current.appendChild(this.container);

      const ws = this.wavesurfer;

      // ===================================================================================
      // Timeline Plugin
      
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

      const existingDots = timelineContainer.querySelectorAll("div[data-timeline-dot]");
      existingDots.forEach((dot) => timelineContainer.removeChild(dot));

      const dot = document.createElement("div");
      dot.setAttribute("data-timeline-dot", "true");
      dot.style.position = "absolute";
      dot.style.width = "8px";
      dot.style.height = "8px";
      dot.style.borderRadius = "50%";
      dot.style.backgroundColor = "black";
      dot.style.top = "50%";
      dot.style.transform = "translateY(-50%)";
      dot.style.left = "0px";

      timelineContainer.appendChild(dot);
      timelineDotRef.current = dot;

      ws.on("audioprocess", (currentTime) => {
        const duration = ws.getDuration();
        if (!duration) return;
        const fraction = currentTime / duration;
        const timelineWidth = timelineContainer?.offsetWidth || 0;
        dot.style.left = fraction * timelineWidth + "px";
      });
      
      const clickHandler = (event: MouseEvent) => { // for moving timeline dot when seeking (ws internally handles seek)
        const rect = timelineContainer.getBoundingClientRect();
        const clickX = event.clientX - rect.left + this.waveformWrapper.scrollLeft;
        const fraction = clickX / this.waveformWrapper.scrollWidth;
        
        const timelineWidth = timelineContainer?.offsetWidth || 0;
        dot.style.left = fraction * timelineWidth + "px";
      };

      this.waveformContainer.addEventListener("click", clickHandler);
      ws.on("destroy", () => {
        this.waveformContainer.removeEventListener("click", clickHandler);
      });
      
      // ===================================================================================
      // Regions Plugin

      this.regionsPlugin = (RegionsPlugin as any).create({
        name: "regions",
        regions: [],
        drag: true,
        resize: true,
        color: "rgba(0, 255, 0, 0.3)",
        dragSelection: true,
      }) as RegionsPlugin;
      ws.registerPlugin(this.regionsPlugin);

      activeRegionRef.current = null;
      this.regionsPlugin.enableDragSelection({ color: "rgba(0,255,0,0.3)" }, 3);

      const redraw = (region) => {
        const waveHeight = this.waveformContainer.offsetHeight;
        const spectroHeight = this.spectrogramContainer.offsetHeight;
        region.element.style.position = "absolute";
        region.element.style.top = "0px";
        region.element.style.height = `${waveHeight + spectroHeight}px`;
        region.element.style.zIndex = "99";
      };

      let createdInitialRegions = false;
      const selectRegion = (region) => {
        if (!createdInitialRegions || !region) return;

        const activeRegion = activeRegionRef.current;

        if (activeRegion === region) {
          // Deselect the region
          region.setOptions({ color: "rgba(0,255,0,0.3)" });
          region.data = { ...region.data, loop: false };
          activeRegionRef.current = null;
        } else {
          // Reset previously active region
          if (activeRegion) {
            activeRegion.setOptions({ color: "rgba(0,255,0,0.3)" });
            activeRegion.data = { ...activeRegion.data, loop: false };
          }
          // Select new region
          region.setOptions({ color: "rgba(255,0,0,0.3)" });
          region.data = { ...region.data, loop: true };
          activeRegionRef.current = region;
        }

        console.log(region.data);
      };

      this.regionsPlugin.on("region-created", (region: any) => {
        //redraw(region);
        selectRegion(region);
        regionListRef.current.push(region);
        setTimeout(() => {
          redraw(region);
        }, 50);
      });

      this.regionsPlugin.on("region-removed", (region: any) => {
        selectRegion(null);
        if (region.id.startsWith("imported-")) {
          const id = Number.parseInt(region.id.split("imported-")[1]);
          removeList.push(id);
        }
      });

      this.regionsPlugin.on("region-updated", (region: any) => {
        redraw(region);
        selectRegion(region);
      });

      this.regionsPlugin.on("region-clicked", (region: any) => {
        selectRegion(region);
      });

      this.regionsPlugin.on("region-out", (region: any) => {
        if (playingRef.current && region.data?.loop) {
          region.play();
        }
      });

      this.regionsPlugin.on("region-double-clicked", (region: any) => {
        assignSpecies(region, speciesMap[selectedSpeciesIdRef.current]);

        const rect = region.element.getBoundingClientRect();
        setSpeciesDropdownState({
          region,
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
        });
      });

      this.entry.regions.forEach((r) => {
        this.regionsPlugin.addRegion({
          start: r.starttime,
          end: r.endtime,
          color: "rgba(0, 255, 0, 0.3)",
          id: "imported-" + r.regionId,
        });
      })
      createdInitialRegions = true;

      ws.on("finish", () => {
        setPlaying(false);
      });

      this.isMounted = true;
    }

    public unmount() {
      if (!this.isMounted) return;

      try {
        this.wavesurfer.unAll();

        this.regionsPlugin.unAll();
        this.regionsPlugin.destroy();
        this.regionsPlugin = null;

        this.timelinePlugin.unAll();
        this.timelinePlugin.destroy();
        this.timelinePlugin = null;

        const timelineContainer = document.getElementById("wave-timeline");
        if (timelineContainer && timelineDotRef.current) {
          try {
            timelineContainer.removeChild(timelineDotRef.current);
          } catch (e) {
            // Dot might already be removed
          }
          timelineDotRef.current = null;
        }

        this.isMounted = false;
      } catch (e) {
        console.warn("Error destroying plugins:", e);
      }

      const container = this.container;
      //if (container.parentElement) {
        container.parentElement.removeChild(container);
      //}
      container.className = `
        ${styles.wavesurferContainer} 
        ${styles.prefetchWave}
      `;
      
      document.body.appendChild(container);
    }

    public cleanup() {
      this.toBeCleanedUp = true;
      if (this.isLoading) return; // should never happen
      if (this.isMounted) { // can happen
        this.unmount();
      }

      try {
        this.wavesurfer.destroy();

        if (timelineDotRef.current) {
          const timelineContainer = document.getElementById("wave-timeline");
          if (timelineContainer) {
            try {
              timelineContainer.removeChild(timelineDotRef.current);
            } catch (e) {
              // Dot might already be removed
            }
          }
          timelineDotRef.current = null;
        }
      } catch (e) {
        console.warn("Error destroying wavesurfer:", e);
      }
      
      URL.revokeObjectURL(this.audioURL);

      this.container.remove();
      delete instances.current[this.id]; // handles removing from instances array for us
    }
  }
  const instances = useRef<Record<string, WavesurferInstance>>({})
  const idsToPreload = entries.slice(Math.max(0, index-1), Math.min(entries.length, index+2)).map(entry => entry.id);
  const currentId = entries[index]?.id ?? null;
  const currentEntry = entries[index];

  const stageRef = useRef<HTMLElement>()
  useEffect(() => {
    stageRef.current = document.getElementById("stage")
  })

  // Button‑disable flags
  const [isPrevDisabled, setPrevDisabled] = useState(false);
  const [isNextDisabled, setNextDisabled] = useState(false);
  const [isYesDisabled, setYesDisabled] = useState(false);
  const [isNoDisabled, setNoDisabled] = useState(false);
  const removeList: number[] = [];

  const timelineDotRef = useRef<HTMLDivElement | null>(null);

  // Zoom controls
  const [zoomX, setZoomX] = useState(DEFAULT_ZOOM_X);
  const [zoomY, setZoomY] = useState(DEFAULT_ZOOM_Y);

  // Preferences
	const [colormap, setColormap] = useState<ColormapOption>(COLORMAP_OPTIONS[0]);

  // =====================================================================================================
  // Wavesurfer Management

  // dimensions matching the CSS
  const BASE_WAVE_HEIGHT = 128;
  const BASE_SPECTRO_HEIGHT = 256;

  const fftSamplesForZoom = (zoom: number): 256 | 512 | 1024 => {
    if (zoom >= 4) return 1024;
    if (zoom >= 2) return 512;
    return 256;
  };

  // Unmount, create, and mount on page update or entries update
  useEffect(() => {
    if (!showSpec || !currentEntry) return;
    if (entries.length === 0) {
      setShowSpec(false);
      setIndex(0);
      console.log("No more audioclips");
      return;
    }

    // cleanup
    Object.entries(instances.current).forEach(([key, instance]) => {
      if (!idsToPreload.includes(key)) { 
        instance.cleanup();
      }
    });

    // optional preload
    if (index + 1 < entries.length && !instances.current[entries[index+1].id]) {
      WavesurferInstance.create(entries[index+1]);
    }

    (async () => {
      let instance;
      if (!instances.current[currentId]) { // create new
        instance = await WavesurferInstance.create(currentEntry);
      } else { // get existing one
        instance = instances.current[currentId];
      }
      instance.mount();
    })();

    return () => {
      if (instances.current[currentId]) {
        instances.current[currentId].unmount();
      }
    }
  }, [index, entries]);

  // Cleanup everything on component unmount
  useEffect(() => {
    return () => {
      Object.entries(instances.current).forEach(([key, instance]) => {
        instance.cleanup();
      });
    };
  }, []);

  // Update zoom on changes - resize divs directly
  useEffect(() => {
    const instance = instances.current[currentId];
    if (!instance) return;

    const hiddenContainer = instance.container;
    const waveformContainer = instance.waveformContainer;
    const spectrogramContainer = instance.spectrogramContainer;

    // Base width is the visible stage width; zooming expands beyond it (stage scrolls)
    const stageEl = document.getElementById("stage");
    const baseWidth = stageEl ? stageEl.clientWidth : hiddenContainer.offsetWidth;

    if (waveformContainer) {
      waveformContainer.style.transform = '';
      waveformContainer.style.transformOrigin = '';
      waveformContainer.style.width = `${baseWidth * zoomX}px`;
    }

    if (spectrogramContainer) {
      spectrogramContainer.style.transform = '';
      spectrogramContainer.style.transformOrigin = '';
      spectrogramContainer.style.width = `${baseWidth * zoomX}px`;
      spectrogramContainer.style.height = `${BASE_SPECTRO_HEIGHT * zoomY}px`;
    }

    if (instance.spectrogramPlugin) {
      (instance.spectrogramPlugin as any).height = BASE_SPECTRO_HEIGHT * zoomY;
      (instance.spectrogramPlugin as any).render();
    }
  }, [zoomX, zoomY, currentId]);

  // =====================================================================================================
  // Zoom Button Handlers

  const zoomXIn = () => setZoomX((prev) => Math.min(prev + ZOOM_STEP, 10));
  const zoomXOut = () => setZoomX((prev) => Math.max(prev - ZOOM_STEP, 1));
  const zoomYIn = () => setZoomY((prev) => Math.min(prev + ZOOM_STEP, 10));
  const zoomYOut = () => setZoomY((prev) => Math.max(prev - ZOOM_STEP, 1));
  const resetZoom = () => {
    setZoomX(DEFAULT_ZOOM_X);
    setZoomY(DEFAULT_ZOOM_Y);
  };

  // =====================================================================================================
  // Button Handlers 

  const clickPrev = async () => {
    if (isPrevDisabled) {
      return;
    }
    setConfidence(maxConfidence);
    setPrevDisabled(true);
    setPlaying(false);
    if (index === 0) return;
    setIndex((prevIndex) => prevIndex - 1);

    setTimeout(() => {
      setPrevDisabled(false);
    }, 500);
  };

  const clickNext = async () => {
    if (isNextDisabled) {
      return;
    }
    setConfidence(maxConfidence);
    setNextDisabled(true);
    setPlaying(false);
    if (index === entries.length - 1) return;
    setIndex((prevIndex) => prevIndex + 1);
    setTimeout(() => {
      setNextDisabled(false);
    }, 500);
  };

  const clickPlay = useCallback(async () => {
    const instance = instances.current[currentId];
    if (!instance) return;

    const wsInstance = instance.wavesurfer;
    if (activeRegionRef.current) {
      activeRegionRef.current.play();
    } else if (wsInstance) {
      wsInstance.playPause();
    }
    setPlaying(true);
  }, [entries, index]);

  const clickPause = useCallback(async () => {
    const instance = instances.current[currentId];
    if (!instance) return;

    const wsInstance = instance.wavesurfer;
    wsInstance.playPause();
    setPlaying(false);
  }, [entries, index]);

  const clickYes = useCallback(async () => {
    if (isYesDisabled) return;
    setConfidence(maxConfidence);
    setYesDisabled(true);

    const instance = instances.current[currentId];
    if (!instance) return;

    const ws = instance.wavesurfer;
    const regionPlugin = (ws as any).plugins[1];
    const allRegions = regionPlugin?.wavesurfer?.plugins[2]?.regions;

    const removeRegions = async () => {
      for (const removed of removeList) {
        console.log("removed following region of interest", removed);
        await window.api.deleteRegionOfInterest(removed);
      }
    };

    if (!allRegions || !Object.keys(allRegions).length) {
      await removeRegions();
    } else {
      const regionValues = Object.values(allRegions) as Region[];
      for (let idx = 0; idx < regionValues.length; idx++) {
        const region = regionValues[idx];
    
        let regionId;
        if (region.id.startsWith("imported-")) {
          const id = Number.parseInt(region.id.split("imported-")[1]);
          console.log("Calling updateRegionOfInterest with:", id, region.start, region.end);
          await window.api.updateRegionOfInterest(id, region.start, region.end);
          regionId = id;
        } else {
          const newRegion = await window.api.createRegionOfInterest(
            currentEntry.recording.recordingId,
            region.start,
            region.end,
          );
          regionId = newRegion.regionId;
          console.log("New region created with ID:", regionId, region);
        }

        console.log(region.data);
        if (region.data?.species && region.data?.confidence) {
          const species: Species = region.data.species as Species;

          const confidence = Number.parseInt(region.data?.confidence as string);
          const username = localStorage.getItem("username") ?? "";
          const email = localStorage.getItem("email") ?? "";
          const labelerId = await window.api.getOrCreateLabeler(username, email);
          console.log("creating new annotations");
          await window.api.createAnnotation(
            currentEntry.recording.recordingId,
            labelerId,
            regionId,
            species.speciesId,
            confidence,
          );
        } else {
          console.log("no annotation");
        }
      };
    }

    await removeRegions();

    if (index === 0) {
      if (entries.length === 1) {
        setShowSpec(false);
        await instance.cleanup();
        setEntries([]);
      } else {
        await instance.cleanup();
        setEntries((arr) => arr.slice(1));
        setIndex(0);
      }
      setTimeout(() => setYesDisabled(false), 500);
      return;
    }

    await instance.cleanup();
    setEntries((arr) => arr.filter((_, i) => i !== index));
    if (entries.length - 1 >= index) setIndex((i) => i - 1);
    setTimeout(() => setYesDisabled(false), 500);
  }, [entries, index, isYesDisabled, confidence, callType, notes]);

  const clickNo = useCallback(async () => {
    if (isNoDisabled) {
      return;
    }
    setNoDisabled(true);
    setConfidence(maxConfidence);

    const instance = instances.current[currentId];
    if (!instance) return;

    if (index == 0) {
      await instance.cleanup();
      
      if (entries.length === 1) {
        setShowSpec(false);
      }
      setEntries((wavesurfers) => wavesurfers.slice(1));
      setIndex(0);
      
      setTimeout(() => {
        setNoDisabled(false);
      }, 500);
      return;
    }
    await instance.cleanup();
    setEntries((wavesurfers) => wavesurfers.filter((_, i) => i !== index));

    if (entries.length == 0) {
      setEntries([]);
    }
    if (entries.length - 1 >= index) {
      setIndex(index - 1);
    }

    setTimeout(() => {
      setNoDisabled(false);
    }, 500);
  }, [entries, index, isNoDisabled]);

  const importFromDB = async (recordings, skippedCount = 0) => {
    console.log("recordings:", recordings);

    Object.entries(instances.current).forEach(([key, instance]) => {
      instance.cleanup();
    });

    if (!Array.isArray(recordings)) {
      console.error("Expected recordings to be an array, got:", recordings);
      return;
    }

    if (recordings.length == 0) {
      const message = skippedCount > 0 
        ? `No recordings found. ${skippedCount} file(s) were skipped due to missing or unreadable files. Maybe you forgot to plug in an external drive or the drive label changed from last time?`
        : "No recordings found. Try a different filter or upload recordings!";
      alert(message);
      return;
    }

    if (skippedCount > 0) {
      alert(`Warning: ${skippedCount} file(s) were skipped due to missing or unreadable files. Maybe you forgot to plug in an external drive or the drive label changed from last time? Loaded ${recordings.length} recording(s).`);
    }

    const newWaveSurfers: Entry[] = await Promise.all(
      (recordings as Recording[]).map(async (rec, i) => {
        const regions = await window.api.listRegionOfInterestByRecordingId(
          rec.recordingId,
        );

        return {
          recording: rec,
          regions: regions || [],
          id: String(i),
          class: "spectrogramContainer" as const,
          isCreating: false,
          isMounted: false,
        };
      }),
    );

    setEntries(newWaveSurfers);
    setShowSpec(true);
    setIndex(0);
    regionListRef.current = [];
    activeRegionRef.current = null;
  };

  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        const listOfSpecies = await window.api.listSpecies();
        const newSpeciesMap: Record<number, Species> = {};
        listOfSpecies.forEach((spec) => {
          newSpeciesMap[spec.speciesId] = spec;
        })
        setSpeciesMap(newSpeciesMap);
        setSelectedSpeciesId(listOfSpecies[0].speciesId);
      } catch (error) {
        console.error("Failed to fetch species list:", error);
      }
    };

    fetchSpecies();
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
        return;
      }

      switch (event.key) {
        case "w":
          clickYes();
          break;
        case "p":
          if (playing) {
            clickPause();
          } else {
            clickPlay();
          }
          break;
        case "d":
          clickNo();
          break;
        case "ArrowRight":
          clickNext();
          break;
        case "a":
        case "ArrowLeft":
          clickPrev();
          break;
        default:
          break;
      }
    },
    [playing, clickYes, clickPlay, clickPause, clickNo, clickNext, clickPrev],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // =====================================================================================================
  // Regions & Species 
  
  const deleteActiveRegion = async () => {
    const ws = instances.current[currentId];
    if (!ws || !activeRegionRef.current) return;

    activeRegionRef.current.remove();
    
    // Remove the region from regionList
    regionListRef.current = regionListRef.current.filter(
      region => region !== activeRegionRef.current
    );
    
    activeRegionRef.current = null;
  };

  const clearAllRegions = () => {
    const ws = instances.current[currentId];
    if (!ws) return;

    const allRegions = (instances.current[currentId].regionsPlugin as any).regions;
    if (!allRegions) return;

    Object.keys(allRegions).forEach((r) => {
      allRegions[r].remove();
    });

    regionListRef.current = [];
    activeRegionRef.current = null;
  };

  const undoLastRegion = () => {
    if (!instances.current[currentId]) return;
    if (regionListRef.current.length === 0) return;

    const lastRegion = regionListRef.current.pop();
    lastRegion.remove();

    if (activeRegionRef.current === lastRegion) {
      activeRegionRef.current = null;
    }
  };

  const assignSpecies = (region: any, species: Species) => {
    if (!region) {
      console.log("No active region selected.");
      return;
    }

    if (!species) {
      region.data = {
        ...region.data,
        label: undefined,
        species: undefined,
        confidence: confidence,
      };
    } else {
      region.data = {
        ...region.data,
        label: species.species,
        species: species,
        confidence: confidence,
      };
    }

    console.log(region.data)

    const regionEl = region.element;
    let labelElem = regionEl.querySelector(".region-label");
    if (!labelElem) {
      labelElem = document.createElement("span");
      labelElem.className = "region-label";
      regionEl.appendChild(labelElem);
    }
    labelElem.textContent = species?.common;
  };

  const [modalEnable, setModalEnable] = useState(false);

  return (
    <React.Fragment>
      <Head>
        <title>Label Page</title>
      </Head>
      <div className={styles.container}>
        <div className={styles.main}>
          <div className={styles.header}>
            <SelectRecordingsButton importFromDB={importFromDB} />

            <div className="w-64">
              Default Species:
              <SpeciesDropdown
                speciesMap={speciesMap}
                speciesId={selectedSpeciesId}
                onChange={(selectedOption) => {
                  setSelectedSpeciesId(selectedOption.speciesId);
                }}
              />
            </div>
          </div>
          {showSpec && (
            <div>
              {showSpec && entries.length > 0 && (
                <div className={styles.audioInfo}>
                  <p>
                    File {index + 1} of {entries.length}:{" "}
                    {currentEntry?.recording.url}
                  </p>
                </div>
              )}
              {showSpec && (
                <div id="stage" className={styles.stage}>
                  
                  {/* Zoom Controls Overlay */}
                  <div className={styles.zoomControls}>
                    <div className={styles.zoomGroup}>
                      <span className={styles.zoomLabel}>X</span>
                      <button
                        className={styles.zoomBtn}
                        onClick={zoomXOut}
                        title="Zoom out horizontal"
                        aria-label="Zoom out horizontal"
                      >−</button>
                      <span className={styles.zoomValue}>{zoomX.toFixed(1)}×</span>
                      <button
                        className={styles.zoomBtn}
                        onClick={zoomXIn}
                        title="Zoom in horizontal"
                        aria-label="Zoom in horizontal"
                      >+</button>
                    </div>

                    <div className={styles.zoomDivider} />

                    <div className={styles.zoomGroup}>
                      <span className={styles.zoomLabel}>Y</span>
                      <button
                        className={styles.zoomBtn}
                        onClick={zoomYOut}
                        title="Zoom out vertical"
                        aria-label="Zoom out vertical"
                      >−</button>
                      <span className={styles.zoomValue}>{zoomY.toFixed(1)}×</span>
                      <button
                        className={styles.zoomBtn}
                        onClick={zoomYIn}
                        title="Zoom in vertical"
                        aria-label="Zoom in vertical"
                      >+</button>
                    </div>

                    <div className={styles.zoomDivider} />

                    <button
                      className={`${styles.zoomBtn} ${styles.zoomReset}`}
                      onClick={resetZoom}
                      title="Reset zoom to default"
                      aria-label="Reset zoom"
                    >
                      ↺
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {showSpec && (
        <>
          <div id="wave-timeline" style={{ height: "20px", margin: "20px" }} />

          <div className={styles.controls}>
            <button
              className={styles.prevClip}
              onClick={clickPrev}
              disabled={isPrevDisabled || index === 0}
            >
              <Image
                src="/images/LArrow.png"
                alt="Previous Button"
                width={45}
                height={45}
              />
            </button>
            <button className={styles.modelButton} onClick={clickYes}>
              Save
            </button>
            {!playing && (
              <button className={styles.play} onClick={clickPlay}>
                <Image
                  src="/images/Play.png"
                  alt="Play Button"
                  width={45}
                  height={45}
                />
              </button>
            )}
            {playing && (
              <button className={styles.pause} onClick={clickPause}>
                <Image
                  src="/images/Pause.png"
                  alt="Pause Button"
                  width={45}
                  height={45}
                />
              </button>
            )}
            <button className={styles.modelButton} onClick={clickNo}>
              Delete
            </button>
            <button
              className={styles.nextClip}
              onClick={clickNext}
              disabled={isNextDisabled || index === entries.length - 1}
            >
              <Image
                src="/images/RArrow.png"
                alt="Next Button"
                width={45}
                height={45}
              />
            </button>
          </div>


          <div className={styles.bottomBar}>
            <div className={styles.confidenceSection}>
              <label>Region buttons</label>
              <div className={styles.regionButtons}>
                <button
                  className={styles.regionButton}
                  onClick={deleteActiveRegion}
                >
                  Delete
                </button>
                <button className={styles.regionButton} onClick={clearAllRegions}>
                  Clear
                </button>
                <button className={styles.regionButton} onClick={undoLastRegion}>
                  Undo
                </button>
              </div>
              
              {useConfidence && (
                <Slider
									displayLabel="Confidence"
									value={confidence}
									setValue={setConfidence}
									min={0}
									max={maxConfidence}
								/>
              )}

              <LogSlider
								displayLabel="Playback Rate"
								value={playbackRate}
								setValue={setPlaybackRate}
								min={0.0625}
								max={2}
								logBase={2}
								onChange={(val) => {
									const ws = instances.current[currentId]?.wavesurfer;
									if (ws) {
										ws.setPlaybackRate(val, false);
									}
								}}
							/>
            </div>
            
            <div className={styles.annotationSection}>
              <label>Call Type:</label>
              <input
                type="text"
                value={callType}
                onChange={(e) => setCallType(e.target.value)}
              />
              {useAdditional && (
                <>
                  <label>Additional Notes:</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </>
              )}
              
            </div>

          </div>
        </>
      )}
      
      {speciesDropdownState &&
        createPortal(
          <div
            style={{
              position: "absolute",
              top: speciesDropdownState.top + 20,
              left: speciesDropdownState.left,
              zIndex: 10000,
              width: 256,
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <SpeciesDropdown
              speciesMap={speciesMap}
              speciesId={speciesDropdownState.region.data?.species?.speciesId ?? selectedSpeciesId}
              onChange={(option) => {
                if (!option) {
                  assignSpecies(speciesDropdownState.region, null);
                  return;
                };

                const selectedSpecies =
                  speciesMap[option.speciesId];

                if (!selectedSpecies) return;

                assignSpecies(speciesDropdownState.region, selectedSpecies);

                setSpeciesDropdownState(null); // close after selection
              }}
              onMenuClose={() => {setSpeciesDropdownState(null);}}
              allowNull={true}
              defaultMenuIsOpen={true}
            />
          </div>,
          document.body
        )}

    </React.Fragment>
  );
};

export default AudioPlayer;