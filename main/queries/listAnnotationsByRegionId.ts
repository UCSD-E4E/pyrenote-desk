import { Statement } from "better-sqlite3";
import { getDatabase } from "../background";
import { Annotation } from "../schema";

type QueryParams = {
  regionId: number;
  pageSize?: number;
  keyOffset?: number;
};

const listAnnotationsByRegionId = async (
  regionId: number,
  pageSize?: number,
  keyOffset: number = -1,
): Promise<Annotation[]> => {
  const db = getDatabase();
  let statement: Statement<QueryParams, Annotation>;
  if (pageSize != null) {
    statement = db.prepare<QueryParams, Annotation>(`
    SELECT * FROM annotation
    WHERE regionId = @regionId
      AND annotationId > @keyOffset
    LIMIT @pageSize
  `);
  } else {
    statement = db.prepare<QueryParams, Annotation>(`
    SELECT * FROM annotation
    WHERE regionId = @regionId
  `);
  }
  try {
    const rows = statement.all({
      regionId,
      pageSize,
      keyOffset,
    });
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed listing annotations by regionId", e);
  }
  return Promise.resolve([]);
};

export default listAnnotationsByRegionId;
