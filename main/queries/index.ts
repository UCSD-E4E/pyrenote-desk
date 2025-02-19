import listRecordingsByDeploymentId from "./listRecordingsByDeploymentId";

export const setupQueries = {
  [listRecordingsByDeploymentId.queryName]: listRecordingsByDeploymentId.query,
};
