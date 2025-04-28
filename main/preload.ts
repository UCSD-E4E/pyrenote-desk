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
  listSurveys: (...args) => invokeQuery("listSurveys", ...args),
  listRecordingsByDeploymentId: (...args) =>
    invokeQuery("listRecordingsByDeploymentId", ...args),
  listRecordings: (...args) => invokeQuery("listRecordings", ...args),
  listDeployments: (...args) => invokeQuery("listDeployments", ...args),
  listRecordingsBySiteId: (...args) =>
    invokeQuery("listRecordingsBySiteId", ...args),
  listAnnotationsByRegionId: (...args) =>
    invokeQuery("listAnnotationsByRegionId", ...args),
  listRegionOfInterestByRecordingId: (...args) =>
    invokeQuery("listRegionOfInterestByRecordingId", ...args),
};

const exposedMutations: MutationsApi = {
  createSite: (...args) => invokeMutation("createSite", ...args),
  createAnnotation: (...args) => invokeMutation("createAnnotation", ...args),
  deleteAnnotation: (...args) => invokeMutation("deleteAnnotation", ...args),
  updateAnnotation: (...args) => invokeMutation("updateAnnotation", ...args),
  createRecording: (...args) => invokeMutation("createRecording", ...args),
  createSurvey: (...args) => invokeMutation("createSurvey", ...args),
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
  invoke: async (channel: string, value: unknown) => {
    return await ipcRenderer.invoke(channel, value);
  },
};

contextBridge.exposeInMainWorld("ipc", handler);

export type IpcHandler = typeof handler;
