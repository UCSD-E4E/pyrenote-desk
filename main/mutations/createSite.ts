import { Annotation } from "../schema";
import { getDatabase } from "../background";

type CreateParams = {
  surveyId: number;
  site_code: string;
  latitude: number;
  longitude: number;
  elevation: number;
};

const createSite = async (
  surveyId: number,
  site_code: string,
  latitude: number,
  longitude: number,
  elevation: number,
): Promise<Annotation | undefined> => {
  const db = getDatabase();
  // TODO: test this mutation
  const statement = db.prepare<CreateParams, Annotation>(`
    INSERT INTO site (surveyId, site_code, latitude, longitude, elevation)
    VALUES (@surveyId, @site_code, @latitude, @longitude, @elevation)
    RETURNING *
  `);
  try {
    const rows = statement.get({
      surveyId,
      site_code,
      latitude,
      longitude,
      elevation,
    })!;
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed to create site", e);
  }
};

export default createSite;
