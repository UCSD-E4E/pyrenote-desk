import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import styles from './next.module.css'

// import data type of tables for queries
import { useSelectedLayoutSegment } from 'next/navigation';


export default function databasePage() {

  const [entry, setEntry] = useState(true);
  const [recorder, setRecorder] = useState(false);
  const [survey, setSurvey] = useState(false);
  const [site, setSite] = useState(false);
  const [deployment, setDeployment] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speciesPage, setSpeciesPage] = useState(false);
  const [databases, setDatabases] = useState(false);

  const [analyticsPage, setAnalyticsPage] = useState(false);
  


  function toEntryForm() {
    setEntry(true);
    setRecorder(false);
    setSurvey(false);
    setSite(false);
    setDeployment(false);
    setRecording(false);
    setSpeciesPage(false);
    setDatabases(false);
    setAnalyticsPage(false);
  }

  function toSpeciesForm() {
    setEntry(false);
    setSpeciesPage(true);
  }

  function toDatabasesForm() {
    setEntry(false);
    setDatabases(true);
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

  function toAnalyticsForm() {
    setEntry(false);
    setAnalyticsPage(true);
  }

  function EntryHomepage() {
    if (!entry) {
      return null;
    }
    return (
      <div className={styles.magnus}>
        <div>
          <h1>Database Page</h1>
          {/* uncomment to show current db in page */}
          {/* <p style={{ color: 'red' }}>Current Database Path: {localStorage.getItem('databasePath')}</p> */}
          <button onClick={toDatabasesForm}>View and Edit Databases</button>
          <button onClick={toAnalyticsForm}>View Analytics</button>
          <button onClick={toRecorderForm}>Add Recorder</button>
          <button onClick={toSurveyForm}>Add Survey</button>
          <button onClick={toSiteForm}>Add Site</button>
          <button onClick={toDeploymentForm}>Add Deployment</button>
          <button onClick={toRecordingForm}>Add Recordings</button>
          <button onClick={toSpeciesForm}>Add Species</button>
        </div>
        
      </div>
    );
  }

  function SpeciesEntryPage() {
    const [species, setSpecies] = useState('');
    const [common, setCommon] = useState('');
    const [loading, setLoading] = useState(false);
    // submit button won't be there while loading is true

    if (!speciesPage) return null;

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
        <h1>Insert Species</h1>
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
    const [loading, setLoading] = useState(false);
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [serialNo, setSerialNo] = useState('');
    const [code, setCode] = useState('');
    const [date, setDate] = useState<Date | null>(null); 


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!brand || !model || !serialNo || !code || !date) {
          alert('Please fill in all fields.');
          return;
        }
        setLoading(true);
        try {
          const purchase_date= date.toISOString().split("T")[0];
          await window.ipc.invoke('createRecorder', {
            brand, 
            model, 
            serialnbr: serialNo, 
            code, 
            purchase_date
          });
          alert('Recorder inserted!');
          setBrand('');
          setModel('');
          setSerialNo('');
          setCode('');
          setDate(null);
          toEntryForm();
        } catch (err) {
          alert('Failed to insert recording: ' + (err?.message || err));
        } finally {
          setLoading(false);
        }
      };
    return (
      <div className={styles.magnus}>
        <h1>Recorder Entry</h1>

        <form onSubmit={handleSubmit}>
          <label>Brand:</label>
          <input value={brand} onChange={e => setBrand(e.target.value)} />
          <label>Model:</label>
          <input value={model} onChange={e => setModel(e.target.value)} />
          <label>Serial number:</label>
          <input value={serialNo} onChange={e => setSerialNo(e.target.value)} />
          <label>Code:</label>
          <input value={code} onChange={e => setCode(e.target.value)} />
          <label>Date Purchased:</label>
          <input
            type="date"
            value={date ? date.toISOString().split("T")[0] : ""}
            onChange={(e) => setDate(new Date(e.target.value))}
          />

          {/* <label>Date Purchased: </label>
          <input type="date" /> */}
          <div>
            <button type="submit" disabled={loading}>Enter</button>
            <button type="button" onClick={toEntryForm}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  function SurveyEntryPage() {
    if (!survey) {
      return null;
    }
    const [loading, setLoading] = useState(false);
    const [surveyname, setSurveyName] = useState('');
    const [studysite, setStudySite] = useState('');
    const [startDate, setStartDate] = useState<Date | null>(null); 
    const [endDate, setEndDate] = useState<Date | null>(null); ;
    const [latitude, setLatitude] = useState(0);
    const [longitude, setLongitude] = useState(0);
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!surveyname || !studysite || !startDate || !endDate || !latitude || !longitude || !notes) {
          alert('Please fill in all fields.');
          return;
        }
        setLoading(true);
        try {
          const start_date= startDate.toISOString().split("T")[0];
          const end_date = endDate.toISOString().split("T")[0];
          console.log(typeof surveyname);
          console.log(typeof studysite);
          console.log(typeof start_date);
          console.log(typeof end_date);
          console.log(typeof latitude);
          console.log(typeof longitude);
          console.log(typeof notes);
          await window.ipc.invoke('createSurvey', {
            surveyname,
            studysite,
            start_date,
            end_date,
            latitude,
            longitude,
            notes
          });
          alert('Survey inserted!');
          setSurveyName('');
          setStudySite('');
          setStartDate(null);
          setEndDate(null);
          setLatitude(0);
          setLongitude(0);
          setNotes('');
          toEntryForm();
        } catch (err) {
          alert('Failed to insert survey: ' + (err?.message || err));
        } finally {
          setLoading(false);
        }
      };

    return (
      <div className={styles.magnus}>
        <h1>Survey Entry</h1>

        <form onSubmit={handleSubmit}>
          <label>Name:</label>
          <input
            type="text"
            value={surveyname}
            onChange={(e) => setSurveyName(e.target.value)}
          />

          <label>Study Site:</label>
          <input
            type="text"
            value={studysite}
            onChange={(e) => setStudySite(e.target.value)}
          />

          <div className={styles.formRow}>
            <div className={styles.labelInput}>
              <label>Start Date:</label>
              <input
                type="date"
                value={startDate ? startDate.toISOString().split("T")[0] : ""}
                onChange={(e) => setStartDate(new Date(e.target.value))}
              />
            </div>
            <div className={styles.labelInput}>
              <label>End Date:</label>
              <input
                type="date"
                value={endDate ? endDate.toISOString().split("T")[0] : ""}
                onChange={(e) => setEndDate(new Date(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.labelInput}>
              <label>Latitude:</label>
              <input
                type="number"
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
              />
            </div>
            <div className={styles.labelInput}>
              <label>Longitude:</label>
              <input
                type="number"
                value={longitude}
                onChange={(e) => setLongitude(Number(e.target.value))}
              />
            </div>
          </div>

          <label>Notes:</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          ></textarea>

          <div>
            <button type="submit" disabled={loading}>Enter</button>
            <button type="button" onClick={toEntryForm}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }


  type SurveyOption = {
    surveyId: number;
    surveyname: string;
  };

  function SiteEntryPage() {
    if (!site) {
      return null;
    }

    const [loading, setLoading] = useState(false);
    const[surveyId, setSurveyId] = useState(0);
    const[site_code, setSiteCode] = useState('');
    const[latitude, setLatitude] = useState(0);
    const[longitude, setLongitude] = useState(0);
    const[elevation, setElevation] = useState(0);
    const [surveys, setSurveys] = useState<SurveyOption[]>([]);

    // Load surveys on mount
    useEffect(() => {
      const fetchSurveys = async () => {
        try {
          const results = await window.ipc.invoke("listSurveys");
          // filter just surveyId and surveyname
          const parsed: SurveyOption[] = results.map((s: any) => ({
            surveyId: s.surveyId,
            surveyname: s.surveyname,
          }));
          setSurveys(parsed);
        } catch (err) {
          console.error("Failed to load surveys", err);
        }
      };
      fetchSurveys();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!surveyId || !site_code || !latitude || !longitude || !elevation) {
          alert('Please fill in all fields.');
          return;
        }
        setLoading(true);
        try {
          await window.ipc.invoke('createSite', {
            surveyId, 
            site_code, 
            latitude, 
            longitude, 
            elevation
          });
          alert('Site inserted!');
          setSurveyId(0);
          setSiteCode('');
          setLatitude(0);
          setLongitude(0);
          setElevation(0);
          toEntryForm();
        } catch (err) {
          alert('Failed to insert site: ' + (err?.message || err));
        } finally {
          setLoading(false);
        }
      };
      return (
        <div className={styles.magnus}>
          <h1>Site Entry</h1>
          <form onSubmit={handleSubmit}>
            <label>Select Survey: </label>
            <select
              value={surveyId}
              onChange={(e) => setSurveyId(Number(e.target.value))}
            >
              <option value={0}>Unselected</option>
              {surveys.map((s) => (
                <option key={s.surveyId} value={s.surveyId}>
                  {s.surveyname}
                </option>
              ))}
            </select>

            <label>Site Code:</label>
            <input value={site_code} onChange={(e) => setSiteCode(e.target.value)} />

            <label>Latitude:</label>
            <input
              type="number"
              value={latitude}
              onChange={(e) => setLatitude(Number(e.target.value))}
            />

            <label>Longitude:</label>
            <input
              type="number"
              value={longitude}
              onChange={(e) => setLongitude(Number(e.target.value))}
            />

            <label>Elevation:</label>
            <input
              type="number"
              value={elevation}
              onChange={(e) => setElevation(Number(e.target.value))}
            />

            <div>
              <button type="submit" disabled={loading}>Enter</button>
              <button type="button" onClick={toEntryForm}>Cancel</button>
            </div>
          </form>
        </div>
      );
    }

  type SiteOption = {
    siteId: number;
    site_code: string;
  };

  type RecorderOption = {
    recorderId: number;
    code: string;
  };

  function DeploymentEntryPage() {
    if (!deployment) {
      return null;
    }

    const [siteId, setSiteId] = useState(0);
    const [recorderId, setRecorderId] = useState(0);
    const [start_date, setStartDate] = useState("");
    const [end_date, setEndDate] = useState("");
    const [deployed_by, setDeployedBy] = useState("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [sites, setSites] = useState<SiteOption[]>([]);
    const [recorders, setRecorders] = useState<RecorderOption[]>([]);

    // Load sites and recorders
    useEffect(() => {
      const fetchDropdownData = async () => {
        try {
          const siteResults = await window.ipc.invoke("listSites");
          const recorderResults = await window.ipc.invoke("listRecorders");
          const parsedSites = siteResults.map((s: any) => ({
            siteId: s.siteId,
            site_code: s.site_code,
          }));
          const parsedRecorders = recorderResults.map((r: any) => ({
            recorderId: r.recorderId,
            code: r.code,
          }));
          setSites(parsedSites);
          setRecorders(parsedRecorders);
        } catch (err) {
          console.error("Failed to load dropdown data", err);
        }
      };
      fetchDropdownData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!siteId || !recorderId || !start_date || !end_date || !deployed_by) {
        alert("Please fill in all required fields.");
        return;
      }

      setLoading(true);
      try {
        await window.ipc.invoke("createDeployment", {
          siteId,
          recorderId,
          start_date,
          end_date,
          deployed_by,
          note,
        });
        alert("Deployment inserted!");
        // Reset
        setSiteId(0);
        setRecorderId(0);
        setStartDate("");
        setEndDate("");
        setDeployedBy("");
        setNote("");
        toEntryForm();
      } catch (err: any) {
        alert("Failed to insert deployment: " + (err?.message || err));
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className={styles.magnus}>
        <h1>Deployment Entry</h1>
        <form onSubmit={handleSubmit}>
          <label>Select Site: </label>
          <select value={siteId} onChange={(e) => setSiteId(Number(e.target.value))}>
            <option value={0}>Unselected</option>
            {sites.map((s) => (
              <option key={s.siteId} value={s.siteId}>
                {s.site_code}
              </option>
            ))}
          </select>

          <label>Select Recorder: </label>
          <select value={recorderId} onChange={(e) => setRecorderId(Number(e.target.value))}>
            <option value={0}>Unselected</option>
            {recorders.map((r) => (
              <option key={r.recorderId} value={r.recorderId}>
                {r.code}
              </option>
            ))}
          </select>

          <label>Start Date:</label>
          <input type="date" value={start_date} onChange={(e) => setStartDate(e.target.value)} />

          <label>End Date:</label>
          <input type="date" value={end_date} onChange={(e) => setEndDate(e.target.value)} />

          <label>Deployed By:</label>
          <input value={deployed_by} onChange={(e) => setDeployedBy(e.target.value)} />

          <label>Notes:</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} />

          <div>
            <button type="submit" disabled={loading}>Enter</button>
            <button type="button" onClick={toEntryForm}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  // function RecordingEntryPage() {
  //   if (!recording) {
  //     return null;
  //   }
  //   return (
  //     <div className={styles.magnus}>
  //       <h1>Recording Entry</h1>
  //       <input type="file" webkitdirectory mozdirectory />
  //       <form>
  //         <label>Select Deployment</label>
  //         <select>
  //           <option>Unselected</option>
  //         </select>
  //         <div>
  //           <button onClick={toEntryForm}>Enter</button>
  //           <button onClick={toEntryForm}>Cancel</button>
  //         </div>
  //       </form>
  //     </div>
  //   );
  // }

  type DeploymentOption = {
    deploymentId: number;
    note: string;
  };

  function RecordingEntryPage() {
    if (!recording) {
      return null;
    }

    const [files, setFiles] = useState<File[]>([]);
    const [deploymentId, setDeploymentId] = useState<number>(0);
    const [driveLabel, setDriveLabel] = useState(""); // optional
    const [deployments, setDeployments] = useState<DeploymentOption[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      const fetchDeployments = async () => {
        try {
          const results = await window.ipc.invoke("listDeployments");
          const parsed: DeploymentOption[] = results.map((d: any) => ({
            deploymentId: d.deploymentId,
            note: d.note,
          }));
          setDeployments(parsed);
        } catch (err) {
          console.error("Failed to load deployments", err);
        }
      };
      fetchDeployments();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        setFiles(selectedFiles);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (files.length === 0 || !deploymentId) {
        alert("Please select a folder and a deployment.");
        return;
      }

      setLoading(true);
      try {
        const fileBuffers = await Promise.all(
          files.map(async (file) => {
            const buffer = await file.arrayBuffer();
            return {
              name: file.name,
              relativePath: (file as any).webkitRelativePath || file.name,
              buffer: Array.from(new Uint8Array(buffer)),
            };
          })
        );

        await window.ipc.invoke("saveMultipleRecordings", {
          files: fileBuffers,
          deploymentId,
          driveLabel: driveLabel || null,
        });

        alert("All recordings saved!");
        setFiles([]);
        setDeploymentId(0);
        toEntryForm();
      } catch (err: any) {
        alert("Failed to save recordings: " + (err?.message || err));
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className={styles.magnus}>
        <h1>Recording Entry</h1>
        <form onSubmit={handleSubmit}>
          <label>Select Folder:</label>
          {/* @ts-ignore */}
          <input type="file" webkitdirectory="true" onChange={handleFileChange} />

          <label>Select Deployment:</label>
          <select
            value={deploymentId}
            onChange={(e) => setDeploymentId(Number(e.target.value))}
          >
            <option value={0}>Unselected</option>
            {deployments.map((d) => (
              <option key={d.deploymentId} value={d.deploymentId}>
                {`Deployment ${d.deploymentId} - ${d.note}`}
              </option>
            ))}
          </select>


          <label>Optional: Drive Label, if external hard drive</label>
          <input value={driveLabel} onChange={(e) => setDriveLabel(e.target.value)} placeholder="Leave blank for local" />

          <div>
            <button type="submit" disabled={loading}>Enter</button>
            <button type="button" onClick={toEntryForm}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  function DatabasesPage() {
    if (!databases) {
      return null;
    }
    const [loading, setLoading] = useState(false);
    const [databaseList, setDatabaseList] = useState([]);
    const [showNewDatabaseForm, setShowNewDatabaseForm] = useState(false);
    const [newDatabaseName, setNewDatabaseName] = useState('');
    const [editingDatabase, setEditingDatabase] = useState(null);
    const [editDatabaseName, setEditDatabaseName] = useState('');
    const [selectedDatabase, setSelectedDatabase] = useState(localStorage.getItem('databasePath') || './pyrenoteDeskDatabase.db');

    useEffect(() => {
      loadDatabases();
    }, [databases]);

    const loadDatabases = async () => {
      try {
        const dbs = await window.ipc.invoke('listDatabases');
        setDatabaseList(dbs);
      } catch (err) {
        console.error('Failed to load databases:', err);
        alert('Failed to load databases: ' + (err?.message || err));
      }
    };

    const handleSelectDatabase = async (db) => {
      try {
        const result = await window.ipc.invoke('set-db-path', db.filepath);
        if (result.success) {
          localStorage.setItem('databasePath', db.filepath); //maybe don't need to save to local storage every time? Only on app close.
          setSelectedDatabase(db.filepath);
          alert(`Selected database: ${db.Country}`);
          
        } else {
          alert('Error selecting database: ' + result.error);
        }
      } catch (error) {
        alert('Error selecting database: ' + error);
      }
    };

    const handleCreateDatabase = async () => {
      if (!newDatabaseName.trim()) {
        alert('Please enter a database name');
        return;
      }

      setLoading(true);
      try {
        const result = await window.ipc.invoke('create-new-database', {
          name: newDatabaseName.trim(),
          filepath: `./databases/${newDatabaseName.trim().toLowerCase().replace(/\s+/g, '_')}.db`
        });

        if (result.success) {
          await loadDatabases();
          setNewDatabaseName('');
          setShowNewDatabaseForm(false);
        } else {
          alert('Failed to create database: ' + result.error);
        }
      } catch (error) {
        alert('Error creating database: ' + error);
      } finally {
        setLoading(false);
      }
    };

    const handleDeleteDatabase = async (db) => {
      if (db.filepath === selectedDatabase) {
        alert('Cannot delete selected database. Please select another database before deleting');
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
          await loadDatabases();
        } else {
          alert('Failed to delete database: ' + result.error);
        }
      } catch (error) {
        alert('Error deleting database: ' + error);
      }
    };

    const handleEditDatabase = async () => {
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
          await loadDatabases();
          setEditingDatabase(null);
          setEditDatabaseName('');
        } else {
          alert('Failed to edit database: ' + result.error);
        }
      } catch (error) {
        alert('Error editing database: ' + error);
      }
    };

    return (
      <div className={styles.magnus}>
        <h1>View and Edit Databases</h1>
          <h2>Available Databases</h2>
          <button 
            type="button" 
            onClick={() => setShowNewDatabaseForm(!showNewDatabaseForm)}
          >
            {showNewDatabaseForm ? 'Cancel' : 'Add New Database'}
          </button>

          {showNewDatabaseForm && (
            <div>
              <label>New Database Name: </label>
              <input
                type="text"
                value={newDatabaseName}
                onChange={(e) => setNewDatabaseName(e.target.value)}
                placeholder="Enter database name"
              />
              <button
                type="button"
                onClick={handleCreateDatabase}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Database'}
              </button>
            </div>
          )}

          {databaseList.length === 0 ? (
            <p>No databases found</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {databaseList.map((db) => (
                <li key={db.ID}>
                  <div>
                    {/* if editing this database, replace name with textbox for new name */}
                    {editingDatabase && editingDatabase.ID === db.ID ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={editDatabaseName}
                          onChange={(e) => setEditDatabaseName(e.target.value)}
                          placeholder="Enter new name"
                        />
                        <button
                          type="button"
                          onClick={handleEditDatabase}
                          style={{
                            width: 100
                          }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDatabase(null);
                            setEditDatabaseName('');
                          }}
                          style={{
                            width: 100
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <strong>{db.Country}</strong>
                    )}
                    <small>{db.filepath}</small>
                    {selectedDatabase === db.filepath && (
                      <span style={{ color: 'green'}}>✓ Currently Selected</span>
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => handleSelectDatabase(db)}
                      style={{ 
                        backgroundColor: selectedDatabase === db.filepath ? 'green' : 'blue',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {selectedDatabase === db.filepath ? 'Selected' : 'Select'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDatabase(db);
                        setEditDatabaseName(db.Country);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDatabase(db)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={toEntryForm}>Back</button>
        </div>
    );
  }

  function AnalyticsPage() {
    if (!analyticsPage) {
      return null;
    }
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [option, setOption] = useState<"species" | "unlabeled">("species");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    // analytics config
    // NOTE: any new analytics query just needs to be added to this
    // optionMap and will be automatically added to the dropdown
    const optionMap = {
      species: {
        label: "Model Accuracy by Species",
        fetchFn: (p: { limit: number; offset: number }) => (window as any).api.listModelAccuracyBySpecies(p),
      },
      unlabeled: {
        label: "List Unlabeled Recordings",
        fetchFn: (p: { limit: number; offset: number }) => (window as any).api.listUnlabeledRecordings(p),
      },
    } as const;
    type OptionKey = keyof typeof optionMap;

    const fetchData = async (selected: OptionKey) => {
      try {
        setLoading(true);
        const offset = (page - 1) * pageSize;
        const { rows: fetchedRows, total: fetchedTotal } = await optionMap[selected].fetchFn({ limit: pageSize, offset });
        setRows(fetchedRows);
        setTotal(fetchedTotal ?? fetchedRows.length);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchData(option as OptionKey);
    }, [option, page, pageSize]);

    useEffect(() => {
      // reset page to 1 when changing option
      setPage(1);
    }, [option]);
    
    return (
      <div className={styles.magnus}>
        <h1>Analytics</h1>        
          {/* Analytics Options Dropdown */}
          <div className="mb-4">
            <label htmlFor="analytics-select" className="block text-sm mb-2">
              Select Analytics View:
            </label>
            <select 
              id="analytics-select"
              className="px-3 py-2 rounded-md"
              value={option}
              onChange={(e) => setOption(e.target.value as any)}
            >
              // options are generated automatically from the optionMap up above
              {Object.entries(optionMap).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Analytics Table */}
          {/* loading */}
          {loading && <p>Loading data...</p>}
          {/* error */}
          {error && <p className="text-red-500">Error: {error}</p>}
          {/* display */}
          {!loading && !error && rows.length > 0 && (
            <table className="border-collapse mt-5 bg-white rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                {Object.keys(rows[0]).map((columnName) => (
                  <th key={columnName} className="px-4 py-2 text-left">{columnName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => ( 
                <tr key={rowIndex} className="hover:bg-gray-50"> {/* better to use sql primary key as key. However, diff queries use this same generic table. Have to find a way for React to find the primary key automatically. */}
                  {Object.values(row).map((value, colIndex) => (
                    <td key={colIndex} className="px-4 py-3 border-b border-gray-200 text-gray-700 text-sm">
                    {(() => {
                      if (typeof value === "number") {
                        if (Number.isInteger(value)) {
                          return value;
                        }
                        return value.toFixed(2);
                      }
                      return String(value);
                    })()}
                  </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          )}
          {/* pagination controls */}
          {!loading && !error && total > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <div className="w-1 flex items-center">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  type="button"
                >
                  First
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  type="button"
                >
                  Prev
                </button>
                <span className="text-sm">
                  Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(total / pageSize)), p + 1))}
                  disabled={page >= Math.ceil(total / pageSize)}
                  type="button"
                >
                  Next
                </button>
                <button
                  onClick={() => setPage(Math.max(1, Math.ceil(total / pageSize)))}
                  disabled={page >= Math.ceil(total / pageSize)}
                  type="button"
                >
                  Last
                </button>
                <span className="text-sm">
                  Showing {(total === 0) ? 0 : (page - 1) * pageSize + 1}
                  –{Math.min(page * pageSize, total)} of {total}
                </span>
              </div>
            </div>
          )}
          {/* no data */}
          {!loading && !error && rows.length === 0 && (
            <p>No data available</p>
          )}
        
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
          <DatabasesPage />
          <AnalyticsPage />
          <EntryHomepage />
          <RecorderEntryPage />
          <SurveyEntryPage />
          <SiteEntryPage />
          <DeploymentEntryPage />
          <RecordingEntryPage />
          <SpeciesEntryPage />
        </div>
      </div>

    </React.Fragment>
  );
}