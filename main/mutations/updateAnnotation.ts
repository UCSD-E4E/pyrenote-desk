import { Annotation } from "../schema";
import { getDatabase } from "../background";

type UpdateParams = {
  annotationId: number;
  speciesId: number;
  speciesProbability: number;
};

const updateAnnotation = async (
  annotationId: number,
  speciesId: number,
  speciesProbability: number,
): Promise<Annotation | undefined> => {
  const db = getDatabase();
  const statement = db.prepare<UpdateParams, Annotation>(`
    UPDATE annotation
    SET speciesId = @speciesId, speciesProbability = @speciesProbability
    WHERE annotationId = @annotationId
    RETURNING *
  `);
  try {
    const rows = statement.get({
      annotationId,
      speciesId,
      speciesProbability,
    })!;
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed to update annotation", e);
  }
};

export default updateAnnotation;
