import { getDatabase } from "../background";
import { tableModelAccuracyBySpecies } from "../../shared/types/tableModelAccuracyBySpecies";

const listModelAccuracyBySpecies = async (): Promise<tableModelAccuracyBySpecies[]> => {
  const db = getDatabase();

  const statement = db.prepare<never[], tableModelAccuracyBySpecies>(`
    SELECT
      s.speciesId as speciesId,
      s.species as speciesName,
      COUNT(CASE WHEN a.verified = 'YES' THEN 1 END) as numYes,
      COUNT(CASE WHEN a.verified = 'NO' THEN 1 END) as numNo,
      COUNT(CASE WHEN a.verified = 'UNVERIFIED' THEN 1 END) as numUnverified,
      COUNT(a.speciesId) as total,
      1.0 * COUNT(CASE WHEN a.verified = 'YES' THEN 1 END) / COUNT(a.speciesId) as accuracy,
      AVG(a.speciesProbability) as avgConfidence
    FROM Annotation a
    LEFT JOIN Species s ON a.speciesId = s.speciesId
    GROUP BY s.speciesId, s.species
  `);

  try {
    const rows = statement.all();
    return rows;
  } catch (e) {
    console.error("Error: failed listing model accuracy by species", e);
    return [];
  }
};

export default listModelAccuracyBySpecies;
