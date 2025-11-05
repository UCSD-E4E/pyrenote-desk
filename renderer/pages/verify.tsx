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

// CONSTANTS //
// modification in Settings page to be implemented

const MAX_SKIPINTERVAL = 8;
const DEFAULT_SKIPINTERVAL = 2;
const MIN_SKIPINTERVAL = 0.5

const MAX_PLAYSPEED = 4;
const DEFAULT_PLAYSPEED = 1;
const MIN_PLAYSPEED = 0.25;

const MAX_COLUMNS = 8;
const DEFAULT_COLUMNS = 2;
const MIN_COLUMNS = 1;

const DEFAULT_SPECIES_ID = 0


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
	url?: string; // not the same as filepath, refers to the cropped audio blob in memory
}


interface VerifyContextValue {
	audioFiles: ProcessedAnnotation[];
	updateAudioFile: <K extends keyof ProcessedAnnotation>(
			i: number, 
			field: K, 
			value: ProcessedAnnotation[K]
		) => void;
	audioURLs: Record<number, string>;
	selected: number[];
	updateSelected: (arr: number[]) => number[] | void;
	hovered: number | null;
	setHovered: (upd: number | ((prev: number) => number)) => void;
	playSpeed: number;
	setPlaySpeed: (upd: number | ((prev: number) => number)) => void;
	speciesList: Species[];
	toggleModal: () => void;
	isModalInputFocused: boolean;
	setIsModalInputFocused: (upd: boolean | ((prev: boolean) => boolean)) => void;
}

export const VerifyContext = createContext<VerifyContextValue | null>(null);

export default function VerifyPage() {	

	//// ================================================================================================================
	//// STATE
	
	// Recordkeeping
	const [audioFiles, setAudioFiles] = useState<ProcessedAnnotation[]>([]); // all audio files retrieved from database
	const [audioURLs, setAudioURLs] = useState<Record<number, string>>({}) // uses audioFiles index as key
	const spectrograms = useRef<SpectroRef[]>([]); // uses currentFiles index

	// Select & Hover
	const [selected, _setSelected] = useState([]); // selected spectrogram(s), currentFiles indices
	const [hovered, setHovered] = useState(null); // hovered spectrogram, currentFiles indices
	const firstSelected = selected[0];
	const lastSelected = selected[selected.length-1];
	
	// Modal
	const [showModal, _setShowModal] = useState(false);
	const [isModalInputFocused, setIsModalInputFocused] = useState(false);

	// Playback
	const currentlyPlayingIndex = useRef(null); // spectrogram that is currently playing sound (currentFiles index)
	const [skipInterval, setSkipInterval] = useState(DEFAULT_SKIPINTERVAL);
	const [playSpeed, _setPlaySpeed] = useState(DEFAULT_PLAYSPEED);

	// Species
	const [defaultSpeciesId, setDefaultSpeciesId] = useState(DEFAULT_SPECIES_ID);
	const [speciesList, setSpeciesList] = useState<Species[]>([]);

	// Page
	const [currentPage, setCurrentPage] = useState(0);
	const [forceReloadKey, setForceReloadKey] = useState(0); // crucial for switching pages	
	
	// Dimensions
	const [ROWS, setROWS] = useState(5);
	const [COLS, setCOLS] = useState(DEFAULT_COLUMNS);
	const FILES_PER_PAGE = ROWS*COLS;
	const totalPages = Math.ceil(audioFiles.length / FILES_PER_PAGE);

	const currentFiles = useMemo(
		() => audioFiles.slice((currentPage - 1) * FILES_PER_PAGE, Math.min(currentPage * FILES_PER_PAGE, audioFiles.length)
	), [currentPage, FILES_PER_PAGE]);
	const numFiles = currentFiles.length;
	const numRows = Math.ceil(numFiles / COLS); 
	const numSpots = numRows * COLS; 


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

	const updateSelected = useCallback((arr) => { // wraps setSelected
		if (!isModalInputFocused) {
			if (arrayEqual(arr, selected)) {return;}

			for (let i = 0; i < selected.length; i++) { // deselect current
				spectrograms.current[selected[i]].pause();
			}
			
			_setSelected(arr);
			
			if (arr.length == 1 && showModal) { // reselect using arrow keys during modal
				toggleModal();
				toggleModal();
			}
			
			return arr;
		}
	}, [isModalInputFocused, showModal, selected]);

	const toggleModal = useCallback(() => {	// wraps setShowModal
		if (selected.length != 0) {
			_setShowModal((prev) => {
				if (prev) { // EXIT MODAL
					currentlyPlayingIndex.current = null;
					return false;
				} else { // SHOW MODAL
					if (currentlyPlayingIndex.current != null) {
						spectrograms.current[currentlyPlayingIndex.current].pause();
					}
					return true;
				}
			});
		}		
	}, [selected, showModal]);

	const setPlaySpeed = useCallback((upd) => {
		_setPlaySpeed((prev) => {
			const newSpeed = typeof upd === 'function' ? upd(prev) : upd;

			console.log(currentlyPlayingIndex.current);
			if (currentlyPlayingIndex.current != null) {
				spectrograms.current[currentlyPlayingIndex.current].setPlaybackRate(newSpeed);

				if (showModal) {
					spectrograms.current[-1].setPlaybackRate(newSpeed);
				}
			}
		
			return newSpeed;
		});
	}, []);


	const contextValue: VerifyContextValue = useMemo(() => ({
		audioFiles, updateAudioFile, audioURLs,
		selected, updateSelected,
		hovered, setHovered,
		playSpeed, setPlaySpeed,
		speciesList,
		toggleModal,
		isModalInputFocused, setIsModalInputFocused,
	}), [
		audioFiles, updateAudioFile, audioURLs,
		selected, updateSelected,
		hovered, setHovered,
		playSpeed, setPlaySpeed,
		speciesList,
		toggleModal,
		isModalInputFocused, setIsModalInputFocused,
	])


	//// ================================================================================================================
	//// CHECKS + SYNC
	
	// crucial for when # of pages decreases while on the last page
	if (currentPage > totalPages) { setCurrentPage(totalPages); }

	// prevents rest of page from interacting with mouse while modal is open
	useEffect(() => { 
		if (showModal) { document.getElementById("container").classList.add(styles.noInteraction); } 
		else { document.getElementById("container").classList.remove(styles.noInteraction); }
	}, [showModal]);

	// decode new audio files on page update
	useEffect(() => {
		let isCancelled = false;

		const loadFiles = async () => {
			Object.entries(audioURLs).forEach(([fullIndex, url]) => {
				URL.revokeObjectURL(url);
			})

			const newAudioURLs: Record<number, string> = {};
			setAudioURLs(newAudioURLs);

			await Promise.all(
				currentFiles.map(async (file, index) => {
					const audioFile = await window.ipc.invoke('read-file-for-verification', file.filePath);
					const decoded = await decodeAudio(audioFile.data);
					const cropped = cropAudio(decoded, file.startOffset, file.endOffset, file.filePath);
					const blob = audioBufferToWavBlob(cropped);
					const url = URL.createObjectURL(blob);
					
					const fullIndex = file.index;
					newAudioURLs[fullIndex] = url;

					if (!isCancelled) {
						setAudioURLs(newAudioURLs);
					}
				})
			);
		};

		loadFiles();

		// cleanup function
		return () => {
			isCancelled = true;
			Object.entries(audioURLs).forEach(([fullIndex, url]) => {
				URL.revokeObjectURL(url);
				delete audioURLs[fullIndex];
			})
		};
	}, [currentFiles]);

	// update currently playing spectrogram's playSpeed
	useEffect(() => {
		if (currentlyPlayingIndex.current != null) {
			spectrograms.current[currentlyPlayingIndex.current].setPlaybackRate(playSpeed);
		}
	}, [playSpeed])


	//// ================================================================================================================
	//// INITIALIZATION

	// load settings
	useEffect(() => {
		//const verifyColorScheme_ = localStorage.getItem('verifyColorScheme');
		const skipInterval_ = Number(localStorage.getItem('skipInterval'));
		const playbackRate_ = Number(localStorage.getItem('playbackRate'));
		const defaultColumns_ = Number(localStorage.getItem('defaultColumns'));
		const defaultSpeciesId_ = Number(localStorage.getItem('defaultSpeciesId')); 
		setSkipInterval(skipInterval_);
		setPlaySpeed(playbackRate_);
		setCOLS(defaultColumns_);
		setDefaultSpeciesId(defaultSpeciesId_);
	}, [])

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

	const moveSelectionUp = () => 		{ if (spectrograms.current.length == 0) return; updateSelected([selected.length==0 ? 0 : Math.max(lastSelected - COLS, lastSelected % COLS)]); }
	const moveSelectionDown = () => 	{ if (spectrograms.current.length == 0) return; updateSelected([selected.length==0 ? 0 : Math.min(lastSelected + COLS, numFiles-1, numSpots-COLS+(lastSelected % COLS))]); }
	const moveSelectionLeft = () => 	{ if (spectrograms.current.length == 0) return; updateSelected([selected.length==0 ? 0 : Math.max(lastSelected - 1, 0)]); }
	const moveSelectionRight = () => 	{ if (spectrograms.current.length == 0) return; updateSelected([selected.length==0 ? 0 : Math.min(lastSelected + 1, numFiles-1)]); }
	const setSpectroStatus = (status) => { selected.forEach((i) => {updateAudioFile(spectrograms.current[i].fullIndex, "status", status);}) }
	const playPauseSelection = () => { 
		if (selected.length == 0) { return }; // null
		if (currentlyPlayingIndex.current != null && currentlyPlayingIndex.current != firstSelected) { spectrograms.current[currentlyPlayingIndex.current].pause(); }; // pause existing
		const id = showModal ? -1 : firstSelected;

		const isPlaying = spectrograms.current[id].playPause(); // play/pause selected
		currentlyPlayingIndex.current = (isPlaying ? id : null);
	}
	const skipBack = () => { if (selected.length != 0) {spectrograms.current[showModal ? -1 : selected[0]].skip(-skipInterval);}; }
	const skipForward = () => { if (selected.length != 0) {spectrograms.current[showModal ? -1 : selected[0]].skip(skipInterval);}; } 
	const doubleSkipInterval = () => { setSkipInterval((prev) => Math.min(prev*2, MAX_SKIPINTERVAL)) } 
	const halveSkipInterval = () => { setSkipInterval((prev) => Math.max(prev/2, MIN_SKIPINTERVAL)) } 
	const doublePlaySpeed = () => { setPlaySpeed((prev) => { return Math.min(MAX_PLAYSPEED, prev*2); }); }
	const halvePlaySpeed = () => { setPlaySpeed((prev) => { return Math.max(MIN_PLAYSPEED, prev/2); }); }
	const resetIncrements = () => { 
		setSkipInterval(DEFAULT_SKIPINTERVAL); 
		setPlaySpeed(DEFAULT_PLAYSPEED); 
		if (currentlyPlayingIndex.current != null) {spectrograms.current[currentlyPlayingIndex.current].setPlaybackRate(DEFAULT_PLAYSPEED)}; 
	}
	const moreColumns = () => { setCOLS((prev) => { updateSelected([]); return Math.min(prev+1, MAX_COLUMNS); }); }
	const lessColumns = () => { setCOLS((prev) => { updateSelected([]); return Math.max(prev-1, MIN_COLUMNS); }); }
	const deleteSelected = () => {
		const fullIndexSelected = selected.map((v,_) => spectrograms.current[v]?.fullIndex)
		const remainingFiles = audioFiles
			.filter((_, i) => !(fullIndexSelected.includes(i)))
				.map((item, newIndex) => ({ ...item, index: newIndex }));

		setAudioFiles(remainingFiles);
		updateSelected([]);
	}
	const switchSpeciesOfSelected = () => { selected.forEach((i) => { updateAudioFile(spectrograms.current[i].fullIndex, "speciesIndex", (prev)=>((prev+1) % speciesList.length)); }) }


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
	}, [selected, currentlyPlayingIndex, playSpeed, skipInterval, currentPage, totalPages, showModal, isModalInputFocused, toggleModal]);


	//// ================================================================================================================
	//// BOX SELECTION SYSTEM

	const [isSelecting, setIsSelecting] = useState(false);
	const [rectStart, setRectStart] = useState(null);
	const [rect, setRect] = useState(null);
	const containerRef = useRef(null)
	const containerLeft = containerRef.current?.getBoundingClientRect().left ?? 0;

	const handleMouseDown = (e: MouseEvent, canSelect=true) => {
		const x = e.clientX - containerLeft;
		const y = e.clientY;
		setRectStart({ x, y });
		setRect({ x, y, width: 0, height: 0 });
		setIsSelecting(canSelect);
	};
	const handleMouseMove = (e) => {
		if (!isSelecting) return;

		const x = e.clientX - containerLeft;
		const y = e.clientY;

		const newRect = {
			x: Math.min(rectStart.x, x),
			y: Math.min(rectStart.y, y),
			width: Math.abs(x - rectStart.x),
			height: Math.abs(y - rectStart.y),
		};

		setRect(newRect);
	};
	const handleMouseUp = () => {
		if (!rect) return;
		let selection = [];

		spectrograms.current.forEach((spectrogram) => {
			const el = spectrogram.containerRef.current;
			if (!el) {
				return;
			}
			const box = el.getBoundingClientRect();

			const relative = {
				left: box.left - containerLeft,
				top: box.top,
				right: box.right - containerLeft,
				bottom: box.bottom,
			};

			const overlap = (
				rect.x < relative.right &&
				rect.x + rect.width > relative.left &&
				rect.y < relative.bottom &&
				rect.y + rect.height > relative.top
			);

			if (overlap) selection.push(spectrogram.id);
		});

		updateSelected(selection)
		setIsSelecting(false);
		setRect(null);
	};

	
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
					onMouseDown={(e) => {if (!showModal) {e.preventDefault(); handleMouseDown(e)}}}
					onMouseUp={(e) => {if (!showModal) {handleMouseUp()}}}
					style={{ userSelect: 'none' }}
				>
					{isSelecting && rect && (
						<div
							style={{
								position: "absolute",
								left: rect.x,
								top: rect.y,
								width: rect.width,
								height: rect.height,
								backgroundColor: "rgba(0, 120, 215, 0.2)",
								border: "1px solid #0078d7",
								pointerEvents: "none",
								zIndex: 10,
							}}
						/>
					)}

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
											selected.map((v,_) => spectrograms.current[v]?.fullIndex+1)
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
							<div id="grid" key={forceReloadKey} className=	{styles.grid} style={{
								gridTemplateColumns: `repeat(${COLS}, 1fr)`,
								gridTemplateRows: `repeat(${ROWS}, auto)`,
							}}>
								{currentFiles.map(({index}, i) => {
									return (
										<Spectrogram
											key={i}
											id={i} 
											fullIndex={index}
											audioUrl={audioURLs[index]}
											audioFile={audioFiles[index]}
											linkedSpectro={null}
											ref={(el) => { if (el) spectrograms.current[i] = el; }}
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
						{showModal && 	
							createPortal(
								<ModalSpectrogram
									key={-1}
									id={-1} 
									fullIndex={spectrograms.current[firstSelected].fullIndex}
									audioUrl={audioURLs[spectrograms.current[firstSelected].fullIndex]}
									audioFile={audioFiles[spectrograms.current[firstSelected].fullIndex]}
									linkedSpectro={spectrograms.current[firstSelected]}
									ref={(el) => { if (el) spectrograms.current[-1] = el; }}
								/>,
								document.body
							)}
						
					</>
				</div>
			</VerifyContext.Provider>
		</React.Fragment>
	)
}