import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import styles from './label.module.css'
import WaveSurfer from 'wavesurfer.js';
import SpectrogramPlugin from 'wavesurfer.js/dist/plugins/spectrogram';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';

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
  const [confidence, setConfidence] = useState<string>("10");
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
    setConfidence("10");
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
    setConfidence("10");
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
    setConfidence("10");
    setYesDisabled(true);

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
    setConfidence("10");
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
    console.log("Files dropped:", acceptedFiles);

    const newWaveSurfers = acceptedFiles.map((file, index) => {
      const containerId = `waveform-${wavesurfers.length + index}`;
      const spectrogramId = `spectrogram-${wavesurfers.length + index}`;
      return {
        id: containerId,
        specId: spectrogramId,
        file: file,
        instance: null,
        class: "spectrogramContainer",
      };
    });
    
    console.log("New WaveSurfers:", newWaveSurfers);
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
    console.log(index);
    
    //window.addEventListener('keydown', handleKeyDown);
      if (wavesurfers.length === 0) {
      //alert user

      setShowSpec(false);
      setIndex(0);
      console.log('No more audioclips');
    } 
    else if (wavesurfers[index]) {
      //if wavesurfers[index] exists
      console.log(index);
      //create wavesurfer
      const createWavesurfer = async () => {
        const ws = await WaveSurfer.create({
          container: `#${wavesurfers[index].id}`,
          waveColor: 'violet',
          progressColor: 'purple',
          plugins: [
            SpectrogramPlugin.create({
              container: `#${wavesurfers[index].spectrogramId}`,
              labels: true,
              colorMap: spectrogramColorMap,
            }),
          ],
        });
      
        // Allow draw selection with Regions plugin
        const wsRegions = ws.registerPlugin((RegionsPlugin as any).create({
          name: 'regions',
          regions: [],
          drag: true,
          resize: true,
          color: 'rgba(0, 255, 0, 0.3)',
          dragSelection: true
        }));
      
        // Enable drag selection with a constant color and threshold.
        const disableDragSelection = wsRegions.enableDragSelection({ color: 'rgba(0,255,0,0.3)' }, 3);
      
        await ws.load(URL.createObjectURL(wavesurfers[index].file));
        console.log('loaded ws');
        wavesurfers[index].instance = ws;

        wsRegions.on('region-clicked', (region) => {
          // selecting selected region cancels loop
          if (activeRegionRef.current === region) {
            region.setOptions({ color: 'rgba(0,255,0,0.3)' });
            region.data = { ...region.data, loop: false };
            activeRegionRef.current = null;
          } else {
          // sets all other red regions to green
          if (activeRegionRef.current) {
            activeRegionRef.current.setOptions({ color: 'rgba(0,255,0,0.3)' });
          }

          // turns region red on click
          console.log("region-clicked fired");
          region.setOptions({ color: 'rgba(255,0,0,0.3)' });
          activeRegionRef.current = region;

          region.data = { ...region.data, loop: true };
        }
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
          input.value = region.data?.label || "";
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

        document.getElementById(wavesurfers[index].spectrogramId)?.classList.add('spectrogramContainer');
      };
      
      createWavesurfer();
      return () => {
        //window.removeEventListener('keydown', handleKeyDown);
      };
    } 
    else {
      console.log('failed initialization');
    }
  }, [index, wavesurfers]);

  
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
          <select name="Species" id="species-names">
            <option value="x">Select a Species</option>
            <option value="y">y</option>
            <option value="z">z</option>
          </select>
          <div>
            {showSpec && (
              <div key={wavesurfers[index].id} className={styles.waveContainer}>
                <div
                  id={wavesurfers[index].id}
                  style={{ width: "10000%", height: "420px", padding: "1px" }}
                ></div>
                <div
                  id={wavesurfers[index].spectrogramId}
                  style={{ width: "100%", height: "50px", padding: "1px" }}
                ></div>
                <div className={styles.controls}></div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showSpec && (
        <div  className={styles.controls}>
          <button className={styles.prevClip} onClick={clickPrev}><Image
              src="/images/LArrow.png"
              alt="Previous Button"
              width={45}
              height={45}
            />
          </button>
          <button className={styles.modelMatch} onClick={clickYes}>Save
          </button>
          {!playing && 
            <button className={styles.play} onClick={clickPlay}><Image
              src="/images/Play.png"
              alt="Play Button"
              width={45}
              height={45}
            />
          </button>}
          {playing &&
            <button className={styles.pause} onClick={clickPause}><Image
              src="/images/Pause.png"
              alt="Pause Button"
              width={45}
              height={45}
            />
          </button>}
          <button className={styles.modelFail} onClick={clickNo}>Delete
          </button>
          <button className={styles.nextClip} onClick={clickNext}><Image
              src="/images/RArrow.png"
              alt="Next Button"
              width={45}
              height={45}
            /></button>
            
        </div>
          
      )}
      {showSpec && 
      <div>
        <input 
          type="range" 
          id='confidence'
          className={styles.confidence} 
          name="confidence" 
          min="0" 
          max="10" 
          value={confidence} 
          onChange={(e) => setConfidence(e.target.value)}
          list = "epochsList" />
          <label className = {styles.confidenceLabel} htmlFor="confidence">Confidence: {confidence}</label>
          </div>}
      
      
    
    
  </React.Fragment>
  );
};

export default AudioPlayer;
