import { getDatabase } from "../background";
import { Recording } from "../schema";

const listRecordingsBySiteId = async (siteId: number): Promise<Recording[]> => {
  const db = getDatabase();
  const statement = db.prepare<number, Recording>(`
    SELECT recordingId, deploymentId, url, directory, datetime, duration, samplerate, bitrate FROM recording
    NATURAL JOIN deployment
    NATURAL JOIN site
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
