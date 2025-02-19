import { IpcMainInvokeEvent } from "electron";
import { getDatabase } from "../background";

const queryName = "listRecordingsByDeploymentId";

const listRecordingsByDeploymentId = async (
  _event: IpcMainInvokeEvent,
  deploymentId: string,
) => {
  const db = getDatabase();
  const statement = db.prepare(`
    SELECT * FROM recording
    WHERE deploymentId = ?
  `);
  statement.run(deploymentId);
  return Promise.resolve(deploymentId);
};

export default {
  query: listRecordingsByDeploymentId,
  queryName,
};
