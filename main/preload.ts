import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

const exposedQueries: QueriesApi = {
  listRecordingsByDeploymentId: (deploymentId: string) =>
    ipcRenderer.invoke("listRecordingsByDeploymentId", deploymentId),
};

contextBridge.exposeInMainWorld("api", {
  ...exposedQueries,
  runScript: () => ipcRenderer.invoke("run-script"),
});

const handler = {
  send(channel: string, value: unknown) {
    ipcRenderer.send(channel, value);
  },
  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      callback(...args);
    ipcRenderer.on(channel, subscription);

    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
};

contextBridge.exposeInMainWorld("ipc", handler);

export type IpcHandler = typeof handler;
