import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

// Helper function for exposing queries
function invokeQuery<C extends keyof QueriesApi>(
  channel: C,
): (...args: Parameters<QueriesApi[C]>) => ReturnType<QueriesApi[C]> {
  return (...args: Parameters<QueriesApi[C]>) =>
    ipcRenderer.invoke(channel, ...args) as ReturnType<QueriesApi[C]>;
}

// Helper function for exposing mutations
function invokeMutation<C extends keyof MutationsApi>(
  channel: C,
): (...args: Parameters<MutationsApi[C]>) => ReturnType<MutationsApi[C]> {
  return (...args: Parameters<MutationsApi[C]>) =>
    ipcRenderer.invoke(channel, ...args) as ReturnType<MutationsApi[C]>;
}

// Queries that are exposed to renderer process
// Queries that are present in queries/index.ts while not
// exposed here will result in type errors
const exposedQueries: QueriesApi = {
  listSurveys: () => invokeQuery("listSurveys")(),
  listRecordingsByDeploymentId: (...args) => invokeQuery("listRecordingsByDeploymentId")(...args),
  listRecordingsByFilters: (...args) => invokeQuery("listRecordingsByFilters")(...args),
  listRecordings: () => invokeQuery("listRecordings")(), 
  listAnnotationsRecordings: () => invokeQuery("listAnnotationsRecordings")(),
  listSpecies: () => invokeQuery("listSpecies")(), 
  listRecorders: () => invokeQuery("listRecorders")(),
  listSites: () => invokeQuery("listSites")(),
  listDeployments: (...args) => invokeQuery("listDeployments")(...args),
  listRecordingsBySiteId: (...args) => invokeQuery("listRecordingsBySiteId")(...args),
  listAnnotationsByRegionId: (...args) => invokeQuery("listAnnotationsByRegionId")(...args),
  listRegionOfInterestByRecordingId: (...args) => invokeQuery("listRegionOfInterestByRecordingId")(...args),
  listDatabases: (...args) => invokeQuery("listDatabases")(...args),
  listModelAccuracyBySpecies: () => invokeQuery("listModelAccuracyBySpecies")(),
  listUnlabeledRecordings: () => invokeQuery("listUnlabeledRecordings")(),
};

// Mutations that are exposed to renderer process
// Mutations that are present in mutations/index.ts while not
// exposed here will result in type errors
const exposedMutations: MutationsApi = {
  createSite: invokeMutation("createSite"),
  createSurvey: invokeMutation("createSurvey"),
  // Annotations
  createAnnotation: invokeMutation("createAnnotation"),
  getOrCreateLabeler: invokeMutation("getOrCreateLabeler"),
  deleteAnnotation: invokeMutation("deleteAnnotation"),
  updateAnnotation: invokeMutation("updateAnnotation"),
  updateAnnotationVerified: invokeMutation("updateAnnotationVerified"),
  // Recordings
  createRecording: (...args) => invokeMutation("createRecording")(...args),
  updateRecording: (...args) => invokeMutation("updateRecording")(...args),
  deleteRecording: (...args) => invokeMutation("deleteRecording")(...args),
  // Region of interest 
  deleteRegionOfInterest: (...args) =>
    invokeMutation("deleteRegionOfInterest")(...args),
  // createRegionOfInterest: (...args) =>
  //   invokeMutation("createRegionOfInterest", ...args),
  createRegionOfInterest: invokeMutation("createRegionOfInterest"),
  updateRegionOfInterest: (...args) =>
    invokeMutation("updateRegionOfInterest")(...args),
  // Species
  createSpecies: (...args) => invokeMutation("createSpecies")(...args),
  createRecorder: (...args) => invokeMutation("createRecorder")(...args),
  createDeployment: (...args) => invokeMutation("createDeployment")(...args)
};

// Exposes all backend queries & mutations
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
  invoke: async (channel: string, value?: unknown) => {
    return await ipcRenderer.invoke(channel, value);
  },
};

contextBridge.exposeInMainWorld("ipc", handler);

export type IpcHandler = typeof handler;
