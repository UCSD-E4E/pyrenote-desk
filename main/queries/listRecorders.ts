import { getDatabase } from "../background";
import { Recorder } from "../schema";

const listRecorders = async (): Promise<Recorder[]> => {
  const db = getDatabase();

  const statement = db.prepare<never[], Recorder>(`
    SELECT recorderId, brand, model, serialnbr, code, purchase_date FROM Recorder
  `);

  try {
    const rows = statement.all();
    console.log("Recorders:", rows);
    return rows;
  } catch (e) {
    console.error("Error: failed listing recorders", e);
    return [];
  }
};

export default listRecorders;
