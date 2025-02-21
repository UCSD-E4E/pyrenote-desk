import { IpcMainInvokeEvent } from "electron";
import { getDatabase } from "../background";
import { Recording } from "../schema";

const listRecordingsBySiteId = async (
  _event: IpcMainInvokeEvent,
  siteId: string,
): Promise<Recording[]> => {
  const db = getDatabase();
  const statement = db.prepare<string, Recording>(`
    SELECT recordingId, deploymentId, filename, url, datetime, duration, samplerate, bitrate FROM recording
    NATURAL JOIN deployment
    NATURAL JOIN siteId
    WHERE siteId = ?
  `);
  try {
    const rows = statement.all(siteId);
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed listing recordings", e);
  }
  return Promise.resolve([]);
};

export default listRecordingsBySiteId;
