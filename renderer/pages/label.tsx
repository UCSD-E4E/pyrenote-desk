import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import styles from './label.module.css'
import WaveSurfer from 'wavesurfer.js';
import SpectrogramPlugin from 'wavesurfer.js/dist/plugins/spectrogram';
//import WaveSurfer from '../wavesurfer.js/src/wavesurfer.js';
//import SpectrogramPlugin from '../wavesurfer.js/src/plugin/spectrogram/spectrogram.js';
//import WaveSurfer from '../wavesurfer.js/src/wavesurfer.js';
//import RegionsPlugin from '../wavesurfer.js/src/plugin/regions/index.js';
//import SpectrogramPlugin from '../wavesurfer.js/src/plugin/spectrogram/index.js';

//see if we can grab species from databse for dropdown, work with keybindings


//Generate ColorMap for Spectrogram
const spectrogramColorMap = [];
for (let i = 0; i < 256; i++) {
  const val = (255 - i) / 256;
  spectrogramColorMap.push([val/2, val/3, val, 1]);
}

const AudioPlayer: React.FC = () => {
  //navigation
  const toHome = () => {
    window.location.href = '/home';
  };
  const toData = () => {
    window.location.href = '/next';
  };
  const toModel = () => {
    window.location.href = '/model';
  };
  const toLabel = () => {
    window.location.href = '/label';
  };

  const [showSpec, setShowSpec] = useState<Boolean>(false);
  const [playing, setPlaying] = useState<Boolean>(false);
  const [index, setIndex] = useState<number>(0);
  const [wavesurfers, setWavesurfers] = useState([]);
  const [isNextDisabled, setNextDisabled] = useState(false);
  const [isPrevDisabled, setPrevDisabled] = useState(false);
  const [isYesDisabled, setYesDisabled] = useState(false);
  const [isNoDisabled, setNoDisabled] = useState(false);
  
  //Destroys Current Wavesurfer reference
  const destroyCurrentWaveSurfer = async () => {
    if (wavesurfers[index]?.instance) {
      await wavesurfers[index].instance.destroy();
      wavesurfers[index].instance = null;
    }
  };

  //Called when moving to previous audio clip 
  //destroys current wavesurfer and changes index
  const clickPrev = async () => {
    if (isPrevDisabled){
      return;
    }
    setPrevDisabled(true);
    if (index === 0) return;
    await destroyCurrentWaveSurfer();
    setIndex((prevIndex) => prevIndex - 1);

    //buffer time between presses
    setTimeout(() => {
      setPrevDisabled(false);
    }, 500); 
  }

  //Called when moving to next audio clip 
  //destroys current wavesurfer and changes index
  const clickNext = async () => {
    if (isNextDisabled){
      return;
      //print message for user
    }
    setNextDisabled(true);
    if (index === wavesurfers.length - 1) return;
    await destroyCurrentWaveSurfer();
    setIndex((prevIndex) => prevIndex + 1);

    //buffer time between presses
    setTimeout(() => {
      setNextDisabled(false);
    }, 500); 
  }

  //Plays the current wavesurfer audio
  const clickPlay = async () => {
    wavesurfers[index].instance.playPause();
    await setPlaying(true);
  };
  
  //Pauses the current wavesurfer audio
  const clickPause = async() => {
    wavesurfers[index].instance.playPause();
    await setPlaying(false);
  };

  /* called when confirming audio matches model annotation
    remove current wavesurfer
    move rest up
    save annotation in database */
  const clickYes = async () => {
    if (isYesDisabled){
      return;
    }
    setYesDisabled(true);

    if (index == 0){
      let currentWaveSurfer = wavesurfers[index].instance
      if (wavesurfers.length === 1){
        setShowSpec(false);
        setWavesurfers([]);
      }
      else {
        await currentWaveSurfer.destroy();
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
      await currentWaveSurfer.destroy();
      currentWaveSurfer = null;

      //buffer between button presses
      setTimeout(() => {
        setYesDisabled(false);
      }, 500); 

      return;
    }
    await destroyCurrentWaveSurfer();
    setWavesurfers(wavesurfers => {
      // Remove the WaveSurfer from the array
      return wavesurfers.filter((_, i) => i !== index);
    });
    if (wavesurfers.length == 0){
      setWavesurfers([]);
    }
    //adjust index if array is shorter than index
    if (wavesurfers.length - 1 >= index){
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
    if (isNoDisabled){
      return;
    }
    setNoDisabled(true);

    if (index == 0){
      let currentWaveSurfer = wavesurfers[index].instance
      if (wavesurfers.length === 1){
        setShowSpec(false);
        setWavesurfers([]);
      }
      else {
        await currentWaveSurfer.destroy();
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
      await currentWaveSurfer.destroy();
      currentWaveSurfer = null;

      //buffer between button presses
      setTimeout(() => {
        setNoDisabled(false);
      }, 500); 
      return;
    }
    await destroyCurrentWaveSurfer();
    setWavesurfers(wavesurfers => {
      // Remove the WaveSurfer from the array
      return wavesurfers.filter((_, i) => i !== index);
    });
    
    console.log(wavesurfers);
    //adjust index if array is shorter than index
    if (wavesurfers.length == 0){
      setWavesurfers([]);
    }
    if (wavesurfers.length -1 >= index){
      setIndex(index - 1);
    }

    //buffer between button presses
    setTimeout(() => {
      setNoDisabled(false);
    }, 500); 
  };
  
  //Handle audio files upload/import and map new wavesurfers
  const handleFiles = (acceptedFiles) => {
    console.log('Files dropped:', acceptedFiles);

    const newWaveSurfers = acceptedFiles.map((file, index) => {
      const containerId = `waveform-${wavesurfers.length + index}`;
      const spectrogramId = `spectrogram-${wavesurfers.length + index}`
      return {
        id: containerId,
        specId: spectrogramId,
        file: file,
        instance: null,
        class: 'spectrogramContainer'
      };
    });

    console.log('New WaveSurfers:', newWaveSurfers);
    setWavesurfers(newWaveSurfers);
    setShowSpec(true);
    setIndex(0);
  };

  //define keybindings
  const handleKeyDown = async (event: KeyboardEvent) => {
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
  };

  //useEffect when index or wavesurfers updates
  useEffect(() => {
    console.log(index);
    
    window.addEventListener('keydown', handleKeyDown);
      if (wavesurfers.length === 0){
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
                colorMap: spectrogramColorMap
                
              }),
            ],
          });
        
          await ws.load(URL.createObjectURL(wavesurfers[index].file));
          console.log(ws);
          console.log('loaded ws');
          wavesurfers[index].instance = ws;
          

          document.getElementById(wavesurfers[index].spectrogramId)?.classList.add('spectrogramContainer');
      }
      
      createWavesurfer();
        return () => {
          window.removeEventListener('keydown', handleKeyDown);
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
      <div className ={styles.container}>
      <div>
          <div className={styles.home} onClick={toHome}>
            <Image
              src="/images/home.png"
              alt="Home image"
              width={45}
              height={45}
            />
            <br />
            <Link href="/home">
              <span className={styles.linkStyle}>Home</span>
            </Link>
          </div>
          <div className={styles.database} onClick={toData}>
            <Image
              src="/images/database.png"
              alt="Database image"
              width={45}
              height={45}
            />
            <br />
            <Link href="/next">
              <span className={styles.linkStyle}>Database</span>
            </Link>
          </div>
          <div className={styles.model} onClick={toModel}>
            <Image
              src="/images/model.png"
              alt="Model image"
              width={45}
              height={45}
            />
            <br />
            <Link href="/model">
              <span className={styles.linkStyle}>Model</span>
            </Link>
          </div>
          <div className={styles.label} onClick={toLabel}>
            <Image
              src="/images/tag.png"
              alt="Label image"
              width={45}
              height={45}
            />
            <br />
            <Link href="/label">
              <span className={styles.linkStyle}>Label</span>
            </Link>
          </div>
     
        </div>


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
      {showSpec && (<div key={wavesurfers[index].id} className={styles.waveContainer}><div id={wavesurfers[index].id} style={{ width: '10000%', height: '420px', padding: '1px' }}></div>
      <div id={wavesurfers[index].spectrogramId} style={{ width: '100%', height: '50px', padding: '1px' }}></div><div  className={styles.controls}>
            
            </div></div>)}
        
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
          <button className={styles.modelMatch} onClick={clickYes}><Image
              src="/images/check.png"
              alt="Model Prediction Success Button"
              width={45}
              height={45}
            />
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
          <button className={styles.modelFail} onClick={clickNo}><Image
              src="/images/X.png"
              alt="Model Prediction Fail Button"
              width={45}
              height={45}
            />
          </button>
          <button className={styles.nextClip} onClick={clickNext}><Image
              src="/images/RArrow.png"
              alt="Next Button"
              width={45}
              height={45}
            /></button>
        </div>
      )}
    
      
    </div>
    </div>
    
  </React.Fragment>
  );
};

export default AudioPlayer;
