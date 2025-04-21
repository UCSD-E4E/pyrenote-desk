import { getDatabase } from "../background";
import { Recording } from "../schema";

const listRecordings = async (): Promise<Recording[]> => {
  const db = getDatabase();
  const statement = db.prepare<never[], Recording>(`
    SELECT * FROM recording
  `);
  try {
    const rows = statement.all();
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed listing recordings", e);
  }
  return Promise.resolve([]);
};

export default listRecordings;
