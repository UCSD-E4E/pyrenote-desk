import { IpcHandler } from "../main/preload";

declare global {
  type QueriesApi = {
    listRecordingsByDeploymentId: (deploymentId: string) => Promise<string>;
  };
  type ScriptApi = {
    runScript: () => Promise<string>;
  };
  type WindowApi = QueriesApi & ScriptApi;
  interface Window {
    ipc: IpcHandler;
    api: WindowApi;
  }
}
