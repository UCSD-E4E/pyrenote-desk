import styles from './verify.module.css'
import { memo, MutableRefObject, Ref, useContext, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ProcessedAnnotation, SpectroStatus, VerifyContext, WavesurferInstance } from "./verify";
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
	mountInstance: (instance: WavesurferInstance) => void,
	unmountInstance: () => void,
	// add properties and functions here if you want them to be accessible from outside the Spectrogram
}

export interface SpectroProps {
	id: number,
	index: number,
	isSelected: boolean,
	isHovered: boolean,
	ref?: any, 
	syncedSpectro?: SpectroRef,
	instance: WavesurferInstance,
}


export const Spectrogram = memo(function Spectrogram({
	id, // index in currentFiles (in-page index)
	index, // index in audioFiles (global index)
	isSelected,
	isHovered,
	ref=null,
	syncedSpectro=null, // grid spectrogram reference, null when not modal
	instance,
}: SpectroProps) {
	const context = useContext(VerifyContext);
	const {
		audioFiles, updateAudioFile,
		setHovered,
		playSpeed,
		speciesList,
		toggleModal,
	} = context;
	const instanceRef = useRef<WavesurferInstance>(null);
	const wavesurferRef = useRef<WaveSurfer>(null);

	const outerRef = useRef(null);
	const innerRef = useRef(null); // parent of preloaded container

	let audioFile = audioFiles[index];
	let speciesIndex = audioFile.speciesIndex;
	let status = audioFile.status;
	let filePath = audioFile.filePath;

	const isMounting = useRef(false);
	const isMounted = useRef(false);
	const isAlive = useRef(true);
	const [isLoaded, setIsLoaded] = useState(false);

	const mountInstance = async (instance: WavesurferInstance) => {
		if (!isAlive.current) return;
		if (isMounted.current) return;
		if (isMounting.current) return;
		isMounting.current = true;

		if (!instance.isAudioUrlReady) {
			await instance.audioUrlReady;
			if (!isAlive.current) {
				return (isMounting.current = false)
			};
		}	

		instanceRef.current = instance;
		wavesurferRef.current = instance.wavesurfer;

		const preloadedContainer = instance.preloadedContainer;
		preloadedContainer.className = `${styles.mountedInstance}`

		if (preloadedContainer.parentElement) {
			preloadedContainer.parentElement.removeChild(preloadedContainer);
		}

		innerRef.current.appendChild(preloadedContainer);

		isMounted.current = true;
		isMounting.current = false;
		
		if (!instance.isAudioLoaded) {
			await instance.audioLoaded;
		}
		document.getElementById(`loading-spinner-${index}`)?.style.setProperty('display', 'none');
		setIsLoaded(true);
	}

	const unmountInstance = () => {
		if (!isMounted.current) {
			return
		};

		wavesurferRef.current.stop();
		wavesurferRef.current.pause();

		const preloadedContainer = instanceRef.current.preloadedContainer;
		
		if (preloadedContainer.parentElement) {
			preloadedContainer.parentElement.removeChild(preloadedContainer);
		}
		preloadedContainer.className = `${styles.unmountedInstance}`
		document.body.appendChild(preloadedContainer);

		isMounted.current = false;
		isMounting.current = false;
	}

	useEffect(() => {
		if (syncedSpectro) { // modal spectrogram
			const audioUrl = instance.audioUrl;

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
					fftSamples: 512, // <<< (SPECTROGRAM QUALITY)	zoomed : unzoomed
					labels: true,
					height: 256, 
				}),
			)

			// on load
			wavesurferRef.current.load(audioUrl).catch((e) => {
				if (e.name === "AbortError") {
					console.log("WaveSurfer load aborted cleanly");
				} else {
					console.error("WaveSurfer load failed:", e);
				}
			});

			// on ready
			wavesurferRef.current.on('ready', function() {
				document.getElementById(`loading-spinner-${id}`)?.style.setProperty('display', 'none');

				wavesurferRef.current.setTime(syncedSpectro.getTime());
				wavesurferRef.current.on("timeupdate", (progress) => {
					syncedSpectro.setTime(progress);
				});
				
				setIsLoaded(true);
			});
			return () => {
				isAlive.current = false;
				if (wavesurferRef.current) {
					wavesurferRef.current.destroy();
					wavesurferRef.current = null;
				}
			}
		} else {
			return () => {
				isAlive.current = false;
				unmountInstance();
			};
		}
	}, [])

	const playPause = () => {
		wavesurferRef.current.setPlaybackRate(playSpeed);
		wavesurferRef.current.playPause();
		return wavesurferRef.current.isPlaying();
	}
	const pause = () => { wavesurferRef.current.pause(); }
	const skip = (i) => { wavesurferRef.current.skip(i); }
	const setPlaybackRate = (i) => { wavesurferRef.current.setPlaybackRate(i); }
	const setTime = (time) => { wavesurferRef.current.setTime(time) }
	const getTime = () => { return wavesurferRef.current.getCurrentTime() }

	useImperativeHandle(ref, () => {
		return {
			id,
			index,
			containerRef: outerRef, // for box selection
			playPause,
			pause,
			skip,
			setPlaybackRate,
			setTime,
			getTime,
			mountInstance,
			unmountInstance,
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
			ref={outerRef}
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
			
			{!isLoaded && (<div id={`loading-spinner-${index}`} className={styles.waveLoadingCircle}></div>)}
			<div 
				id={`waveform-${index}`} 
				ref={innerRef}
				style={{ width: "100%", height: "256px"}}
				onContextMenu={(e) => { e.preventDefault(); if (isSelected) playPause(); }}
			></div>
		</div>	
	)
}, (prev, next) => {
	if (prev.isSelected !== next.isSelected) return false;
	if (prev.id !== next.id) return false;
	if (prev.index !== next.index) return false;
	if (prev.isHovered !== next.isHovered) return false;
	if (prev.syncedSpectro !== next.syncedSpectro) return false;

	return true;
});


export function ModalSpectrogram({
	id, // index in currentFiles (in-page index)
	index, // index in audioFiles (global index)
	isSelected,
	isHovered,
	syncedSpectro,
	ref,
	instance,
}: SpectroProps) {
	const context = useContext(VerifyContext);
	const {
		audioFiles, updateAudioFile,
		setHovered,
		playSpeed,
		speciesList,
		toggleModal,
	} = context;

	const audioFile = audioFiles[index];

	const speciesIndex = audioFile.speciesIndex;
	const [displaySpecies, setDisplaySpecies] = useState(speciesList[speciesIndex].common);

	return (
		<div className={styles.modal}>
			<div className={styles.modalHeader}>
				<div>ID: {index + 1}</div>
				<div>File Path: {audioFile?.filePath}</div>
				<div>Species: {displaySpecies}</div>
			</div>		

			<Spectrogram 
				id={-1} 
				index={index}
				syncedSpectro={syncedSpectro}
				ref={ref}
				isSelected={isSelected}
				isHovered={isHovered}
				instance={instance}
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