import styles from './verify.module.css'
import { memo, MutableRefObject, Ref, useContext, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ProcessedAnnotation, SpectroStatus, VerifyContext, WavesurferInstance } from "./verify";
import WaveSurfer from "wavesurfer.js";
import SpectrogramPlugin from "wavesurfer.js/dist/plugins/spectrogram";
import Select, { GroupBase, StylesConfig } from 'react-select';
import { computeColormap } from '../utils/colormaps';
import { SpeciesDropdown } from '../components/SpeciesDropdown';

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
		speciesMap,
		toggleModal,
		colormap,
	} = context;
	const instanceRef = useRef<WavesurferInstance>(null);
	const wavesurferRef = useRef<WaveSurfer>(null);
	const spectrogramPluginRef = useRef<SpectrogramPlugin>();

	const outerRef = useRef(null);
	const innerRef = useRef(null); // parent of preloaded container

	let audioFile = audioFiles[index];
	let speciesId = audioFile.speciesId;
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
		spectrogramPluginRef.current = instance.spectrogramPlugin;

		const preloadedContainer = instance.preloadedContainer;
		preloadedContainer.className = `${styles.mountedInstance}`

		if (preloadedContainer.parentElement) {
			preloadedContainer.parentElement.removeChild(preloadedContainer);
		}

		innerRef.current.appendChild(preloadedContainer);

		isMounted.current = true;
		isMounting.current = false;

		if ((spectrogramPluginRef.current as any).currentColormap !== colormap) {
			(spectrogramPluginRef.current as any).currentColormap = colormap;
			(spectrogramPluginRef.current as any).colorMap = computeColormap(colormap);
			(spectrogramPluginRef.current as any).render();
		}

		
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

			spectrogramPluginRef.current = SpectrogramPlugin.create({
				colorMap: computeColormap(colormap),
				scale: "linear",
				fftSamples: (id==-1) ? 512 : 64, // <<< (SPECTROGRAM QUALITY)	zoomed : unzoomed
				labels: (id==-1),
				labelsColor: '#00FFFF',
				height: (id==-1) ? 256 : 90, 
			});
			(spectrogramPluginRef.current as any).currentColormap = colormap; // super hacky
			wavesurferRef.current.registerPlugin(spectrogramPluginRef.current);

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

	useEffect(() => { // change colormap when changed in context
		if (!spectrogramPluginRef.current) return;
		(spectrogramPluginRef.current as any).currentColormap = colormap; 
		(spectrogramPluginRef.current as any).colorMap = computeColormap(colormap);
		(spectrogramPluginRef.current as any).render();
	}, [colormap]);

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
				<div className="absolute left-10 top-1 w-64">
					<SpeciesDropdown
						speciesMap={speciesMap}
						speciesId={speciesId}
						onChange={
							(selectedOption) => updateAudioFile(
								index,
								"speciesId",
								selectedOption?.speciesId
							)
						}
					/>
				</div>
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
		speciesMap,
		toggleModal,
	} = context;

	const audioFile = audioFiles[index];

	const speciesId = audioFile.speciesId;
	const [displaySpecies, setDisplaySpecies] = useState(speciesMap[speciesId].common);

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
						speciesMap={speciesMap}
						speciesId={speciesId}
						onChange={
							(selectedOption) => updateAudioFile(
								index,
								"speciesId",
								selectedOption?.speciesId
							)
						}
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