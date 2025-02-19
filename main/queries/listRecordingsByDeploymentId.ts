import { IpcMainInvokeEvent } from "electron";
import { getDatabase } from "../background";
import { Recording } from "../schema";

const listRecordingsByDeploymentId = async (
  _event: IpcMainInvokeEvent,
  deploymentId: string,
): Promise<Recording[]> => {
  const db = getDatabase();
  const statement = db.prepare<string, Recording>(`
    SELECT * FROM recording
    WHERE deploymentId = ?
  `);
  const rows = statement.all(deploymentId);
  return Promise.resolve(rows);
};

export default listRecordingsByDeploymentId;
