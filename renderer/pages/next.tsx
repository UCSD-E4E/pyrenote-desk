import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head'
import styles from './next.module.css'


export default function databasePage() {
  //toggle between data entry and data view
  const [addData, setAddData] = useState(true);

  //toggle between different data entry forms
  const [entry, setEntry] = useState(true);
  const [recorder, setRecorder] = useState(false);
  const [survey, setSurvey] = useState(false);
  const [site, setSite] = useState(false);
  const [deployment, setDeployment] = useState(false);
  const [recording, setRecording] = useState(false);

  function toAddData() {setAddData(true);}
  function toViewData() {setAddData(false);}

  //toggle between different data view forms

  const [viewSite, setViewSite] = useState(false);
  const [viewSurvey, setViewSurvey] = useState(false);
  const [viewRecorder, setViewRecorder] = useState(false);
  const [viewDeployment, setViewDeployment] = useState(false);
  const [viewRecordings, setViewRecordings] = useState(false);

  //Switch between data entry and data view pages
  function DataBaseNavigation() {
    if (addData) {
      return (
        <div className={styles.databaseNav}>
            <button onClick={toAddData} id={styles.selected}>Database Entry</button> <br />
            <button onClick={toViewData}>View Database</button>
        </div>
      );
    } else {
      return (
        <div className={styles.databaseNav}>
            <button onClick={toAddData}>Database Entry</button> <br />
            <button onClick={toViewData} id={styles.selected}>View Database</button>
        </div>
      );
    }
    
  }

  const updateViewForm = (e) => {
    setViewSurvey(false);
    setViewSite(false);
    setViewRecorder(false);
    setViewDeployment(false);
    setViewRecordings(false);
    if (e.target.value == "Survey") { setViewSurvey(true);}
    else if (e.target.value == "Site") {setViewSite(true);}
    else if (e.target.value == "Recorder") {setViewRecorder(true);}
    else if (e.target.value == "Deployment") {setViewDeployment(true);}
    else if (e.target.value == "Recordings") {setViewRecordings(true);}
  }

  function SiteViewForm() {
    if (!viewSite) {return null;}
    return (
      <div className={styles.magnusContent}>
        <form>
          <label>Select Survey</label>
          <select>
            <option>Unselected</option>
          </select>
        </form>
        <button>View Sites</button>
      </div>
    );
  }

  function DeploymentViewForm() {
    if (!viewDeployment) {return null;}
    return (
      <div className={styles.magnusContent}>
        <form>
          <label>Select Recorder</label>
          <select>
            <option>Unselected</option>
          </select>
        </form>
        <button>View Deployments</button>
      </div>
    );
  }

  function RecordingViewForm() {
    if (!viewRecordings){ return null;}

    return (
      <div className={styles.magnusContent}>
        <form>
          <label>Select Survey</label>
          <select>Unselected</select>
          <label>Select Site</label>
          <select>Unselected</select>
          <label>Select Recorder</label>
          <select>Unselected</select>
          <label>Select Deployment</label>
          <select>Unselected</select>
        </form>
        <button>View Recordings</button>
      </div>
    );
  }

  //Database view page
  function DatabaseView() {
    if(addData) {
      return null;
    }
    return (
      <div className={styles.magnus}>
        <h1> View Database </h1>
        <label>Viewing:</label>
        <select onChange={updateViewForm}>
          <option>Survey</option>
          <option>Site</option>
          <option>Recorders</option>
          <option>Deployments</option>
          <option>Recordings</option>
        </select>
        <hr className={styles.hr}/>
        <RecordingViewForm />
        <SiteViewForm />
        <DeploymentViewForm />
      </div>
    );
  }

  //Page with forms to add data to database
  function DatabaseAddition() {
    if (!addData) {
      return null;
    }
    return (
      <div className={styles.magnus}>
          <EntryHomepage />
          <RecorderEntryPage />
          <SurveyEntryPage />
          <SiteEntryPage />
          <DeploymentEntryPage />
          <RecordingEntryPage />
          <SelectRecordings />
      </div>
    );
  }
  
  //switch between database entry page and different forms
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
      <div className={styles.magnusContent}>
        <h1>Database Entry</h1>
  
        <button onClick={toRecorderForm}>Add Recorder</button>
        <button onClick={toSurveyForm}>Add Survey</button>
        <button onClick={toSiteForm}>Add Site</button>
        <button onClick={toDeploymentForm}>Add Deployment</button>
        <button onClick={toRecordingForm}>Add Recordings</button>
        <button onClick={toggleRecordingSelect}>Select Recordings</button>
      </div>
    );
  }

  const [selection, setSelection] = useState(false);
  function toggleRecordingSelect() {
    setSelection(!selection);
  }
  function SelectRecordings() {
    if (!selection) {
      return null;
    }
    return (
      <div>
        <section className={styles.selectPopup}>
          <label>Select Site</label>
          <select>Unselected</select>
          <label>Select Recorder</label>
          <select>Unselected</select>
          <label>Select Survey</label>
          <select>Unselected</select>
          <label>Select Deployment</label>
          <select>Unselected</select>
          <button onClick={toggleRecordingSelect}>Select</button>
          <button onClick={toggleRecordingSelect}>Cancel</button>
        </section>

        <div className={styles.overlay}></div>
      </div>
    );
  }

  //Form to add recorders
  function RecorderEntryPage() {
    if (!recorder) {
      return null;
    }
    return (
      <div>
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

  //Form to add surveys
  function SurveyEntryPage() {
    if (!survey) {
      return null;
    }
    return (
      <div>
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

  //Form to add sites
  function SiteEntryPage() {
    if (!site) {
      return null;
    }
    return (
      <div>
        <h1>Site Entry</h1>
        <form>

        <label>Select Survey: </label>
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

  //form to add deployments
  function DeploymentEntryPage() {
    if (!deployment) {
      return null;
    }
    return (
      <div>
        <h1>Deployment Entry</h1>

        <form>
          <label>Select Survey</label>
          <select>
            <option>Unselected</option>
          </select>
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

  //Form to add recordings
  function RecordingEntryPage() {
    if (!recording) {
      return null;
    }
    return (
      <div>
        <h1>Recording Entry</h1>
        <input type="folder" webkitdirectory mozdirectory />
        <form>
          <label>Select Site</label>
          <select>
            <option>Unselected</option>
          </select>
          <label>Select Recorder</label>
          <select>
            <option>Unselected</option>
          </select>
          <label>Select Survey</label>
          <select>
            <option>Unselected</option>
          </select>
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
        <DataBaseNavigation />
        <DatabaseAddition />
        <DatabaseView />
      </div>

    </React.Fragment>
  );
}