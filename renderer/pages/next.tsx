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

import React, { useRef, useState } from 'react';
import Papa from 'papaparse';

function UserForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [csvData, setCsvData] = useState<Array<any>>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  //need to mind the order of parameters but can enter any numbebr of parameters and this function will work
  const insertRow = async (name: string | null, email: string | null, url: string | null, model_version: string | null, is_human: number | null ) => {
    name= name || null;
    email= email || null;
    url= url || null;
    model_version = model_version || null;
    is_human = is_human || null;
    // Use the IPC API exposed via preload script to send a query to the main process
    try {
        // Insert a new row into the Labeler table
        await window.api.runQuery(
            "INSERT INTO Labeler (name, email, url, model_version, is_human) VALUES (?, ?, ?, ?, ?)",
            [name, email, url, model_version, is_human]  // Passing parameters
        );
        console.log("Row inserted!");
    } catch (error) {
        console.error("Failed to insert row:", error);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Display the user's input in an alert
    alert(`Name: ${name}\nEmail: ${email}`);

    //all the other values default to null if not specified
    insertRow(name, email);

    const file = fileInputRef.current?.files?.[0];
    if (file) {
      parseCSV(file);
    }
    
    // Reset the form fields
    setName('');
    setEmail('');
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true, //assuming that csv has a header row
      skipEmptyLines: true,
      complete: (result) => {
        const processedData = result.data.map((row: any) => {
          // Replace empty cells with null so that all data is valid before ingesting
          return Object.fromEntries(
            Object.entries(row).map(([key, value]) => [key, value === "" ? null : value])
          );
        });
        console.log('Processed Data: ', processedData);
        setCsvData(processedData); // Store processed data in state

         // Insert each row into the database
        for (const row of processedData) {
          const { name, email, url, model_version, is_human } = row;
          insertRow(name, email, url, model_version, is_human);
        }
      },
      error: (error) => {
        console.error('Error parsing CSV: ', error);
      },
    });
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
        <input type="file" accept=".csv" ref={fileInputRef}/>
        <br/>
        <button type="submit">Submit</button>
      </form>

      {/* Display parsed CSV data */}
      {/* {csvData.length > 0 && ( */}
        <div>
          <h3>Parsed CSV Data:</h3>
          <table>
            <thead>
              {/*<tr>
                {Object.keys(csvData[0]).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr> */}
            </thead>
            <tbody>
              {csvData.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((value, i) => (
                    <td key={i}>{value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      {/*)}*/}
    </div>
  );
}

export default UserForm;

