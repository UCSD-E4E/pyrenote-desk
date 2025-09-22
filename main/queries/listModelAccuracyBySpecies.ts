import { getDatabase } from "../background";

export type tableModelAccuracyBySpecies = {
  speciesId: number;
  speciesName: string;
  numYes: number;
  numNo: number;
  numUnverified: number;
  total: number;
  accuracy: number;
  avgConfidence: number;
};

type ListModelAccuracyBySpeciesParams = { limit: number; offset: number };
type ListModelAccuracyBySpeciesResponse = { rows: tableModelAccuracyBySpecies[]; total: number };

const listModelAccuracyBySpecies = async (
  params: ListModelAccuracyBySpeciesParams,
): Promise<ListModelAccuracyBySpeciesResponse> => {
  const db = getDatabase();

  const baseQuery = `
    SELECT
      s.speciesId as speciesId,
      s.species as speciesName,
      COUNT(CASE WHEN a.verified = 'YES' THEN 1 END) as numYes,
      COUNT(CASE WHEN a.verified = 'NO' THEN 1 END) as numNo,
      COUNT(CASE WHEN a.verified = 'UNVERIFIED' THEN 1 END) as numUnverified,
      COUNT(a.speciesId) as total,
      1.0 * COUNT(CASE WHEN a.verified = 'YES' THEN 1 END) / NULLIF( COUNT(a.speciesId)
                 - COUNT(CASE WHEN a.verified = 'UNVERIFIED' THEN 1 END),
                 0) as accuracy,
      AVG(a.speciesProbability) as avgConfidence
    FROM Annotation a
    LEFT JOIN Species s ON a.speciesId = s.speciesId
    GROUP BY s.speciesId, s.species
  `;

  try {
    // total number of grouped rows
    const totalStmt = db.prepare<never[], { count: number }>(`SELECT COUNT(*) as count FROM ( ${baseQuery} ) as base`);
    const total = totalStmt.get()?.count ?? 0;

    // paged rows
    const pagedStmt = db.prepare<[number, number], tableModelAccuracyBySpecies>(
      `${baseQuery} LIMIT ? OFFSET ?`
    );
    const rows = pagedStmt.all(params.limit, params.offset);

    return { rows, total };
  } catch (e) {
    console.error("Error: failed listing model accuracy by species", e);
    return { rows: [], total: 0 };
  }
};

export default listModelAccuracyBySpecies;
