import listRecordingsByDeploymentId from "./listRecordingsByDeploymentId";
import listRecordings from "./listRecordings";
import { ApiWithoutEvent } from "../helpers/util-types";

export const setupQueries = {
  listRecordingsByDeploymentId,
  listRecordings,
};

export type QueriesApi = ApiWithoutEvent<typeof setupQueries>;
