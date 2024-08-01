import Head from 'next/head'
import Link from 'next/link'
import WaveSurfer from 'wavesurfer.js';
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram';
import Papa from 'papaparse';
import React, { useState, useEffect, ChangeEvent, MouseEvent } from 'react';
import utils from '../../main/helpers/utils'; 

const NUM_PER_PAGE = 5;

const NextPage: React.FC = () => {
  const [pageNum, setPageNum] = useState(0);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [wavesurferArray, setWavesurferArray] = useState<WaveSurfer[]>([]);
  const [filename, setFilename] = useState('');
  const [lastTime, setLastTime] = useState<number>(Date.now());

  useEffect(() => {
    const handleUploadSuccess = () => {
      const fileInput = document.getElementById('UploadFile') as HTMLInputElement;
      if (fileInput.files && fileInput.files[0]) {
        setFilename(fileInput.files[0].name);
        if (wavesurferArray.length !== 0) {
          setLastTime(Date.now());
          _downloadCSV();
        }

        utils.removeALL(wavesurferArray);
        setCsvData([]);
        setWavesurferArray([]);

        Papa.parse(fileInput.files[0], {
          download: true,
          header: true,
          skipEmptyLines: true,
          complete: handleCreatePage,
        });
      }
    };

    const uploadSuccessButton = document.getElementById('uploadsuccess');
    uploadSuccessButton?.addEventListener('click', handleUploadSuccess);

    return () => {
      uploadSuccessButton?.removeEventListener('click', handleUploadSuccess);
    };
  }, [wavesurferArray]);

  const handleCreatePage = (result: Papa.ParseResult<any>) => {
    let newWavesurferArray: WaveSurfer[] = [];
    let data = result.data;

    for (let i = 0; i < data.length; i++) {
      const rowData = data[i];
      if (!rowData.hasOwnProperty("VERIFY_ID")) {
        rowData["VERIFY_ID"] = "";
        rowData["USER_CONFIDENCE"] = "";
        rowData["TIME_TO_LABEL"] = 0;
        rowData["TIME_LAST_LABELED"] = "";
      }

      const wavesurferContainer = document.createElement("div");
      wavesurferContainer.id = `wavesurfer_${i}`;
      wavesurferContainer.classList.add("wavesurfer_container");
      wavesurferContainer.style.display = "none";
      const currentDiv = document.getElementById("wavesurfer_divs");
      currentDiv?.append(wavesurferContainer);

      if (i < NUM_PER_PAGE) {
        utils.addAudio(rowData, i, newWavesurferArray, WaveSurfer, Spectrogram);
      }

      newWavesurferArray.push(rowData);
    }

    setCsvData(newWavesurferArray);
  };

  const handleVerify = (e: ChangeEvent<HTMLInputElement>) => {
    const tempTime = Date.now();
    const totalTime = (tempTime - lastTime) / 1000;
    const id = Number(e.target.parentElement?.id.split("_")[2]);

    const updatedCsvData = [...csvData];
    updatedCsvData[id]["VERIFY_ID"] = e.target.value;
    updatedCsvData[id]["TIME_TO_LABEL"] += totalTime;
    updatedCsvData[id]["TIME_LAST_LABELED"] = new Date().toString();

    utils.changeBackground(e.target.parentElement?.parentElement as HTMLElement, e.target.value);
    setCsvData(updatedCsvData);
    setLastTime(tempTime);
  };

  const handlePage = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    let startIdx = 0;
    let endIdx = 0;

    if ((e.target as HTMLAnchorElement).classList.contains("next")) {
      startIdx = pageNum * NUM_PER_PAGE + NUM_PER_PAGE;
      endIdx = (pageNum + 1) * NUM_PER_PAGE + NUM_PER_PAGE;
      setPageNum(pageNum + 1);
    } else {
      startIdx = pageNum * NUM_PER_PAGE - NUM_PER_PAGE;
      endIdx = pageNum * NUM_PER_PAGE;
      setPageNum(pageNum - 1);
    }

    if (startIdx >= csvData.length) {
      alert("Congrats! No more next pages. Download your labeled data now!");
      return;
    } else if (startIdx < 0) {
      alert("No previous pages");
      return;
    }

    csvData.forEach((rowData, i) => {
      if (i >= startIdx && i < endIdx) {
        utils.addAudio(rowData, i, wavesurferArray, WaveSurfer, Spectrogram);
      } else {
        utils.removeAudio(i, wavesurferArray);
      }
    });
  };

  const _downloadCSV = () => {
    utils.downloadCSV(csvData, filename);
  };

  const handleConfidence = (e: ChangeEvent<HTMLInputElement>) => {
    const id = Number(e.target.parentElement?.id.split("_")[2]);
    const updatedCsvData = [...csvData];
    updatedCsvData[id]["USER_CONFIDENCE"] = e.target.value;
    setCsvData(updatedCsvData);
  };

  return (
    <React.Fragment>
      <head>
        <link rel="stylesheet" href="style.css" />
        <title>Labeling Page</title>
      </head>
      <Link href="/home">Go to home page</Link>

      <div className="header">
        <input type='file' id="UploadFile" accept=".csv" />
        <button id="uploadsuccess">file uploaded</button>
        <a href="#" className="previous round" onClick={handlePage}>&#8249;</a>
        <a href="#" className="next round" onClick={handlePage}>&#8250;</a>
        <button id="download" onClick={_downloadCSV}>download</button>
      </div>

      <div className="row_controls" id="original_form" style={{ display: 'none' }}>
        <button className="media_controls">Play/pause</button>
        <p>Verify Audio</p>
        <input
          className="radio"
          type="radio"
          id="exists"
          name="verification"
          value="PRESENT"
          onChange={handleVerify}
        />
        <label htmlFor="exists">Species Exists</label><br />
        <input
          className="radio"
          type="radio"
          id="nonexists"
          name="verification"
          value="ABSENT"
          onChange={handleVerify}
        />
        <label htmlFor="nonexists">Species Does Not Exist</label><br />
        <p>How confident are you in your decision</p>
        <p>left not very confident | right very confident</p>
        <input
          type="range"
          min="1"
          max="10"
          value="5"
          className="slider"
          id="confidence"
          style={{ width: '20em' }}
          onChange={handleConfidence}
        />
      </div>

      <div className="labeling_wrapper">
        <div id="wavesurfer_divs"></div>
      </div>
    </React.Fragment>
  );
};

export default NextPage;
