import { Statement } from "better-sqlite3";
import { getDatabase } from "../background";
import { Recording } from "../schema";

type QueryParams = {
  deploymentId: number;
};

const listUnlabeledRecordingsByDeploymentId = async (
  deploymentId: number,
): Promise<Recording[]> => {
  const db = getDatabase();

  const statement: Statement<QueryParams, Recording> = db.prepare(`
    SELECT r.*
    FROM recording r
    WHERE r.deploymentId = @deploymentId
      AND NOT EXISTS (
        SELECT 1
        FROM regionOfInterest roi
        JOIN annotation a ON roi.regionId = a.regionId
        WHERE roi.recordingId = r.recordingId
      )
  `);

  try {
    const rows = statement.all({ deploymentId });
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed to list unlabeled recordings by deploymentId", e);
  }
  return Promise.resolve([]);
};

export default listUnlabeledRecordingsByDeploymentId;
