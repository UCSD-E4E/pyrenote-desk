import React, { useState, useRef, useEffect, useCallback } from "react";
import Head from "next/head";
import Image from "next/image";
import styles from "./recordingFilter.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onImport: (recordings: any[], skippedCount) => void;
};

export default function RecordingFilter({
    open,
    onClose,
    onImport,
    }: Props) {

    const [siteList, setSiteList] = useState([]);
    const [recorderList, setRecorderList] = useState([]);
    const [deploymentList, setDeploymentList] = useState([]);
    const [surveyList, setSurveyList] = useState([]);
    const [speciesList, setspeciesList] = useState([]);
    const verificationList = ["YES", "NO", "UNVERIFIED"]

    const [selectedSites, setSelectedSites] = useState([]);
    const [selectedRecorders, setSelectedRecorders] = useState([]);
    const [selectedDeployments, setSelectedDeployments] = useState([]);
    const [selectedSurveys, setSelectedSurveys] = useState([]);
    const [selectedSpecies, setSelectedSpecies] = useState([]);
    const [selectedVerifications, setSelectedVerifications] = useState([]);


    useEffect(() => {

        const fetchData = async () => {
        const sites = await window.api.listSites();
        const recorders = await window.api.listRecorders();
        const deployments = await window.ipc.invoke("listDeployments");
        const surveys = await window.api.listSurveys();
        const species = await window.api.listSpecies();

        setSiteList(sites);
        setRecorderList(recorders);
        setDeploymentList(deployments);
        setSurveyList(surveys);
        setspeciesList(species);
        }

        fetchData();
    }, [open]);


    if (!open) {
        return null;
    }

    return (
        <div className={styles.modalParent}>
        <section className={styles.selectPopup}>
            <h1>Select Recordings</h1>
            <p>Filter by:</p>
            <details>
            <summary>Recorders</summary>
            {recorderList.map((recorder) => (
                <div key={recorder.recorderId}>
                <input type="checkbox" onChange={(e) => {
                    if (e.target.checked) {
                    setSelectedRecorders([...selectedRecorders, recorder.recorderId]);
                    } else {
                    setSelectedRecorders(selectedRecorders.filter(val => val != recorder.recorderId));
                    }
                }}/>
                <label>Recorder {recorder.code}</label>
                <br />
                </div>
            ))}
            </details>
            <details>
            <summary>Surveys</summary>
            {surveyList.map((survey) => (
                <div key={survey.surveyId}>
                <input type="checkbox" onChange={(e) => {
                    if (e.target.checked) {
                    setSelectedSurveys([...selectedSurveys, survey.surveyId]);
                    } else {
                    setSelectedSurveys(selectedSurveys.filter(val => val != survey.surveyId));
                    }
                }}/>
                <label>{survey.surveyname}</label>
                <br />
                </div>
            ))}
            </details>
            <details>
            <summary>Sites</summary>
            {siteList.map((site) => (
                <div key={site.siteId}>
                <input type="checkbox" onChange={(e) => {
                    if (e.target.checked) {
                    setSelectedSites([...selectedSites, site.siteId]);
                    } else {
                    setSelectedSites(selectedSites.filter(val => val != site.siteId));
                    }
                }}/>
                <label>{site.site_code}</label>
                <br />
                </div>
            ))}
            </details>
            <details>
            <summary>Deployments</summary>
            {deploymentList.map((deployment) => (
                <div key={deployment.deploymentId}>
                <input type="checkbox" onChange={(e) => {
                    if (e.target.checked) {
                    setSelectedDeployments([...selectedDeployments, deployment.deploymentId]);
                    } else {
                    setSelectedDeployments(selectedDeployments.filter(val => val != deployment.deploymentId));
                    }
                }}/>
                <label>{deployment.deploymentId} - {deployment.note}</label>
                <br />
                </div>
            ))}
            </details>
            <details>
            <summary>Species</summary>
            {speciesList.map((species) => (
            <div key={species.speciesId}>
                <input type="checkbox" onChange={(e) => {
                    if (e.target.checked) {
                    setSelectedSpecies([...selectedSpecies, species.speciesId]);
                    } else {
                    setSelectedDeployments(selectedSpecies.filter(val => val != species.speciesId));
                    }
                }}/>
                <label>{species.common} ({species.species})</label>
            </div>
            ))}
            </details>
            <details>
            <summary>Verification</summary>
            {verificationList.map((verification) => (
            <div key={verification}>
                <input type="checkbox" onChange={(e) => {
                if (e.target.checked) {
                    setSelectedVerifications([...selectedVerifications, verification]);
                } else {
                    setSelectedVerifications(selectedVerifications.filter(val => val != verification));
                }
                }}/>
                <label>{verification}</label>
            </div>
            ))}
            </details>
            <br />
            <button onClick={ async () => {
                onClose();
                let filter = {
                    deployments: selectedDeployments,
                    sites: selectedSites,
                    recorders: selectedRecorders,
                    surveys: selectedSurveys,
                    species: selectedSpecies,
                    verifications: selectedVerifications
                };
                const result = await window.api.listRecordingsByFilters(filter);
                if (result != null) {
                    onImport(result.recordings, result.skippedCount);
                }
            }}>Import Selected</button>
            <button onClick={async () => {
            onClose();
            const recordings = await window.api.listRecordings();
            onImport(recordings, 0);
            }}>Import All</button>
            <button onClick={onClose}>Cancel</button>
        </section>
            </div>
        );
    }