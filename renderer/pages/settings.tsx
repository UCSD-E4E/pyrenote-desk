import styles from "./settings.module.css";
import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

export default function SettingsPage() {
    const [showGeneral, setShowGeneral] = useState(false);
    const [showData, setShowData] = useState(false);
    const [showModel, setShowModel] = useState(false);
    const [showLabel, setShowLabel] = useState(false);
    const [showVerify, setShowVerify] = useState(false);
    const [username, setUsername] = useState(" ");

    function collapseGeneral () { setShowGeneral(!showGeneral); }
    function collapseData () { setShowData(!showData); }
    function collapseModel () { setShowModel(!showModel); }
    function collapseLabel () { setShowLabel(!showLabel); }
    function collapseVerify () { setShowVerify(!showVerify); }
    
  return (
    <React.Fragment>
      <Head>
        <title>
            Settings
        </title>
      </Head>
        <div className={styles.container}>
            <div className={styles.settings}>
            <br></br><button type="button" className={styles.collapsible} onClick={collapseGeneral}>General</button>
                {showGeneral && <div id="content">
                    <br></br>
                    <form>
                        <label >Labeler Name: </label>
                        <input type="text" 
                            id="name" 
                            name="name" 
                            onChange={(e) => setUsername(e.target.value)} 
                            value={username}
                ></input><br></br>
                        <label >Labeler Email: </label>
                        <input type="email" id="email" name="email"></input><br></br>
                        <label >Dark Mode: </label>
                        <input type="checkbox" id="dark" name="dark"></input>
                    </form>
                </div>}
            {!showGeneral && <br></br>}<br></br><button type="button" className={styles.collapsible} onClick={collapseData}>Database</button>
                {showData && <div id="content">
                    <br></br>
                    <form>
                        <label >Input Style: </label>
                        <input type="text" id="fname" name="fname"></input><br></br>
                        <label >Input Type: </label>
                        <input type="text" id="lname" name="lname"></input>
                    </form>
                </div>}
            {!showData && <br></br>}<br></br><button type="button" className={styles.collapsible} onClick={collapseModel}>Model</button>
                {showModel && <div id="content">
                    <br></br>
                    <form>
                        <label >Model Version: </label>
                        <input type="text" id="fname" name="fname"></input><br></br>
                        <label >Model Parameters: </label>
                        <input type="text" id="lname" name="lname"></input>
                    </form>
                </div>}
            {!showModel && <br></br>}<br></br><button type="button" className={styles.collapsible} onClick={collapseLabel}>Label</button>
                {showLabel && <div id="content">
                    <br></br>
                    <form>
                        <label>Spectrogram Sample Rate: </label>
                        <input type="text" id="fname" name="fname"></input><br></br>
                        <label>Color Scheme: </label>
                        <input type="text" id="lname" name="lname"></input><br></br>
                        <label >Disable Additional: </label>
                        <input type="checkbox" id="disableAdditional" name="disableAdditional"></input><br></br>
                        <label >Disable Confidence: </label>
                        <input type="checkbox" id="disableConfidence" name="disableConfidence"></input><br></br>
                        <label>Confidence Range: </label>
                        <input type="number" id="range" name="range"></input><br></br>
                    </form>
                </div>}
            {!showLabel && <br></br>}<br></br><button type="button" className={styles.collapsible} onClick={collapseVerify}>Verify</button>
                {showVerify && <div id="content">
                    <br></br>
                    <form>
                        <label>Color Scheme: </label>
                        <input type="text" id="lname" name="lname"></input><br></br>
                        <label>Default Skip Interval: </label>
                        <input type="number" id="skip" name="skip"></input><br></br>
                        <label>Default Playback Rate: </label>
                        <input type="number" id="speed" name="speed"></input><br></br>
                        <label>Default Number of Columns: </label>
                        <input type="number" id="columns" name="columns"></input><br></br>
                    </form>
                </div>}
             </div>
        <Image
            src="/images/MagnusDefault.png"
            alt="Image of Bird"
            className={styles.magnus}
            width={610}
            height={400}
        /></div>

    </React.Fragment>
  );
}
