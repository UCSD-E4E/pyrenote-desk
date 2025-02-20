import { IpcMainInvokeEvent } from "electron";
import { Annotation } from "../schema";
import { getDatabase } from "../background";

const createAnnotation = async (
  _event: IpcMainInvokeEvent,
  recordingId: string,
  labelerId: string,
): Promise<Annotation | undefined> => {
  const db = getDatabase();
  // TODO: finish this mutation
  const statement = db.prepare<string[], Annotation>(`
    INSERT INTO annotation
    VALUES ()
  `);
  try {
    const rows = statement.get(recordingId, labelerId)!;
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed to create annotation", e);
  }
};

export default createAnnotation;
