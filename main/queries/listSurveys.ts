import { getDatabase } from "../background";
import { Survey } from "../schema";

const listSurveys = async (): Promise<Survey[]> => {
  const db = getDatabase();
  const statement = db.prepare<never[], Survey>(`
    SELECT * FROM survey
  `);
  try {
    const rows = statement.all();
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed listing surveys", e);
  }
  return Promise.resolve([]);
};

export default listSurveys;
