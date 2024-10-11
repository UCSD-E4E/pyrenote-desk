import { IpcHandler } from '../main/preload'

declare global {
  interface Window {
    ipc: IpcHandler; 
    //added to enable you to "expose" runQuery function so that the renderer can call it
    api: {
      runQuery: (query: string, params?: any[]) => Promise<any>;  
    };
  }
}
