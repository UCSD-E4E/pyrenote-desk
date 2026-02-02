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

type WaveSurferObj = {
  recording: Recording;
  regions: RegionOfInterest[];
  id: string;
  spectrogramId: string;
  file: Blob;
  instance: WaveSurfer | null;
  class: "spectrogramContainer";
};

// Generate ColorMap for Spectrogram
const spectrogramColorMap = [];
for (let i = 0; i < 256; i++) {
  const val = (255 - i) / 256;
  spectrogramColorMap.push([val / 2, val / 3, val, 1]);
}

const AudioPlayer: React.FC = () => {
  // UI state
  const [showSpec, setShowSpec] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);

  // Annotation state
  const [confidence, setConfidence] = useState("100");
  const confidenceRef = useRef(confidence);
  const [callType, setCallType] = useState("");
  const [notes, setNotes] = useState("");

  // Playback controls
  const [playbackRate, setPlaybackRate] = useState("1");
  const [sampleRate, _setSampleRate] = useState("24000");

  // Region & species
  const regionListRef = useRef<any[]>([]);
  const activeRegionRef = useRef<any>(null);
  // const [speciesList, setSpeciesList] = useState<Species[]>([
  //   { species: "Default", common: "no", speciesId: 0 },
  //   { species: "some birds", common: "?", speciesId: 1 },
  // ]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<number>(0);

  // Wavesurfers array + button‑disable flags
  const [wavesurfers, setWavesurfers] = useState<any[]>([]);
  const [isPrevDisabled, setPrevDisabled] = useState(false);
  const [isNextDisabled, setNextDisabled] = useState(false);
  const [isYesDisabled, setYesDisabled] = useState(false);
  const [isNoDisabled, setNoDisabled] = useState(false);
  const removeList: number[] = [];

  const timelineDotRef = useRef<HTMLDivElement | null>(null);

  // Get user settings from local storage
  useEffect(() => {
    setConfidence(localStorage.getItem("confidenceRange") || "100");
    _setSampleRate(localStorage.getItem("sampleRate") || "24000");
  }, []);

  useEffect(() => {
    confidenceRef.current = confidence;
  }, [confidence]);

  // Destroys Current Wavesurfer reference
  const destroyCurrentWaveSurfer = async () => {
    if (wavesurfers[index]?.instance) {
      wavesurfers[index].instance.destroy();
      wavesurfers[index].instance = null;
    }
  };

  // Called when moving to previous audio clip
  // Destroys current wavesurfer and changes index
  const clickPrev = async () => {
    if (isPrevDisabled) {
      return;
    }
    setConfidence(localStorage.getItem("confidenceRange") || "100");
    setPrevDisabled(true);
    setPlaying(false);
    if (index === 0) return;
    await destroyCurrentWaveSurfer();
    setIndex((prevIndex) => prevIndex - 1);

    // Buffer time between presses
    setTimeout(() => {
      setPrevDisabled(false);
    }, 500);
  };

  // Called when moving to next audio clip
  // Destroys current wavesurfer and changes index
  const clickNext = async () => {
    if (isNextDisabled) {
      return;
    }
    setConfidence(localStorage.getItem("confidenceRange") || "100");
    setNextDisabled(true);
    setPlaying(false);
    if (index === wavesurfers.length - 1) return;
    await destroyCurrentWaveSurfer();
    setIndex((prevIndex) => prevIndex + 1);
    //buffer time between presses
    setTimeout(() => {
      setNextDisabled(false);
    }, 500);
  };

  // Plays the current wavesurfer audio
  const clickPlay = useCallback(async () => {
    const wsInstance = wavesurfers[index]?.instance;
    // Plays the active region
    if (wsInstance && activeRegionRef.current) {
      activeRegionRef.current.play();
    } else if (wsInstance) {
      wsInstance.playPause();
    }
    setPlaying(true);
  }, [wavesurfers, index]);

  //Pauses the current wavesurfer audio
  const clickPause = useCallback(async () => {
    const wsInstance = wavesurfers[index]?.instance;
    if (wsInstance) {
      wsInstance.playPause();
    }
    setPlaying(false);
  }, [wavesurfers, index]);

  /* called when confirming audio matches model annotation
     remove current wavesurfer
     move rest up
     save annotation in database */
  const clickYes = useCallback(async () => {
    if (isYesDisabled) return;
    setConfidence(localStorage.getItem("confidenceRange") || "100");
    setYesDisabled(true);

    const ws = wavesurfers[index]?.instance;
    if (!ws) return;

    // Accesses all regions
    const regionPlugin = ws.plugins[1];
    if (!wavesurfers[index]?.instance?.regions?.list) {
      console.warn("Missing regions plugin or list not ready");
    }
    const allRegions = regionPlugin?.wavesurfer?.plugins[2]?.regions;
    const lines: string[] = [];

    const removeRegions = async () => {
      for (const removed of removeList) {
        console.log("removed following region of interest", removed);
        await window.api.deleteRegionOfInterest(removed);
      }
    };


    if (!allRegions || !Object.keys(allRegions).length) {
      console.log("No regions");
      await removeRegions();
      //await removeRegionsFromUI(); //clear UI just in case even if no regions exist
    } else {
      // Text document of start/end times
      //Object.values(allRegions).forEach(async (region: Region, idx: number) => {
      const regionValues = Object.values(allRegions) as Region[];
      for (let idx = 0; idx < regionValues.length; idx++) {
        const region = regionValues[idx];
        console.log("Saved region id: ", region.id);
        console.log("region: ", region.start, region.end);
        let regionId;
        if (region.id.startsWith("imported-")) {
          const id = Number.parseInt(region.id.split("imported-")[1]);
          console.log("Calling updateRegionOfInterest with:", id, region.start, region.end);
          await window.api.updateRegionOfInterest(id, region.start, region.end);
          regionId = id;
        } else {
          // NOTE: Would this cause issues if newly assigned ids &
          // cur region id not linked?
          console.log("Creating new region of interest with ",wavesurfers[index].recording.recordingId, region.start, region.end);
          const newRegion = await window.api.createRegionOfInterest(
            wavesurfers[index].recording.recordingId,
            region.start,
            region.end,
          );
          regionId = newRegion.regionId;
          console.log("New region created with ID:", regionId);
        }
        if (region.data?.species && region.data?.confidence) {
          const species: Species = region.data.species as Species;
          console.log("label: ", region.data.species);
          const confidence = Number.parseInt(region.data?.confidence as string);
          const username = localStorage.getItem("username") ?? "";
          const email = localStorage.getItem("email") ?? "";
          const labelerId = await window.api.getOrCreateLabeler(username, email);
          console.log("creating new annotations");
          await window.api.createAnnotation(
            wavesurfers[index].recording.recordingId,
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
      if (wavesurfers.length === 1) {
        setShowSpec(false);
        setWavesurfers([]);
      } else {
        ws.destroy();
        setWavesurfers((arr) => arr.slice(1));
        setIndex(0);
      }
      setTimeout(() => setYesDisabled(false), 500);
      return;
    }

    await destroyCurrentWaveSurfer();
    setWavesurfers((arr) => arr.filter((_, i) => i !== index));
    if (wavesurfers.length - 1 >= index) setIndex((i) => i - 1);
    setTimeout(() => setYesDisabled(false), 500);
  }, [wavesurfers, index, isYesDisabled, confidence, callType, notes]);

  /* called when audio doesn't match model annotation
    remove current wavesurfer
    move rest up
    save annotation in database */
  const clickNo = useCallback(async () => {
    if (isNoDisabled) {
      return;
    }
    setNoDisabled(true);
    setConfidence(localStorage.getItem("confidenceRange") || "100");
    if (index == 0) {
      let currentWaveSurfer = wavesurfers[index].instance;
      if (wavesurfers.length === 1) {
        setShowSpec(false);
        setWavesurfers([]);
      } else {
        currentWaveSurfer.destroy();
        currentWaveSurfer = null;
        // Remove the first WaveSurfer
        setWavesurfers((wavesurfers) => wavesurfers.slice(1));
        setIndex(0);

        //buffer between button presses
        setTimeout(() => {
          setNoDisabled(false);
        }, 500);
        return;
      }
      currentWaveSurfer.destroy();
      currentWaveSurfer = null;

      //buffer between button presses
      setTimeout(() => {
        setNoDisabled(false);
      }, 500);
      return;
    }
    await destroyCurrentWaveSurfer();
    setWavesurfers((wavesurfers) => {
      // Remove the WaveSurfer from the array
      return wavesurfers.filter((_, i) => i !== index);
    });

    console.log(wavesurfers);
    //adjust index if array is shorter than index
    if (wavesurfers.length == 0) {
      setWavesurfers([]);
    }
    if (wavesurfers.length - 1 >= index) {
      setIndex(index - 1);
    }

    //buffer between button presses
    setTimeout(() => {
      setNoDisabled(false);
    }, 500);
  }, [wavesurfers, index, isNoDisabled]);

  const importFromDB = async (recordings, skippedCount = 0) => {
    console.log("recordings:", recordings);
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

    const newWaveSurfers: WaveSurferObj[] = await Promise.all(
      recordings.map(async (rec, i) => {
        const regions = await window.api.listRegionOfInterestByRecordingId(
          rec.recordingId,
        );
        console.log("regions:", regions);
        const containerId = `waveform-${i}`;
        const spectrogramId = `spectrogram-${i}`;
        return {
          recording: rec,
          regions: regions || [], //ensure regions is array
          id: containerId,
          spectrogramId: spectrogramId,
          file: new Blob([rec.fileData as BlobPart]),
          instance: null,
          class: "spectrogramContainer",
        };
      }),
    );

    console.log("New WaveSurfers:", newWaveSurfers);
    setWavesurfers(newWaveSurfers);
    setShowSpec(true);
    setIndex(0);
    regionListRef.current = [];
    activeRegionRef.current = null;
  };

  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        const species = await window.api.listSpecies();
        setSpeciesList(species);
      } catch (error) {
        console.error("Failed to fetch species list:", error);
        setSpeciesList([
          { species: "Default", common: "no", speciesId: 0 },
          { species: "some birds", common: "?", speciesId: 1 },
        ]);
      }
    };

    fetchSpecies();
  }, []);

  //Handle audio files upload/import and map new wavesurfers
  const handleFiles = async (acceptedFiles: File[]) => {
    console.log("Files dropped:", acceptedFiles);

    // Clear existing wavesurfers if any
    if (wavesurfers.length > 0) {
      if (wavesurfers[index]?.instance) {
        wavesurfers[index].instance.destroy();
      }
    }

    const newWaveSurfers = acceptedFiles.map((file, i) => {
      const containerId = `waveform-${i}`;
      const spectrogramId = `spectrogram-${i}`;
      return {
        id: containerId,
        spectrogramId: spectrogramId,
        file: file,
        instance: null,
        class: "spectrogramContainer",
      };
    });

    console.log("New WaveSurfers:", newWaveSurfers);
    setWavesurfers(newWaveSurfers);
    setShowSpec(true);
    setIndex(0);
    regionListRef.current = [];
    activeRegionRef.current = null;
  };

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

  //useEffect when index or wavesurfers updates
  useEffect(() => {
    if (showSpec && wavesurfers[index]) {
      if (wavesurfers.length === 0) {
        //alert user
        setShowSpec(false);
        setIndex(0);
        console.log("No more audioclips");
      } else if (wavesurfers[index]) {
        //if wavesurfers[index] exists
        console.log("idx", index);
        //create wavesurfer
        const createWavesurfer = async () => {
          const waveId = wavesurfers[index].id;
          const spectroId = wavesurfers[index].spectrogramId;

          console.log("Creating ws");
          const ws = WaveSurfer.create({
            container: `#${wavesurfers[index].id}`,
            waveColor: "violet",
            progressColor: "purple",
            sampleRate: parseInt(sampleRate),
            plugins: [
              // TODO: Currently errors after spectrogram hidden from bug
              //        May need to update wavesurfer verison to > 7.5
              //        See: https://github.com/katspaugh/wavesurfer.js/pull/3110
              SpectrogramPlugin.create({
                container: `#${wavesurfers[index].spectrogramId}`,
                labels: true,
                colorMap: spectrogramColorMap,
                // height set to minimum of height val and fftSamples / 8 on some versions
                fftSamples: 2048,
                height: 230,
              }),
              // add timeline plugin syncing to audio files
              TimelinePlugin.create({
                container: "#wave-timeline",
                height: 20,
              }),
            ],
          });

          // Allow draw selection with Regions plugin
          // const wsRegions = ws.registerPlugin(
          //   (RegionsPlugin as any).create({
          const wsRegions = await ws.registerPlugin(
            (RegionsPlugin as any).create({
              name: "regions",
              regions: [],
              drag: true,
              resize: true,
              color: "rgba(0, 255, 0, 0.3)",
              dragSelection: true,
            }),
          );

          // Load DB regions into the plugin
          // regions.forEach((region) => {
          //   wsRegions.addRegion({
          //     id: region.id,
          //     start: region.start,
          //     end: region.end,
          //     color: "rgba(0, 255, 0, 0.3)", // optional per-region
          //     data: region, // store extra info if needed
          //   });
          // });

          wavesurfers[index].instance = ws; //Added to prevent region error 

          // Enable drag selection with a constant color and threshold.
          const disableDragSelection = wsRegions.enableDragSelection(
            { color: "rgba(0,255,0,0.3)" },
            3,
          );
          // Select timeline
          const timelineContainer = document.getElementById("wave-timeline");
          if (timelineContainer) {
            timelineContainer.style.position = "relative";
            timelineContainer.style.overflow = "visible";

            // Remove any existing dots before creating a new one
            const existingDots = timelineContainer.querySelectorAll(
              "div[data-timeline-dot]",
            );
            existingDots.forEach((dot) => timelineContainer.removeChild(dot));
          }

          // Create the dot
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

          // Move dot according to audio time
          ws.on("audioprocess", (currentTime) => {
            const duration = ws.getDuration();
            if (!duration) return;
            const fraction = currentTime / duration;
            const timelineWidth = timelineContainer?.offsetWidth;

            dot.style.left = fraction * timelineWidth + "px";
          });

          // Update dot on clicking a waveform
          const waveformContainer = document.getElementById(waveId);
          if (waveformContainer && timelineContainer) {
            waveformContainer.addEventListener("click", (event) => {
              const rect = timelineContainer.getBoundingClientRect();
              const clickX = event.clientX - rect.left;
              dot.style.left = clickX + "px";
              // Calculate fraction and seek audio accordingly
              const fraction = clickX / timelineContainer.offsetWidth;
              ws.seekTo(fraction);
            });
          }

          // NOTE: Not sure if any performance difference between loading
          // w/ url or blob
          // await ws.load(URL.createObjectURL(wavesurfers[index].file));
          await ws.loadBlob(wavesurfers[index].file);
          console.log("loaded ws");
          wavesurfers[index].instance = ws;

          // Apply playback rate from state
          ws.setPlaybackRate(parseFloat(playbackRate), false);

          // list of all regions for overlay
          const regionList = [];

          // helper function to reapply spectrogram overlay
          function redraw(region: Region) {
            const waveEl = document.getElementById(waveId);
            const spectroEl = document.getElementById(spectroId);
            const waveSpectroContainer = waveEl?.parentElement;
            if (!waveEl || !spectroEl || !waveSpectroContainer) return;

            waveSpectroContainer.appendChild(region.element);

            // recalc height, may need to change for diff monitor sizes
            const waveHeight = waveEl.offsetHeight;
            const spectroHeight = spectroEl.offsetHeight;
            region.element.style.position = "absolute";
            region.element.style.top = "0px";
            region.element.style.height = `${waveHeight + spectroHeight}px`;
            region.element.style.zIndex = "9999";
          }

          wsRegions.on("region-created", (region: Region) => {
            redraw(region);
            regionListRef.current.push(region);

            // add to list to redraw on movements
            regionList.push(region);

            // needed due to redrawing by plugin
            setTimeout(() => {
              redraw(region);
            }, 50);
          });

          wsRegions.on("region-removed", (region: Region) => {
            // NOTE: add to list for deleteRegionOfInterest?
            console.log("Removing: ", region.id);
            if (region.id.startsWith("imported-")) {
              const id = Number.parseInt(region.id.split("imported-")[1]);
              removeList.push(id);
            }
          });

          wsRegions.on("redraw", () => {
            regionList.forEach((region) => {
              regionList.forEach((region) => redraw(region));
            });
          });

          wsRegions.on("region-updated", (region: Region) => {
            redraw(region);
          });

          wsRegions.on("region-clicked", (region) => {
            // selecting selected region cancels loop
            if (activeRegionRef.current === region) {
              region.setOptions({ color: "rgba(0,255,0,0.3)" });
              region.data = { ...region.data, loop: false };
              activeRegionRef.current = null;
            } else {
              // sets all other red regions to green
              if (activeRegionRef.current) {
                activeRegionRef.current.setOptions({
                  color: "rgba(0,255,0,0.3)",
                });
              }

              // turns region red on click
              console.log("region-clicked fired");
              region.setOptions({ color: "rgba(255,0,0,0.3)" });
              activeRegionRef.current = region;

              region.data = { ...region.data, loop: true };
            }
          });

          // loops clicked region
          wsRegions.on("region-out", (region: Region) => {
            if (region.data?.loop) {
              region.play();
            }
          });

          wsRegions.on("region-double-clicked", (region, event) => {
            // Create the dropdown
            const select = document.createElement("select");

            speciesList.forEach((sp) => {
              const option = document.createElement("option");
              option.value = sp.speciesId.toString();
              option.textContent = `${sp.common} (${sp.species})`;
              if (
                region.data?.species &&
                region.data.species.speciesId === sp.speciesId
              ) {
                option.selected = true;
              }
              select.appendChild(option);
            });

            // Stop region toggle on select click
            select.addEventListener("mousedown", (e) => e.stopPropagation());
            select.addEventListener("click", (e) => e.stopPropagation());

            // When the dropdown value changes
            select.addEventListener("change", () => {
              const selectedId = parseInt(select.value);
              const selectedSpecies = speciesList.find(
                (sp) => sp.speciesId === selectedId
              );
              if (!selectedSpecies) return;

              // Update region metadata
              region.data = {
                ...region.data,
                species: selectedSpecies,
                label: selectedSpecies.species,
                confidence: confidenceRef.current,
              };

              // Update or create label element
              let labelElem = region.element.querySelector(".region-label");
              if (!labelElem) {
                labelElem = document.createElement("span");
                labelElem.className = "region-label";
                region.element.appendChild(labelElem);
              }
              labelElem.textContent = selectedSpecies.species;

              // Remove dropdown
              //document.body.removeChild(select);
              if (document.body.contains(select)) {
                document.body.removeChild(select);
              }
            });

            // Remove on blur
            select.addEventListener("blur", () => {
              if (document.body.contains(select)) {
                document.body.removeChild(select);
              }
            });


            // Position the dropdown relative to the region on screen
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

            // Append to body
            document.body.appendChild(select);
            select.focus();
          });




          document
            .getElementById(wavesurfers[index].spectrogramId)
            ?.classList.add("spectrogramContainer");

          // Handle audio finish
          ws.on("finish", () => {
            setPlaying(false);
          });

          console.log("wavesurfers[index[.region", wavesurfers[index].regions);
          //console.log('regionsArray:', regionsArray)
          // const regionsArray = Object.values(wavesurfers[index]?.instance?.regions?.list );
          // console.log('regionsArray:', regionsArray)

          // necessary to avoid error when no regions are present
          const dbRegions = Array.isArray(wavesurfers[index].regions)
          ? wavesurfers[index].regions
          : [];
          for (const r of dbRegions) {
            wsRegions.addRegion({
              start: r.starttime,
              end: r.endtime,
              color: "rgba(0, 255, 0, 0.3)",
              id: "imported-" + r.regionId,
            });
          }
        };

        createWavesurfer();
      }
    }
  }, [showSpec, index, wavesurfers, playbackRate, sampleRate]);

  // Deletes selected region
  const deleteActiveRegion = async () => {
    if (!wavesurfers[index]?.instance || !activeRegionRef.current) return;

    activeRegionRef.current.remove();
    activeRegionRef.current = null;
  };

  // Deletes all regions
  const clearAllRegions = () => {
    if (!wavesurfers[index]?.instance) return;

    const regionPlugin = wavesurfers[index].instance.plugins[1];
    const allRegions = regionPlugin?.wavesurfer?.plugins[2]?.regions;
    if (!allRegions) return;

    Object.keys(allRegions).forEach((r) => {
      allRegions[r].remove();
    });

    regionListRef.current = [];
    activeRegionRef.current = null;
  };

  // Delete last region
  const undoLastRegion = () => {
    if (!wavesurfers[index]?.instance) return;
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
  const saveLabelsToSpecies = () => {
    const ws = wavesurfers[index]?.instance;
    if (!ws) return;

    const regionPlugin = ws.plugins[1];
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
      confidence: confidenceRef.current,
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

  /*
  <input
              type="file"
              multiple
              accept="audio/*"
              onChange={(e) => handleFiles(Array.from(e.target.files))}
            />*/

  const [modalEnable, setModalEnable] = useState(false);


	function toggleRecordingSelect() {
	  setModalEnable(!modalEnable);
	}

	function SelectRecordings() {
	  if (!modalEnable) {
      return null;
	  }

    const [siteList, setSiteList] = useState([]);
    const [recorderList, setRecorderList] = useState([]);
    const [deploymentList, setDeploymentList] = useState([]);
    const [surveyList, setSurveyList] = useState([]);
    const [speciesList, setspeciesList] = useState([]);
    const verificationList = ["YES", "NO", "UNVERIFIED"]

    const [selectedSites, setSelectedSites] = useState([]);
    const [selectedRecorders, setSelectedRecorders] = useState([]);
    const [selectedDeployments, setSelectedDeployments] = useState([]);
    const [selectedSurveys, setSelectedSurveys] = useState([]);
    const [selectedSpecies, setSelectedSpecies] = useState([]);
    const [selectedVerifications, setSelectedVerifications] = useState([]);

    useEffect(() => {
      if (!modalEnable) {
        return null;
      }

      const fetchData = async () => {
        const sites = await window.api.listSites();
        const recorders = await window.api.listRecorders();
        const deployments = await window.ipc.invoke("listDeployments");
        const surveys = await window.api.listSurveys();
        const species = await window.api.listSpecies();

        setSiteList(sites);
        setRecorderList(recorders);
        setDeploymentList(deployments);
        setSurveyList(surveys);
        setspeciesList(species);
      }

      fetchData();
    }, [modalEnable]);

	  return (
      <div className={styles.modalParent}>
        <section className={styles.selectPopup}>
          <h1>Select Recordings</h1>
          <p>Filter by:</p>
          <details>
            <summary>Recorders</summary>
            {recorderList.map((recorder) => (
              <div key={recorder.recorderId}>
                <input type="checkbox" onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRecorders([...selectedRecorders, recorder.recorderId]);
                  } else {
                    setSelectedRecorders(selectedRecorders.filter(val => val != recorder.recorderId));
                  }
                }}/>
                <label>Recorder {recorder.code}</label>
                <br />
              </div>
            ))}
          </details>
          <details>
            <summary>Surveys</summary>
            {surveyList.map((survey) => (
              <div key={survey.surveyId}>
                <input type="checkbox" onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedSurveys([...selectedSurveys, survey.surveyId]);
                  } else {
                    setSelectedSurveys(selectedSurveys.filter(val => val != survey.surveyId));
                  }
                }}/>
                <label>{survey.surveyname}</label>
                <br />
              </div>
            ))}
          </details>
          <details>
            <summary>Sites</summary>
            {siteList.map((site) => (
              <div key={site.siteId}>
                <input type="checkbox" onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedSites([...selectedSites, site.siteId]);
                  } else {
                    setSelectedSites(selectedSites.filter(val => val != site.siteId));
                  }
                }}/>
                <label>{site.site_code}</label>
                <br />
              </div>
            ))}
          </details>
          <details>
            <summary>Deployments</summary>
            {deploymentList.map((deployment) => (
              <div key={deployment.deploymentId}>
                <input type="checkbox" onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedDeployments([...selectedDeployments, deployment.deploymentId]);
                  } else {
                    setSelectedDeployments(selectedDeployments.filter(val => val != deployment.deploymentId));
                  }
                }}/>
                <label>{deployment.deploymentId} - {deployment.note}</label>
                <br />
              </div>
            ))}
          </details>
          <details>
            <summary>Species</summary>
          {speciesList.map((species) => (
            <div key={species.speciesId}>
               <input type="checkbox" onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedSpecies([...selectedSpecies, species.speciesId]);
                  } else {
                    setSelectedDeployments(selectedSpecies.filter(val => val != species.speciesId));
                  }
                }}/>
              <label>{species.common} ({species.species})</label>
            </div>
          ))}
          </details>
          <details>
            <summary>Verification</summary>
          {verificationList.map((verification) => (
            <div key={verification}>
              <input type="checkbox" onChange={(e) => {
                if (e.target.checked) {
                  setSelectedVerifications([...selectedVerifications, verification]);
                } else {
                  setSelectedVerifications(selectedVerifications.filter(val => val != verification));
                }
              }}/>
              <label>{verification}</label>
            </div>
          ))}
          </details>
          <br />
          <button onClick={ async () => {
            toggleRecordingSelect();
            const result  = await window.api.listRecordingsByFilters({
              deployments: selectedDeployments,
              sites: selectedSites,
              recorders: selectedRecorders,
              surveys: selectedSurveys,
              species: selectedSpecies,
              verifications: selectedVerifications
            });
            importFromDB(result.recordings, result.skippedCount);
          }}>Import Selected</button>
          <button onClick={async () => {
            toggleRecordingSelect();
            const recordings = await window.api.listRecordings();
            importFromDB(recordings);
          }}>Import All</button>
          <button onClick={toggleRecordingSelect}>Cancel</button>
        </section>
		  </div>
	  );
	}

  return (
    <React.Fragment>
      <Head>
        <title>Label Page</title>
      </Head>
      <div className={styles.container}>
        <div className={styles.main}>
          <div className={styles.header}>
            <button onClick={toggleRecordingSelect}>Select Recordings</button>
            <SelectRecordings />
              <div>
              <label htmlFor="species-names">Choose a species: </label>
              <select
                name="Species"
                id="species-names"
                value={speciesList[selectedSpecies]?.speciesId ?? ""}
                onChange={(e) => {
                  const selectedId = Number(e.target.value);
                  const selectedIdx = speciesList.findIndex(
                    (sp) => sp.speciesId === selectedId
                  );
                  if (selectedIdx !== -1) {
                    assignSpecies(speciesList[selectedIdx]);
                    setSelectedSpecies(selectedIdx);
                  }
                }}
              >
                {speciesList.map((sp) => (
                  <option key={sp.speciesId} value={sp.speciesId}>
                    {sp.common} ({sp.species})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            {showSpec && wavesurfers.length > 0 && (
              <div className={styles.audioInfo}>
                <p>
                  File {index + 1} of {wavesurfers.length}:{" "}
                  {wavesurfers[index]?.recording.url}
                </p>
              </div>
            )}
            {showSpec && (
              // styling for extended regions selection
              <div className={styles.waveSpectroContainer}>
                <div
                  id={wavesurfers[index]?.id}
                  className={styles.waveContainer}
                ></div>
                <div
                  id={wavesurfers[index]?.spectrogramId}
                  className={styles.spectrogramContainer}
                ></div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showSpec && (
        <div id="wave-timeline" style={{ height: "20px", margin: "20px" }} />
      )}
      {showSpec && (
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
            disabled={isNextDisabled || index === wavesurfers.length - 1}
          >
            <Image
              src="/images/RArrow.png"
              alt="Next Button"
              width={45}
              height={45}
            />
          </button>
        </div>
      )}
      {showSpec && (
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

            <label className={styles.confidenceLabel} htmlFor="confidence">
              Confidence: {confidence}
            </label>
            <input
              type="range"
              id="confidence"
              min="0"
              max={localStorage.getItem("confidenceRange") || "100"}
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
            />
            <label className={styles.confidenceLabel} htmlFor="confidence">
              Speed: {playbackRate}
            </label>
            <input
              type="range"
              id="speed"
              min="0.5"
              max="2"
              step="0.1"
              value={playbackRate}
              onChange={(e) => {
                setPlaybackRate(e.target.value);
                if (wavesurfers[index]?.instance) {
                  wavesurfers[index].instance.setPlaybackRate(
                    parseFloat(e.target.value),
                    false,
                  );
                }
              }}
            />
          </div>
          {showSpec && (
            <div className={styles.annotationSection}>
              <label>
                Zoom:{" "}
                <input type="range" min="10" max="1000" defaultValue="10" />
              </label>
              <label>Call Type:</label>
              <input
                type="text"
                value={callType}
                onChange={(e) => setCallType(e.target.value)}
              />
              <label>Additional Notes:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}
        </div>
      )}
    </React.Fragment>
  );
};

export default AudioPlayer;
