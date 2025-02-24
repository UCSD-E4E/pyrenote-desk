import { Annotation } from "../schema";
import { getDatabase } from "../background";

type CreateParams = {
  recordingId: number;
  labelerId: number;
  regionId: number;
  speciesId: number;
  speciesProbability: number;
  mostRecent: boolean;
};

const createAnnotation = async (
  recordingId: number,
  labelerId: number,
  regionId: number,
  speciesId: number,
  speciesProbability: number,
): Promise<Annotation | undefined> => {
  const db = getDatabase();
  // TODO: test this mutation
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
      mostRecent: true,
    })!;
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed to create annotation", e);
  }
};

export default createAnnotation;
