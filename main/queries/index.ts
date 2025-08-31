import listRecordingsByDeploymentId from "./listRecordingsByDeploymentId";
import listRecordings from "./listRecordings";
import listAnnotationsByRegionId from "./listAnnotationsByRegionId";
import listRecordingsBySiteId from "./listRecordingsBySiteId";
import listSurveys from "./listSurveys";
import listDeployments from "./listDeployments";
import listRegionOfInterestByRecordingId from "./listRegionOfInterestByRecordingId";
import listDatabases from "./listDatabases";
import listSpecies from "./listSpecies";
import listSites from "./listSites";
import listRecorders from "./listRecorders"
import listAnnotationsRecordings from "./listAnnotationsRecordings";
import listModelAccuracyBySpecies from "./listModelAccuracyBySpecies";
import { ApiWithoutEvent } from "../helpers/util-types";

// List of queries to expose
export const setupQueries = {
  listRecordingsByDeploymentId,
  listRecordings,
  listAnnotationsByRegionId,
  listRecordingsBySiteId,
  listSurveys,
  listDeployments,
  listRegionOfInterestByRecordingId,
  listDatabases,
  listSpecies,
  listSites,
  listRecorders,
  listAnnotationsRecordings,
  listModelAccuracyBySpecies
};

export type QueriesApi = typeof setupQueries;
