import listRecordingsByDeploymentId from "./listRecordingsByDeploymentId";
import listRecordings from "./listRecordings";
import { OmitEventArg } from "../helpers/util-types";

export const setupQueries = {
  listRecordingsByDeploymentId,
  listRecordings,
};

export type QueriesApi = {
  [Property in keyof typeof setupQueries]: OmitEventArg<
    (typeof setupQueries)[Property]
  >;
};
