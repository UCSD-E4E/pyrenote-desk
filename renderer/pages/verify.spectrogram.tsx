import styles from './verify.module.css'
import { useContext, useEffect, useRef, useState } from "react";
import { SpectroStatus, VerifyContext } from "./verify";
import WaveSurfer from "wavesurfer.js";
import SpectrogramPlugin from "wavesurfer.js/dist/plugins/spectrogram";

export function Spectrogram({
	id, // index in currentFiles (in-page index)
	fullIndex, // index in audioFiles (global index)
	linkedSpectro,
}) {
	const context = useContext(VerifyContext);
	const {
		audioFiles, updateAudioFile,
		audioURLs,
		selected, updateSelected,
		hovered, updateHovered,
		playSpeed, setPlaySpeed,
		speciesList,
		toggleModal,
		isModalInputFocused, setIsModalInputFocused,
		currentLabel, setCurrentLabel,
	} = context;

	const wavesurferRef = useRef<WaveSurfer>(null);
	const containerRef = useRef(null);
	const innerRef = useRef(null);

	const me = audioFiles[fullIndex];
	const url = audioURLs[fullIndex];
	const speciesIndex = me.speciesIndex;
	const status = me.status;
	const filePath = me.filePath;
	const isSelected = (selected == id);
	const isHovered = (hovered == id);

	let isDestroyed = false;
	const [isLoaded, setIsLoaded] = useState(false);

	const playPause = () => {
		wavesurferRef.current.setPlaybackRate(playSpeed);
		wavesurferRef.current.playPause();
		return wavesurferRef.current.isPlaying();
	}

	useEffect(() => { // initialize
		setIsLoaded(false);

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
		wavesurferRef.current.load(url).catch((e) => {
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
	}, [url]);
	
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
			onMouseEnter={() => updateHovered(id)}
			onMouseLeave={() => updateHovered(null)}
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
	linkedSpectro,
}) {
	const context = useContext(VerifyContext);
	const {
		audioFiles, updateAudioFile,
		audioURLs,
		selected, updateSelected,
		hovered, updateHovered,
		playSpeed, setPlaySpeed,
		speciesList,
		toggleModal,
		isModalInputFocused, setIsModalInputFocused,
		currentLabel, setCurrentLabel,
	} = context;

	const modalRef = useRef(null);

	// Update label on change
	const [localLabel, setLocalLabel] = useState(speciesList[linkedSpectro.speciesIndex].common);
	const [displaySpecies, setDisplaySpecies] = useState(speciesList[linkedSpectro.speciesIndex].common);

	useEffect(() => {
		setLocalLabel(speciesList[linkedSpectro.speciesIndex].common);
		setDisplaySpecies(speciesList[linkedSpectro.speciesIndex].common);
	}, [linkedSpectro]);

	return (
		<div ref={modalRef} className={styles.modal}>
			<div className={styles.modalHeader}>
				<div>ID: {linkedSpectro?.fullIndex + 1}</div>
				<div>File Path: {linkedSpectro?.filePath}</div>
				<div>Species: {displaySpecies}</div>
			</div>		

			<Spectrogram 
				id={-1} 
				fullIndex={fullIndex}
				linkedSpectro={linkedSpectro}
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
									linkedSpectro.setSpeciesIndex(localLabel);
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