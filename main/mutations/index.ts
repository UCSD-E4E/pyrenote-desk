import {
  deleteAnnotation,
  updateAnnotation,
  createAnnotation,
} from "./annotation";
import createSite from "./createSite";
import { createRecording, deleteRecording, updateRecording } from "./recording";
import createSurvey from "./createSurvey";
import {
  deleteRegionOfInterest,
  createRegionOfInterest,
  updateRegionOfInterest,
} from "./regionOfInterest";

// List of mutations to expose
export const setupMutations = {
  createAnnotation,
  updateAnnotation,
  deleteAnnotation,
  createSite,
  createRecording,
  updateRecording,
  deleteRecording,
  createSurvey,
  deleteRegionOfInterest,
  createRegionOfInterest,
  updateRegionOfInterest,
};

export type MutationsApi = typeof setupMutations;
