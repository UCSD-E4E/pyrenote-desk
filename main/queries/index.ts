import listRecordingsByDeploymentId from "./listRecordingsByDeploymentId";
import listRecordings from "./listRecordings";
import listAnnotationsByRegionId from "./listAnnotationsByRegionId";
import listRecordingsBySiteId from "./listRecordingsBySiteId";
import listSurveys from "./listSurveys";
import listDeployments from "./listDeployments";
import listRegionOfInterestByRecordingId from "./listRegionOfInterestByRecordingId";
import listDatabases from "./listDatabases";
import { ApiWithoutEvent } from "../helpers/util-types";

export const setupQueries = {
  listRecordingsByDeploymentId,
  listRecordings,
  listAnnotationsByRegionId,
  listRecordingsBySiteId,
  listSurveys,
  listDeployments,
  listRegionOfInterestByRecordingId,
  listDatabases,
};

export type QueriesApi = ApiWithoutEvent<typeof setupQueries>;
