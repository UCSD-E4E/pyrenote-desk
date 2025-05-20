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

    //TODO: change default database path to something else, or force user to select database
    const [databasePath, setDatabasePath] = useState(localStorage.getItem('databasePath') || defaultDatabasePath);
    const [availableDatabases, setAvailableDatabases] = useState([
        { Country: 'Default', filepath: defaultDatabasePath }
    ]);
    const [showNewDatabaseForm, setShowNewDatabaseForm] = useState(false);
    const [newDatabaseName, setNewDatabaseName] = useState('');
    const [isCreatingDatabase, setIsCreatingDatabase] = useState(false);
    const [editingDatabase, setEditingDatabase] = useState(null);
    const [editDatabaseName, setEditDatabaseName] = useState('');

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
    function newDatabasePath(path) {
        localStorage.setItem('databasePath', path);
        setDatabasePath(localStorage.getItem('databasePath'));
        window.ipc.invoke('set-db-path', path);
        console.log("path set to ", path);
    }

    //TODO: Implement Local Storage for existing settings
    //      Create export/import settings button
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
        setDatabasePath(defaultDatabasePath);
    }
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
                } catch (error) {
                    console.error("Error importing settings:", error);
                    alert("Failed to import settings. Please ensure the file is a valid JSON.");
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    async function createNewDatabase() {
        if (!newDatabaseName.trim()) { //if name is empty
            alert('Please enter a database name');
            return;
        }

        setIsCreatingDatabase(true);
        try {
            const result = await window.ipc.invoke('create-new-database', {
                name: newDatabaseName.trim(),
                filepath: `./databases/${newDatabaseName.trim().toLowerCase().replace(/\s+/g, '_')}.db`
            });

            if (result.success) {
                //Refresh database list
                const response = await fetch('/masterdb.json');
                const data = await response.json();
                const dbs = [
                    { Country: 'Default', filepath: defaultDatabasePath },
                    ...data.databases
                ];
                setAvailableDatabases(dbs);
                
                //Reset form
                setNewDatabaseName('');
                setShowNewDatabaseForm(false);
            } else {
                alert('Failed to create database: ' + result.error);
            }
        } catch (error) {
            alert('Error creating database: ' + error);
        } finally {
            setIsCreatingDatabase(false);
        }
    }

    async function deleteDatabase(db) {
        if (db.filepath === defaultDatabasePath) {
            alert('Cannot delete the default database');
            return;
        }

        if (!confirm(`Are you sure you want to delete the database "${db.Country}"?`)) {
            return;
        }

        try {
            const result = await window.ipc.invoke('delete-database', {
                filepath: db.filepath,
                country: db.Country
            });

            if (result.success) {
                // Refresh database list
                const response = await fetch('/masterdb.json');
                const data = await response.json();
                const dbs = [
                    { Country: 'Default', filepath: defaultDatabasePath },
                    ...data.databases
                ];
                setAvailableDatabases(dbs);
                
                // If the deleted database was selected, switch to default
                if (databasePath === db.filepath) {
                    newDatabasePath(defaultDatabasePath);
                }
            } else {
                alert('Failed to delete database: ' + result.error);
            }
        } catch (error) {
            alert('Error deleting database: ' + error);
        }
    }

    async function editDatabase(db) {
        if (db.filepath === defaultDatabasePath) {
            alert('Cannot edit the default database');
            return;
        }

        setEditingDatabase(db);
        setEditDatabaseName(db.Country);
    }

    async function saveDatabaseEdit() {
        if (!editDatabaseName.trim()) {
            alert('Please enter a database name');
            return;
        }

        try {
            const result = await window.ipc.invoke('edit-database', {
                oldName: editingDatabase.Country,
                newName: editDatabaseName.trim(),
                filepath: editingDatabase.filepath
            });

            if (result.success) {
                // Refresh database list
                const response = await fetch('/masterdb.json');
                const data = await response.json();
                const dbs = [
                    { Country: 'Default', filepath: defaultDatabasePath },
                    ...data.databases
                ];
                setAvailableDatabases(dbs);
                
                // If the edited database was selected, update the path
                if (databasePath === editingDatabase.filepath) {
                    newDatabasePath(editingDatabase.filepath);
                }
                
                setEditingDatabase(null);
                setEditDatabaseName('');
            } else {
                alert('Failed to edit database: ' + result.error);
            }
        } catch (error) {
            alert('Error editing database: ' + error);
        }
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
                        <button 
                            type="button" 
                            onClick={() => setShowNewDatabaseForm(!showNewDatabaseForm)}
                            style={{ marginLeft: '10px' }}
                        >
                            {showNewDatabaseForm ? 'Cancel' : 'Add New Database'}
                        </button>
                        {showNewDatabaseForm && (
                            <div style={{ marginTop: '10px' }}>
                                <label>New Database Name: </label>
                                <input
                                    type="text"
                                    value={newDatabaseName}
                                    onChange={(e) => setNewDatabaseName(e.target.value)}
                                    placeholder="Enter database name"
                                    style={{ marginRight: '10px' }}
                                />
                                <button
                                    type="button"
                                    onClick={createNewDatabase}
                                    disabled={isCreatingDatabase}
                                >
                                    {isCreatingDatabase ? 'Creating...' : 'Create Database'}
                                </button>
                            </div>
                        )}
                        {editingDatabase && (
                            <div style={{ marginTop: '10px' }}>
                                <label>Edit Database Name: </label>
                                <input
                                    type="text"
                                    value={editDatabaseName}
                                    onChange={(e) => setEditDatabaseName(e.target.value)}
                                    placeholder="Enter new name"
                                    style={{ marginRight: '10px' }}
                                />
                                <button
                                    type="button"
                                    onClick={saveDatabaseEdit}
                                >
                                    Save
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingDatabase(null);
                                        setEditDatabaseName('');
                                    }}
                                    style={{ marginLeft: '10px' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                        <div style={{ marginTop: '10px' }}>
                            {availableDatabases.map((db) => (
                                db.filepath !== defaultDatabasePath && (
                                    <div key={db.filepath} style={{ marginBottom: '5px' }}>
                                        <span>{db.Country}</span>
                                        <button
                                            type="button"
                                            onClick={() => editDatabase(db)}
                                            style={{ marginLeft: '10px' }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => deleteDatabase(db)}
                                            style={{ marginLeft: '10px' }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )
                            ))}
                        </div>
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
