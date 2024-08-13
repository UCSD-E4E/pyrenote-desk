import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import styles from './label.module.css'
import WaveSurfer from 'wavesurfer.js';
import SpectrogramPlugin from 'wavesurfer.js/dist/plugins/spectrogram';

const AudioPlayer: React.FC = () => {
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
  const [audioURL, setAudioURL] = useState<string | undefined>(undefined);
  const [audioFile, setAudioFile] = useState<File | undefined>(undefined);
  const wavesurferRef = useRef(null);
  const spectrogramRef = useRef(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioFile(file);
      setAudioURL(url);
    }
  };

  useEffect(() => {
    if (audioURL) {
      wavesurferRef.current = WaveSurfer.create({
        container: '#waveform',
        waveColor: 'violet',
        progressColor: 'purple',
        plugins: [
          SpectrogramPlugin.create({
            container: '#spectrogram',
            labels: true,
          })
        ],
      });

      wavesurferRef.current.load(audioURL);

      return () => wavesurferRef.current.destroy();
    }
  }, [audioURL]);

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
    <div className={styles.abc}>
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
      />    
      {audioURL && (
        <audio controls className={styles.player}>
          <source src={audioURL} type={audioFile?.type} />
          Your browser does not support the audio element.
        </audio>
      )}
      {audioURL && (
        <div>
          <div id="waveform" style={{ width: '75%', height: '120px' }}></div>
          <div id="spectrogram" style={{ width: '75%', height: '120px' }}></div>
        </div>
      )}
    </div>
    </div>
  </React.Fragment>
  );
};

export default AudioPlayer;
