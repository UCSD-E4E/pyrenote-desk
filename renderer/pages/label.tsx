import React, { useState, useRef, useEffect, useCallback } from "react";
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
import { ColormapPicker } from "../components/ColormapPicker/ColormapPicker"

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
  const [selectedSpecies, setSelectedSpecies] = useState<number>(0);

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

        /*
        const prevInstances = wavesurferObjs.current;
        const prevMap = new Map<string, WaveSurfer | null>();
        prevMetas.forEach((meta, idx) => {
          prevMap.set(meta.id, prevInstances[idx] ?? null);
        });

        wavesurferObjs.current = nextMetas.map(
          (meta) => prevMap.get(meta.id) ?? null,
        );
        */

        return nextMetas;
      });
    },
    [],
  );

  const instances = useRef<Record<string, WavesurferInstance>>({})
  const idsToPreload = entries.slice(Math.max(0, index-1), Math.min(entries.length, index+2)).map(entry => entry.id);
  const currentEntryId = entries[index]?.id ?? null;
  // the reason we key instances by "entry's id" is because indices themselves will shift as entries get deleted

  const waveStageRef = useRef<HTMLElement>()
  useEffect(() => {
    waveStageRef.current = document.getElementById("stage")
  })

  // Button‑disable flags
  const [isPrevDisabled, setPrevDisabled] = useState(false);
  const [isNextDisabled, setNextDisabled] = useState(false);
  const [isYesDisabled, setYesDisabled] = useState(false);
  const [isNoDisabled, setNoDisabled] = useState(false);
  const removeList: number[] = [];

  const timelineDotRef = useRef<HTMLDivElement | null>(null);

  // Preferences
	const [colormap, setColormap] = useState<ColormapOption>(COLORMAP_OPTIONS[0]);

  // =====================================================================================================
  // Wavesurfer Management

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

        // Clean up timeline dot if this is the current index
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

    // Clean up blob URL
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

    if (!instance) {
      return; // shouldn't happen
    }

    const ws = instance.wavesurfer;
    const hiddenContainer = instance.preloadedContainer;

    if (!hiddenContainer || !ws || !waveEntry) {
      return;
    }

    // Remove from current parent if it exists
    if (hiddenContainer.parentElement) {
      hiddenContainer.parentElement.removeChild(hiddenContainer);
    }

    // Set class to active (visible) and append to waveStage
    hiddenContainer.className = `
      ${styles.waveSpectroContainer} 
      ${styles.activeWave}
    `;
    
    if (waveStageRef.current) {
      waveStageRef.current.appendChild(hiddenContainer);
    }

    // Only register plugins if not already mounted
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

    const timelineContainer = document.getElementById("wave-timeline");

    if (timelineContainer) {
      timelineContainer.style.position = "relative";
      timelineContainer.style.overflow = "visible";

      const existingDots = timelineContainer.querySelectorAll(
        "div[data-timeline-dot]",
      );
      existingDots.forEach((dot) => timelineContainer.removeChild(dot));
    }

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

    timelineContainer?.appendChild(dot);
    timelineDotRef.current = dot;

    ws.on("audioprocess", (currentTime) => {
      const duration = ws.getDuration();
      if (!duration) return;
      const fraction = currentTime / duration;
      const timelineWidth = timelineContainer?.offsetWidth || 0;
      dot.style.left = fraction * timelineWidth + "px";
    });
    
    const waveformContainer = document.getElementById(key);
    if (waveformContainer && timelineContainer) {
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
    }

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
      const waveSpectroContainer = waveEl?.parentElement;
      if (!waveEl || !spectroEl || !waveSpectroContainer) return;

      waveSpectroContainer.appendChild(region.element);

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

      if (activeRegionRef.current === region) {
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
      redraw(region);
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
      const select = document.createElement("select");

      Object.entries(speciesMap).forEach(([id, species]) => {
        const option = document.createElement("option");
        option.value = species.speciesId.toString();
        option.textContent = `${species.common} (${species.species})`;
        if (
          region.data?.species &&
          region.data.species.speciesId === species.speciesId
        ) {
          option.selected = true;
        }
        select.appendChild(option);
      });

      select.addEventListener("mousedown", (e) => e.stopPropagation());
      select.addEventListener("click", (e) => e.stopPropagation());

      select.addEventListener("change", () => {
        const selectedId = parseInt(select.value);
        const selectedSpecies = Object.values(speciesMap).find(
          (sp) => sp.speciesId === selectedId,
        );
        if (!selectedSpecies) return;

        region.data = {
          ...region.data,
          species: selectedSpecies,
          label: selectedSpecies.species,
          confidence: confidence,
        };

        let labelElem = region.element.querySelector(".region-label");
        if (!labelElem) {
          labelElem = document.createElement("span");
          labelElem.className = "region-label";
          region.element.appendChild(labelElem);
        }
        labelElem.textContent = selectedSpecies.species;

        if (document.body.contains(select)) {
          document.body.removeChild(select);
        }
      });

      select.addEventListener("blur", () => {
        if (document.body.contains(select)) {
          document.body.removeChild(select);
        }
      });

      const rect = region.element.getBoundingClientRect();
      select.style.position = "absolute";
      select.style.top = `${rect.top}px`;
      select.style.left = `${rect.left}px`;
      select.style.zIndex = "10000";
      select.style.backgroundColor = "white";
      select.style.border = "1px solid black";
      select.style.padding = "4px";
      select.style.boxSizing = "border-box";
      select.style.maxHeight = "200px";
      select.style.overflow = "auto";

      document.body.appendChild(select);
      select.focus();
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
    const container = instance.preloadedContainer;

    // Destroy plugins if wavesurfer exists and is mounted
    if (ws && waveEntry?.isMounted) {
      try {
        // Remove all event listeners
        ws.unAll();

        instance.regionsPlugin.unAll();
        instance.regionsPlugin.destroy();
        delete instance.regionsPlugin;

        instance.timelinePlugin.unAll();
        instance.timelinePlugin.destroy();
        delete instance.timelinePlugin;

        // Clean up timeline dot
        const timelineContainer = document.getElementById("wave-timeline");
        if (timelineContainer && timelineDotRef.current) {
          try {
            timelineContainer.removeChild(timelineDotRef.current);
          } catch (e) {
            // Dot might already be removed
          }
          timelineDotRef.current = null;
        }

        // Reset mounted flag
        waveEntry.isMounted = false;
      } catch (e) {
        console.warn("Error destroying plugins:", e);
      }
    }

    // Remove from current parent if it exists
    if (container.parentElement) {
      container.parentElement.removeChild(container);
    }

    // Set class to hidden and move to document.body
    container.className = `
      ${styles.waveSpectroContainer} 
      ${styles.prefetchWave}
    `;
    
    document.body.appendChild(container);
  };

  const createWavesurfer = async (key: string) => {
    const waveEntry = entries.find((entry) => (entry.id == key));

    if (
      !waveEntry ||
      waveEntry.isCreating || // existing instance
      instances.current[key]
    ) {
      return;
    }

    waveEntry.isCreating = true;
    waveEntry.isMounted = false;

    // create hidden container for preloaded wavesurfer
    const hiddenContainer = document.createElement('div');
    hiddenContainer.className = `
      ${styles.waveSpectroContainer} 
      ${styles.prefetchWave}
    `;
    const waveDiv = document.createElement("div");
    waveDiv.id = waveEntry.id;
    waveDiv.classList.add(styles.waveContainer);
    hiddenContainer.appendChild(waveDiv);

    const spectroDiv = document.createElement("div");
    spectroDiv.id = waveEntry.spectrogramId;
    spectroDiv.classList.add(styles.spectrogramContainer);
    hiddenContainer.appendChild(spectroDiv);

    // Append to document.body as hidden
    document.body.appendChild(hiddenContainer);

    /*
    <div
      className={`
        ${styles.waveSpectroContainer} 
        ${(index == targetIndex) ? styles.activeWave : styles.prefetchWave}
      `}
    >
      <div id={waveEntry.id} className={styles.waveContainer}></div>
      <div
        id={waveEntry.spectrogramId}
        className={styles.spectrogramContainer}
      ></div>
    </div>
    */

    const ws = WaveSurfer.create({
      container: `#${waveEntry.id}`,
      waveColor: "violet",
      progressColor: "purple",
      sampleRate: parseInt(sampleRate),
    });

    const audioFile = await window.ipc.invoke('read-file-for-verification', waveEntry.recording.url);
    const audioURL = URL.createObjectURL(new Blob([audioFile.data]));

    await ws.load(audioURL); 
    
    ws.setPlaybackRate(playbackRate, false);


    // ===================================================================================
    // Spectrogram Plugin

    const spectrogramPlugin = SpectrogramPlugin.create({
      container: `#${waveEntry.spectrogramId}`,
      labels: true,
      colorMap: computeColormap(colormap),
      fftSamples: 256,
      height: 230,
    })
    ws.registerPlugin(spectrogramPlugin);

    // ===================================================================================
    // Finalize

    waveEntry.isCreating = false;

    instances.current[key] = {
      audioURL: audioURL,
      wavesurfer: ws,
      preloadedContainer: hiddenContainer,
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

    // Destroy containers that are no longer in range (index, index+1)
    Object.entries(instances.current).forEach(([key, container]) => {
      if (!idsToPreload.includes(key)) { 
        cleanupWavesurfer(key)
      }
    });

    async function handleMounting() {
      // Create wavesurfers for next index if they don't exist
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

			// super hacky but actually works
			(instance.spectrogramPlugin as any).colorMap = computeColormap(colormap);
			(instance.spectrogramPlugin as any).render();
		});
	}, [colormap]);


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

    // Buffer time between presses
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
    //buffer time between presses
    setTimeout(() => {
      setNextDisabled(false);
    }, 500);
  };

  const clickPlay = useCallback(async () => {
    const wsInstance = instances.current[currentEntryId].wavesurfer;
    // Plays the active region
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

  /* called when confirming audio matches model annotation
     remove current wavesurfer
     move rest up
     save annotation in database */
  const clickYes = useCallback(async () => {
    if (isYesDisabled) return;
    setConfidence(maxConfidence);
    setYesDisabled(true);

    const ws = instances.current[currentEntryId].wavesurfer;
    if (!ws) return;

    // Accesses all regions
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
      //await removeRegionsFromUI(); //clear UI just in case even if no regions exist
    } else {
      // Text document of start/end times
      //Object.values(allRegions).forEach(async (region: Region, idx: number) => {
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
          // NOTE: Would this cause issues if newly assigned ids &
          // cur region id not linked?
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
        // const startSec = region.start.toFixed(3);
        // const endSec = region.end.toFixed(3);
        // lines.push(
        //   `Region #${idx + 1}: Start = ${startSec}s, End = ${endSec}s`,
        // );
      };
      //
      // lines.push(
      //   "",
      //   `Confidence: ${confidence}`,
      //   `Call Type: ${callType}`,
      //   `Additional Notes: ${notes}`,
      // );

      // Make text file
      // const blob = new Blob([lines.join("\n")], { type: "text/plain" });
      // const url = URL.createObjectURL(blob);
      // const link = document.createElement("a");
      // link.href = url;
      // link.download = "regionTimes.txt";
      // document.body.appendChild(link);
      // link.click();
      // document.body.removeChild(link);
      // URL.revokeObjectURL(url);
    }

    await removeRegions();
    //await removeRegionsFromUI();

    // remove or shift current wavesurfer
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

  /* called when audio doesn't match model annotation
    remove current wavesurfer
    move rest up
    save annotation in database */
  const clickNo = useCallback(async () => {
    if (isNoDisabled) {
      return;
    }
    setNoDisabled(true);
    setConfidence(maxConfidence);
    if (index == 0) {
      await cleanupWavesurfer();
      
      // Remove the first WaveSurfer
      if (entries.length === 1) {
        setShowSpec(false);
      }
      setEntries((wavesurfers) => wavesurfers.slice(1));
      setIndex(0);
      

      //buffer between button presses
      setTimeout(() => {
        setNoDisabled(false);
      }, 500);
      return;
    }
    await cleanupWavesurfer();
    setEntries((wavesurfers) => wavesurfers.filter((_, i) => i !== index));

    //adjust index if array is shorter than index
    if (entries.length == 0) {
      setEntries([]);
    }
    if (entries.length - 1 >= index) {
      setIndex(index - 1);
    }

    //buffer between button presses
    setTimeout(() => {
      setNoDisabled(false);
    }, 500);
  }, [entries, index, isNoDisabled]);

  const importFromDB = async (recordings, skippedCount = 0) => {
    console.log("recordings:", recordings);

    await cleanupAll();

    // Ensure it's an array
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
          regions: regions || [], //ensure regions is array
          id: containerId,
          spectrogramId: spectrogramId,
          //file: new Blob([rec.fileData as BlobPart]),
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
        setSelectedSpecies(listOfSpecies[0].speciesId);
      } catch (error) {
        console.error("Failed to fetch species list:", error);
      }
    };

    fetchSpecies();
  }, []);

  // Keydown handler with useCallback to properly track dependencies
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
    // Attach once on mount (and re‑attach if handleKeyDown identity changes)
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

    // If the last region was active, reset activeRegionRef
    if (activeRegionRef.current === lastRegion) {
      activeRegionRef.current = null;
    }
  };

  // Download regions data only (maybe repurpose logic later)
  // TODO: Fix this
  /*
  const saveLabelsToSpecies = () => {
    const ws = instances.current[currentEntryId];
    if (!ws) return;

    const regionPlugin = (ws as any).plugins[1];
    const allRegions = regionPlugin?.wavesurfer?.plugins[2]?.regions;
    if (!allRegions) return;

    const newSet = new Set(speciesList);

    // Add non repeated labels to set
    Object.keys(allRegions).forEach((regionId) => {
      const region = allRegions[regionId];
      const label = region.data?.label?.trim();
      if (label) {
        newSet.add(label);
      }
    });

    setSpeciesList(Array.from(newSet));
    console.log("Updated speciesList:", Array.from(newSet));
  };
  */

  // Saves selected category as label
  const assignSpecies = (species: Species) => {
    if (!activeRegionRef.current) {
      console.log("No active region selected.");
      return;
    }

    // TODO: Save and initialize confidence by active region
    activeRegionRef.current.data = {
      ...activeRegionRef.current.data,
      label: species.species,
      species: species,
      confidence: confidence,
    };

    // TODO: Initialize label when importing
    const regionEl = activeRegionRef.current.element;
    let labelElem = regionEl.querySelector(".region-label");
    if (!labelElem) {
      labelElem = document.createElement("span");
      labelElem.className = "region-label";
      regionEl.appendChild(labelElem);
    }
    labelElem.textContent = species.species;
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
            <button onClick={() => setModalEnable(prev => !prev)}>Select Recordings</button>
            <SelectRecordingsButton
              modalEnable={modalEnable} 
              setModalEnable={setModalEnable} 
              importFromDB={importFromDB} 
            />
            <div>
              <ColormapPicker 
								selected={colormap}
								setSelected={setColormap} />
              <label htmlFor="species-names">Choose a species: </label>
              <select
                name="Species"
                id="species-names"
                value={selectedSpecies ?? ""}
                onClick={(e) => {
                  const value = (e.target as HTMLSelectElement).value;
                  if (value !== "") {
                    const selectedId = Number(value);
                    assignSpecies(speciesMap[selectedId]);
                  }
                }}
                onChange={(e) => {
                  const selectedId = Number(e.target.value);
                  setSelectedSpecies(selectedId);
                }}
              >
                {Object.entries(speciesMap).map(([id, species]) => (
                  <option key={species.speciesId} value={species.speciesId}>
                    {species.common} ({species.species})
                  </option>
                ))}
              </select>
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
                <div id="stage" className={styles.waveStage}>

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
                {/* Removed because saves new species to list in UI not database */}
                {/* <button
                  className={styles.regionButton}
                  onClick={saveLabelsToSpecies}
                >
                  Save Labels
                </button> */}
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
        
    </React.Fragment>
  );
};

export default AudioPlayer;
