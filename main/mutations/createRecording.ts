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

const createRecording = async (
  deploymentId: number,
  filename: string,
  url: string,
  datetime: string,
  duration: number,
  samplerate: number,
  bitrate: number,
): Promise<Recording | undefined> => {
  const db = getDatabase();
  // TODO: finish this mutation
  const statement = db.prepare<CreateParams, Recording>(`
    INSERT INTO recording (deploymentId, filename, url, datetime, duration, samplerate, bitrate)
    VALUES (@deploymentId, @filename, @url, @datetime, @duration, @samplerate, @bitrate)
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

export default createRecording;
