import { Statement } from "better-sqlite3";
import { getDatabase } from "../background";
import { Recording } from "../schema";

const listRecordingsLabeledByModel = async (): Promise<Recording[]> => {
  const db = getDatabase();

  const statement: Statement<[], Recording> = db.prepare(`
    SELECT DISTINCT r.*
    FROM recording r
    JOIN regionOfInterest roi ON roi.recordingId = r.recordingId
    JOIN annotation a ON a.regionId = roi.regionId
    JOIN labeler l ON l.labelerId = a.labelerId
    WHERE l.isHuman = 0
  `);

  try {
    const rows = statement.all();
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed to list recordings labeled by a model", e);
  }
  return Promise.resolve([]);
};

export default listRecordingsLabeledByModel;
