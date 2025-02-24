import createAnnotation from "./createAnnotation";
import updateAnnotation from "./updateAnnotation";
import createSite from "./createSite";
import createRecording from "./createRecording";
import createSurvey from "./createSurvey";
import { ApiWithoutEvent } from "../helpers/util-types";

export const setupMutations = {
  createAnnotation,
  updateAnnotation,
  createSite,
  createRecording,
  createSurvey,
};

export type MutationsApi = ApiWithoutEvent<typeof setupMutations>;
