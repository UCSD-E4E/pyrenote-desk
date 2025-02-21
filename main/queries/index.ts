import listRecordingsByDeploymentId from "./listRecordingsByDeploymentId";
import listRecordings from "./listRecordings";
import listAnnotationsByRecordingId from "./listAnnotationsByRecordingId";
import listRecordingsBySiteId from "./listRecordingsBySiteId";
import { ApiWithoutEvent } from "../helpers/util-types";

export const setupQueries = {
  listRecordingsByDeploymentId,
  listRecordings,
  listAnnotationsByRecordingId,
  listRecordingsBySiteId,
};

export type QueriesApi = ApiWithoutEvent<typeof setupQueries>;
