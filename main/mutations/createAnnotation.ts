import { Annotation } from "../schema";
import { getDatabase } from "../background";

type QueryParams = {
  recordingId: number;
  labelerId: number;
  regionId: number;
  annotationDate: string;
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
  // TODO: finish this mutation
  const statement = db.prepare<QueryParams, Annotation>(`
    INSERT INTO annotation (regionId, labelerId, annotationDate, speciesId, speciesProbability, mostRecent)
    VALUES (@regionId, @labelerId, @annotationDate, @speciesId, @speciesProbability, @mostRecent)
  `);
  try {
    const rows = statement.get({
      recordingId,
      labelerId,
      regionId,
      speciesId,
      speciesProbability,
      annotationDate: new Date().toISOString(),
      mostRecent: true,
    })!;
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed to create annotation", e);
  }
};

export default createAnnotation;
