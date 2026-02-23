import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Head from "next/head";
import Image from "next/image";
import styles from "./label.module.css";

import { Species } from "../../main/schema";
import { WavesurferInstance, Entry, RegionWithData } from "./label.wavesurfer";

import { SelectRecordingsButton } from "../components/SelectRecordingsButton";
import { Slider, LogSlider } from "../components/Slider";
import { COLORMAP_OPTIONS, ColormapOption } from "../utils/colormaps";
import { SpeciesDropdown } from "../components/SpeciesDropdown";

const DEFAULT_ZOOM_X = 1;
const DEFAULT_ZOOM_Y = 1;
const ZOOM_STEP = 0.25;
const BASE_WAVE_HEIGHT = 128;
const BASE_SPECTRO_HEIGHT = 256;

const fftSamplesForZoom = (zoom: number): 256 | 512 | 1024 => {
  if (zoom >= 4) return 1024;
  if (zoom >= 2) return 512;
  return 256;
};

const AudioPlayer: React.FC = () => {
  // ================================================================================================================
  // Settings

  const [useConfidence, setUseConfidence] = useState(false);
  const [useAdditional, setUseAdditional] = useState(false);
  const [maxConfidence, setMaxConfidence] = useState(10);
  const [labelerId, setLabelerId] = useState(-1);
  const [sampleRate, setSampleRate] = useState("44100");
  const [colormap, setColormap] = useState<ColormapOption>(COLORMAP_OPTIONS[0]);

  // fetch settings
  useEffect(() => {
    setUseConfidence(localStorage.getItem("disableConfidence") === "false");
    setUseAdditional(localStorage.getItem("disableAdditional") === "false");
    setSampleRate(localStorage.getItem("sampleRate") || "44100");
    setColormap(localStorage.getItem("labelColorScheme") as ColormapOption);

    const storedConfidence = Number(localStorage.getItem("confidenceRange") || 10);
    setMaxConfidence(storedConfidence);
    setConfidence(storedConfidence);

    (async () => {
      const username = localStorage.getItem("username") ?? "";
      const email = localStorage.getItem("email") ?? "";
      const id = await window.api.getOrCreateLabeler(username, email);
      setLabelerId(id);
    })();
  }, []);

  // ================================================================================================================
  // Species

  const [speciesMap, setSpeciesMap] = useState<Record<number, Species>>({});
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<number>(0);
  const selectedSpeciesIdRef = useRef(0);
  selectedSpeciesIdRef.current = selectedSpeciesId;

  // fetch species
  useEffect(() => {
    (async () => {
      try {
        const list = await window.api.listSpecies();
        const map: Record<number, Species> = {};
        list.forEach((s) => (map[s.speciesId] = s));
        setSpeciesMap(map);
        setSelectedSpeciesId(list[0].speciesId);
      } catch (err) {
        console.error("Failed to fetch species list:", err);
      }
    })();
  }, []);

  const [speciesDropdownState, setSpeciesDropdownState] = useState<{
    region: any;
    top: number;
    left: number;
  } | null>(null);

  // ================================================================================================================
  // UI / playback state

  const [showSpec, setShowSpec] = useState(false);
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);
  playingRef.current = playing;

  const [index, setIndex] = useState(0);
  const [confidence, setConfidence] = useState(10);
  const [callType, setCallType] = useState("");
  const [notes, setNotes] = useState("");
  const [playbackRate, setPlaybackRate] = useState(1);

  // Button debounce flags
  const [isPrevDisabled, setPrevDisabled] = useState(false);
  const [isNextDisabled, setNextDisabled] = useState(false);
  const [isSaveDisabled, setSaveDisabled] = useState(false);
  const [isSkipDisabled, setSkipDisabled] = useState(false);

  // Zoom
  const [zoomX, setZoomX] = useState(DEFAULT_ZOOM_X);
  const [zoomY, setZoomY] = useState(DEFAULT_ZOOM_Y);

  // ================================================================================================================
  // Entries & instances

  const [entries, setEntries] = useState<Entry[]>([]);
  const currentEntry = entries[index];
  const currentId = currentEntry?.id ?? null;
  const idsToPreload = entries
    .slice(Math.max(0, index - 1), Math.min(entries.length, index + 2))
    .map((e) => e.id);

  const instances = useRef<Record<string, WavesurferInstance>>({});

  // ================================================================================================================
  // DOM refs

  const stageRef = useRef<HTMLDivElement>();
  const timelineDotRef = useRef<HTMLDivElement | null>(null);

  // ================================================================================================================
  // Region refs

  const regionListRef = useRef<Record<string, RegionWithData>>({});
  const selectedRegionRef = useRef<RegionWithData | null>(null);
  const removeListRef = useRef(new Set<string>());

  const wipeRegions = () => {
    regionListRef.current = {};
    selectedRegionRef.current = null;
  };

  // ================================================================================================================
  // Wavesurfer instance management 

  // add any states or refs here if WavesurferInstance needs them
  const bundleDependencies = () => ({
    sampleRate,
    playbackRate,
    colormap,
    zoomX,
    zoomY,
    fftSamplesForZoom,
    BASE_SPECTRO_HEIGHT,
    stageRef,
    timelineDotRef,
    instances,
    regionListRef,
    selectedRegionRef,
    removeListRef,
    wipeRegions,
    assignSpeciesToRegion,
    playingRef,
    selectedSpeciesIdRef,
    speciesMap,
    setPlaying,
    setSpeciesDropdownState,
  });

  // Mount, unmount, and preload instances when index or entries change
  useEffect(() => {
    if (!showSpec || !currentEntry) return;
    if (entries.length === 0) {
      setShowSpec(false);
      setIndex(0);
      return;
    }

    // Cleanup stale instances
    Object.entries(instances.current).forEach(([key, inst]) => {
      if (!idsToPreload.includes(key)) inst.cleanup();
    });

    // Preload next
    if (index + 1 < entries.length && !instances.current[entries[index + 1].id]) {
      WavesurferInstance.create(entries[index + 1], bundleDependencies());
    }

    let cancelled = false;
    (async () => {
      let inst: WavesurferInstance;
      if (!instances.current[currentId]) {
        inst = await WavesurferInstance.create(currentEntry, bundleDependencies());
      } else {
        inst = instances.current[currentId];
      }
      if (!cancelled) inst.mount();
    })();

    return () => {
      cancelled = true;
      instances.current[currentId]?.unmount();
    };
  }, [index, entries]);

  // Full cleanup on component unmount
  useEffect(() => {
    return () => {
      Object.values(instances.current).forEach((inst) => inst.cleanup());
    };
  }, []);

  // Zoom resize — update DOM widths / spectrogram height directly
  useEffect(() => {
    const inst = instances.current[currentId];
    if (!inst) return;

    const baseWidth = stageRef.current?.clientWidth ?? inst.container.offsetWidth;

    inst.waveformContainer.style.width = `${baseWidth * zoomX}px`;
    inst.spectrogramContainer.style.width = `${baseWidth * zoomX}px`;
    inst.spectrogramContainer.style.height = `${BASE_SPECTRO_HEIGHT * zoomY}px`;

    if (inst.spectrogramPlugin) {
      (inst.spectrogramPlugin as any).height = BASE_SPECTRO_HEIGHT * zoomY;
      (inst.spectrogramPlugin as any).render();
    }
  }, [zoomX, zoomY, currentId]);

  // ================================================================================================================
  // Zoom helpers

  const zoomXIn  = () => setZoomX((p) => Math.min(p + ZOOM_STEP, 10));
  const zoomXOut = () => setZoomX((p) => Math.max(p - ZOOM_STEP, 1));
  const zoomYIn  = () => setZoomY((p) => Math.min(p + ZOOM_STEP, 10));
  const zoomYOut = () => setZoomY((p) => Math.max(p - ZOOM_STEP, 1));
  const resetZoom = () => { setZoomX(DEFAULT_ZOOM_X); setZoomY(DEFAULT_ZOOM_Y); };

  // ================================================================================================================
  // Playback / navigation

  const resetValues = () => { 
    setConfidence(maxConfidence); 
    setPlaying(false); 
    setSpeciesDropdownState(null);
  };

  const clickPrev = async () => {
    if (isPrevDisabled || index === 0) return;
    resetValues();
    setIndex((i) => i - 1);
    setPrevDisabled(true);
    setTimeout(() => setPrevDisabled(false), 500);
  };

  const clickNext = async () => {
    if (isNextDisabled || index === entries.length - 1) return;
    resetValues();
    setIndex((i) => i + 1);
    setNextDisabled(true);
    setTimeout(() => setNextDisabled(false), 500);
  };

  const clickPlay = useCallback(async () => {
    const inst = instances.current[currentId];
    if (!inst) return;
    if (selectedRegionRef.current) {
      selectedRegionRef.current.play();
    } else {
      inst.wavesurfer.playPause();
    }
    setPlaying(true);
  }, [entries, index]);

  const clickPause = useCallback(async () => {
    instances.current[currentId]?.wavesurfer.playPause();
    setPlaying(false);
  }, [entries, index]);

  // ================================================================================================================
  // Save / Delete

  const clickSave = useCallback(async () => {
    const inst = instances.current[currentId];
    if (!inst || isSaveDisabled) return;
    resetValues();
    setSaveDisabled(true);

    // Remove deleted pre-existing regions from DB
    await Promise.all(
      Array.from(removeListRef.current).map(async (id) => {
        await window.api.deleteRegionOfInterest(Number(id));
      }),
    );
    removeListRef.current.clear();

    // Persist regions + annotations
    await Promise.all(
      Object.values(regionListRef.current).map(async (region) => {
        if (!region.isNew) {
          await window.api.updateRegionOfInterest(Number(region.id), region.start, region.end);
        } else {
          const newRegion = await window.api.createRegionOfInterest(
            currentEntry.recording.recordingId,
            region.start,
            region.end,
          );
          region.id = String(newRegion.regionId);
        }

        if (region.species && region.confidence) {
          await window.api.createAnnotation(
            currentEntry.recording.recordingId,
            labelerId,
            Number(region.id),
            region.species.speciesId,
            region.confidence,
          );
        }
      }),
    );

    inst.cleanup();
    if (entries.length === 1) setShowSpec(false);
    else if (index === entries.length - 1) setIndex((i) => i - 1);
    setEntries((prev) => prev.filter((_, i) => i !== index));
    setTimeout(() => setSaveDisabled(false), 500);
  }, [entries, index, isSaveDisabled, confidence, labelerId]);

  const clickSkip = useCallback(async () => {
    const inst = instances.current[currentId];
    if (!inst || isSkipDisabled) return;
    setSkipDisabled(true);
    resetValues();

    inst.cleanup();
    if (entries.length === 1) setShowSpec(false);
    else if (index === entries.length - 1) setIndex(index - 1);
    setEntries((prev) => prev.filter((_, i) => i !== index));
    setTimeout(() => setSkipDisabled(false), 500);
  }, [entries, index, isSkipDisabled]);

  // ================================================================================================================
  // Import

  const importFromDB = async (recordings: any[], skippedCount = 0) => {
    Object.values(instances.current).forEach((inst) => inst.cleanup());

    if (!Array.isArray(recordings)) return;

    if (recordings.length === 0) {
      alert(
        skippedCount > 0
          ? `No recordings found. ${skippedCount} file(s) were skipped.`
          : "No recordings found. Try a different filter or upload recordings!",
      );
      return;
    }

    if (skippedCount > 0) {
      alert(`Warning: ${skippedCount} file(s) were skipped. Loaded ${recordings.length} recording(s).`);
    }

    const newEntries: Entry[] = await Promise.all(
      recordings.map(async (rec, i) => ({
        recording: rec,
        regions: (await window.api.listRegionOfInterestByRecordingId(rec.recordingId)) || [],
        id: String(i),
      })),
    );

    setEntries(newEntries);
    setShowSpec(true);
    setIndex(0);
    wipeRegions();
  };

  // ================================================================================================================
  // Region actions

  const deleteSelectedRegion = () => {
    if (!selectedRegionRef.current) return;
    selectedRegionRef.current.remove();
    selectedRegionRef.current = null;
  };

  const clearAllRegions = () => {
    Object.values(regionListRef.current).forEach((r) => r.remove());
    wipeRegions();
  };

  const assignSpeciesToRegion = (region: RegionWithData, species: Species) => {
    if (!region) return;
    region.species = species ?? null;
    region.confidence = species ? confidence : 0;

    let labelElem = region.element.querySelector(".region-label");
    if (!labelElem) {
      labelElem = document.createElement("span");
      labelElem.className = "region-label";
      region.element.appendChild(labelElem);
    }
    labelElem.textContent = species?.common ?? "";
  };

  // ================================================================================================================
  // Keyboard shortcuts

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      switch (e.key) {
        case "w": clickSave(); break;
        case "p": playing ? clickPause() : clickPlay(); break;
        case "d": clickSkip(); break;
        case "ArrowRight": clickNext(); break;
        case "a":
        case "ArrowLeft": clickPrev(); break;
      }
    },
    [playing, clickSave, clickPlay, clickPause, clickSkip, clickNext, clickPrev],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ================================================================================================================
  // Render

  return (
    <React.Fragment>
      <Head><title>Label Page</title></Head>
      <div className={styles.container}>
        <div className={styles.main}>
          <div className={styles.header}>
            <SelectRecordingsButton importFromDB={importFromDB} />
            <div className="w-64">
              Default Species:
              <SpeciesDropdown
                speciesMap={speciesMap}
                speciesId={selectedSpeciesId}
                onChange={(opt) => setSelectedSpeciesId(opt.speciesId)}
              />
            </div>
          </div>

          {showSpec && (
            <div>
              {entries.length > 0 && (
                <div className={styles.audioInfo}>
                  <p>File {index + 1} of {entries.length}: {currentEntry?.recording.url}</p>
                </div>
              )}
              <div id="stage" className={styles.stage} ref={stageRef}>
                {/* Zoom Controls Overlay */}
                <div className={styles.zoomControls}>
                  <div className={styles.zoomGroup}>
                    <span className={styles.zoomLabel}>X</span>
                    <button className={styles.zoomBtn} onClick={zoomXOut} aria-label="Zoom out horizontal">−</button>
                    <span className={styles.zoomValue}>{zoomX.toFixed(1)}×</span>
                    <button className={styles.zoomBtn} onClick={zoomXIn}  aria-label="Zoom in horizontal">+</button>
                  </div>
                  <div className={styles.zoomDivider} />
                  <div className={styles.zoomGroup}>
                    <span className={styles.zoomLabel}>Y</span>
                    <button className={styles.zoomBtn} onClick={zoomYOut} aria-label="Zoom out vertical">−</button>
                    <span className={styles.zoomValue}>{zoomY.toFixed(1)}×</span>
                    <button className={styles.zoomBtn} onClick={zoomYIn}  aria-label="Zoom in vertical">+</button>
                  </div>
                  <div className={styles.zoomDivider} />
                  <button className={`${styles.zoomBtn} ${styles.zoomReset}`} onClick={resetZoom} aria-label="Reset zoom">↺</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showSpec && (
        <>
          <div id="wave-timeline" style={{ height: "20px", margin: "20px" }} />

          <div className={styles.controls}>
            <button className={styles.prevClip} onClick={clickPrev} disabled={isPrevDisabled || index === 0}>
              <Image src="/images/LArrow.png" alt="Previous Button" width={45} height={45} />
            </button>
            <button className={styles.modelButton} onClick={clickSave}>Save</button>
            {!playing
              ? <button className={styles.play} onClick={clickPlay}><Image src="/images/Play.png"  alt="Play Button"  width={45} height={45} /></button>
              : <button className={styles.pause} onClick={clickPause}><Image src="/images/Pause.png" alt="Pause Button" width={45} height={45} /></button>
            }
            <button className={styles.modelButton} onClick={clickSkip}>Delete</button>
            <button className={styles.nextClip} onClick={clickNext} disabled={isNextDisabled || index === entries.length - 1}>
              <Image src="/images/RArrow.png" alt="Next Button" width={45} height={45} />
            </button>
          </div>

          <div className={styles.bottomBar}>
            <div className={styles.confidenceSection}>
              <label>Region buttons</label>
              <div className={styles.regionButtons}>
                <button className={styles.regionButton} onClick={deleteSelectedRegion}>Delete</button>
                <button className={styles.regionButton} onClick={clearAllRegions}>Clear</button>
              </div>
              {useConfidence && (
                <Slider displayLabel="Confidence" value={confidence} setValue={setConfidence} min={0} max={maxConfidence} />
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
                  if (ws) ws.setPlaybackRate(val, false);
                }}
              />
            </div>

            <div className={styles.annotationSection}>
              <label>Call Type:</label>
              <input type="text" value={callType} onChange={(e) => setCallType(e.target.value)} />
              {useAdditional && (
                <>
                  <label>Additional Notes:</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                </>
              )}
            </div>
          </div>
        </>
      )}

      {speciesDropdownState &&
        createPortal(
          <>
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 9999,
              }}
              onClick={() => setSpeciesDropdownState(null)}
            />
              <div
                style={{
                  position: "absolute",
                  top: speciesDropdownState.top + 20,
                  left: speciesDropdownState.left,
                  zIndex: 10000,
                  width: 256,
                }}
              >
                <SpeciesDropdown
                  speciesMap={speciesMap}
                  speciesId={speciesDropdownState.region.data?.species?.speciesId ?? selectedSpeciesId}
                  onChange={(option) => {
                    if (!option) { assignSpeciesToRegion(speciesDropdownState.region, null); return; }
                    const species = speciesMap[option.speciesId];
                    if (!species) return;
                    assignSpeciesToRegion(speciesDropdownState.region, species);
                    setSpeciesDropdownState(null);
                  }}
                  onMenuClose={() => setSpeciesDropdownState(null)}
                  onBlur={() => setSpeciesDropdownState(null)}
                  allowNull={true}
                  defaultMenuIsOpen={true}
                />
              </div>
            </>,
          document.body,
        )}
    </React.Fragment>
  );
};

export default AudioPlayer;