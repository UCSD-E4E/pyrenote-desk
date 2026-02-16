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
import listModelAccuracyBySpecies from "./listModelAccuracyBySpecies";
import { ApiWithoutEvent } from "../helpers/util-types";
import listUnlabeledRecordings from "./listUnlabeledRecordings";
import listAnnotationsByRecordingIds from "./listAnnotationsByRecordingIds"
import listModels from "./listModels";

// List of queries to expose
export const setupQueries = {
  listAnnotationsByRecordingIds,
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
  listModelAccuracyBySpecies,
  listUnlabeledRecordings,
  listModels
};

export type QueriesApi = typeof setupQueries;
