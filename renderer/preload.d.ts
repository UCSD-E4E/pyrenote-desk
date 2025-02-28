import { IpcHandler } from '../main/preload'

declare global {
  interface Window {
    ipc: IpcHandler
    api: {
      runScript: (input: string) => Promise<string>;
      runQuery: (query: string, params: any) => Promise<any>;
    }
  }
}
