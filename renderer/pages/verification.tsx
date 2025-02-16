
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import styles from './verification.module.css'
import React, { useState, useRef, useEffect } from 'react';


export default function HomePage() {
  const [spectrograms, setSpectrograms] = useState([]);

  const toHome = () => {
    window.location.href = '/home';
  };
  const toData = () => {
    window.location.href = '/database';
  };
  const toModel = () => {
    window.location.href = '/model';
  };
  const toLabel = () => {
    window.location.href = '/label';
  };
  const toVerify = () => {
    window.location.href = '/verification';
  };
  
  const handleFiles = async (files: File[]) => {
    const generatedSpectrograms: string[] = [];
    for (const file of files) {
      const audioData = await file.arrayBuffer();
      //const spectrogramUrl = await generateSpectrogram(audioData, file.name);
      //generatedSpectrograms.push(spectrogramUrl);
    }
    setSpectrograms(generatedSpectrograms);
  };

  
  
  
  return (
    <React.Fragment>
      <Head>
        <title>Home - Magnus (basic-lang-typescript)</title>
      </Head>
      <div className={styles.container}>
        <div>
          <div className={styles.home} onClick = {toHome}>
            <Image
              src="/images/home.png"
              alt="Home image"
              width={45}
              height={45}
            />
            <br />
            <Link href="/next">
              <span className={styles.linkStyle}>Home</span>
            </Link>
          </div>
          <div className={styles.database} onClick = {toData}>
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
          <div className={styles.model} onClick = {toModel}>
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
          <div className={styles.label} onClick = {toLabel}>
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
          <div className={styles.model} onClick = {toVerify}>
            <Image
              src="/images/model.png"
              alt="Verification image"
              width={45}
              height={45}
            />
            <br/>
            <Link href="/verification">
              <span className={styles.linkStyle}>Verify</span>
            </Link>
          </div>
        </div>
        <br/>
        <br/>
        <br/>
        <br/>
        <div>
        <p>Verify Spectograms</p>
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
        </div>
        <div>
          {spectrograms.map((url, index) => (
            <div key={index}>
              <Image src={url} alt={`Spectrogram ${index + 1}`} width={500} height={200} />
            </div>
          ))}
        </div>
      </div>
      <div>
      </div>
    </React.Fragment>
  )
}
