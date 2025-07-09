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
  const [speciesPage, setSpeciesPage] = useState(false);
  const [databases, setDatabases] = useState(false);

  function toEntryForm() {
    setEntry(true);
    setRecorder(false);
    setSurvey(false);
    setSite(false);
    setDeployment(false);
    setRecording(false);
    setSpeciesPage(false);
    setDatabases(false);
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

  function EntryHomepage() {
    if (!entry) {
      return null;
    }
    return (
      <div className={styles.magnus}>
        <h1>Database Page</h1>
        {/* uncomment to show current db in page */}
        {/* <p style={{ color: 'red' }}>Current Database Path: {localStorage.getItem('databasePath')}</p> */}
        <button onClick={toDatabasesForm}>View and Edit Databases</button>
        <button onClick={toRecorderForm}>Add Recorder</button>
        <button onClick={toSurveyForm}>Add Survey</button>
        <button onClick={toSiteForm}>Add Site</button>
        <button onClick={toDeploymentForm}>Add Deployment</button>
        <button onClick={toRecordingForm}>Add Recordings</button>
        <button onClick={toSpeciesForm}>Add Species</button>
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
        <div>
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

          {editingDatabase && (
            <div>
              <label>Edit Database Name: </label>
              <input
                type="text"
                value={editDatabaseName}
                onChange={(e) => setEditDatabaseName(e.target.value)}
                placeholder="Enter new name"
              />
              <button
                type="button"
                onClick={handleEditDatabase}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingDatabase(null);
                  setEditDatabaseName('');
                }}
              >
                Cancel
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
                    <strong>{db.Country}</strong>
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