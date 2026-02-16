import { getDatabase } from "../background";
import { Model } from "../schema";

const listModels = async (): Promise<Model[]> => {
  const db = getDatabase();
  
  const statement = db.prepare<never[], Model>(`
    SELECT * FROM Model
  `);
  
  try {
    const rows = statement.all();
    return rows;
  } catch (e) {
    console.error("Error: failed listing models", e);
    return [];
  }
};

export default listModels;