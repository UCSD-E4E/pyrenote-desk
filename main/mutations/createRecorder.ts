import { Recorder } from "../schema";
import { getDatabase } from "../background";

type CreateRecorderParams = {
  brand: string;
  model: string;
  serialnbr: string;
  code: string;
  purchase_date: string;
};

const createRecorder = async (params: CreateRecorderParams) => {
  const {
    brand,
    model,
    serialnbr,
    code,
    purchase_date
  } = params;

  const db = getDatabase();
  const statement = db.prepare(`
    INSERT INTO Recorder (brand, model, serialnbr, code, purchase_date)
    VALUES (@brand, @model, @serialnbr, @code, @purchase_date)
    RETURNING *
  `);

  try {
    const row = statement.get({
      brand: String(brand),
      model: String(model),
      serialnbr: String(serialnbr),
      code: String(code),
      purchase_date: String(purchase_date),
    });
    console.log("Inserted row:", row);
    return row;
  } catch (e) {
    console.error("Error inserting recorder:", e);
    throw e;
  }
};

export default createRecorder;
