import React, { useState, useRef, useEffect, MouseEvent, useCallback, useImperativeHandle, forwardRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import Head from 'next/head'
import Image from 'next/image'
import styles from './verify.module.css'
import { audioBufferToWavBlob, cropAudio, decodeAudio } from '../utils/audio-decode'
import { Species } from '../../main/schema'
import arrayEqual from 'array-equal'
import { createContext } from 'react'
import { ModalSpectrogram, Spectrogram, SpectroRef } from './verify.spectrogram'
import { KeybindGuide } from './verify.keybind-guide'
import { useBoxSelection } from './verify.box-select'
import WaveSurfer from "wavesurfer.js";
import SpectrogramPlugin from "wavesurfer.js/dist/plugins/spectrogram";

// CONSTANTS //
// modification in Settings page to be implemented

const MAX_SKIPINTERVAL = 8;
const MIN_SKIPINTERVAL = 0.5

const MAX_PLAYSPEED = 4;
const MIN_PLAYSPEED = 0.25;

const MAX_COLUMNS = 8;
const MIN_COLUMNS = 1;


// DATA STRUCTURES //

export enum SpectroStatus { // 3 spectrogram states (default: Unverified)
	UNVERIFIED = "UNVERIFIED", 
	YES = "YES",
	NO = "NO",
}

interface SaveData { // JSON data structure for save files
	page: number,
	columns: number,
	spectrograms: {
		filePath: string;
		status: SpectroStatus;
		species: number;
	}[]
}
export interface ProcessedAnnotation { // Audio file information
	index: number;
	filePath: string;
	status: SpectroStatus;
	speciesIndex: number;
	recordingId: number;
	startOffset: number;
	endOffset: number;
}

export type WavesurferInstance = {
	audioUrl: string | null;
	wavesurfer: WaveSurfer;
	preloadedContainer: HTMLDivElement;
	spectrogramPlugin: SpectrogramPlugin;

	isAudioUrlReady: boolean;
	audioUrlReady: Promise<void>;

	isAudioLoaded: boolean;
	audioLoaded: Promise<void>;
}

interface VerifyContextValue {
	audioFiles: ProcessedAnnotation[];
	updateAudioFile: <K extends keyof ProcessedAnnotation>(
			i: number, 
			field: K, 
			value: ProcessedAnnotation[K]
		) => void;
	setHovered: (upd: number | ((prev: number) => number)) => void;
	playSpeed: number;
	speciesList: Species[];
	toggleModal: () => void;
}

export const VerifyContext = createContext<VerifyContextValue | null>(null);

export default function VerifyPage() {	

	// Default Settings

 	const [DEFAULT_SKIPINTERVAL, SET_DEFAULT_SKIPINTERVAL] = useState(1);
	const [DEFAULT_PLAYSPEED, SET_DEFAULT_PLAYSPEED] = useState(1.0);
	const [DEFAULT_COLUMNS, SET_DEFAULT_COLUMNS] = useState(2);
	const [DEFAULT_SPECIES_ID, SET_DEFAULT_SPECIES_ID] = useState(1);
	useEffect(() => {
		SET_DEFAULT_SKIPINTERVAL(Number(localStorage.getItem('skipInterval')));
		SET_DEFAULT_PLAYSPEED(Number(localStorage.getItem('playbackRate')) || DEFAULT_PLAYSPEED);
		SET_DEFAULT_COLUMNS(Number(localStorage.getItem('defaultColumns')) || DEFAULT_COLUMNS);
		SET_DEFAULT_SPECIES_ID(Number(localStorage.getItem('defaultSpeciesId')) || DEFAULT_SPECIES_ID);

		setSkipInterval(Number(localStorage.getItem('skipInterval')) || DEFAULT_SKIPINTERVAL);
		setPlaySpeed(Number(localStorage.getItem('playbackRate')) || DEFAULT_PLAYSPEED);
		setCOLS(Number(localStorage.getItem('defaultColumns')) || DEFAULT_COLUMNS);
		setDefaultSpeciesId(Number(localStorage.getItem('defaultSpeciesId')) || DEFAULT_SPECIES_ID);
	}, []);

	//// ================================================================================================================
	//// STATE
	
	// Page
	const [currentPage, setCurrentPage] = useState(0);
	const [forceReloadKey, setForceReloadKey] = useState(0); // crucial for switching pages	

	// Dimensions
	const [ROWS, setROWS] = useState(5);
	const [COLS, setCOLS] = useState(DEFAULT_COLUMNS);
	const FILES_PER_PAGE = ROWS*COLS;

	// Audio Files
	const [audioFiles, setAudioFiles] = useState<ProcessedAnnotation[]>([]); // global index (all audio files retrieved from database)
	const currentFiles = useMemo(
		() => audioFiles.slice((currentPage-1) * FILES_PER_PAGE, Math.min(currentPage * FILES_PER_PAGE, audioFiles.length)
	), [currentPage, FILES_PER_PAGE, audioFiles]);
	const nextFiles = useMemo( // specifically for pre-decoding audio files on the next page in the background
		() => audioFiles.slice(Math.min(currentPage * FILES_PER_PAGE, audioFiles.length), Math.min((currentPage+1) * FILES_PER_PAGE, audioFiles.length)
	), [currentPage, FILES_PER_PAGE, audioFiles]);
	const prevFiles = useMemo( // specifically for pre-decoding audio files on the prev page in the background
		() => audioFiles.slice(Math.max(0, (currentPage-2) * FILES_PER_PAGE), Math.min((currentPage-1) * FILES_PER_PAGE, audioFiles.length)
	), [currentPage, FILES_PER_PAGE, audioFiles]);

	const totalPages = Math.ceil(audioFiles.length / FILES_PER_PAGE);
	const numFiles = currentFiles.length;
	const numRows = Math.ceil(numFiles / COLS); 

	const firstIndexOnScreen = (currentPage-1) * FILES_PER_PAGE;
	const lastIndexOnScreen = Math.min(currentPage * FILES_PER_PAGE, audioFiles.length) - 1;

	// Spectrograms
	const instances = useRef<Record<number, WavesurferInstance>>({}); // global index
	const spectrograms = useRef<Record<number, SpectroRef>>({}); // screen index (wavesurfer spectros shown on screen)
	const globalIndexToScreenIndex = (index) => {
		return index - firstIndexOnScreen;
	}
	const screenIndexToGlobalIndex = (index) => {
		return index + firstIndexOnScreen;
	}

	// Select & Hover
	const [selected, _setSelected] = useState<number[]>([]); // global index
	const [hovered, setHovered] = useState<number | null>(null); // global index
	const firstSelected = selected[0]; // global index
	const lastSelected = selected[selected.length-1]; // global index
	
	// Modal
	const [showModal, _setShowModal] = useState(false);
	const [isModalInputFocused, setIsModalInputFocused] = useState(false);

	// Playback
	const currentlyPlayingId = useRef<number | null>(null); // screen index (-1 for modal)
	const [skipInterval, setSkipInterval] = useState(DEFAULT_SKIPINTERVAL);
	const [playSpeed, _setPlaySpeed] = useState(DEFAULT_PLAYSPEED);

	// Species
	const [defaultSpeciesId, setDefaultSpeciesId] = useState(DEFAULT_SPECIES_ID);
	const [speciesList, setSpeciesList] = useState<Species[]>([]);

	// Wrapped Setters

	const updateAudioFile = useCallback(
		<K extends keyof ProcessedAnnotation>(
			i: number,
			field: K,
			value: ProcessedAnnotation[K] | ((prev: ProcessedAnnotation[K]) => ProcessedAnnotation[K])
		) => {
			setAudioFiles(prevItems =>
				prevItems.map((item, index) => {
					if (index !== i) return item;
					const newValue =
						typeof value === 'function'
							? (value as (prev: ProcessedAnnotation[K]) => ProcessedAnnotation[K])(item[field])
							: value;
					return { ...item, [field]: newValue };
				})
			);
		},
		[]
	);

	const updateSelected = useCallback((arr: number[]): number[] | void => { // wraps setSelected
		if (isModalInputFocused) {return;}
		if (arrayEqual(arr as any, selected as any)) {return;}

		spectrograms.current[currentlyPlayingId.current]?.pause()
		_setSelected(arr);
		
		if (arr.length == 1 && showModal) { // reselect using arrow keys during modal
			toggleModal();
			toggleModal();
		}
		
		return arr;
		
	}, [isModalInputFocused, showModal, selected]);

	const toggleModal = useCallback(() => {	// wraps setShowModal
		if (selected.length != 0) {
			_setShowModal((prev) => {
				if (prev) { // EXIT MODAL
					currentlyPlayingId.current = null;
					return false;
				} else { // SHOW MODAL
					spectrograms.current[currentlyPlayingId.current]?.pause();
					return true;
				}
			});
		}		
	}, [selected, showModal]);

	const setPlaySpeed = useCallback((upd) => {
		_setPlaySpeed((prev) => {
			const newSpeed = typeof upd === 'function' ? upd(prev) : upd;

			if (currentlyPlayingId.current != null) {
				spectrograms.current[currentlyPlayingId.current].setPlaybackRate(newSpeed);

				if (showModal) {
					spectrograms.current[-1].setPlaybackRate(newSpeed);
				}
			}
		
			return newSpeed;
		});
	}, []);

	const contextValue: VerifyContextValue = useMemo(() => ({
		audioFiles, updateAudioFile,
		setHovered,
		playSpeed,
		speciesList,
		toggleModal,
	}), [
		audioFiles, updateAudioFile,
		setHovered,
		playSpeed,
		speciesList,
		toggleModal,
	])

	//// ================================================================================================================
	//// Cleanup

	const cleanup = async (index: number, force: boolean = false) => {
		const currentInstances = instances.current;
		const instance = currentInstances[index];
		if (instance) {
			if (!instance.isAudioLoaded) {
				if (force) {
					await instance.audioLoaded;
				} else {
					return;
				}
			}

			URL.revokeObjectURL(instance.audioUrl);
			instance.wavesurfer.unAll();
			instance.wavesurfer.destroy();
			
			instance.preloadedContainer.remove();
			delete currentInstances[index];
		}
	}

	useEffect(() => {
		return () => {
			instances.current && Object.keys(instances.current).forEach((key) => {
				cleanup(Number(key), true);
			});
		}
	}, [])

	//// ================================================================================================================
	//// CHECKS + SYNC
	
	// crucial for when # of pages decreases while on the last page
	if (currentPage > totalPages) { setCurrentPage(totalPages); }

	// prevents rest of page from interacting with mouse while modal is open
	useEffect(() => { 
		if (showModal) { document.getElementById("container").classList.add(styles.noInteraction); } 
		else { document.getElementById("container").classList.remove(styles.noInteraction); }
	}, [showModal]);

	// decode new audio files and prerenders new Wavesurfer objects on page update
	useEffect(() => {
		Object.entries(instances.current).forEach(([index, _]) => {
			const indexNum = Number(index);

			const isInPrev = !!prevFiles.find(f => f.index === indexNum);
			const isInCurrent = !!currentFiles.find(f => f.index === indexNum);
			const isInNext = !!nextFiles.find(f => f.index === indexNum);
			
			if (!isInPrev && !isInCurrent && !isInNext) {
				cleanup(indexNum);
			}
		})

		const filesToLoad = [...currentFiles, ...nextFiles];
		filesToLoad.forEach(async (file, _) => {
			const index = file.index;

			const existing = instances.current[index];
			if (existing) {
				return;
			}

			// loading promise
			let resolveAudioUrlReady: () => void;
			let resolveAudioLoaded: () => void;

			// new instance shell
			const instance = {
				audioUrl: null,
				wavesurfer: null as any, // assigned below
				preloadedContainer: null as any, // assigned below
				spectrogramPlugin: null as any, // assigned below

				isAudioUrlReady: false,
				audioUrlReady: new Promise<void>((resolve) => {resolveAudioUrlReady = resolve;}),

				isAudioLoaded: false,
				audioLoaded: new Promise<void>((resolve) => {resolveAudioLoaded = resolve;}),
			} as WavesurferInstance;
			instances.current[index] = instance;

			// create preloaded container
			const preloadedContainer = document.createElement('div');
			preloadedContainer.className = `${styles.unmountedInstance}`
			preloadedContainer.id = `preload-wavesurfer-${index}`;
			document.body.appendChild(preloadedContainer);

			// create wavesurfer instance + spectrogram plugin
			const wavesurfer = WaveSurfer.create({
				container: preloadedContainer,
				height: 0,
				fillParent: true,
				progressColor: 'white',
				cursorColor: 'yellow',
				cursorWidth: 2,
				sampleRate: 16000,
			});
			const spectrogramPlugin = SpectrogramPlugin.create({
				colorMap: 'roseus',
				scale: "linear",
				fftSamples: 64, // unzoomed quality for preload
				labels: false,
				height: 90,
			});
			wavesurfer.registerPlugin(spectrogramPlugin);

			// assign instant variables
			instance.preloadedContainer = preloadedContainer;
			instance.wavesurfer = wavesurfer;
			instance.spectrogramPlugin = spectrogramPlugin;
			
			// ------------- ASYNC WORK ------------
			try {
				const audioFile = await window.ipc.invoke(
					'read-file-for-verification',
					file.filePath
				);
				const decoded = await decodeAudio(audioFile.data);
				const cropped = cropAudio(
					decoded,
					file.startOffset,
					file.endOffset,
					file.filePath
				);
				const blob = audioBufferToWavBlob(cropped);
				const audioUrl = URL.createObjectURL(blob);

				instance.audioUrl = audioUrl;
				instance.isAudioUrlReady = true; // resolve url ready
				resolveAudioUrlReady();

				wavesurfer.on('ready', () => {
					if (instance.isAudioLoaded) return;

					instance.isAudioLoaded = true; // resolve audio loaded
					resolveAudioLoaded();
				});
				

				wavesurfer.load(audioUrl);
			} catch (e) {
				console.error('Preloaded WaveSurfer load failed:', e);
				wavesurfer.destroy();
				instance.isAudioLoaded = true;
				resolveAudioLoaded(); 
			}
		});

		Object.entries(spectrograms.current).forEach(([screenIndex, spectroRef]) => {
			if (Number(screenIndex) == -1) return;
			const instance = instances.current[spectroRef.index];
			spectrograms.current[screenIndex].mountInstance(instance);
		})

	}, [currentFiles]);

	// update currently playing spectrogram's playSpeed
	useEffect(() => {
		if (currentlyPlayingId.current != null) {
			spectrograms.current[currentlyPlayingId.current].setPlaybackRate(playSpeed);
		}
	}, [playSpeed])


	//// ================================================================================================================
	//// INITIALIZATION

	// initial DB load
	async function handleFileSelectionFromDB() {
		let processed: ProcessedAnnotation[] = [...audioFiles];
		let spawnPage = 1;

		const recordings = await window.api.listRecordings();
		const listOfSpecies: Species[] = await window.api.listSpecies();
		setSpeciesList(listOfSpecies);

		const tasks = recordings.map(async (rec, i) => {
			try {
				const regions = await window.api.listRegionOfInterestByRecordingId(rec.recordingId);

				await Promise.all(regions.map(async (region) => {
					const anns = await window.api.listAnnotationsByRegionId(regions[0].regionId);
					if (!anns) {return;}

					await Promise.all(anns.map(async (annotation, i) => {
						processed.push({
							index: processed.length,
							filePath: rec.url,
							recordingId: rec.recordingId,
							status: (
								annotation.verified == "YES" ? SpectroStatus.YES :
								annotation.verified == "NO" ? SpectroStatus.NO : SpectroStatus.UNVERIFIED
							),
							speciesIndex: (annotation.speciesId ?? defaultSpeciesId)-1, // NEED CLARIFICATION HERE
							startOffset: region.starttime,
							endOffset: region.endtime,
						});
					}))
				}))
			} catch (err) {
				console.error(`Failed to read audio file at ${rec.url}:`, err);
			}
		});

		await Promise.all(tasks);

		setAudioFiles(processed);
		setCurrentPage(spawnPage);
	}

	//// ================================================================================================================
	//// CONTROLS

	const saveToJSON = async () => {
		var obj : SaveData = { page: currentPage, columns: COLS, spectrograms: [] };
		for (let i = 0; i < audioFiles.length; i++) {
			const save = audioFiles[i];
			obj.spectrograms.push({
				filePath: save.filePath, 
				species: save.speciesIndex || DEFAULT_SPECIES_ID,
				status: save.status
			});
		}
		var json = JSON.stringify(obj);

		const filePath = await window.ipc.invoke('save-dialog', null);
		if (filePath) {
			await window.ipc.send("save-file", {filename: filePath, content: json});
		}
	}

	const handleSaveToDB = async () => {
		for (let i = 0; i < audioFiles.length; i++) {
			const file = audioFiles[i];
			await window.api.updateAnnotationVerified(file.recordingId, file.status);
		}
	}
	const nextPage = useCallback(() => {
		if (!showModal && currentPage < totalPages) {
			setCurrentPage((prev) => Math.min(prev + 1, totalPages));
			setForceReloadKey((prev) => prev + 1);
		}
	}, [currentPage, totalPages, showModal]);
	const prevPage = useCallback(() => {
		if (!showModal && currentPage > 1) {
			setCurrentPage((prev) => Math.max(prev - 1, 1));
			setForceReloadKey((prev) => prev + 1);
		}
	}, [currentPage, totalPages, showModal]);

	const moveSelectionUp = () => 		{ if (numFiles == 0) return; updateSelected([selected.length==0 ? firstIndexOnScreen : Math.max(lastSelected - COLS, firstIndexOnScreen + (lastSelected % COLS))]); }
	const moveSelectionDown = () => 	{ if (numFiles == 0) return; updateSelected([selected.length==0 ? firstIndexOnScreen : Math.min(lastSelected + COLS, lastIndexOnScreen - (COLS - lastSelected % COLS) + 1)]); }
	const moveSelectionLeft = () => 	{ if (numFiles == 0) return; updateSelected([selected.length==0 ? firstIndexOnScreen : Math.max(lastSelected - 1, firstIndexOnScreen)]); }
	const moveSelectionRight = () => 	{ if (numFiles == 0) return; updateSelected([selected.length==0 ? firstIndexOnScreen : Math.min(lastSelected + 1, lastIndexOnScreen)]); }
	const setSpectroStatus = (status) => { selected.forEach((i) => {updateAudioFile(i, "status", status);}) }
	const playPauseSelection = () => { 
		if (selected.length == 0) { return }; // null
		if (currentlyPlayingId.current != null && currentlyPlayingId.current != globalIndexToScreenIndex(firstSelected) && !showModal) { spectrograms.current[currentlyPlayingId.current].pause(); }; // pause existing
		const screenIndex = showModal ? -1 : globalIndexToScreenIndex(firstSelected);

		const isPlaying = spectrograms.current[screenIndex].playPause(); // play/pause selected
		currentlyPlayingId.current = (isPlaying ? screenIndex : null);
	}
	const skipBack = () => { if (selected.length != 0) {spectrograms.current[showModal ? -1 : globalIndexToScreenIndex(firstSelected)].skip(-skipInterval);}; }
	const skipForward = () => { if (selected.length != 0) {spectrograms.current[showModal ? -1 : globalIndexToScreenIndex(firstSelected)].skip(skipInterval);}; } 
	const doubleSkipInterval = () => { setSkipInterval((prev) => Math.min(prev*2, MAX_SKIPINTERVAL)) } 
	const halveSkipInterval = () => { setSkipInterval((prev) => Math.max(prev/2, MIN_SKIPINTERVAL)) } 
	const doublePlaySpeed = () => { setPlaySpeed((prev) => { return Math.min(MAX_PLAYSPEED, prev*2); }); }
	const halvePlaySpeed = () => { setPlaySpeed((prev) => { return Math.max(MIN_PLAYSPEED, prev/2); }); }
	const resetIncrements = () => { 
		setSkipInterval(DEFAULT_SKIPINTERVAL); 
		setPlaySpeed(DEFAULT_PLAYSPEED); 
		if (currentlyPlayingId.current != null) {spectrograms.current[currentlyPlayingId.current].setPlaybackRate(DEFAULT_PLAYSPEED)}; 
	}
	const moreColumns = () => { setCOLS((prev) => { updateSelected([]); return Math.min(prev+1, MAX_COLUMNS); }); }
	const lessColumns = () => { setCOLS((prev) => { updateSelected([]); return Math.max(prev-1, MIN_COLUMNS); }); }
	const deleteSelected = () => {
		// Update audio files
		const remainingFiles = audioFiles
			.filter((_, i) => !selected.includes(i))
			.map((item, newIndex) => ({ ...item, index: newIndex }));

		// Unmount all spectrograms that have to shift down
		for (let id = globalIndexToScreenIndex(firstSelected); id < numFiles; id++) {
			spectrograms.current[id].unmountInstance();
		}

		// Clean up instances of deleted
		selected.map((index) => {
			cleanup(index, true);
		})

		// Rebuild instances with shifted indices
		const newInstances: Record<number, WavesurferInstance> = {};
		let newIndex = 0;
		for (let oldIndex = 0; oldIndex < audioFiles.length; oldIndex++) {
			if (selected.includes(oldIndex)) continue;

			const instance = instances.current[oldIndex];
			if (instance) {
				newInstances[newIndex] = instance;
				newIndex++;
			}
		}
		instances.current = newInstances;

		// Clear selection
		setAudioFiles(remainingFiles);
		updateSelected([]);
	};
	const switchSpeciesOfSelected = () => { selected.forEach((i) => { updateAudioFile(i, "speciesIndex", (prev)=>((prev+1) % speciesList.length)); }) }


	//// ================================================================================================================
	//// KEYBIND SYSTEM

	// print 'event.key' to get the right keycode 
	const keybinds = {
		"w": {func: moveSelectionUp, label: "Move selection up"},
		"a": {func: moveSelectionLeft, label: "Move selection left"},
		"s": {func: moveSelectionDown, label: "Move selection down"},
		"d": {func: moveSelectionRight, label: "Move selection right"},
		"ArrowUp": {func: moveSelectionUp, label: "Move selection up"},
		"ArrowLeft": {func: moveSelectionLeft, label: "Move selection left"},
		"ArrowDown": {func: moveSelectionDown, label: "Move selection down"},
		"ArrowRight": {func: moveSelectionRight, label: "Move selection right"},
		"Tab": {func: moveSelectionRight, label: "Move selection right"},
		"z": {func: () => {setSpectroStatus(SpectroStatus.UNVERIFIED)}, label: "Mark as unverified/valid/invalid"},
		"x": {func: () => {setSpectroStatus(SpectroStatus.YES)}, label: "Mark as unverified/valid/invalid"},
		"c": {func: () => {setSpectroStatus(SpectroStatus.NO)}, label: "Mark as unverified/valid/invalid"},
		" ": {func: playPauseSelection, label: "Play/Pause"},
		",": {func: skipBack, label: "Skip back/forward"},
		".": {func: skipForward, label: "Skip back/forward"},
		"l": {func: doubleSkipInterval, label: "Double/Halve skip interval"},
		"k": {func: halveSkipInterval, label: "Double/Halve skip interval"},
		"m": {func: doublePlaySpeed, label: "Double/Halve playback speed"},
		"n": {func: halvePlaySpeed, label: "Double/Halve playback speed"},
		";": {func: lessColumns, label: "Fewer/More columns"},
		"'": {func: moreColumns, label: "Fewer/More columns"},
		"r": {func: resetIncrements, label: "Reset increments"},
		"o": {func: toggleModal, label: "Toggle detailed view"},
		"Backspace": {func: deleteSelected, label: "Delete selected"},
		"Shift": {func: switchSpeciesOfSelected, label: "Start/Exit labeling mode"},
		"\\": {func: prevPage, label: "Next/Prev page"},
	}

	// handle keyboard input (ADD STATES TO THE DEPENDENCY ARRAY IF RELATED TO A KEYBIND )
	useEffect(() => { 
		const handleKeyDown = (event) => {
			if (event.key == "Tab") {
				event.preventDefault();
			}

			if (showModal) {
				if (event.key == "Escape") {
					if (isModalInputFocused) {
						setIsModalInputFocused(false);
					} else {
						toggleModal();
					}
					return; 
				} else {
					if (isModalInputFocused) {return;}
				}
			}

			const func = keybinds[event.key]?.func;		
			if (func) {
				func();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [selected, currentlyPlayingId, playSpeed, skipInterval, currentPage, totalPages, showModal, isModalInputFocused, toggleModal]);


	//// ================================================================================================================
	//// BOX SELECTION SYSTEM

	const containerRef = useRef(null)
	const selectionRectRef = useRef<HTMLDivElement>(null)
	const { handleMouseDown, handleMouseMove, handleMouseUp } =
		useBoxSelection({
			containerRef,
			spectrograms,
			updateSelected,
			selectionRectRef,
		});

	
	//// ================================================================================================================
	//// DOM

	return (
		<React.Fragment>
			<Head>
				<title>Verify Page</title>
			</Head>
			
			<VerifyContext.Provider value={contextValue}>
				<div 
					id="container" 
					className={styles.container} 
					ref={containerRef}
					onMouseMove={(e) => {if (!showModal) {handleMouseMove(e)}}}
					onMouseDown={(e) => {if (!showModal) {handleMouseDown(e)}}}
					onMouseUp={(e) => {if (!showModal) {handleMouseUp()}}}
					style={{ userSelect: 'none' }}
				>
					<div
						ref={selectionRectRef}
						style={{
							position: "absolute",
							left: 0,
							top: 0,
							width: 0,
							height: 0,
							backgroundColor: "rgba(0, 120, 215, 0.2)",
							border: "1px solid #0078d7",
							pointerEvents: "none",
							zIndex: 10,
							display: "none",
						}}
					/>

					<div 
						className = {styles.verifyButtonMenu}
						onMouseDown={(e) => {if (!showModal) {e.stopPropagation(); handleMouseDown(e, false)}}}
					>

						<label className={styles.pickFiles} onClick={(e) => {
							e.stopPropagation();
							handleFileSelectionFromDB();
						}}>
							<p>Import files from Database</p>
						</label> 
						{audioFiles.length > 0 && (
							<>
								<div className={styles.smallContainer}>
									<p className={styles.smallLabel}>Save</p>

									<div className={styles.save} onClick={(e) => {
										e.stopPropagation()
										saveToJSON()
										handleSaveToDB()
									}}>
										<Image
										src="/images/database.png"
										alt="Save to JSON"
										width={20}
										height={20}
										/>
									</div>
								</div>

								<div className={styles.smallContainer}>
									<p className={styles.smallLabel}>
										Page:{" "}
										<input
											type="number"
											value={currentPage}
											min={1}
											max={totalPages}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
												const value = parseInt(e.target.value);
												if (!isNaN(value) && value >= 1 && value <= totalPages) {
													setCurrentPage(value);
												}
											}}
											style={{ width: "3em", textAlign: "center" }}
										/>{" "}
										/ {totalPages}
									</p>

									<div 
									style={{ overflow: 'hidden', display: 'flex', alignItems: 'center' }} 
									className={styles.smallContainerRow}
									>
										<div className={currentPage>1 ? styles.prevFiles : styles.disabled} onClick={prevPage}>
											<Image
											src="/images/LArrow.png"
											alt="Previous files"
											width={20}
											height={20}
											style={{ display: 'block' }}
											/>
										</div>	
										<div className={currentPage<totalPages ? styles.nextFiles : styles.disabled} onClick={nextPage}>
											<Image
											src="/images/RArrow.png"
											alt="Next files"
											width={20}
											height={20}
											style={{ display: 'block' }}
											/>
										</div>
									</div>
								</div>
							</>
						)}
						
						<div className={styles.smallContainer}>
							<p className={styles.smallLabel}>Skip Interval: {skipInterval}</p>
							<div className={styles.smallContainerRow}>
								<button className={styles.smallButton} onClick={(e) => {halveSkipInterval(); e.stopPropagation()}}>-</button>
								<button className={styles.smallButton} onClick={(e) => {doubleSkipInterval(); e.stopPropagation()}}>+</button>
							</div>
						</div>
						
						<div className={styles.smallContainer}>
							<p className={styles.smallLabel}>Playback Speed: {playSpeed}</p>
							<div className={styles.smallContainerRow}>
								<button className={styles.smallButton} onClick={(e) => {halvePlaySpeed(); e.stopPropagation()}}>-</button>
								<button className={styles.smallButton} onClick={(e) => {doublePlaySpeed(); e.stopPropagation()}}>+</button>
							</div>
						</div>

						<div className={styles.smallContainer}>
							<p className={styles.smallLabel}>COLUMNS: {COLS}</p>
							<div className={styles.smallContainerRow}>
								<button className={styles.smallButton} onClick={(e) => {lessColumns(); e.stopPropagation()}}>-</button>
								<button className={styles.smallButton} onClick={(e) => {moreColumns(); e.stopPropagation()}}>+</button>
							</div>
						</div>

						<div>
							<p className={styles.smallLabel}>Selected: 
								{	
									" " + (
										selected.length==0 ? 
											"none" : 
											selected.map((fullIdx) => fullIdx + 1)
									)
								}
							</p>
							
							{ selected.length > 0 && (
								<button 
									onClick={(e) => { deleteSelected(); e.stopPropagation()}}
									onMouseDown={(e) => { e.stopPropagation()}}>
										Delete selected
								</button>
							)}
						</div>
						
						{/* Help icon with tooltip */}
						<div className={styles.helpIcon}>
							?
							<div className={styles.helpTooltip}>
								<KeybindGuide keybinds={keybinds} />
							</div>
						</div>
					</div>

					{audioFiles.length > 0 && (
						currentFiles.length > 0 ? (
							<div id="grid" key={forceReloadKey} className={styles.grid} style={{
								gridTemplateColumns: `repeat(${COLS}, 1fr)`,
								gridTemplateRows: `repeat(${ROWS}, auto)`,
							}}>
								{currentFiles.map(({index}, i) => {
									if (!(spectrograms as any)._refCallbacks) {
										(spectrograms as any)._refCallbacks = {};
									}
									const refCallbacks = (spectrograms as any)._refCallbacks as Record<number, (el: any) => void>;
									if (!refCallbacks[i]) {
										refCallbacks[i] = (el) => { if (el) spectrograms.current[i] = el; };
									}
									return (
										<Spectrogram
											key={index}
											id={i} 
											index={index}
											syncedSpectro={null}
											ref={refCallbacks[i]}
											isSelected={selected.includes(index)}
											isHovered={hovered == index}
											instance={instances.current[index]}
										/>
									)
								})}
							</div>
						) : (
							<div className={styles.noSpectrosContainer}>
								<div className={styles.waveLoadingCircle}></div>
							</div>
						)
					)}

					<>
						{showModal && firstSelected != null && (() => {
							const refCallbacks = (spectrograms as any)._refCallbacks as Record<number, (el: any) => void>;
							if (!refCallbacks[-1]) {
								refCallbacks[-1] = (el) => { if (el) spectrograms.current[-1] = el; };
							}
							return createPortal(
								<ModalSpectrogram
									key={-1}
									id={-1} 
									index={firstSelected}
									isSelected={false}
									isHovered={false}
									syncedSpectro={spectrograms.current[firstSelected]}
									ref={refCallbacks[-1]}
									instance={instances.current[firstSelected]}
								/>,
								document.body
							)
						})()}
							
					</>
				</div>
			</VerifyContext.Provider>
		</React.Fragment>
	)
}