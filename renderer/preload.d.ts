import { IpcHandler } from "../main/preload";

declare global {
  // TODO: Put all database types here as well?
  type QueriesApi = {
    listRecordingsByDeploymentId: (deploymentId: string) => Promise<string>;
    listRecordings: () => Promise<void>;
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
