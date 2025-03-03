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
        <br></br><button type="button" className={styles.collapsible} onClick={collapseGeneral}>General</button>
            {showGeneral && <div id="content">
                <br></br>
                <form>
                    <label >Labeler Name:</label>
                    <input type="text" 
                        id="name" 
                        name="name" 
                        onChange={(e) => setUsername(e.target.value)} 
                        value={username}
            ></input><br></br>
                    <label >Labeler Email:</label>
                    <input type="email" id="email" name="email"></input><br></br>
                    <label >Dark Mode:</label>
                    <input type="checkbox" id="dark" name="dark"></input>
                </form>
             </div>}
        {!showGeneral && <br></br>}<br></br><button type="button" className={styles.collapsible} onClick={collapseData}>Database</button>
            {showData && <div id="content">
                <br></br>
                <form>
                    <label >Labeler Name:</label>
                    <input type="text" id="fname" name="fname"></input><br></br>
                    <label >Labeler Email:</label>
                    <input type="text" id="lname" name="lname"></input>
                </form>
             </div>}
        {!showData && <br></br>}<br></br><button type="button" className={styles.collapsible} onClick={collapseModel}>Model</button>
            {showModel && <div id="content">
                <br></br>
                <form>
                    <label >Model Version:</label>
                    <input type="text" id="fname" name="fname"></input><br></br>
                    <label >Model Parameters:</label>
                    <input type="text" id="lname" name="lname"></input>
                </form>
             </div>}
        {!showModel && <br></br>}<br></br><button type="button" className={styles.collapsible} onClick={collapseLabel}>Label</button>
            {showLabel && <div id="content">
                <br></br>
                <form>
                    <label>Number of Spectrograms Per Page:</label>
                    <input type="text" id="fname" name="fname"></input><br></br>
                    <label>Color Scheme:</label>
                    <input type="text" id="lname" name="lname"></input>
                </form>
             </div>}
        {!showLabel && <br></br>}<br></br><button type="button" className={styles.collapsible} onClick={collapseVerify}>Verify</button>
            {showVerify && <div id="content">
                <br></br>
                <form>
                    <label>Number of Spectrograms Per Page:</label>
                    <input type="text" id="fname" name="fname"></input><br></br>
                    <label>Color Scheme:</label>
                    <input type="text" id="lname" name="lname"></input>
                </form>
             </div>}

    </React.Fragment>
  );
}
