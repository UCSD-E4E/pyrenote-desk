import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

function invokeQuery<C extends keyof QueriesApi>(
  channel: C,
  ...args: Parameters<QueriesApi[C]>
): ReturnType<QueriesApi[C]> {
  return ipcRenderer.invoke(channel, ...args) as ReturnType<QueriesApi[C]>;
}

function invokeMutation<C extends keyof MutationsApi>(
  channel: C,
  ...args: Parameters<MutationsApi[C]>
): ReturnType<MutationsApi[C]> {
  return ipcRenderer.invoke(channel, ...args) as ReturnType<MutationsApi[C]>;
}

const exposedQueries: QueriesApi = {
  listRecordingsByDeploymentId: (deploymentId) =>
    invokeQuery("listRecordingsByDeploymentId", deploymentId),
  listRecordings: () => invokeQuery("listRecordings"),
  listRecordingsBySiteId: (siteId) =>
    invokeQuery("listRecordingsBySiteId", siteId),
  listAnnotationsByRegionId: (regionId) =>
    invokeQuery("listAnnotationsByRegionId", regionId),
};

const exposedMutations: MutationsApi = {
  createAnnotation: (
    recordingId: number,
    labelerId: number,
    regionId: number,
    speciesId: number,
    speciesProbability: number,
  ) =>
    invokeMutation(
      "createAnnotation",
      recordingId,
      labelerId,
      regionId,
      speciesId,
      speciesProbability,
    ),
  updateAnnotation: (annotationId, speciesId, speciesProbability) =>
    invokeMutation(
      "updateAnnotation",
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
