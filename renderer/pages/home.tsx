import styles from "./home.module.css";
import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';


export default function HomePage() {
  //Initialize Local Storage Variables to Prevent Null Values
  useEffect(() => {
    if (localStorage.getItem('username') == null) localStorage.setItem('username', '');
    if (localStorage.getItem('email') == null) localStorage.setItem('email', '');
    if (localStorage.getItem('darkMode') == null) localStorage.setItem('darkMode', 'false');
    
    if (localStorage.getItem('inputStyle') == null) localStorage.setItem('inputStyle', 'default');
    if (localStorage.getItem('inputType') == null) localStorage.setItem('inputType', 'default');
    
    if (localStorage.getItem('modelVersion') == null) localStorage.setItem('modelVersion', '1.0.0');
    if (localStorage.getItem('modelParameters') == null) localStorage.setItem('modelParameters', 'default');
    
    if (localStorage.getItem('sampleRate') == null) localStorage.setItem('sampleRate', '44100');
    if (localStorage.getItem('colorScheme') == null) localStorage.setItem('colorScheme', 'black and white');
    if (localStorage.getItem('disableAdditional') == null) localStorage.setItem('disableAdditional', 'false');
    if (localStorage.getItem('disableConfidence') == null) localStorage.setItem('disableConfidence', 'false');
    if (localStorage.getItem('confidenceRange') == null) localStorage.setItem('confidenceRange', '10');
    
    if (localStorage.getItem('verifyColorScheme') == null) localStorage.setItem('verifyColorScheme', 'black and white');
    if (localStorage.getItem('skipInterval') == null) localStorage.setItem('skipInterval', '1')
    if (localStorage.getItem('playbackRate') == null) localStorage.setItem('playbackRate', '1');
    if (localStorage.getItem('defaultColumns') == null) localStorage.setItem('defaultColumns', '4');
    console.log('Local storage initialized');
  }, []);
  return (
    <React.Fragment>
      <Head>
        <title>Home - Pyrenote Desktop</title>
      </Head>
      <div className={styles.container}>
        <div className={styles.magnus}>
          <br />
          <h1>Pyrenote Desktop</h1>
          <div className={styles.intro}>
            <br />
            <br />
            <h2>Welcome to Pyrenote Desktop!</h2>
            <p>
              Pyrenote Desktop is a desktop application developed by students at UC San Diego's Engineers for Exploration Lab in collaboration with the San Diego Zoo Wildlife Alliance.
              It is designed to provide a user friendly interface for labelling and running inference over large-scale bioacoustic data. 
              The results of human labelling & model inference are stored in a database and can be retrieved or even verified later.
            </p>
            <p>
              To start using Pyrenote Desktop, please navigate to the "Database" tab using the sidebar on the left & start inserting information!
            </p>
            <br />
            {/* <Image
              src="/images/youtube.png"
              alt="Label image"
              width={15}
              height={15}
            />
            <a
              href="https://youtu.be/xvFZjo5PgG0"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.externalLink}
            >
              Learn more about Magnusnote
            </a> */}
          </div>
        </div>
      </div>
      <div></div>
    </React.Fragment>
  );
}
