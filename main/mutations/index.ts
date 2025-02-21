import createAnnotation from "./createAnnotation";
import updateAnnotation from "./updateAnnotation";
import createSite from "./createSite";
import { ApiWithoutEvent } from "../helpers/util-types";

export const setupMutations = {
  createAnnotation,
  updateAnnotation,
  createSite,
};

export type MutationsApi = ApiWithoutEvent<typeof setupMutations>;
