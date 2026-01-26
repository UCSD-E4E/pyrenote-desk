import React, { useState, useRef, useEffect, useCallback } from "react";
import Head from "next/head";
import Image from "next/image";
import styles from "./label.module.css";

import WaveSurfer from "wavesurfer.js";
import SpectrogramPlugin from "wavesurfer.js/dist/plugins/spectrogram";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline";
import { GenericPlugin } from "wavesurfer.js/dist/base-plugin";
import { Region } from "wavesurfer.js/src/plugin/regions";
import {
	Annotation,
	Recording,
	RegionOfInterest,
	Species,
} from "../../main/schema";

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
	wsInstance: WaveSurfer;
	preloadedContainer: HTMLDivElement;
	spectrogramPlugin: SpectrogramPlugin;
	regionsPlugin?: RegionsPlugin;
	timelinePlugin?: TimelinePlugin;
}

// Generate ColorMap for Spectrogram
const spectrogramColorMap = [];
for (let i = 0; i < 256; i++) {
	const val = (255 - i) / 256;
	spectrogramColorMap.push([val / 2, val / 3, val, 1]);
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
	const [playbackRate, setPlaybackRate] = useState("1");
	const [sampleRate, setSampleRate] = useState('44100');

	// Region & species
	const regionListRef = useRef<any[]>([]);
	const activeRegionRef = useRef<any>(null);
	const [speciesList, setSpeciesList] = useState<Species[]>([]);
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

	// =====================================================================================================
	// Cleanup 

	const cleanup = async (key = currentEntryId) => {
		const instance = instances.current[key];
		if (!instance) {
			return;
		}

		const waveEntry = entries.find((entry) => (entry.id == key));
		if (waveEntry) {
			waveEntry.isMounted = false;
		}

		const ws = instance.wsInstance;
		if (ws) {
			try {
				// Remove all event listeners
				ws.unAll();

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

				// Destroy the wavesurfer instance (this will also clean up plugins)
				ws.destroy();
			} catch (e) {
				console.warn("Error destroying wavesurfer:", e);
				// Still try to destroy even if cleanup failed
				try {
					ws.destroy();
				} catch (destroyError) {
					console.error("Error in final destroy:", destroyError);
				}
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
		console.log("Cleaned up wavesurfer instance for key:", key);
		delete instances.current[key];
	}

	const cleanupAll = async () => {
		Object.entries(instances.current).forEach(async ([key, url]) => {
			console.log(key);
			cleanup(key);
		})
	}

	// Cleanup everything on component unmount
	useEffect(() => {
		return () => {
			console.log("UNMOUNT")
			cleanupAll();
		};
	}, []);

	// =====================================================================================================
	// Loop 

	const mountWavesurfer = async (key: string) => {
		const waveEntry = entries.find((entry) => (entry.id == key));
		const instance = instances.current[key];

		const ws = instance.wsInstance;
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
		await ws.registerPlugin(instance.timelinePlugin);

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

		const regionList: Region[] = [];
		
		const plug = (RegionsPlugin as any).create({
			name: "regions",
			regions: [],
			drag: true,
			resize: true,
			color: "rgba(0, 255, 0, 0.3)",
			dragSelection: true,
		});
		const wsRegions = await ws.registerPlugin(plug);
		instance.regionsPlugin = plug;

		wsRegions.enableDragSelection({ color: "rgba(0,255,0,0.3)" }, 3);

		const redraw = (region: Region) => {
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
			region.element.style.zIndex = "9999";
		};

		wsRegions.on("region-created", (region: Region) => {
			redraw(region);
			regionListRef.current.push(region);
			regionList.push(region);
			setTimeout(() => {
				redraw(region);
			}, 50);
		});

		wsRegions.on("region-removed", (region: Region) => {
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

				region.setOptions({ color: "rgba(255,0,0,0.3)" });
				activeRegionRef.current = region;

				region.data = { ...region.data, loop: true };
			}
		});

		wsRegions.on("region-out", (region: Region) => {
			if (region.data?.loop) {
				region.play();
			}
		});

		wsRegions.on("region-double-clicked", (region) => {
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

			select.addEventListener("mousedown", (e) => e.stopPropagation());
			select.addEventListener("click", (e) => e.stopPropagation());

			select.addEventListener("change", () => {
				const selectedId = parseInt(select.value);
				const selectedSpecies = speciesList.find(
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

		ws.on("finish", () => {
			setPlaying(false);
		});

		const dbRegions = Array.isArray(waveEntry.regions)
			? waveEntry.regions
			: [];
		for (const r of dbRegions) {
			wsRegions.addRegion({
				start: r.starttime,
				end: r.endtime,
				color: "rgba(0, 255, 0, 0.3)",
				id: "imported-" + r.regionId,
			});
		}

		waveEntry.isMounted = true;
	}

	const unmountWavesurfer = (key: string) => {
		const waveEntry = entries.find((entry) => (entry.id == key));

		const instance = instances.current[key];
		const container = instance.preloadedContainer;
		const ws = instance.wsInstance;

		if (!container) return;

		// Destroy plugins if wavesurfer exists and is mounted
		if (ws && waveEntry?.isMounted) {
			try {
				// Remove all event listeners
				ws.unAll();

				instance.regionsPlugin.destroy();
				instance.timelinePlugin.destroy();
				delete instance.regionsPlugin;
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
		
		ws.setPlaybackRate(parseFloat(playbackRate), false);


		// ===================================================================================
		// Spectrogram Plugin

		const spectrogramPlugin = SpectrogramPlugin.create({
			container: `#${waveEntry.spectrogramId}`,
			labels: true,
			colorMap: "roseus",
			fftSamples: 256,
			height: 230,
		})
		ws.registerPlugin(spectrogramPlugin);

		// ===================================================================================
		// Finalize

		waveEntry.isCreating = false;

		instances.current[key] = {
			audioURL: audioURL,
			wsInstance: ws,
			preloadedContainer: hiddenContainer,
			spectrogramPlugin: spectrogramPlugin,
		}
	}

	// Runs on page update or entries update
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

		async function handleMounting() {
			// Unmount containers that are no longer in range (index, index+1)
			Object.entries(instances.current).forEach(([key, container]) => {
				if (!idsToPreload.includes(key)) { 
					cleanup(key)
				} else if (key != currentEntryId) {
					unmountWavesurfer(key);
				}
			});


			// Create wavesurfers for current and next index if they don't exist
			if (index + 1 < entries.length) {
				createWavesurfer(entries[index+1].id);
			}
			await createWavesurfer(entries[index].id);

			// Clear waveStage
			if (waveStageRef.current) {
				while (waveStageRef.current.firstChild) {
					waveStageRef.current.removeChild(waveStageRef.current.firstChild);
				}
			}

			// Mount the current index (make it visible in waveStage)
			await mountWavesurfer(currentEntryId);
		}

		handleMounting();
	}, 
	[
		showSpec,
		index,
		entries,
	]);

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
		const wsInstance = instances.current[currentEntryId].wsInstance;
		// Plays the active region
		if (wsInstance && activeRegionRef.current) {
			activeRegionRef.current.play();
		} else if (wsInstance) {
			wsInstance.playPause();
		}
		setPlaying(true);
	}, [entries, index]);

	const clickPause = useCallback(async () => {
		const wsInstance = instances.current[currentEntryId].wsInstance;
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

		const ws = instances.current[currentEntryId].wsInstance;
		if (!ws) return;

		// Accesses all regions
		const regionPlugin = (ws as any).plugins[1];
		if (!(ws as any)?.regions?.list) {
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
					console.log("Creating new region of interest with ",entries[index].recording.recordingId, region.start, region.end);
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
					console.log("label: ", region.data.species);
					const confidence = Number.parseInt(region.data?.confidence as string);
					// TODO: Labeller id & confidence
					console.log("creating new annoations")
					await window.api.createAnnotation(
						entries[index].recording.recordingId,
						0,
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
				//	 `Region #${idx + 1}: Start = ${startSec}s, End = ${endSec}s`,
				// );
			};
			//
			// lines.push(
			//	 "",
			//	 `Confidence: ${confidence}`,
			//	 `Call Type: ${callType}`,
			//	 `Additional Notes: ${notes}`,
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
				await cleanup();
				setEntries([]);
			} else {
				await cleanup();
				setEntries((arr) => arr.slice(1));
				setIndex(0);
			}
			setTimeout(() => setYesDisabled(false), 500);
			return;
		}

		await cleanup();
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
			await cleanup();
			
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
		await cleanup();
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
				const species = await window.api.listSpecies();
				setSpeciesList(species);
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
	function toggleRecordingSelect() {setModalEnable(prev => !prev);}

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
						const result	= await window.api.listRecordingsByFilters({
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
								<>
									<label className={styles.confidenceLabel} htmlFor="confidence">
										Confidence: {confidence}
									</label>
									<input
										type="range"
										id="confidence"
										min="0"
										max={maxConfidence}
										value={confidence}
										onChange={(e) => setConfidence(Number(e.target.value))}
									/>
								</>
							)}

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
									const ws = instances.current[currentEntryId]?.wsInstance;
									if (ws) {
										ws.setPlaybackRate(parseFloat(e.target.value), false);
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
