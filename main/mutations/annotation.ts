import { Annotation } from "../schema";
import { getDatabase } from "../background";

type CreateParams = {
  recordingId: number;
  labelerId: number;
  regionId: number;
  speciesId: number;
  speciesProbability: number;
  mostRecent: number;
  verified: 'YES' | 'NO' | 'UNVERIFIED';
};

export const createAnnotation = async (
  recordingId: number,
  labelerId: number,
  regionId: number,
  speciesId: number,
  speciesProbability: number,
  verified: 'YES' | 'NO' | 'UNVERIFIED' = 'UNVERIFIED',
): Promise<Annotation | undefined> => {
  const db = getDatabase();
  // TODO: Should remove mostRecent?
  const statement = db.prepare<CreateParams, Annotation>(`
    INSERT INTO annotation (regionId, labelerId, annotationDate, speciesId, speciesProbability, mostRecent, verified)
    VALUES (@regionId, @labelerId, CURRENT_TIMESTAMP, @speciesId, @speciesProbability, @mostRecent, @verified)
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
      verified,
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
    console.log("Error: failed to delete annotation", e);
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

// New mutation to update verified status for an annotation
export const updateAnnotationVerified = async (
    annotationId: number,
    status: string,
): Promise<void> => {
    
    const db = getDatabase();
    const statusString = String(status);

    const statement = db.prepare(`
        UPDATE annotation
        SET verified = @statusString
        WHERE annotationId = @annotationId
    `);
    
    try {
      statement.run({
        statusString,
        annotationId,
      });
      console.log(`Updated annotation verification status for annotation ${annotationId}`);
    } catch (e) {
      console.log("Error: failed to update annotation verification status", e);
    }
};
