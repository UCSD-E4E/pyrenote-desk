import { Statement } from "better-sqlite3";
import { getDatabase } from "../background";
import { Recording } from "../schema";

const listRecordingsLabeledByModelId = async (modelId: number): Promise<Recording[]> => {
  const db = getDatabase();

  const statement: Statement<[number], Recording> = db.prepare(`
    SELECT DISTINCT r.*
    FROM Recording r
    JOIN RegionOfInterest roi ON roi.recordingId = r.recordingId
    JOIN Annotation a ON a.regionId = roi.regionId
    
    JOIN Labeler l ON l.labelerId = a.labelerId
    WHERE l.modelId = ? AND l.isHuman = 0
  `);

  try {
    const rows = statement.all(modelId);
    return Promise.resolve(rows);
  } catch (e) {
    console.log(`Error: failed to list recordings labeled by model ${modelId}`, e);
  }
  return Promise.resolve([]);
};

export default listRecordingsLabeledByModelId;