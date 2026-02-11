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
  spectrogramId: string;
  class: "spectrogramContainer";
  isCreating: boolean;
  isMounted: boolean;
};

type WavesurferInstance = {
  audioURL: string;
  wavesurfer: WaveSurfer;
  preloadedContainer: HTMLDivElement;
  spectrogramPlugin: SpectrogramPlugin;
  regionsPlugin?: RegionsPlugin;
  timelinePlugin?: TimelinePlugin;
}

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
    if (confidence > Number(localStorage.getItem('confidenceRange'))) {
      setConfidence(Number(localStorage.getItem('confidenceRange')));
    }
    setColormap(localStorage.getItem('labelColorScheme') as ColormapOption);
  }, []);

  // UI state
  const [showSpec, setShowSpec] = useState(false);
  const [playing, setPlaying] = useState(false);
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

  // Wavesurfer metadata & instances
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

  const instances = useRef<Record<string, WavesurferInstance>>({})
  const idsToPreload = entries.slice(Math.max(0, index-1), Math.min(entries.length, index+2)).map(entry => entry.id);
  const currentEntryId = entries[index]?.id ?? null;

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

  const cleanupWavesurfer = (key = currentEntryId) => {
    const instance = instances.current[key];
    if (!instance) {
      return;
    }

    const waveEntry = entries.find((entry) => (entry.id == key));
    if (waveEntry) {
      if (waveEntry.isMounted) {
        unmountWavesurfer(key);
      }
      waveEntry.isMounted = false;
    }

    const ws = instance.wavesurfer;
    if (ws) {
      try {
        ws.destroy();

        if (key === currentEntryId && timelineDotRef.current) {
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
    }

    const audioURL = instance.audioURL;
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }

    const container = instance.preloadedContainer;
    if (container && container.parentElement === document.body) {
      container.remove();
    }
    delete instances.current[key];
  }
  const cleanupAll = () => {
    Object.entries(instances.current).forEach(async ([key, url]) => {
      cleanupWavesurfer(key);
    })
  }

  const mountWavesurfer = async (key: string) => {
    const waveEntry = entries.find((entry) => (entry.id == key));
    const instance = instances.current[key];
    const ws = instance?.wavesurfer;

    const wavesurferContainer = instance?.preloadedContainer;
    const waveformContainer = document.querySelector<HTMLElement>(`#${waveEntry.id}`);
    const spectrogramContainer = document.querySelector<HTMLElement>(`#${waveEntry.spectrogramId}`);
    const waveformWrapper = waveformContainer?.parentElement;
    const spectrogramWrapper = spectrogramContainer?.parentElement;
    const timelineContainer = document.getElementById("wave-timeline");

    if (!instance || !wavesurferContainer || !ws || !waveEntry || !waveformContainer || !timelineContainer || !waveformWrapper || !spectrogramWrapper || !timelineContainer) {
      console.error("Missing instance or HTML element: ", instance,wavesurferContainer,ws,waveEntry,waveformContainer,timelineContainer,waveformWrapper,spectrogramWrapper);
      return;
    }

    wavesurferContainer.parentElement.removeChild(wavesurferContainer);

    wavesurferContainer.className = `
      ${styles.wavesurferContainer} 
      ${styles.activeWave}
    `;
  
    stageRef.current.appendChild(wavesurferContainer);

    if (waveEntry.isMounted) {
      return;
    }

    // ===================================================================================
    // Timeline Plugin

    instance.timelinePlugin = TimelinePlugin.create({
      container: "#wave-timeline",
      height: 20,
    });
    ws.registerPlugin(instance.timelinePlugin);

    timelineContainer.style.position = "relative";
    timelineContainer.style.overflow = "visible";

    const existingDots = timelineContainer.querySelectorAll(
      "div[data-timeline-dot]",
    );
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
    
    const clickHandler = (event: MouseEvent) => {
      const rect = timelineContainer.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      dot.style.left = clickX + "px";
      const fraction =
        timelineContainer.offsetWidth === 0
          ? 0
          : clickX / timelineContainer.offsetWidth;
      ws.seekTo(fraction);
    };

    waveformContainer.addEventListener("click", clickHandler);
    ws.on("destroy", () => {
      waveformContainer.removeEventListener("click", clickHandler);
    });
    
    // ===================================================================================
    // Regions Plugin

    instance.regionsPlugin = (RegionsPlugin as any).create({
      name: "regions",
      regions: [],
      drag: true,
      resize: true,
      color: "rgba(0, 255, 0, 0.3)",
      dragSelection: true,
    }) as RegionsPlugin;
    ws.registerPlugin(instance.regionsPlugin);

    activeRegionRef.current = null;
    instance.regionsPlugin.enableDragSelection({ color: "rgba(0,255,0,0.3)" }, 3);

    const redraw = (region) => {
      const waveEl = document.getElementById(waveEntry.id);
      const spectroEl = document.getElementById(waveEntry.spectrogramId);
      const wavesurferContainer = waveEl?.parentElement;
      if (!waveEl || !spectroEl || !wavesurferContainer) return;

      const waveHeight = waveEl.offsetHeight;
      const spectroHeight = spectroEl.offsetHeight;
      region.element.style.position = "absolute";
      region.element.style.top = "0px";
      region.element.style.height = `${waveHeight + spectroHeight}px`;
      region.element.style.zIndex = "99";
    };

    let createdInitialRegions = false;
    const selectRegion = (region) => {
      if (!createdInitialRegions) {
        return;
      }

      if (activeRegionRef.current === region && !!region) {
        region.setOptions({ color: "rgba(0,255,0,0.3)" });
        region.data = { ...region.data, loop: false };
        activeRegionRef.current = null;
      } else {
        if (activeRegionRef.current) {
          activeRegionRef.current.setOptions({
            color: "rgba(0,255,0,0.3)",
          });
        }

        if (region) {
          region.setOptions({ color: "rgba(255,0,0,0.3)" });
          activeRegionRef.current = region;

          region.data = { ...region.data, loop: true };
        }
      }
    }

    instance.regionsPlugin.on("region-created", (region: any) => {
      //redraw(region);
      selectRegion(region);
      regionListRef.current.push(region);
      setTimeout(() => {
        redraw(region);
      }, 50);
    });

    instance.regionsPlugin.on("region-removed", (region: any) => {
      selectRegion(null);
      if (region.id.startsWith("imported-")) {
        const id = Number.parseInt(region.id.split("imported-")[1]);
        removeList.push(id);
      }
    });

    instance.regionsPlugin.on("region-updated", (region: any) => {
      redraw(region);
      selectRegion(region);
    });

    instance.regionsPlugin.on("region-clicked", (region: any) => {
      selectRegion(region);
    });

    instance.regionsPlugin.on("region-out", (region: any) => {
      if (region.data?.loop) {
        region.play();
      }
    });

    instance.regionsPlugin.on("region-double-clicked", (region: any) => {
      assignSpecies(region, speciesMap[selectedSpeciesIdRef.current]);

      const rect = region.element.getBoundingClientRect();
      setSpeciesDropdownState({
        region,
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
      });
    });
    
    waveEntry.regions.forEach((r) => {
      instance.regionsPlugin.addRegion({
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

    waveEntry.isMounted = true;
  }

  const unmountWavesurfer = (key: string) => {
    const waveEntry = entries.find((entry) => (entry.id == key));
    const instance = instances.current[key];

    if (!instance) {
      return; 
    }

    const ws = instance.wavesurfer;
    const wavesurferContainer = instance.preloadedContainer;

    if (ws && waveEntry?.isMounted) {
      try {
        ws.unAll();

        instance.regionsPlugin.unAll();
        instance.regionsPlugin.destroy();
        delete instance.regionsPlugin;

        instance.timelinePlugin.unAll();
        instance.timelinePlugin.destroy();
        delete instance.timelinePlugin;

        const timelineContainer = document.getElementById("wave-timeline");
        if (timelineContainer && timelineDotRef.current) {
          try {
            timelineContainer.removeChild(timelineDotRef.current);
          } catch (e) {
            // Dot might already be removed
          }
          timelineDotRef.current = null;
        }

        waveEntry.isMounted = false;
      } catch (e) {
        console.warn("Error destroying plugins:", e);
      }
    }

    if (wavesurferContainer.parentElement) {
      wavesurferContainer.parentElement.removeChild(wavesurferContainer);
    }

    wavesurferContainer.className = `
      ${styles.wavesurferContainer} 
      ${styles.prefetchWave}
    `;
    
    document.body.appendChild(wavesurferContainer);
  };

  const createWavesurfer = async (key: string) => {
    const waveEntry = entries.find((entry) => (entry.id == key));

    if (
      !waveEntry ||
      waveEntry.isCreating ||
      instances.current[key]
    ) {
      return;
    }

    waveEntry.isCreating = true;
    waveEntry.isMounted = false;

    const wavesurferContainer = document.createElement('div');
    wavesurferContainer.className = `
      ${styles.wavesurferContainer} 
      ${styles.prefetchWave}
    `;

    // ===================================================================================
    // Setup DOM Nodes

    // waveform
    const waveformWrapper = document.createElement("div");
    waveformWrapper.classList.add(styles.waveContainerWrapper);
    wavesurferContainer.appendChild(waveformWrapper);

    const waveformContainer = document.createElement("div");
    waveformContainer.id = waveEntry.id;
    waveformContainer.classList.add(styles.waveContainer);
    waveformWrapper.appendChild(waveformContainer);

    // spectrogram
    const spectrogramWrapper = document.createElement("div");
    spectrogramWrapper.classList.add(styles.spectrogramContainerWrapper);
    wavesurferContainer.appendChild(spectrogramWrapper);

    const spectrogramContainer = document.createElement("div");
    spectrogramContainer.id = waveEntry.spectrogramId;
    spectrogramContainer.classList.add(styles.spectrogramContainer);
    spectrogramWrapper.appendChild(spectrogramContainer);

    document.body.appendChild(wavesurferContainer);

    // ===================================================================================
    // Wavesurfer

    const ws = WaveSurfer.create({
      container: `#${waveEntry.id}`,
      waveColor: "violet",
      progressColor: "purple",
      sampleRate: parseInt(sampleRate),
      height: 128,
    });
    
    const audioFile = await window.ipc.invoke('read-file-for-verification', waveEntry.recording.url);
    const audioURL = URL.createObjectURL(new Blob([audioFile.data]));

    await ws.load(audioURL); 
    
    ws.setPlaybackRate(playbackRate, false);

    // ===================================================================================
    // Spectrogram Plugin

    const spectrogramPlugin = SpectrogramPlugin.create({
      container: `#${waveEntry.spectrogramId}`,
      colorMap: computeColormap(colormap),
      fftSamples: fftSamplesForZoom(zoomX),
      height: BASE_SPECTRO_HEIGHT * zoomY,
      labels: true,
    })
    ws.registerPlugin(spectrogramPlugin);

    // ===================================================================================
    // Resize Clickable Area to Combined Height Of Waveform + Spectrogram

    const shadowHost = waveformContainer.querySelector<HTMLElement>('div');

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
        if (waveformWrapper) waveformWrapper.scrollLeft += dx;
        if (spectrogramWrapper) spectrogramWrapper.scrollLeft += dx;
      }

      // Forward y-scroll to spectrogramContainer only
      if (dy !== 0 && spectrogramWrapper) {
        spectrogramWrapper.scrollTop += dy;
      }
    };

    wavesurferContainer.addEventListener("wheel", handleScroll as EventListener, { passive: false });

    // ===================================================================================
    // Finalize

    waveEntry.isCreating = false;

    instances.current[key] = {
      audioURL: audioURL,
      wavesurfer: ws,
      preloadedContainer: wavesurferContainer,
      spectrogramPlugin: spectrogramPlugin,
    }
  }

  // Unmount, create, and mount on page update or entries update
  useEffect(() => {
    if (!showSpec || !entries[index]) {
      return;
    }
    if (entries.length === 0) {
      setShowSpec(false);
      setIndex(0);
      console.log("No more audioclips");
      return;
    }

    Object.entries(instances.current).forEach(([key, container]) => {
      if (!idsToPreload.includes(key)) { 
        cleanupWavesurfer(key)
      }
    });

    async function handleMounting() {
      if (index + 1 < entries.length) {
        createWavesurfer(entries[index+1].id);
      }
      await createWavesurfer(entries[index].id);
      await mountWavesurfer(currentEntryId);
    }

    handleMounting();

    return () => {
      unmountWavesurfer(currentEntryId);
    }
  }, 
  [
    showSpec,
    index,
    entries,
  ]);

  // Cleanup everything on component unmount
  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, []);

  // Rerenders spectrograms on colormap change
	useEffect(() => {
		instances.current && Object.entries(instances.current).forEach(async ([key, instance]) => {
			const waveEntry = entries.find((entry) => (entry.id == key));
			if (!waveEntry) cleanupWavesurfer(key);
			if (!instance.spectrogramPlugin) return;

			(instance.spectrogramPlugin as any).colorMap = computeColormap(colormap);
      (instance.spectrogramPlugin as any).fftSamples = fftSamplesForZoom(zoomX);
			(instance.spectrogramPlugin as any).render();
		});
	}, [colormap]);

  // Update zoom on changes - resize divs directly (no CSS transform)
  useEffect(() => {
    const instance = instances.current[currentEntryId];
    if (!instance) return;

    const hiddenContainer = instance.preloadedContainer;
    if (!hiddenContainer) return;

    const waveContainer = hiddenContainer.querySelector<HTMLElement>('[class*="waveContainerWrapper"]').querySelector<HTMLElement>('[class*="waveContainer"]');
    const spectroContainer = hiddenContainer.querySelector<HTMLElement>('[class*="spectrogramContainerWrapper"]').querySelector<HTMLElement>('[class*="spectrogramContainer"]');

    // Base width is the visible stage width; zooming expands beyond it (stage scrolls)
    const stageEl = document.getElementById("stage");
    const baseWidth = stageEl ? stageEl.clientWidth : hiddenContainer.offsetWidth;

    if (waveContainer) {
      waveContainer.style.transform = '';
      waveContainer.style.transformOrigin = '';
      waveContainer.style.width = `${baseWidth * zoomX}px`;
    }

    if (spectroContainer) {
      spectroContainer.style.transform = '';
      spectroContainer.style.transformOrigin = '';
      spectroContainer.style.width = `${baseWidth * zoomX}px`;
      spectroContainer.style.height = `${BASE_SPECTRO_HEIGHT * zoomY}px`;
    }

    if (instance.spectrogramPlugin) {
      (instance.spectrogramPlugin as any).height = BASE_SPECTRO_HEIGHT * zoomY;
      (instance.spectrogramPlugin as any).render();
    }
  }, [zoomX, zoomY, currentEntryId]);

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
    const wsInstance = instances.current[currentEntryId].wavesurfer;
    if (wsInstance && activeRegionRef.current) {
      activeRegionRef.current.play();
    } else if (wsInstance) {
      wsInstance.playPause();
    }
    setPlaying(true);
  }, [entries, index]);

  const clickPause = useCallback(async () => {
    const wsInstance = instances.current[currentEntryId].wavesurfer;
    if (wsInstance) {
      wsInstance.playPause();
    }
    setPlaying(false);
  }, [entries, index]);

  const clickYes = useCallback(async () => {
    if (isYesDisabled) return;
    setConfidence(maxConfidence);
    setYesDisabled(true);

    const ws = instances.current[currentEntryId].wavesurfer;
    if (!ws) return;

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
        console.log("Saved region id: ", region.id);
    
        let regionId;
        if (region.id.startsWith("imported-")) {
          const id = Number.parseInt(region.id.split("imported-")[1]);
          console.log("Calling updateRegionOfInterest with:", id, region.start, region.end);
          await window.api.updateRegionOfInterest(id, region.start, region.end);
          regionId = id;
        } else {
          const newRegion = await window.api.createRegionOfInterest(
            entries[index].recording.recordingId,
            region.start,
            region.end,
          );
          regionId = newRegion.regionId;
          console.log("New region created with ID:", regionId);
        }
        if (region.data?.species && region.data?.confidence) {
          const species: Species = region.data.species as Species;

          const confidence = Number.parseInt(region.data?.confidence as string);
          const username = localStorage.getItem("username") ?? "";
          const email = localStorage.getItem("email") ?? "";
          const labelerId = await window.api.getOrCreateLabeler(username, email);
          console.log("creating new annotations");
          await window.api.createAnnotation(
            entries[index].recording.recordingId,
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
        await cleanupWavesurfer();
        setEntries([]);
      } else {
        await cleanupWavesurfer();
        setEntries((arr) => arr.slice(1));
        setIndex(0);
      }
      setTimeout(() => setYesDisabled(false), 500);
      return;
    }

    await cleanupWavesurfer();
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
    if (index == 0) {
      await cleanupWavesurfer();
      
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
    await cleanupWavesurfer();
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

    await cleanupAll();

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
        const containerId = `waveform-${i}`;
        const spectrogramId = `spectrogram-${i}`;
        return {
          recording: rec,
          regions: regions || [],
          id: containerId,
          spectrogramId: spectrogramId,
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
    const ws = instances.current[currentEntryId];
    if (!ws || !activeRegionRef.current) return;

    activeRegionRef.current.remove();
    activeRegionRef.current = null;
  };

  const clearAllRegions = () => {
    const ws = instances.current[currentEntryId];
    if (!ws) return;

    const regionPlugin = (ws as any).plugins[1];
    const allRegions = regionPlugin?.wavesurfer?.plugins[2]?.regions;
    if (!allRegions) return;

    Object.keys(allRegions).forEach((r) => {
      allRegions[r].remove();
    });

    regionListRef.current = [];
    activeRegionRef.current = null;
  };

  const undoLastRegion = () => {
    if (!instances.current[currentEntryId]) return;
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
                  assignSpecies(activeRegionRef.current, speciesMap[selectedOption.speciesId]);
                }}
                onMenuOpen={() => assignSpecies(activeRegionRef.current, speciesMap[selectedSpeciesId])}
              />
            </div>
          </div>
          {showSpec && (
            <div>
              {showSpec && entries.length > 0 && (
                <div className={styles.audioInfo}>
                  <p>
                    File {index + 1} of {entries.length}:{" "}
                    {entries[index]?.recording.url}
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
									const ws = instances.current[currentEntryId]?.wavesurfer;
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