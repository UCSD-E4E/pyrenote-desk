import { Statement } from "better-sqlite3";
import { getDatabase } from "../background";
import { Recording } from "../schema";

const listUnlabeledRecordings = async (): Promise<Recording[]> => {
  const db = getDatabase();

  const statement: Statement<[], Recording> = db.prepare<[], Recording>(`
    SELECT r.*
    FROM recording r
    WHERE NOT EXISTS (
      SELECT 1
      FROM regionOfInterest roi
      JOIN annotation a ON roi.regionId = a.regionId
      WHERE roi.recordingId = r.recordingId
    )
  `);

  try {
    const rows = statement.all();
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed to list unlabeled recordings", e);
  }
  return Promise.resolve([]);
};

export default listUnlabeledRecordings;
