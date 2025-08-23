import {
  deleteAnnotation,
  updateAnnotation,
  createAnnotation,
  updateAnnotationVerified
} from "./annotation";
import createSite from "./createSite";
import { createRecording, deleteRecording, updateRecording } from "./recording";
import createRecorder from "./createRecorder";
import createSurvey from "./createSurvey";
import {
  deleteRegionOfInterest,
  createRegionOfInterest,
  updateRegionOfInterest,
} from "./regionOfInterest";
import createSpecies from "./createSpecies";
import createDeployment from "./createDeployment";

// List of mutations to expose
export const setupMutations = {
  createAnnotation,
  updateAnnotation,
  updateAnnotationVerified,
  deleteAnnotation,
  createSite,
  createRecording,
  updateRecording,
  deleteRecording,
  createSurvey,
  deleteRegionOfInterest,
  createRegionOfInterest,
  updateRegionOfInterest,
  createSpecies,
  createRecorder,
  createDeployment
};

export type MutationsApi = typeof setupMutations;
