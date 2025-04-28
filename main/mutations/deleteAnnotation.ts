import { Annotation } from "../schema";
import { getDatabase } from "../background";

type UpdateParams = {
  annotationId: number;
};

const deleteAnnotation = async (
  annotationId: number,
): Promise<Annotation | undefined> => {
  const db = getDatabase();
  const statement = db.prepare<UpdateParams, Annotation>(`
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

export default deleteAnnotation;
