import { IpcHandler } from "../main/preload";

declare global {
  // TODO: Put all database types here as well?
  type QueriesApi = import("../main/queries").QueriesApi;
  type MutationsApi = import("../main/mutations").MutationsApi;
  type ScriptApi = {
    runScript: () => Promise<string>;
  };
  type WindowApi = QueriesApi & ScriptApi;
  interface Window {
    ipc: IpcHandler;
    api: WindowApi;
  }
}
