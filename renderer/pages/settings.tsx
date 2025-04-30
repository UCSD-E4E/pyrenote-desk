import styles from "./settings.module.css";
import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

export default function SettingsPage() {
    //Initialize Local Storage Variables to Prevent Null Values TODO: move this to start page
    if (localStorage.getItem('username') == null) localStorage.setItem('username', '');
    if (localStorage.getItem('email') == null) localStorage.setItem('email', '');
    if (localStorage.getItem('skipInterval') == null) localStorage.setItem('skipInterval', '1')
    if (localStorage.getItem('playbackRate') == null) localStorage.setItem('playbackRate', '1');
    if (localStorage.getItem('darkMode') == null) localStorage.setItem('darkMode', 'false');
    if (localStorage.getItem('inputStyle') == null) localStorage.setItem('inputStyle', 'default');
    if (localStorage.getItem('inputType') == null) localStorage.setItem('inputType', 'default');
    if (localStorage.getItem('modelVersion') == null) localStorage.setItem('modelVersion', 'default');
    if (localStorage.getItem('modelParameters') == null) localStorage.setItem('modelParameters', 'default');
    if (localStorage.getItem('sampleRate') == null) localStorage.setItem('sampleRate', 'default');
    if (localStorage.getItem('colorScheme') == null) localStorage.setItem('colorScheme', 'default');
    if (localStorage.getItem('disableAdditional') == null) localStorage.setItem('disableAdditional', 'false');
    if (localStorage.getItem('disableConfidence') == null) localStorage.setItem('disableConfidence', 'false');
    if (localStorage.getItem('confidenceRange') == null) localStorage.setItem('confidenceRange', 'default');
    if (localStorage.getItem('defaultSkipInterval') == null) localStorage.setItem('defaultSkipInterval', '1');
    if (localStorage.getItem('defaultPlaybackRate') == null) localStorage.setItem('defaultPlaybackRate', '1');
    if (localStorage.getItem('defaultColumns') == null) localStorage.setItem('defaultColumns', '1');

    const [showGeneral, setShowGeneral] = useState(false);
    const [showData, setShowData] = useState(false);
    const [showModel, setShowModel] = useState(false);
    const [showLabel, setShowLabel] = useState(false);
    const [showVerify, setShowVerify] = useState(false);
    const [username, setUsername] = useState(localStorage.getItem('username'));
    const [email, setEmail] = useState(localStorage.getItem('email'));
    const [skipInterval, setSkipInterval] = useState(localStorage.getItem('skipInterval'));
    const [playbackRate, setPlaybackRate] = useState(localStorage.getItem('playbackRate'));
    const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode'));
    const [inputStyle, setInputStyle] = useState(localStorage.getItem('inputStyle'));
    const [inputType, setInputType] = useState(localStorage.getItem('inputType'));
    const [modelVersion, setModelVersion] = useState(localStorage.getItem('modelVersion'));
    const [modelParameters, setModelParameters] = useState(localStorage.getItem('modelParameters'));
    const [sampleRate, setSampleRate] = useState(localStorage.getItem('sampleRate'));
    const [colorScheme, setColorScheme] = useState(localStorage.getItem('colorScheme'));
    const [disableAdditional, setDisableAdditional] = useState(localStorage.getItem('disableAdditional'));
    const [disableConfidence, setDisableConfidence] = useState(localStorage.getItem('disableConfidence'));
    const [confidenceRange, setConfidenceRange] = useState(localStorage.getItem('confidenceRange'));
    const [defaultSkipInterval, setDefaultSkipInterval] = useState(localStorage.getItem('defaultSkipInterval'));
    const [defaultPlaybackRate, setDefaultPlaybackRate] = useState(localStorage.getItem('defaultPlaybackRate'));
    const [defaultColumns, setDefaultColumns] = useState(localStorage.getItem('defaultColumns'));

    function collapseGeneral () { setShowGeneral(!showGeneral); }
    function collapseData () { setShowData(!showData); }
    function collapseModel () { setShowModel(!showModel); }
    function collapseLabel () { setShowLabel(!showLabel); }
    function collapseVerify () { setShowVerify(!showVerify); }

    function newUsername (username) {
        localStorage.setItem('username', username);
        setUsername(localStorage.getItem('username'));
    }
    function newEmail (email) {
        localStorage.setItem('email', email);
        setEmail(localStorage.getItem('email'));
    }
    function newSkipInterval (interval) {
        localStorage.setItem('skipInterval', interval);
        setSkipInterval(localStorage.getItem('skipInterval'));
    }
    function newPlaybackRate (rate) {
        localStorage.setItem('playbackRate', rate);
        setPlaybackRate(localStorage.getItem('playbackRate'));
    }
    function newDarkMode (mode) {
        localStorage.setItem('darkMode', mode);
        setDarkMode(localStorage.getItem('darkMode'));
    }
    function newInputStyle (style) {
        localStorage.setItem('inputStyle', style);
        setInputStyle(localStorage.getItem('inputStyle'));
    }
    function newInputType (type) {
        localStorage.setItem('inputType', type);
        setInputType(localStorage.getItem('inputType'));
    }
    function newModelVersion (version) {
        localStorage.setItem('modelVersion', version);
        setModelVersion(localStorage.getItem('modelVersion'));
    }
    function newModelParameters (parameters) {
        localStorage.setItem('modelParameters', parameters);
        setModelParameters(localStorage.getItem('modelParameters'));
    }
    function newSampleRate (rate) {
        localStorage.setItem('sampleRate', rate);
        setSampleRate(localStorage.getItem('sampleRate'));
    }
    function newColorScheme (scheme) {
        localStorage.setItem('colorScheme', scheme);
        setColorScheme(localStorage.getItem('colorScheme'));
    }
    function newDisableAdditional (disable) {
        localStorage.setItem('disableAdditional', disable);
        setDisableAdditional(localStorage.getItem('disableAdditional'));
    }
    function newDisableConfidence (disable) {
        localStorage.setItem('disableConfidence', disable);
        setDisableConfidence(localStorage.getItem('disableConfidence'));
    }
    function newConfidenceRange (range) {
        localStorage.setItem('confidenceRange', range);
        setConfidenceRange(localStorage.getItem('confidenceRange'));
    }
    function newDefaultSkipInterval (interval) {
        localStorage.setItem('defaultSkipInterval', interval);
        setDefaultSkipInterval(localStorage.getItem('defaultSkipInterval'));
    }
    function newDefaultPlaybackRate (rate) {
        localStorage.setItem('defaultPlaybackRate', rate);
        setDefaultPlaybackRate(localStorage.getItem('defaultPlaybackRate'));
    }
    function newDefaultColumns (columns) {
        localStorage.setItem('defaultColumns', columns);
        setDefaultColumns(localStorage.getItem('defaultColumns'));
    }

    //TODO: Implement Local Storage for existing settings
    //      Create export/import settings button
    
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
                            onChange={(e) => newUsername(e.target.value)} 
                            value={username}
                ></input><br></br>
                        <label >Labeler Email: </label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email" 
                            onChange={(e) => newEmail(e.target.value)}
                            value={email}>
                        </input><br></br>
                        <label >Dark Mode: </label>
                        <input type="checkbox" id="dark" name="dark"
                            onChange={(e) => newDarkMode(e.target.value)}
                            value={darkMode}>    
                        </input>
                    </form>
                </div>}
            {!showGeneral && <br></br>}<br></br><button type="button" className={styles.collapsible} onClick={collapseData}>Database</button>
                {showData && <div id="content">
                    <br></br>
                    <form>
                        <label >Input Style: </label>
                        <input type="text" id="fname" name="fname"
                            onChange={(e) => newInputStyle(e.target.value)}
                            value = {inputStyle}>
                        </input><br></br>
                        <label >Input Type: </label>
                        <input type="text" id="lname" name="lname"
                            onChange={(e) => newInputType(e.target.value)}
                            value = {inputType}>
                        </input>
                    </form>
                </div>}
            {!showData && <br></br>}<br></br><button type="button" className={styles.collapsible} onClick={collapseModel}>Model</button>
                {showModel && <div id="content">
                    <br></br>
                    <form>
                        <label >Model Version: </label>
                        <input type="text" id="fname" name="fname"
                            onChange={(e) => newModelVersion(e.target.value)}
                            value = {modelVersion}> 
                        </input><br></br>
                        <label >Model Parameters: </label>
                        <input type="text" id="lname" name="lname" 
                            onChange={(e) => newModelParameters(e.target.value)}
                            value = {modelParameters}>
                        </input>
                    </form>
                </div>}
            {!showModel && <br></br>}<br></br><button type="button" className={styles.collapsible} onClick={collapseLabel}>Label</button>
                {showLabel && <div id="content">
                    <br></br>
                    <form>
                        <label>Spectrogram Sample Rate: </label>
                        <input type="text" id="fname" name="fname"
                            onChange={(e) => newSampleRate(e.target.value)}
                            value = {sampleRate}>
                        </input><br></br>
                        <label>Color Scheme: </label>
                        <input type="text" id="lname" name="lname"
                            onChange={(e) => newColorScheme(e.target.value)}
                            value = {colorScheme}>
                        </input><br></br>
                        <label >Disable Additional: </label>
                        <input type="checkbox" id="disableAdditional" name="disableAdditional"
                            onChange={(e) => newDisableAdditional(e.target.value)}
                            value = {disableAdditional}>    
                        </input><br></br>
                        <label >Disable Confidence: </label>
                        <input type="checkbox" id="disableConfidence" name="disableConfidence"
                            onChange={(e) => newDisableConfidence(e.target.value)}
                            value = {disableConfidence}>    
                        </input><br></br>
                        <label>Confidence Range: </label>
                        <input type="number" id="range" name="range"
                            onChange={(e) => newConfidenceRange(e.target.value)}
                            value = {confidenceRange}>
                        </input><br></br>
                    </form>
                </div>}
            {!showLabel && <br></br>}<br></br><button type="button" className={styles.collapsible} onClick={collapseVerify}>Verify</button>
                {showVerify && <div id="content">
                    <br></br>
                    <form>
                        <label>Color Scheme: </label>
                        <input type="text" id="lname" name="lname"></input><br></br>
                        <label>Default Skip Interval: </label>
                        <input type="number" id="skip" name="skip"
                            onChange={(e) => newSkipInterval(e.target.value)}
                            value = {skipInterval}>
                        </input><br></br>
                        <label>Default Playback Rate: </label>
                        <input type="number" id="speed" name="speed"
                            onChange={(e) => newPlaybackRate(e.target.value)}
                            value = {playbackRate}>
                        </input><br></br>
                        <label>Default Number of Columns: </label>
                        <input type="number" id="columns" name="columns"
                            onChange={(e) => newDefaultColumns(e.target.value)}
                            value = {defaultColumns}>
                        </input><br></br>
                    </form>
                </div>}
            <br></br>
            <div className={styles.controls}>
                <button className={styles.controls}>Reset Defaults</button>
                <button className={styles.controls}>Export Settings</button>
                <button className={styles.controls}>Import Settings</button>
            </div>
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
