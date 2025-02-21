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

import React, { FormEvent, useState } from "react";

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
    </div>
  );
}

export default UserForm;
