import { ipcMain, IpcMainInvokeEvent, ipcRenderer } from "electron";
import { getDatabase } from "../background";

const queryName = "listRecordingsByDeploymentId";

const exposed = async (deploymentId: string) => {
  return ipcRenderer.invoke(queryName, deploymentId);
};

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

ipcMain.handle(queryName, listRecordingsByDeploymentId);

export default exposed;
