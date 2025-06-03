import { Recording } from "../schema";
import { getDatabase } from "../background";

type CreateParams = {
  deploymentId: number;
  filename: string;
  url: string;
  datetime: string;
  duration: number;
  samplerate: number;
  bitrate: number;
};

export const createRecording = async (
  deploymentId: number,
  filename: string,
  url: string,
  datetime: string,
  duration: number,
  samplerate: number,
  bitrate: number,
): Promise<Recording | undefined> => {
  const db = getDatabase();
  // TODO: test this mutation
  const statement = db.prepare<CreateParams, Recording>(`
    INSERT INTO recording (deploymentId, filename, url, datetime, duration, samplerate, bitrate)
    VALUES (@deploymentId, @filename, @url, @datetime, @duration, @samplerate, @bitrate)
    RETURNING * 
  `);
  try {
    const rows = statement.get({
      deploymentId,
      filename,
      url,
      datetime,
      duration,
      samplerate,
      bitrate,
    })!;
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed to create recording", e);
  }
};

type DeleteParams = {
  recordingId: number;
};

export const deleteRecording = async (
  recordingId: number,
): Promise<Recording | undefined> => {
  const db = getDatabase();
  // TODO: test this mutation
  const statement = db.prepare<DeleteParams, Recording>(`
    DELETE FROM recording 
    WHERE recordingId = @recordingId
    RETURNING * 
  `);
  try {
    const rows = statement.get({
      recordingId,
    })!;
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed to delete recording", e);
  }
};

type UpdateParams = {
  recordingId: number;
  deploymentId: number;
  filename: string;
  url: string;
  datetime: string;
  duration: number;
  samplerate: number;
  bitrate: number;
};

export const updateRecording = async (
  recordingId: number,
  deploymentId: number,
  filename: string,
  url: string,
  datetime: string,
  duration: number,
  samplerate: number,
  bitrate: number,
): Promise<Recording | undefined> => {
  const db = getDatabase();
  // TODO: test this mutation
  const statement = db.prepare<UpdateParams, Recording>(`
    UPDATE Recording
    SET 
      deploymentId = @deploymentId,
      filename = @filename,
      url = @url,
      datetime = @datetime,
      duration = @duration,
      samplerate = @samplerate,
      bitrate = @bitrate
      WHERE recordingId = @recordingId
    RETURNING * 
  `);
  try {
    const rows = statement.get({
      recordingId,
      deploymentId,
      filename,
      url,
      datetime,
      duration,
      samplerate,
      bitrate,
    })!;
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed to update recording", e);
  }
};
