import { IpcMainInvokeEvent } from "electron";
import { getDatabase } from "../background";
import { Recording } from "../schema";

const listRecordings = async (
  _event: IpcMainInvokeEvent,
): Promise<Recording[]> => {
  const db = getDatabase();
  const statement = db.prepare<never[], Recording>(`
    SELECT * FROM recording
  `);
  const rows = statement.all();
  return Promise.resolve(rows);
};

export default listRecordings;
