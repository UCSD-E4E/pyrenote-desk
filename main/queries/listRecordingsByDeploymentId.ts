import { getDatabase } from "../background";
import { Recording } from "../schema";

const listRecordingsByDeploymentId = async (
  deploymentId: number,
): Promise<Recording[]> => {
  const db = getDatabase();
  const statement = db.prepare<number, Recording>(`
    SELECT * FROM recording
    WHERE deploymentId = ?
  `);
  try {
    const rows = statement.all(deploymentId);
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed listing recordings by deploymentId", e);
  }
  return Promise.resolve([]);
};

export default listRecordingsByDeploymentId;
