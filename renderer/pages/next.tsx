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
  const [databases, setDatabases] = useState(false);

  function toEntryForm() {
    setEntry(true);
    setRecorder(false);
    setSurvey(false);
    setSite(false);
    setDeployment(false);
    setRecording(false);
    setTest(false);
    setDatabases(false);
  }

  function toTestForm() {
    setEntry(false);
    setTest(true);
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
        <p style={{ color: 'red' }}>Current Database Path: {localStorage.getItem('databasePath')}</p>
        <button onClick={toDatabasesForm}>View and Edit Databases</button>
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
        await window.ipc.invoke('set-db-path', db.filepath);
        localStorage.setItem('databasePath', db.filepath);
        setSelectedDatabase(db.filepath);
        alert(`Selected database: ${db.Country}`);
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
            style={{ marginBottom: '10px' }}
          >
            {showNewDatabaseForm ? 'Cancel' : 'Add New Database'}
          </button>

          {showNewDatabaseForm && (
            <div style={{ marginBottom: '20px' }}>
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
                onClick={handleCreateDatabase}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Database'}
              </button>
            </div>
          )}

          {editingDatabase && (
            <div style={{ marginBottom: '20px' }}>
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
                style={{ marginLeft: '10px' }}
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
                <li key={db.ID} style={{ 
                  marginBottom: '10px', 
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong>{db.Country}</strong>
                    <small style={{ display: 'block', color: '#666' }}>{db.filepath}</small>
                    {selectedDatabase === db.filepath && (
                      <span style={{ color: 'green', fontSize: '0.9em' }}>✓ Currently Selected</span>
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => handleSelectDatabase(db)}
                      style={{ 
                        marginRight: '10px',
                        backgroundColor: selectedDatabase === db.filepath ? '#4CAF50' : '#2196F3',
                        color: 'white',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '3px',
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
                      style={{ marginRight: '10px' }}
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
          <TestPage />
        </div>
      </div>

    </React.Fragment>
  );
}