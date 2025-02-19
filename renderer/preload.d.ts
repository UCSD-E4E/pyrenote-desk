import { IpcHandler } from "../main/preload";

declare global {
  interface Window {
    ipc: IpcHandler;
    api: {
      listRecordingsByDeploymentId: (deploymentId: string) => Promise<string>;
      runScript: () => Promise<any>;
    };
  }
}
