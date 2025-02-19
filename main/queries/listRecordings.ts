import { IpcMainInvokeEvent } from "electron";
import { getDatabase } from "../background";

const listRecordings = async (_event: IpcMainInvokeEvent) => {
  const db = getDatabase();
  const statement = db.prepare(`
    SELECT * FROM recording
  `);
  statement.run();
  return Promise.resolve();
};

export default listRecordings;
