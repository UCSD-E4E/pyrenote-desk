import createAnnotation from "./createAnnotation";
import { ApiWithoutEvent } from "../helpers/util-types";

export const setupMutations = {
  createAnnotation,
};

export type MutationsApi = ApiWithoutEvent<typeof setupMutations>;
