import createAnnotation from "./createAnnotation";
import updateAnnotation from "./updateAnnotation";
import { ApiWithoutEvent } from "../helpers/util-types";

export const setupMutations = {
  createAnnotation,
  updateAnnotation,
};

export type MutationsApi = ApiWithoutEvent<typeof setupMutations>;
