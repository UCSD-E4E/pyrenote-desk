import { IpcMainInvokeEvent } from "electron";
import { getDatabase } from "../background";
import { Annotation } from "../schema";

const listAnnotationsByRecordingId = async (
  _event: IpcMainInvokeEvent,
  recordingId: string,
): Promise<Annotation[]> => {
  const db = getDatabase();
  const statement = db.prepare<string, Annotation>(`
    SELECT * FROM annotation
    WHERE recordingId = ?
  `);
  try {
    const rows = statement.all(recordingId);
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed listing annotations by recordingId", e);
  }
  return Promise.resolve([]);
};

export default listAnnotationsByRecordingId;
