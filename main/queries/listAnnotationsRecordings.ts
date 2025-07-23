import { getDatabase } from "../background";
import { Recording, RecordingWithData } from "../schema";
import fs from "fs";

const listAnnotationsRecordings = async (): Promise<RecordingWithData[]> => {
  const db = getDatabase();
  const statement = db.prepare<never[], Recording>(`
    SELECT * FROM Recording
    WHERE recordingId IN (SELECT DISTINCT recordingId FROM RegionOfInterest)
  `);
  try {
    const rows = statement.all();
    console.log("rows are", rows )
    // NOTE: Not sure if this would work for super large audio files
    const rowsWithData: RecordingWithData[] = rows.map((r) => ({
      ...r,
      fileData: new Uint8Array(fs.readFileSync(r.url)),
    }));
    return Promise.resolve(rowsWithData);
  } catch (e) {
    console.log("Error: failed listing recordings", e);
  }
  return Promise.resolve([]);
};

export default listAnnotationsRecordings;
