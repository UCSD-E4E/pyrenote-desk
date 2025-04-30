import createAnnotation from "./createAnnotation";
import updateAnnotation from "./updateAnnotation";
import deleteAnnotation from "./deleteAnnotation";
import createSite from "./createSite";
import createRecording from "./createRecording";
import createSurvey from "./createSurvey";
import { ApiWithoutEvent } from "../helpers/util-types";
import {
  deleteRegionOfInterest,
  createRegionOfInterest,
  updateRegionOfInterest,
} from "./regionOfInterest";

export const setupMutations = {
  createAnnotation,
  updateAnnotation,
  deleteAnnotation,
  createSite,
  createRecording,
  createSurvey,
  deleteRegionOfInterest,
  createRegionOfInterest,
  updateRegionOfInterest,
};

export type MutationsApi = ApiWithoutEvent<typeof setupMutations>;
