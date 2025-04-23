import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import styles from './next.module.css'


export default function databasePage() {

  const [entry, setEntry] = useState(true);
  const [recorder, setRecorder] = useState(false);
  const [survey, setSurvey] = useState(false);
  const [site, setSite] = useState(false);
  const [deployment, setDeployment] = useState(false);
  const [recording, setRecording] = useState(false);

  function toEntryForm() {
    setEntry(true);
    setRecorder(false);
    setSurvey(false);
    setSite(false);
    setDeployment(false);
    setRecording(false);
  }

  function toRecorderForm() {
    setEntry(false);
    setRecorder(true);
  }

  function toSurveyForm() {
    setEntry(false);
    setSurvey(true);
  }

  function toSiteForm() {
    setEntry(false);
    setSite(true);
  }

  function toDeploymentForm() {
    setEntry(false);
    setDeployment(true);
  }

  function toRecordingForm() {
    setEntry(false);
    setRecording(true);
  }

  function EntryHomepage() {
    if (!entry) {
      return null;
    }
    return (
      <div className={styles.magnus}>
        <h1>Database Page</h1>
  
        <button onClick={toRecorderForm}>Add Recorder</button>
        <button onClick={toSurveyForm}>Add Survey</button>
        <button onClick={toSiteForm}>Add Site</button>
        <button onClick={toDeploymentForm}>Add Deployment</button>
        <button onClick={toRecordingForm}>Add Recordings</button>
      </div>
    );
  }

  function RecorderEntryPage() {
    if (!recorder) {
      return null;
    }
    return (
      <div className={styles.magnus}>
        <h1>Recorder Entry</h1>

        <form>
          <label>Brand: </label>
          <input type="text" />
          <label>Model: </label>
          <input type="text" />
          <label>Serial number: </label>
          <input type="text" />
          <label>Code: </label>
          <input type="text" />
          <label>Date Purchased: </label>
          <input type="date" />
          <div>
            <button onClick={toEntryForm}>Enter</button>
            <button onClick={toEntryForm}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  function SurveyEntryPage() {
    if (!survey) {
      return null;
    }
    return (
      <div className={styles.magnus}>
        <h1>Survey Entry</h1>

        <form>
          <label>Name:</label>
          <input type="text" />
          <div className={styles.formRow}>
            <div className={styles.labelInput}>
              <label>Start Date:</label>
              <input type="date" />
            </div>
            <div className={styles.labelInput}>
              <label>End Date:</label>
              <input type="date" />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.labelInput}>
              <label>Latitude:</label>
              <input type="number" />
            </div>
            <div className={styles.labelInput}>
              <label>Longitude:</label>
              <input type="number" />              
            </div>
          </div>
          <label>Notes:</label><textarea></textarea>
          <button onClick={toEntryForm}>Enter</button>
          <button onClick={toEntryForm}>Cancel</button>
        </form>
      </div>
    );
  }

  function SiteEntryPage() {
    if (!site) {
      return null;
    }
    return (
      <div className={styles.magnus}>
        <h1>Site Entry</h1>
        <form>

        <label>Select Site: </label>
          <select>
            <option>Unselected</option>
          </select>
          <label>Latitude:</label>
          <input type="number" />
          <label>Longitude:</label>
          <input type="number" />
          <label>Elevation:</label>
          <input type="number" />
          <div>
            <button onClick={toEntryForm}>Enter</button>
            <button onClick={toEntryForm}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  function DeploymentEntryPage() {
    if (!deployment) {
      return null;
    }
    return (
      <div className={styles.magnus}>
        <h1>Deployment Entry</h1>

        <form>
          <label>Select Site: </label>
          <select>
            <option>Unselected</option>
          </select>
          <label>Select Recorder: </label>
          <select>
            <option>Unselected</option>
          </select>
          <label>Start Date:</label>
          <input type="date" />
          <label>End Date:</label>
          <input type="date" />
          <label>Notes:</label>
          <textarea></textarea>
          <div>
            <button onClick={toEntryForm}>Enter</button>
            <button onClick={toEntryForm}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  function RecordingEntryPage() {
    if (!recording) {
      return null;
    }
    return (
      <div className={styles.magnus}>
        <h1>Recording Entry</h1>
        <input type="file" webkitdirectory mozdirectory />
        <form>
          <label>Select Deployment</label>
          <select>
            <option>Unselected</option>
          </select>
          <div>
            <button onClick={toEntryForm}>Enter</button>
            <button onClick={toEntryForm}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <React.Fragment>
      <Head>
        <title>Database Page</title>
      </Head>

      <div className={styles.container}>
        <div>
          <EntryHomepage />
          <RecorderEntryPage />
          <SurveyEntryPage />
          <SiteEntryPage />
          <DeploymentEntryPage />
          <RecordingEntryPage />
        </div>
      </div>

    </React.Fragment>
  );
}


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

// import React, { useState } from 'react';

// function UserForm() {
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');

//   const handleSubmit = (event) => {
//     event.preventDefault();
//     // Display the user's input in an alert
//     alert(`Name: ${name}\nEmail: ${email}`);
    
//     // Reset the form fields
//     setName('');
//     setEmail('');
//   };

//   return (
//     <div>
//       <h1>User Form</h1>
//       <form onSubmit={handleSubmit}>
//         <div>
//           <label>
//             Name:
//             <input
//               type="text"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               required
//             />
//           </label>
//         </div>
//         <div>
//           <label>
//             Email:
//             <input
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//             />
//           </label>
//         </div>
//         <button type="submit">Submit</button>
//       </form>
//     </div>
//   );
// }

// export default UserForm;

