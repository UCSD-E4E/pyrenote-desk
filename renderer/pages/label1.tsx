import Head from 'next/head';
import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram';
import Image from 'next/image';
import styles from './label1.module.css';
import { PauseCircleFilled } from "@material-ui/icons";

const FileInputComponent = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  // const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const wavesurferContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (wavesurferContainerRef.current) {
      wavesurferRef.current = WaveSurfer.create({
        
        container: wavesurferContainerRef.current,
        waveColor: 'violet',
        progressColor: 'purple',
        height: 50,
        plugins: [
          Spectrogram.create({
            container: wavesurferContainerRef.current,
          }),
        ],
      });

    //   return () => {
    //     wavesurferRef.current?.destroy();
    //   };
     }
  }, []);

  useEffect(() => {
    if (file && wavesurferRef.current) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const audioData = e.target?.result as ArrayBuffer;
        wavesurferRef.current?.loadBlob(new Blob([audioData]));
      };
      reader.readAsArrayBuffer(file);
    }
  }, [file]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };



//   const handlePlayPause = () => {
//   //   if (wavesurferRef.current) {
//   //     if (isPlaying) {
//   //       wavesurferRef.current.pause();
//   //     } else {
//   //       wavesurferRef.current.play();
//   //     }
//   //     setIsPlaying(!isPlaying);
//   //   }
// };

  return (
    <React.Fragment>
      <Head>
        <title>Label Page</title>
      </Head>
      <div className={styles.container}>
        <div className={styles.navbar}>
          <div className={styles.home}>
            <Image src="/images/home.png" alt="Home image" width={45} height={45} />
            <br />
            <Link href="/home">
              <span className={styles.linkStyle}>Home</span>
            </Link>
          </div>
          <div className={styles.database}>
            <Image src="/images/database.png" alt="Database image" width={45} height={45} />
            <br />
            <Link href="/next">
              <span className={styles.linkStyle}>Database</span>
            </Link>
          </div>
          <div className={styles.model}>
            <Image src="/images/model.png" alt="Model image" width={45} height={45} />
            <br />
            <Link href="/model">
              <span className={styles.linkStyle}>Model</span>
            </Link>
          </div>
          <div className={styles.label}>
            <Image src="/images/tag.png" alt="Label image" width={45} height={45} />
            <br />
            <Link href="/label">
              <span className={styles.linkStyle}>Label</span>
            </Link>
          </div>
        </div>
        <div className={styles.fileInputContainer}>
          <button type="button" onClick={handleButtonClick}>
            Choose File
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none'}}
            onChange={handleFileChange}
          />
        {file && (
          <div className={styles.first}>
            <p >Selected file: {fileName}</p>
            <div ref={wavesurferContainerRef} style={{ width: '200%', height: '50px' }} />
                 {/* <div className={styles.playing}>
                <button onClick={handlePlayPause}>
                  {isPlaying ? 'Pause' : 'Play'}
                </button> */}
              {/* <button className="player__button" onClick={() => handlePlayPause()}>
                  <PauseCircleFilled />
              </button> */}
            </div> 
            // </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default FileInputComponent;
