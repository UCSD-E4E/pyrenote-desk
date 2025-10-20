import listRecordingsByDeploymentId from "./listRecordingsByDeploymentId";
import listRecordings from "./listRecordings";
import listRecordingsByFilters from "./listRecordingsByFilters";
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
import listUnlabeledRecordings from "./listUnlabeledRecordings";

// List of queries to expose
export const setupQueries = {
  listRecordingsByDeploymentId,
  listRecordings,
  listRecordingsByFilters,
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
  listModelAccuracyBySpecies,
  listUnlabeledRecordings
};

export type QueriesApi = typeof setupQueries;
