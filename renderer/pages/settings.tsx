import styles from "./settings.module.css";
import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

const defaultDatabasePath = './pyrenoteDeskDatabase.db';
export default function SettingsPage() {
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
    const [verifyColorScheme, setVerifyColorScheme] = useState(localStorage.getItem('verifyColorScheme'));
    const [confidenceRange, setConfidenceRange] = useState(localStorage.getItem('confidenceRange'));
    const [defaultColumns, setDefaultColumns] = useState(localStorage.getItem('defaultColumns'));
	const [defaultSpeciesId, setDefaultSpeciesId] = useState(localStorage.getItem('defaultSpeciesId'));

    //TODO: maybe change default database path to something else, or force user to select database
    const [databasePath, setDatabasePath] = useState(localStorage.getItem('databasePath') || defaultDatabasePath);
    const [availableDatabases, setAvailableDatabases] = useState([
        { Country: 'Default', filepath: defaultDatabasePath }
    ]);

    // fetch data from masterdb.json and save to availableDatabases variable
    useEffect(() => {
        fetch('/masterdb.json')
            .then(response => response.json())
            .then(data => {
                const dbs = [
                    { Country: 'Default', filepath: defaultDatabasePath },
                    ...data.databases
                ];
                setAvailableDatabases(dbs);
            })
            .catch(error => {
                console.error('Error loading database paths:', error);
            });
    }, []);

    function collapseGeneral () { setShowGeneral(!showGeneral); }
    function collapseData () { setShowData(!showData); }
    function collapseModel () { setShowModel(!showModel); }
    function collapseLabel () { setShowLabel(!showLabel); }
    function collapseVerify () { setShowVerify(!showVerify); }
    
    /**
     * Each new_____ function updates local storage and updates the state with the new value.
     *
     * @param param the new value to be set in local storage and state.
     */
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
    function newVerifyColorScheme (scheme) {
        localStorage.setItem('verifyColorScheme', scheme);
        setVerifyColorScheme(localStorage.getItem('verifyColorScheme'));
    }
    function newConfidenceRange (range) {
        localStorage.setItem('confidenceRange', range);
        setConfidenceRange(localStorage.getItem('confidenceRange'));
    }
    function newDefaultColumns (columns) {
        localStorage.setItem('defaultColumns', columns);
        setDefaultColumns(localStorage.getItem('defaultColumns'));
    }
	function newDefaultSpeciesId (columns) {
        localStorage.setItem('defaultSpeciesId', columns);
        setDefaultSpeciesId(localStorage.getItem('defaultSpeciesId'));
    }
    function newDatabasePath(path) {
        // Sets new database path for all SQL operations
        localStorage.setItem('databasePath', path);
        setDatabasePath(localStorage.getItem('databasePath'));
        window.ipc.invoke('set-db-path', path);
        console.log("path set to ", path);
    }

    /**
     * restoreDefaults function resets all settings to their default values.
     * It updates both local storage and the state variables.
     */
    function restoreDefaults () {
        localStorage.setItem('username', '');
        localStorage.setItem('email', '');
        localStorage.setItem('skipInterval', '1');
        localStorage.setItem('playbackRate', '1');
        localStorage.setItem('darkMode', 'false');
        localStorage.setItem('inputStyle', 'default');
        localStorage.setItem('inputType', 'default');
        localStorage.setItem('modelVersion', '1.0.0');
        localStorage.setItem('modelParameters', 'default');
        localStorage.setItem('sampleRate', '44100');
        localStorage.setItem('colorScheme', 'black and white');
        localStorage.setItem('disableAdditional', 'false');
        localStorage.setItem('disableConfidence', 'false');
        localStorage.setItem('verifyColorScheme', 'black and white');
        localStorage.setItem('confidenceRange', '10');
        localStorage.setItem('defaultColumns', '4');
		localStorage.setItem('defaultSpeciesId', 'Default');
        localStorage.setItem('databasePath', defaultDatabasePath);

        setUsername('');
        setEmail('');
        setSkipInterval('1');
        setPlaybackRate('1');
        setDarkMode('false');
        setInputStyle('default');
        setInputType('default');
        setModelVersion('1.0.0');
        setModelParameters('default');
        setSampleRate('44100');
        setColorScheme('black and white');
        setDisableAdditional('false');
        setDisableConfidence('false');
        setVerifyColorScheme('black and white');
        setConfidenceRange('10');
        setDefaultColumns('4');
		setDefaultSpeciesId('Default')
        setDatabasePath(defaultDatabasePath);
    }
    /**
     * exportSettings function creates a JSON file with the current settings
     * and triggers a download of that file.
     */
    function exportSettings() {
        const settings = {
            username,
            email,
            skipInterval,
            playbackRate,
            darkMode,
            inputStyle,
            inputType,
            modelVersion,
            modelParameters,
            sampleRate,
            colorScheme,
            disableAdditional,
            disableConfidence,
            verifyColorScheme,
            confidenceRange,
            defaultColumns,
			defaultSpeciesId,
            databasePath
        };

        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "pyrenoteDeskSettings.json";
        link.click();
        URL.revokeObjectURL(url);
    }
    /**
     * importSettings function allows the user to select a JSON file
     * and imports the settings from that file into the application.
     */
    function importSettings() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json";
        input.onchange = (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedSettings = JSON.parse(e.target?.result as string);
                    setUsername(importedSettings.username || "");
                    setEmail(importedSettings.email || "");
                    setSkipInterval(importedSettings.skipInterval || "1");
                    setPlaybackRate(importedSettings.playbackRate || "1");
                    setDarkMode(importedSettings.darkMode || "false");
                    setInputStyle(importedSettings.inputStyle || "default");
                    setInputType(importedSettings.inputType || "default");
                    setModelVersion(importedSettings.modelVersion || "1.0.0");
                    setModelParameters(importedSettings.modelParameters || "default");
                    setSampleRate(importedSettings.sampleRate || "44100");
                    setColorScheme(importedSettings.colorScheme || "black and white");
                    setDisableAdditional(importedSettings.disableAdditional || "false");
                    setDisableConfidence(importedSettings.disableConfidence || "false");
                    setVerifyColorScheme(importedSettings.verifyColorScheme || "black and white");
                    setConfidenceRange(importedSettings.confidenceRange || "10");
                    setDefaultColumns(importedSettings.defaultColumns || "4");
					setDefaultSpeciesId(importedSettings.defaultSpeciesId || 'Default');

                    localStorage.setItem("username", importedSettings.username || "");
                    localStorage.setItem("email", importedSettings.email || "");
                    localStorage.setItem("skipInterval", importedSettings.skipInterval || "1");
                    localStorage.setItem("playbackRate", importedSettings.playbackRate || "1");
                    localStorage.setItem("darkMode", importedSettings.darkMode || "false");
                    localStorage.setItem("inputStyle", importedSettings.inputStyle || "default");
                    localStorage.setItem("inputType", importedSettings.inputType || "default");
                    localStorage.setItem("modelVersion", importedSettings.modelVersion || "1.0.0");
                    localStorage.setItem("modelParameters", importedSettings.modelParameters || "default");
                    localStorage.setItem("sampleRate", importedSettings.sampleRate || "44100");
                    localStorage.setItem("colorScheme", importedSettings.colorScheme || "black and white");
                    localStorage.setItem("disableAdditional", importedSettings.disableAdditional || "false");
                    localStorage.setItem("disableConfidence", importedSettings.disableConfidence || "false");
                    localStorage.setItem("verifyColorScheme", importedSettings.verifyColorScheme || "black and white");
                    localStorage.setItem("confidenceRange", importedSettings.confidenceRange || "10");
                    localStorage.setItem("defaultColumns", importedSettings.defaultColumns || "4");
					localStorage.setItem("defaultSpeciesId", importedSettings.defaultSpeciesId || 'Default');
                } catch (error) {
                    console.error("Error importing settings:", error);
                    alert("Failed to import settings. Please ensure the file is a valid JSON.");
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }


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
                        <label>Database Path: </label>
                        <select 
                            id="dbPath" 
                            name="dbPath"
                            onChange={(e) => newDatabasePath(e.target.value)}
                            value={databasePath}
                            style={{ width: '300px' }}
                        >
                            {availableDatabases.map((db) => (
                                <option key={db.filepath} value={db.filepath}>
                                    {db.Country}
                                </option>
                            ))}
                        </select>
                        
                        <br></br>
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
                        <input type="text" id="lname" name="lname"
                            onChange={(e) => newVerifyColorScheme(e.target.value)}
                            value = {verifyColorScheme}>
                        </input><br></br>
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
						 <label>Default Species: </label>
                        <input type="text" id="species" name="species"
                            onChange={(e) => newDefaultSpeciesId(e.target.value)}
                            value = {defaultSpeciesId}>
                        </input><br></br>
                    </form>
                </div>}
            <br></br>
            <div className={styles.controls}>
                <button className={styles.controls} onClick={restoreDefaults}>Reset Defaults</button>
                <button className={styles.controls} onClick={exportSettings}>Export Settings</button>
                <button className={styles.controls} onClick={importSettings}>Import Settings</button>
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
