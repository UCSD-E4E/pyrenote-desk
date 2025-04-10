// import React from 'react'
// import Head from 'next/head'
// import Link from 'next/link'

// export default function NextPage() {
//   return (
//     <React.Fragment>
//       <Head>
//         <title>Next - Nextron (basic-lang-typescript)</title>
//       </Head>
//       <div>
//         <p>
//           ⚡ Electron + Next.js ⚡ -<Link href="/home">Go to home page</Link>
//         </p>
//       </div>
//     </React.Fragment>
//   )
// }
// import React, { useState, useRef, useEffect } from 'react';
// import WaveSurfer from 'wavesurfer.js';
// import SpectrogramPlugin from 'wavesurfer.js/dist/plugins/spectrogram';
// import styles from './label.module.css'

// const AudioVisualizer = () => {
//   const [audioURL, setAudioURL] = useState(null);
//   const [audioFile, setAudioFile] = useState<File | undefined>(undefined);
//   const wavesurferRef = useRef(null);
//   const spectrogramRef = useRef(null);

//   const handleFileChange = (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       const url = URL.createObjectURL(file);
//       setAudioFile(file);
//       setAudioURL(url);
//     }
//   };

//   useEffect(() => {
//     if (audioURL) {
//       wavesurferRef.current = WaveSurfer.create({
//         container: '#waveform',
//         waveColor: 'violet',
//         progressColor: 'purple',
//         plugins: [
//           SpectrogramPlugin.create({
//             container: '#spectrogram',
//             labels: true,
//           })
//         ],
//       });

//       wavesurferRef.current.load(audioURL);

//       return () => wavesurferRef.current.destroy();
//     }
//   }, [audioURL]);

//   return (
//     <div className={styles.abc}>
//       <input
//         type="file"
//         accept="audio/*"
//         onChange={handleFileChange}
//       />
//       {audioURL && (
//         <div>
//           <div id="waveform" style={{ width: '100%', height: '150px' }}></div>
//           <div id="spectrogram" style={{ width: '100%', height: '150px' }}></div>
//         </div>
//       )}
//       {audioURL && (
//         <audio controls className={styles.player}>
//           <source src={audioURL} type={audioFile?.type} />
//           Your browser does not support the audio element.
//         </audio>
//       )}
//     </div>
//   );
// };

// export default AudioVisualizer;

import React, { useState, FormEvent, useEffect } from "react";
import { Survey } from "../../main/schema";

function UserForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    // Display the user's input in an alert
    alert(`Name: ${name}\nEmail: ${email}`);

    // Reset the form fields
    setName("");
    setEmail("");
  };

  const runPython = async () => {
    try {
      const result = await window.api.runScript();
      console.log("Script Output:", result);
    } catch (error) {
      console.error("Error running script:", error);
    }
  };

  const getDeploymentById = async () => {
    try {
      // const result = await window.api.listRecordingsByDeploymentId(1);
      // console.log(result);
      // const result2 = await window.api.listRecordings();
      // console.log(result2);
      // const result3 = await window.api.listRecordingsBySiteId(1);
      // console.log(result3);
      // const surveys = await window.api.listSurveys();
      // console.log(surveys);
      const deployments = await window.api.listDeployments();
      console.log("deployments", deployments);
      const roi = await window.api.listRegionOfInterestByRecordingId(1);
      console.log(roi);
      const newAnnotation = await window.api.createAnnotation(
        roi[0].recordingId,
        2,
        roi[0].regionId,
        1,
        0.2,
      );
      console.log(newAnnotation);
      const annotation = await window.api.listAnnotationsByRegionId(
        roi[0].regionId,
      );
      console.log(annotation);
      const updatedAnnotation = await window.api.updateAnnotation(
        newAnnotation.annotationId,
        1,
        0.4,
      );
      console.log(updatedAnnotation);
      const newRecording = await window.api.createRecording(
        0,
        "thing.mp3",
        "some url",
        "2025",
        20,
        4,
        5,
      );
      console.log(newRecording);
      if (surveys.length > 0) {
        const site = await window.api.createSite(
          surveys[0].surveyId,
          "new test site",
          31.232,
          -32.33333,
          32,
        );
        console.log(site);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const [surveyName, setSurveyName] = useState("");
  const [studySite, setStudySite] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [lat, setLat] = useState(0);
  const [long, setLong] = useState(0);
  const [notes, setNotes] = useState("");

  const testCreateSurvey = async (event: FormEvent) => {
    event.preventDefault();
    const newSurvey = await window.api.createSurvey(
      surveyName,
      studySite,
      startDate,
      endDate,
      lat,
      long,
      notes,
    );
    console.log(newSurvey);
    setSurveyName("");
    setStudySite("");
    setStartDate("");
    setEndDate("");
    setLat(0);
    setLong(0);
    setNotes("");
    await getSurveys();
  };

  const [siteName, setSiteName] = useState("");
  const [siteLat, setSiteLat] = useState(0);
  const [siteLong, setSiteLong] = useState(0);
  const [elevation, setElevation] = useState(0);
  const [surveyId, setSurveyId] = useState(-1);
  const [surveys, setSurveys] = useState<Survey[]>([]);

  const getSurveys = async () => {
    setSurveys(await window.api.listSurveys());
  };

  useEffect(() => {
    getSurveys().catch((e) => console.log(e));
  }, []);
  const testCreateSite = async (event: FormEvent) => {
    event.preventDefault();
    if (surveyId < 0) return;
    const newSurvey = await window.api.createSite(
      surveyId,
      siteName,
      siteLat,
      siteLong,
      elevation,
    );
    console.log(newSurvey);
    setSiteName("");
    setSiteLat(0);
    setSiteLong(0);
    setElevation(0);
  };

  return (
    <div>
      <h1>User Form</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Name:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Email:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
        </div>
        <button type="submit">Submit</button>
      </form>
      <button onClick={runPython}>Run Python Script</button>
      <button onClick={getDeploymentById}>Run thing </button>
      <form className="flex flex-col" onSubmit={testCreateSurvey}>
        <h1>Test add survey</h1>
        <label>Survey Name</label>
        <input
          value={surveyName}
          onChange={(e) => setSurveyName(e.target.value)}
        />
        <label>Study Site</label>
        <input
          value={studySite}
          onChange={(e) => setStudySite(e.target.value)}
        />
        <label>Start Date</label>
        <input
          type="datetime-local"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <label>End Date</label>
        <input
          type="datetime-local"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <label>Lat</label>
        <input
          type="number"
          value={lat}
          onChange={(e) => setLat(+e.target.value)}
        />
        <label>Long</label>
        <input
          type="number"
          value={long}
          onChange={(e) => setLong(+e.target.value)}
        />
        <label>Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button type="submit">Submit</button>
      </form>
      <form className="flex flex-col" onSubmit={testCreateSite}>
        <h1>Test add site</h1>
        <label>Survey</label>
        <select value={surveyId} onChange={(e) => setSurveyId(+e.target.value)}>
          {surveys.map((s) => (
            <option key={s.surveyId} value={s.surveyId}>
              {s.surveyname}
            </option>
          ))}
        </select>
        <label>Site Name</label>
        <input value={siteName} onChange={(e) => setSiteName(e.target.value)} />
        <label>Lat</label>
        <input
          type="number"
          value={siteLat}
          onChange={(e) => setSiteLat(+e.target.value)}
        />
        <label>Long</label>
        <input
          type="number"
          value={siteLong}
          onChange={(e) => setSiteLong(+e.target.value)}
        />
        <label>Elevation</label>
        <input
          type="number"
          value={elevation}
          onChange={(e) => setElevation(+e.target.value)}
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default UserForm;
