import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

const exposedQueries: QueriesApi = {
  listRecordingsByDeploymentId: (deploymentId) =>
    ipcRenderer.invoke("listRecordingsByDeploymentId", deploymentId),
  listRecordings: () => ipcRenderer.invoke("listRecordings"),
  listRecordingsBySiteId: (siteId) =>
    ipcRenderer.invoke("listRecordingsBySiteId", siteId),
  listAnnotationsByRegionId: (regionId) =>
    ipcRenderer.invoke("listAnnotationsByRegionId", regionId),
};

const exposedMutations: MutationsApi = {
  createAnnotation: (
    recordingId: number,
    labelerId: number,
    regionId: number,
    speciesId: number,
    speciesProbability: number,
  ) =>
    ipcRenderer.invoke(
      "createAnnotation",
      recordingId,
      labelerId,
      regionId,
      speciesId,
      speciesProbability,
    ),
  updateAnnotation: (annotationId, speciesId, speciesProbability) =>
    ipcRenderer.invoke(
      "createAnnotation",
      annotationId,
      speciesId,
      speciesProbability,
    ),
};

contextBridge.exposeInMainWorld("api", {
  ...exposedQueries,
  ...exposedMutations,
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
