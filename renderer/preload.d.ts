import { IpcHandler } from "../main/preload";

declare global {
  type QueriesApi = import("../main/queries").QueriesApi;
  type MutationsApi = import("../main/mutations").MutationsApi;
  type ScriptApi = {
    runScript: () => Promise<string>;
  };
  type WindowApi = QueriesApi & MutationsApi & ScriptApi;
  interface Window {
    ipc: IpcHandler;
    api: WindowApi;
  }
}
