import { Site } from "../schema";
import { getDatabase } from "../background";

type CreateParams = {
  surveyId: number;
  site_code: string;
  latitude: number;
  longitude: number;
  elevation: number;
};

const createSite  = async (params: CreateParams) => {
  const {
    surveyId,
    site_code,
    latitude,
    longitude,
    elevation
  } = params;

  const db = getDatabase();
  const statement = db.prepare(`
    INSERT INTO site (surveyId, site_code, latitude, longitude, elevation)
    VALUES (@surveyId, @site_code, @latitude, @longitude, @elevation)
    RETURNING *
  `);
  try {
    const row = statement.get({
      surveyId: surveyId,
      site_code: String(site_code),
      latitude: latitude,
      longitude: longitude,
      elevation: elevation
    });
    console.log("Inserted row:", row);
    return row;
  } catch (e) {
    console.error("Error inserting site:", e);
    throw e;
  }
};

export default createSite;

