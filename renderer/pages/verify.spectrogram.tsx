import styles from './verify.module.css'
import { memo, Ref, useContext, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ProcessedAnnotation, SpectroStatus, VerifyContext } from "./verify";
import WaveSurfer from "wavesurfer.js";
import SpectrogramPlugin from "wavesurfer.js/dist/plugins/spectrogram";

export interface SpectroRef { // public Spectrogram properties & functions
	id: number,
	fullIndex: number,
	containerRef: React.RefObject<HTMLElement>,
	playPause: () => boolean,
	pause: () => void,
	setPlaybackRate: (number) => void,
	skip: (number) => void,
	setTime: (number) => void,
	getTime: () => number,
	// add properties and functions here if you want them to be accessible from outside the Spectrogram
}

export interface SpectroProps {
	id: number,
	fullIndex: number,
	audioFile: ProcessedAnnotation,
	audioUrl: string,
	linkedSpectro: SpectroRef,
	ref: any, 
}

export function Spectrogram({
	id, // index in currentFiles (in-page index)
	fullIndex, // index in audioFiles (global index)
	audioFile,
	audioUrl,
	linkedSpectro,
	ref,
}: SpectroProps) {
	const context = useContext(VerifyContext);
	const {
		audioFiles, updateAudioFile,
		audioURLs,
		selected, updateSelected,
		hovered, setHovered,
		playSpeed, setPlaySpeed,
		speciesList,
		toggleModal,
		isModalInputFocused, setIsModalInputFocused,
		currentLabel, setCurrentLabel,
	} = context;

	const wavesurferRef = useRef<WaveSurfer>(null);
	const containerRef = useRef(null);
	const innerRef = useRef(null);

	const speciesIndex = audioFile.speciesIndex;
	const status = audioFile.status;
	const filePath = audioFile.filePath;
	const isSelected = (selected.includes(id));
	const isHovered = (hovered == id);

	let isDestroyed = false;
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => { // initialize
		setIsLoaded(false);

		if (!audioUrl) {
			return;
		}

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
			document.getElementById(`loading-spinner-${id}`).style.display = 'none';

			if (linkedSpectro) {
				wavesurferRef.current.setTime(linkedSpectro.getTime());
				wavesurferRef.current.on("timeupdate", (progress) => {
					linkedSpectro.setTime(progress);
				});
			}
			setIsLoaded(true);
		});
		
		return () => { 
			isDestroyed = true;
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
		};
	}, [audioUrl]);

	const playPause = () => {
		console.log("playpause")
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
			fullIndex,
			containerRef, // for box selection
			playPause,
			pause,
			skip,
			setPlaybackRate,
			setTime: (time) => { wavesurferRef.current.setTime(time) },
			getTime: () => { return wavesurferRef.current.getCurrentTime() },
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
			onMouseEnter={() => setHovered(id)}
			onMouseLeave={() => setHovered(null)}
			onClick={(e) => e.stopPropagation()}
			style={{ position: "relative" }}
		>
			{id!=-1 && (<div className={styles.indexOverlay}>{fullIndex+1}</div>)} 
			{id!=-1 && (<div className={styles.filePathOverlay}>{filePath}</div>)} 	
			<div className={styles.speciesOverlay}>{speciesList[speciesIndex].common}</div>
			
			
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

export function ModalSpectrogram({
	id, // index in currentFiles (in-page index)
	fullIndex, // index in audioFiles (global index)
	audioFile,
	audioUrl,
	linkedSpectro,
	ref,
}: SpectroProps) {
	const context = useContext(VerifyContext);
	const {
		audioFiles, updateAudioFile,
		audioURLs,
		selected, updateSelected,
		hovered, setHovered,
		playSpeed, setPlaySpeed,
		speciesList,
		toggleModal,
		isModalInputFocused, setIsModalInputFocused,
		currentLabel, setCurrentLabel,
	} = context;

	const modalRef = useRef(null);

	// Update label on change
	const [localLabel, setLocalLabel] = useState(speciesList[audioFile.speciesIndex].common);
	const [displaySpecies, setDisplaySpecies] = useState(speciesList[audioFile.speciesIndex].common);

	useEffect(() => {
		setLocalLabel(speciesList[audioFile.speciesIndex].common);
		setDisplaySpecies(speciesList[audioFile.speciesIndex].common);
	}, [linkedSpectro]);

	return (
		<div ref={modalRef} className={styles.modal}>
			<div className={styles.modalHeader}>
				<div>ID: {fullIndex + 1}</div>
				<div>File Path: {audioFile?.filePath}</div>
				<div>Species: {displaySpecies}</div>
			</div>		

			<Spectrogram 
				id={-1} 
				fullIndex={fullIndex}
				audioUrl={audioUrl}
				audioFile={audioFile}
				linkedSpectro={linkedSpectro}
				ref={ref}
			/>
			
			<div className={styles.modalControls}>
				<div>
					<input 
						type="text" 
						value={localLabel}
						onChange={(e) => setLocalLabel(e.target.value)}
						placeholder="Enter label"
						onFocus={() => setIsModalInputFocused(true)}
						onBlur={() => setIsModalInputFocused(false)}
						// Add keydown event handler directly to the input
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								
								// Apply the label
								if (linkedSpectro && localLabel.trim() !== "") {
									updateAudioFile(fullIndex, 'speciesIndex', Number(localLabel)); // figure out what to do here
									setCurrentLabel(localLabel);
									
									// Update modal
									toggleModal();
									setTimeout(() => {
										toggleModal();
									}, 10);
								}
							}
						}}
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