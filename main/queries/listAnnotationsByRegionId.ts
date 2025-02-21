import { getDatabase } from "../background";
import { Annotation } from "../schema";

const listAnnotationsByRegionId = async (
  regionId: number,
): Promise<Annotation[]> => {
  const db = getDatabase();
  const statement = db.prepare<number, Annotation>(`
    SELECT * FROM annotation
    WHERE regionId = ?
  `);
  try {
    const rows = statement.all(regionId);
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed listing annotations by regionId", e);
  }
  return Promise.resolve([]);
};

export default listAnnotationsByRegionId;
