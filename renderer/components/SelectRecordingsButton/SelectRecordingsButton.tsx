import { useEffect, useState } from "react";

import styles from './SelectRecordingsButton.module.css';

interface SelectRecordingsProps {
	importFromDB: (recordings: any[], skippedCount?: number) => void;
}

export function SelectRecordingsButton({importFromDB}: SelectRecordingsProps) {
	const [modalEnable, setModalEnable] = useState(false);

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
		if (!modalEnable) {
			return;
		}

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
	}, [modalEnable]);

	return (
		<>
			<button onClick={() => setModalEnable(prev => !prev)}>Select Recordings</button>
			{modalEnable &&
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
											setSelectedRecorders(prev => [...prev, recorder.recorderId]);
										} else {
											setSelectedRecorders(prev => prev.filter(val => val != recorder.recorderId));
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
											setSelectedSurveys(prev => [...prev, survey.surveyId]);
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
											setSelectedSites(prev => [...prev, site.siteId]);
										} else {
											setSelectedSites(prev => prev.filter(val => val != site.siteId));
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
											setSelectedDeployments(prev => [...prev, deployment.deploymentId]);
										} else {
											setSelectedDeployments(prev => prev.filter(val => val != deployment.deploymentId));
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
												setSelectedSpecies(prev => [...prev, species.speciesId]);
											} else {
												setSelectedSpecies(prev => prev.filter(val => val != species.speciesId));
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
											setSelectedVerifications(prev => [...prev, verification]);
										} else {
											setSelectedVerifications(prev => prev.filter(val => val != verification));
										}
									}}/>
									<label>{verification}</label>
								</div>
							))}
						</details>
						<br />
						<button onClick={ async () => {
							setModalEnable(prev => !prev);
							const result = await window.api.listRecordingsByFilters({
								deployments: selectedDeployments,
								sites: selectedSites,
								recorders: selectedRecorders,
								surveys: selectedSurveys,
								species: selectedSpecies,
								verifications: selectedVerifications
							});
							importFromDB(result.recordings, result.skippedCount);
						}}>Import Selected</button>
							<button onClick={async () => {
								setModalEnable(prev => !prev);
								const recordings = await window.api.listRecordings();
								importFromDB(recordings);
							}}>Import All</button>
						<button onClick={() => setModalEnable(false)}>Cancel</button>
					</section>
				</div>
			}
		</>
	);
}