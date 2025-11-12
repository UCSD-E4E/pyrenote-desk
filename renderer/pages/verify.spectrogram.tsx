import styles from './verify.module.css'
import { memo, MutableRefObject, Ref, useContext, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ProcessedAnnotation, SpectroStatus, VerifyContext } from "./verify";
import WaveSurfer from "wavesurfer.js";
import SpectrogramPlugin from "wavesurfer.js/dist/plugins/spectrogram";
import Select, { GroupBase, StylesConfig } from 'react-select';
import { SingleValue } from 'react-select';
import { uuid as v4 } from 'uuidv4';

export interface SpectroRef { // public Spectrogram properties & functions
	id: number,
	index: number,
	containerRef: React.RefObject<HTMLElement>,
	playPause: () => boolean,
	pause: () => void,
	setPlaybackRate: (number) => void,
	skip: (number) => void,
	setTime: (number) => void,
	getTime: () => number,
	wsRef: MutableRefObject<WaveSurfer>
	// add properties and functions here if you want them to be accessible from outside the Spectrogram
}

export interface SpectroProps {
	id: number,
	index: number,
	audioFile: ProcessedAnnotation,
	audioUrl: string,
	syncedSpectro: SpectroRef,
	isHovered: boolean,
	ref?: any, 
	spectroRef?: any,
	uuid?: string,
}

function SpectrogramComponent({
	id, // index in currentFiles (in-page index)
	index, // index in audioFiles (global index)
	audioFile,
	audioUrl,
	syncedSpectro, // grid spectrogram reference, null when not modal
	ref,
	isHovered,
}: SpectroProps) {
	const context = useContext(VerifyContext);
	const {
		audioFiles, updateAudioFile,
		audioURLs,
		preloadedWavesurfers, preloadedContainers,
		selected, updateSelected,
		setHovered,
		playSpeed, setPlaySpeed,
		speciesList,
		toggleModal,
		isModalInputFocused, setIsModalInputFocused,
	} = context;

	const wavesurferRef = useRef<WaveSurfer>(null);
	const containerRef = useRef(null);
	const innerRef = useRef(null);

	const speciesIndex = audioFile.speciesIndex;
	const status = audioFile.status;
	const filePath = audioFile.filePath;
	const isSelected = (selected.includes(index));

	let isDestroyed = false;
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => { // initialize
		setIsLoaded(false);

		if (!audioUrl) {
			return;
		}

		// check if there's a preloaded wavesurfer for this index
		const preloadedWs = preloadedWavesurfers?.[index];
		const preloadedContainer = preloadedContainers?.[index];
		const isUsingPreloaded = !!(preloadedWs && preloadedContainer && innerRef.current && !syncedSpectro);

		if (isUsingPreloaded) {
			innerRef.current.innerHTML = '';
			preloadedContainer.style.position = 'relative';
			preloadedContainer.style.left = '0';
			preloadedContainer.style.top = '0';
			preloadedContainer.style.width = '100%';
			preloadedContainer.style.height = '256px';
			
			// remove from old parent if it exists
			if (preloadedContainer.parentElement) {
				preloadedContainer.parentElement.removeChild(preloadedContainer);
			}
			innerRef.current.appendChild(preloadedContainer);

			wavesurferRef.current = preloadedWs;

			// check if already loaded
			try {
				const duration = preloadedWs.getDuration();
				if (duration > 0) {
					// is loaded
					document.getElementById(`loading-spinner-${id}`)?.style.setProperty('display', 'none');
					setIsLoaded(true);
				} else {
					// wait for ready event if not yet loaded
					wavesurferRef.current.on('ready', function() {
						document.getElementById(`loading-spinner-${id}`)?.style.setProperty('display', 'none');
						setIsLoaded(true);
					});
				}
			} catch (e) {
				// wait for ready event
				wavesurferRef.current.on('ready', function() {
					document.getElementById(`loading-spinner-${id}`)?.style.setProperty('display', 'none');
					setIsLoaded(true);
				});
			}
		} else {
			// new wavesurfer instance
			wavesurferRef.current = WaveSurfer.create({	
				container: innerRef.current,
				height: 0,
				fillParent: true,
				progressColor: 'white',
				cursorColor: 'yellow',
				cursorWidth: 2,
				sampleRate: 16000,
			});
			wavesurferRef.current.registerPlugin(
				SpectrogramPlugin.create({
					colorMap: 'roseus',
					scale: "linear",
					fftSamples: (id==-1) ? 512 : 64, // <<< (SPECTROGRAM QUALITY)	zoomed : unzoomed
					labels: (id==-1),
					height: (id==-1) ? 256 : 90, 
				}),
			)

			// on load
			wavesurferRef.current.load(audioUrl).catch((e) => {
				if (e.name === "AbortError" && isDestroyed) {
					console.log("WaveSurfer load aborted cleanly");
				} else {
					console.error("WaveSurfer load failed:", e);
				}
			});

			// on ready
			wavesurferRef.current.on('ready', function() {
				document.getElementById(`loading-spinner-${id}`)?.style.setProperty('display', 'none');

				if (syncedSpectro) {
					wavesurferRef.current.setTime(syncedSpectro.getTime());
					wavesurferRef.current.on("timeupdate", (progress) => {
						syncedSpectro.setTime(progress);
					});
				}
				setIsLoaded(true);
			});
		}
		
		return () => { 
			isDestroyed = true;
			// only destroy if we created a new instance (not preloaded)
			if (!isUsingPreloaded && wavesurferRef.current) {
				wavesurferRef.current.unAll();
				try {
					wavesurferRef.current?.destroy();
				} catch (e) {
					if (e instanceof DOMException && e.name === "AbortError") {
						console.warn("WaveSurfer load aborted cleanly");
					} else {
						console.error("WaveSurfer destroy failed:", e);
					}
				}
			}
		};
	}, [audioUrl, index, preloadedWavesurfers, preloadedContainers]);

	const playPause = () => {
		wavesurferRef.current.setPlaybackRate(playSpeed);
		wavesurferRef.current.playPause();
		return wavesurferRef.current.isPlaying();
	}
	const pause = () => { wavesurferRef.current.pause(); }
	const skip = (i) => { wavesurferRef.current.skip(i); }
	const setPlaybackRate = (i) => { wavesurferRef.current.setPlaybackRate(i); }

	useImperativeHandle(ref, () => {
		return {
			id,
			index,
			containerRef, // for box selection
			playPause,
			pause,
			skip,
			setPlaybackRate,
			setTime: (time) => { wavesurferRef.current.setTime(time) },
			getTime: () => { return wavesurferRef.current.getCurrentTime() },
			wsRef: wavesurferRef,
		}
	});

	return (
		<div 
			key={id} 
			className={`
				${(id==-1) ? styles.waveContainerModal : styles.waveContainer} 
				${isLoaded && (
					(status==SpectroStatus.YES && styles.greenOutline) || 
					(status==SpectroStatus.NO && styles.redOutline)
				)}
				${isLoaded && (isSelected ? styles.selectOutline : styles.unselectOutline)}
				${isLoaded && (isHovered ? styles.hoverOutline : styles.unhoverOutline)}
			`}
			ref={containerRef}
			onMouseEnter={() => setHovered(index)}
			onMouseLeave={() => setHovered(null)}
			style={{ position: "relative" }}
		>
			{id!=-1 && (<div className={styles.indexOverlay}>{index+1}</div>)} 
			{id!=-1 && (<div className={styles.filePathOverlay}>{filePath}</div>)} 		
			{id!=-1 && 
				<SpeciesDropdown
					speciesList={speciesList}
					speciesIndex={speciesIndex}
					index={index}
					updateAudioFile={updateAudioFile}
					styles={dropdownStyles}
				/>
			}
			
			<div id={`loading-spinner-${id}`} className={styles.waveLoadingCircle}></div>
			<div 
				id={`waveform-${id}`} 
				ref={innerRef}
				style={{ width: "100%", height: "256px"}}
				onContextMenu={(e) => { e.preventDefault(); if (isSelected) playPause(); }}
			></div>
		</div>	
	)
}

export const Spectrogram = memo(SpectrogramComponent, (prev, next) => {
	// Only rerender when rendering-relevant props change. Ignore `ref` prop identity.
	if (prev.id !== next.id) return false;
	if (prev.index !== next.index) return false;
	if (prev.audioUrl !== next.audioUrl) return false;
	if (prev.isHovered !== next.isHovered) return false;
	if (prev.syncedSpectro !== next.syncedSpectro) return false;
	// Compare used fields of audioFile
	const p = prev.audioFile;
	const n = next.audioFile;
	if (p.speciesIndex !== n.speciesIndex) return false;
	if (p.status !== n.status) return false;
	if (p.filePath !== n.filePath) return false;
	return true;
});

export function ModalSpectrogram({
	id, // index in currentFiles (in-page index)
	index, // index in audioFiles (global index)
	audioFile,
	audioUrl,
	syncedSpectro,
	isHovered,
	spectroRef,
}: Omit<SpectroProps, 'ref'>) {
	const context = useContext(VerifyContext);
	const {
		audioFiles, updateAudioFile,
		audioURLs,
		selected, updateSelected,
		setHovered,
		playSpeed, setPlaySpeed,
		speciesList,
		toggleModal,
		isModalInputFocused, setIsModalInputFocused,
	} = context;

	const modalRef = useRef(null);

	const speciesIndex = audioFile.speciesIndex;
	const [displaySpecies, setDisplaySpecies] = useState(speciesList[speciesIndex].common);

	return (
		<div ref={modalRef} className={styles.modal}>
			<div className={styles.modalHeader}>
				<div>ID: {index + 1}</div>
				<div>File Path: {audioFile?.filePath}</div>
				<div>Species: {displaySpecies}</div>
			</div>		

			<Spectrogram 
				id={-1} 
				index={index}
				audioUrl={audioUrl}
				audioFile={audioFile}
				syncedSpectro={syncedSpectro}
				ref={spectroRef}
				isHovered={isHovered}
			/>
			
			<div className={styles.modalControls}>
				<div>
					<SpeciesDropdown
						speciesList={speciesList}
						speciesIndex={speciesIndex}
						index={index}
						updateAudioFile={updateAudioFile}
					/>
				</div>
				<button onClick={(e)=>{
					toggleModal();
					e.stopPropagation();
				}}>Close</button>
			</div>
		</div>
	);
}


const dropdownStyles: StylesConfig<any, false, GroupBase<any>> = {
	control: (base: any) => ({
		...base,
		position: "absolute",
		top: "4px",
		left: "40px",
		zIndex: "10",
		backgroundColor: "rgba(0, 0, 0, 0.2)",
		":hover": {
			backgroundColor: "rgba(0, 0, 0, 0.8)"
		},
		padding: "0px 0px 0px 4px",
		margin: "0px 0px",
		borderRadius: "4px",
		maxWidth: "50%",
		minWidth: "50%",
		maxHeight: "20px",
		minHeight: "20px",
	}),
	menu: (base: any) => ({
		...base,
		zIndex: "1000",
		borderRadius: "8px",
		backgroundColor: "rgba(0, 0, 0, 0.8)",
		color: "white",
		marginTop: '24px',
		width: '50%',
		left: '40px',
	}),
	option: (base: any, state: any) => ({
		...base,
		display: "flex",
		flexDirection: "column",
		zIndex: "1000",
		padding: "0px 15px",  // padding inside each option
		color: "white",
		":hover": {
			backgroundColor: "rgba(255, 255, 255, 0.5)"
		},
		backgroundColor: state.selected ? "rgba(0,0,255,0.3)" : "transparent",
		fontSize: '12px',
		height: '20px',
		justifyContent: 'center',
	}),
	singleValue: (base: any) => ({
		...base,
		fontSize: "12px",
		color: "white",
		padding: "0px",
		margin: "0px",
	}),
	indicatorSeparator: (base: any) => ({
		...base,
		marginBottom: "4px",
		marginTop: "4px",
		flex: "1",
	}),
	dropdownIndicator: (base: any) => ({
		...base,
		padding: "0px",
		margin: "0px",
		width: '20px',
		height: '20px',
		flex: "0",
	}),
	valueContainer: (base: any) => ({
		...base,
		margin: '0 0',
		padding: '0 0',
	}),
	input: (base: any) => ({
		...base,
		margin: '0 0',
		padding: '0 0',
		color: 'white',
		fontSize: '12px',
	})
}

type SpeciesOption = {
	value: number;
	label: string;
};

type SpeciesDropdownProps = {
	speciesList: { common: string }[];
	speciesIndex: number | "";
	index: number;
	updateAudioFile: (index: number, key: string, value: number | "") => void;
	styles?: StylesConfig<any, false, GroupBase<any>>;
};

export default function SpeciesDropdown({
	speciesList,
	speciesIndex,
	index,
	updateAudioFile,
	styles,
}: SpeciesDropdownProps) {
	const speciesOptions: SpeciesOption[] = speciesList.map((s, index) => ({
		value: index,
		label: s.common,
	}));

	const [inputValue, setInputValue] = useState("");

	return (
		<div className="w-64">
			<Select
				value={speciesOptions[speciesIndex] ?? null}
				onChange={(selectedOption: SingleValue<SpeciesOption>) =>
					updateAudioFile(
						index,
						"speciesIndex",
						selectedOption?.value ?? ""
					)
				}
				styles={styles}
				options={speciesOptions}
				isClearable={false}
				placeholder="Select a species..."
				isSearchable
				inputValue={inputValue}
				onInputChange={(newValue) => setInputValue(newValue)}
				onKeyDown={(e) => e.stopPropagation()} // prevent global keybinds
				onMenuOpen={() => {}} // satisfy TS
        		onMenuClose={() => {}} // satisfy TS
				filterOption={(option, rawInput) =>
					option.label.toLowerCase().includes(rawInput.toLowerCase())
				}>
			</Select>
		</div>
	);
}