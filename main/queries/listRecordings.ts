import { getDatabase } from "../background";
import { Recording } from "../schema";
import fs from "fs";

type RecordingWithData = Recording & { fileData: Uint8Array };
const listRecordings = async (): Promise<RecordingWithData[]> => {
  const db = getDatabase();
  const statement = db.prepare<never[], Recording>(`
    SELECT * FROM recording
  `);
  try {
    const rows = statement.all();
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

export default listRecordings;
