import { IpcHandler } from '../main/preload'

declare global {
  interface Window {
    ipc: IpcHandler
    api: {
      runQuery: (query: string, params?: any[]) => Promise<any>;  
      runScript: () => Promise<any>;
    };
  }
}
