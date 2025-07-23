import { getDatabase } from "../background";
import { Site } from "../schema";

const listSites = async (): Promise<Site[]> => {
  const db = getDatabase();

  const statement = db.prepare<never[], Site>(`
    SELECT siteId, surveyId, site_code, latitude, longitude, elevation FROM Site
  `);

  try {
    const rows = statement.all();
    console.log("Sites:", rows);
    return rows;
  } catch (e) {
    console.error("Error: failed listing sites", e);
    return [];
  }
};

export default listSites;
