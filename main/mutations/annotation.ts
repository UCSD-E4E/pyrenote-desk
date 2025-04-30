import { Annotation } from "../schema";
import { getDatabase } from "../background";

type CreateParams = {
  recordingId: number;
  labelerId: number;
  regionId: number;
  speciesId: number;
  speciesProbability: number;
  mostRecent: number;
};

export const createAnnotation = async (
  recordingId: number,
  labelerId: number,
  regionId: number,
  speciesId: number,
  speciesProbability: number,
): Promise<Annotation | undefined> => {
  const db = getDatabase();
  // TODO: Should remove mostRecent?
  const statement = db.prepare<CreateParams, Annotation>(`
    INSERT INTO annotation (regionId, labelerId, annotationDate, speciesId, speciesProbability, mostRecent)
    VALUES (@regionId, @labelerId, CURRENT_TIMESTAMP, @speciesId, @speciesProbability, @mostRecent)
    RETURNING * 
  `);
  try {
    const rows = statement.get({
      recordingId,
      labelerId,
      regionId,
      speciesId,
      speciesProbability,
      mostRecent: 1,
    })!;
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed to create annotation", e);
  }
};

type DeleteParams = {
  annotationId: number;
};

export const deleteAnnotation = async (
  annotationId: number,
): Promise<Annotation | undefined> => {
  const db = getDatabase();
  const statement = db.prepare<DeleteParams, Annotation>(`
    DELETE FROM annotation
    WHERE annotationId = @annotationId
    RETURNING *
  `);
  try {
    const rows = statement.get({
      annotationId,
    })!;
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed to update annotation", e);
  }
};


type UpdateParams = {
  annotationId: number;
  speciesId: number;
  speciesProbability: number;
};

export const updateAnnotation = async (
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

