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
  const [test, setTest] = useState(false);

  function toEntryForm() {
    setEntry(true);
    setRecorder(false);
    setSurvey(false);
    setSite(false);
    setDeployment(false);
    setRecording(false);
    setTest(false);
  }

  function toTestForm() {
    setEntry(false);
    setTest(true);
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
        <button onClick={toTestForm}>Test</button>
      </div>
    );
  }

  function TestPage() {
    const [species, setSpecies] = useState('');
    const [common, setCommon] = useState('');
    const [loading, setLoading] = useState(false);
    // submit button won't be there while loading is true

    if (!test) return null;

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!species || !common) {
        alert('Please fill in both fields.');
        return;
      }
      setLoading(true);
      try {
        await window.ipc.invoke('createSpecies', { species, common });
        alert('Species inserted!');
        setSpecies('');
        setCommon('');
        toEntryForm();
      } catch (err) {
        alert('Failed to insert species: ' + (err?.message || err));
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className={styles.magnus}>
        <h1>Test Page insert species</h1>
        <form onSubmit={handleSubmit}>
          <label>Species:</label>
          <input value={species} onChange={e => setSpecies(e.target.value)} />
          <label>Common Name:</label>
          <input value={common} onChange={e => setCommon(e.target.value)} />
          <div>
            <button type="submit" disabled={loading}>Enter</button>
            <button type="button" onClick={toEntryForm}>Cancel</button>
          </div>
        </form>
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
          <TestPage />
        </div>
      </div>

    </React.Fragment>
  );
}