import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import styles from './label.module.css';
import WaveSurfer from 'wavesurfer.js';
import SpectrogramPlugin from 'wavesurfer.js/dist/plugins/spectrogram';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline';

//Generate ColorMap for Spectrogram
const spectrogramColorMap = [];
for (let i = 0; i < 256; i++) {
	const val = (255 - i) / 256;
	spectrogramColorMap.push([val / 2, val / 3, val, 1]);
}

const AudioPlayer: React.FC = () => {
	const [showSpec, setShowSpec] = useState<Boolean>(false);
	const [playing, setPlaying] = useState<Boolean>(false);
	const [index, setIndex] = useState<number>(0);
	const [confidence, setConfidence] = useState<string>('10');
	const [playbackRate, setPlaybackRate] = useState<string>('1');
	const [sampleRate, setSampleRate] = useState<string>('24000');
	const [callType, setCallType] = useState('');
	const [notes, setNotes] = useState('');
	const regionListRef = useRef<any[]>([]);
	// For label selection
	const [speciesList, setSpeciesList] = useState<string[]>(['Default', 'Pigeon']);
	const [selectedSpecies, setSelectedSpecies] = useState('Default');

	// TODO: Add typing
	const [wavesurfers, setWavesurfers] = useState([]);
	const [isNextDisabled, setNextDisabled] = useState(false);
	const [isPrevDisabled, setPrevDisabled] = useState(false);
	const [isYesDisabled, setYesDisabled] = useState(false);
	const [isNoDisabled, setNoDisabled] = useState(false);

	const activeRegionRef = useRef<any>(null);

	//Destroys Current Wavesurfer reference
	const destroyCurrentWaveSurfer = async () => {
		if (wavesurfers[index]?.instance) {
			wavesurfers[index].instance.destroy();
			wavesurfers[index].instance = null;
		}
	};

	//Called when moving to previous audio clip
	//destroys current wavesurfer and changes index
	const clickPrev = async () => {
		if (isPrevDisabled) {
			return;
		}
		setConfidence('10');
		setPrevDisabled(true);
		if (index === 0) return;
		await destroyCurrentWaveSurfer();
		setIndex((prevIndex) => prevIndex - 1);

		//buffer time between presses
		setTimeout(() => {
			setPrevDisabled(false);
		}, 500);
	};

	//Called when moving to next audio clip
	//destroys current wavesurfer and changes index
	const clickNext = async () => {
		if (isNextDisabled) {
			return;
			//print message for user
		}
		setConfidence('10');
		setNextDisabled(true);
		if (index === wavesurfers.length - 1) return;
		await destroyCurrentWaveSurfer();
		setIndex((prevIndex) => prevIndex + 1);

		//buffer time between presses
		setTimeout(() => {
			setNextDisabled(false);
		}, 500);
	};

	//Plays the current wavesurfer audio
	const clickPlay = async () => {
		const wsInstance = wavesurfers[index].instance;

		// plays the active region
		if (wsInstance && activeRegionRef.current) {
			activeRegionRef.current.play();
		} else if (wsInstance) {
			wsInstance.playPause();
		}
		setPlaying(true);
	};

	//Pauses the current wavesurfer audio
	const clickPause = async () => {
		wavesurfers[index].instance.playPause();
		setPlaying(false);
	};

	/* called when confirming audio matches model annotation
    remove current wavesurfer
    move rest up
    save annotation in database */
	const clickYes = async () => {
		if (isYesDisabled) {
			return;
		}
		setConfidence('10');
		setYesDisabled(true);

		const ws = wavesurfers[index]?.instance;
		if (!ws) {
			return;
		}

		// Accesses all regions
		const regionPlugin = ws.plugins[1];
		const allRegions = regionPlugin?.wavesurfer?.plugins[2]?.regions;

		const lines = [];

		if (!allRegions || Object.keys(allRegions).length === 0) {
			console.log('No regions');
		} else {
			// Text document of start/end times
			Object.keys(allRegions).forEach((regionId, idx) => {
				const region = allRegions[regionId];
				const startSec = region.start.toFixed(3);
				const endSec = region.end.toFixed(3);
				lines.push(
					`Region #${idx + 1}: Start = ${startSec}s, End = ${endSec}s`
				);
			});

			lines.push('');
			lines.push(`Confidence: ${confidence}`);
			lines.push(`Call Type: ${callType}`);
			lines.push(`Additional Notes: ${notes}`);

			// Make text file
			const content = lines.join('\n');
			const blob = new Blob([content], { type: 'text/plain' });
			const url = URL.createObjectURL(blob);

			// Download (test for Windows)
			const link = document.createElement('a');
			link.href = url;
			link.download = 'regionTimes.txt';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		}

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
					setYesDisabled(false);
				}, 500);
				return;
			}
			currentWaveSurfer.destroy();
			currentWaveSurfer = null;

			//buffer between button presses
			setTimeout(() => {
				setYesDisabled(false);
			}, 500);

			return;
		}
		await destroyCurrentWaveSurfer();
		setWavesurfers((wavesurfers) => {
			// Remove the WaveSurfer from the array
			return wavesurfers.filter((_, i) => i !== index);
		});
		if (wavesurfers.length == 0) {
			setWavesurfers([]);
		}
		//adjust index if array is shorter than index
		if (wavesurfers.length - 1 >= index) {
			setIndex(index - 1);
		}
		//buffer between button presses
		setTimeout(() => {
			setYesDisabled(false);
		}, 500);
	};

	/* called when audio doesn't match model annotation
    remove current wavesurfer
    move rest up
    save annotation in database */
	const clickNo = async () => {
		if (isNoDisabled) {
			return;
		}
		setNoDisabled(true);
		setConfidence('10');
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
	};

	//Handle audio files upload/import and map new wavesurfers
	const handleFiles = (acceptedFiles: File[]) => {
		console.log('Files dropped:', acceptedFiles);

		const newWaveSurfers = acceptedFiles.map((file, index) => {
			const containerId = `waveform-${wavesurfers.length + index}`;
			const spectrogramId = `spectrogram-${wavesurfers.length + index}`;
			return {
				id: containerId,
				spectrogramId: spectrogramId,
				file: file,
				instance: null,
				class: 'spectrogramContainer',
			};
		});

		console.log('New WaveSurfers:', newWaveSurfers);
		setWavesurfers(newWaveSurfers);
		setShowSpec(true);
		setIndex(0);
	};

	//TODO: Implement Confidence Scale

	//define keybindings
	/*const handleKeyDown = async (event: KeyboardEvent) => {
    switch (event.key) {
      case 'w': 
        clickYes();
        break;
      case 'p':
        if (playing){await clickPause();}
        else {await clickPlay();}
        break;
      case 's': 
        clickNo();
        break;
      case 'd': 
        clickNext();
        break;
      case 'a': 
        clickPrev();
        break;
      default:
        break;
    }
  };*/

	//useEffect when index or wavesurfers updates
	useEffect(() => {
		if (showSpec && wavesurfers[index]) {
			console.log(index);

			//window.addEventListener('keydown', handleKeyDown);
			if (wavesurfers.length === 0) {
				//alert user

				setShowSpec(false);
				setIndex(0);
				console.log('No more audioclips');
			} else if (wavesurfers[index]) {
				//if wavesurfers[index] exists
				console.log(index);
				//create wavesurfer
				const createWavesurfer = async () => {
					const waveId = wavesurfers[index].id;
					const spectroId = wavesurfers[index].spectrogramId;

					const ws = await WaveSurfer.create({
						container: `#${wavesurfers[index].id}`,
						waveColor: 'violet',
						progressColor: 'purple',
						sampleRate: parseInt(sampleRate),
						plugins: [
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
								container: '#wave-timeline',
								height: 20,
							}),
						],
					});

					window.ws = ws;

					// Allow draw selection with Regions plugin
					const wsRegions = ws.registerPlugin(
						(RegionsPlugin as any).create({
							name: 'regions',
							regions: [],
							drag: true,
							resize: true,
							color: 'rgba(0, 255, 0, 0.3)',
							dragSelection: true,
						})
					);

					// Enable drag selection with a constant color and threshold.
					const disableDragSelection = wsRegions.enableDragSelection(
						{ color: 'rgba(0,255,0,0.3)' },
						3
					);

					// Select timeline
					const timelineContainer = document.getElementById('wave-timeline');
					if (timelineContainer) {
						timelineContainer.style.position = 'relative';
						timelineContainer.style.overflow = 'visible';
					}

					// Create the dot
					const dot = document.createElement('div');
					dot.style.position = 'absolute';
					dot.style.width = '8px';
					dot.style.height = '8px';
					dot.style.borderRadius = '50%';
					dot.style.backgroundColor = 'black';
					dot.style.top = '50%';
					dot.style.transform = 'translateY(-50%)';
					dot.style.left = '0px';

					timelineContainer?.appendChild(dot);

					// Move dot according to audio time
					ws.on('audioprocess', (currentTime) => {
						const duration = ws.getDuration();
						if (!duration) return;
						const fraction = currentTime / duration;
						const timelineWidth = timelineContainer?.offsetWidth;

						dot.style.left = fraction * timelineWidth + 'px';
					});

					// Update dot on clicking a waveform
					const waveformContainer = document.getElementById(waveId);
					if (waveformContainer && timelineContainer) {
						waveformContainer.addEventListener('click', (event) => {
							const rect = timelineContainer.getBoundingClientRect();
							const clickX = event.clientX - rect.left;
							dot.style.left = clickX + 'px';
							// Calculate fraction and seek audio accordingly
							const fraction = clickX / timelineContainer.offsetWidth;
							ws.seekTo(fraction);
						});
					}

					await ws.load(URL.createObjectURL(wavesurfers[index].file));
					console.log('loaded ws');
					wavesurfers[index].instance = ws;

					// list of all regions for overlay
					let regionList = [];

					// helper function to reapply spectrogram overlay
					function redraw(region) {
						const waveEl = document.getElementById(waveId);
						const spectroEl = document.getElementById(spectroId);
						const waveSpectroContainer = waveEl?.parentElement;
						if (!waveEl || !spectroEl || !waveSpectroContainer) return;

						waveSpectroContainer.appendChild(region.element);

						// recalc height, may need to change for diff monitor sizes
						const waveHeight = waveEl.offsetHeight;
						const spectroHeight = spectroEl.offsetHeight;
						region.element.style.position = 'absolute';
						region.element.style.top = '0px';
						region.element.style.height = `${waveHeight + spectroHeight}px`;
						region.element.style.zIndex = '9999';
					}

					wsRegions.on('region-created', (region) => {
						redraw(region);
						regionListRef.current.push(region);

						// add to list to redraw on movements
						regionList.push(region);

						// needed due to redrawing by plugin
						setTimeout(() => {
							redraw(region);
						}, 50);
					});

					wsRegions.on('redraw', () => {
						regionList.forEach((region) => {
							regionList.forEach((region) => redraw(region));
						});
					});

					wsRegions.on('region-updated', (region) => {
						redraw(region);
					});

					wsRegions.on('region-clicked', (region) => {
						// selecting selected region cancels loop
						if (activeRegionRef.current === region) {
							region.setOptions({ color: 'rgba(0,255,0,0.3)' });
							region.data = { ...region.data, loop: false };
							activeRegionRef.current = null;
						} else {
							// sets all other red regions to green
							if (activeRegionRef.current) {
								activeRegionRef.current.setOptions({
									color: 'rgba(0,255,0,0.3)',
								});
							}

							// turns region red on click
							console.log('region-clicked fired');
							region.setOptions({ color: 'rgba(255,0,0,0.3)' });
							activeRegionRef.current = region;

							region.data = { ...region.data, loop: true };
						}

						// decide on function of clicking on region while audio playing
						// select region, move dot, or both?
						// // change audio dot to region that is clicked
						// if (event && timelineContainer) {
						// 	const rect = timelineContainer.getBoundingClientRect();
						// 	const clickX = event.clientX - rect.left;
						// 	dot.style.left = clickX + 'px';
						// }
						// if (activeRegionRef.current === region) {
						// 	region.setOptions({ color: 'rgba(0,255,0,0.3)' });
						// 	region.data = { ...region.data, loop: false };
						// 	activeRegionRef.current = null;
						// } else {
						// 	if (activeRegionRef.current) {
						// 		activeRegionRef.current.setOptions({
						// 			color: 'rgba(0,255,0,0.3)',
						// 		});
						// 	}
						// 	console.log('region-clicked fired');
						// 	region.setOptions({ color: 'rgba(255,0,0,0.3)' });
						// 	activeRegionRef.current = region;
						// 	region.data = { ...region.data, loop: true };
						// }
					});

					// loops clicked region
					wsRegions.on('region-out', (region: any) => {
						if (region.data?.loop) {
							region.play();
						}
					});

					wsRegions.on('region-double-clicked', (region, event) => {
						// creates label, prompt not being supported on electron
						// possibly replace with prompt plugin in future, change to module css
						const input = document.createElement('input');
						input.type = 'text';
						input.value = region.data?.label || '';
						input.style.position = 'absolute';
						input.style.top = '0';
						input.style.left = '0';
						input.style.width = '100%';
						input.style.boxSizing = 'border-box';
						input.style.textAlign = 'center';
						input.style.display = 'block';

						region.element.appendChild(input);
						input.focus();
						input.addEventListener('blur', () => {
							region.data = { label: input.value };
							let labelElem = region.element.querySelector('.region-label');
							if (labelElem) {
								labelElem.textContent = input.value;
							} else {
								labelElem = document.createElement('span');
								labelElem.className = 'region-label';
								labelElem.textContent = input.value;
								region.element.appendChild(labelElem);
							}
							region.element.removeChild(input);
						});

						// enter to confirm label
						input.addEventListener('keydown', (e: KeyboardEvent) => {
							if (e.key === 'Enter') {
								input.blur();
							}
						});
					});

					document
						.getElementById(wavesurfers[index].spectrogramId)
						?.classList.add('spectrogramContainer');
				};

				createWavesurfer();
				return () => {
					//window.removeEventListener('keydown', handleKeyDown);
				};
			} else {
				console.log('failed initialization');
			}
		}
	}, [showSpec, index, wavesurfers]);

	// Deletes selected region
	const deleteActiveRegion = () => {
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
		console.log('Updated speciesList:', Array.from(newSet));
	};

	// Saves selected category as label
	const assignSpecies = (species: string) => {
		if (!activeRegionRef.current) {
			console.log('No active region selected.');
			return;
		}

		activeRegionRef.current.data = {
			...activeRegionRef.current.data,
			label: species,
		};

		const regionEl = activeRegionRef.current.element;
		let labelElem = regionEl.querySelector('.region-label');
		if (!labelElem) {
			labelElem = document.createElement('span');
			labelElem.className = 'region-label';
			regionEl.appendChild(labelElem);
		}
		labelElem.textContent = species;
	};

	return (
		<React.Fragment>
			<Head>
				<title>Label Page</title>
			</Head>
			<div className={styles.container}>
				<div className={styles.main}>
					<input
						type="file"
						multiple
						accept="audio/*"
						onChange={(e) => handleFiles(Array.from(e.target.files))}
					/>
					<label>Choose a species:</label>
					{/* Turns category selection back to default on selection */}
					<select
						name="Species"
						id="species-names"
						value={selectedSpecies}
						onChange={(e) => {
							const sp = e.target.value;
							assignSpecies(sp);
							setSelectedSpecies('Default');
						}}
					>
						{speciesList.map((sp) => (
							<option key={sp} value={sp}>
								{sp}
							</option>
						))}
					</select>

					<div>
						{showSpec && (
							// styling for extended regions selection
							<div className={styles.waveSpectroContainer}>
								<div
									id={wavesurfers[index].id}
									className={styles.waveContainer}
								></div>
								<div
									id={wavesurfers[index].spectrogramId}
									className={styles.spectrogramContainer}
								></div>
							</div>
						)}
					</div>
				</div>
			</div>
			{showSpec && (
				<div id="wave-timeline" style={{ height: '20px', margin: '20px' }} />
			)}
			{showSpec && (
				<div className={styles.controls}>
					<button className={styles.prevClip} onClick={clickPrev}>
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
					<button className={styles.nextClip} onClick={clickNext}>
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
							<button
								className={styles.regionButton}
								onClick={saveLabelsToSpecies}
							>
								Save Labels
							</button>
						</div>

						<label className={styles.confidenceLabel} htmlFor="confidence">
							Confidence: {confidence}
						</label>
						<input
							type="range"
							id="confidence"
							min="0"
							max="10"
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
								wavesurfers[index].instance.setPlaybackRate(
									parseFloat(e.target.value),
									false
								);
							}}
						/>
					</div>
					{/* <div className={styles.confidence}>
						<input
							type="range"
							id="frequency"
							min="8000"
							max="48000"
							step="1000"
							value={sampleRate}
							onChange={(e) => {
								setSampleRate(e.target.value);
								if (wavesurfers[index]?.instance) {
									const currentTime =
										wavesurfers[index].instance.getCurrentTime();
									destroyCurrentWaveSurfer().then(() => {
										const ws = wavesurfers[index];
										wavesurfers[index].instance = null;
										setWavesurfers([...wavesurfers]);
									});
								}
							}}
						/>
						<label className={styles.confidenceLabel} htmlFor="frequency">
							Frequency: {sampleRate} Hz
						</label>
					</div> */}
					{showSpec && (
						<div className={styles.annotationSection}>
							<label>
								Zoom: <input type="range" min="10" max="1000" value="10" />
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
