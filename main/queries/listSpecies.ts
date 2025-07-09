import { getDatabase } from "../background";
import { Species } from "../schema";

const listSpecies = async (): Promise<Species[]> => {
  const db = getDatabase();

  const statement = db.prepare<never[], Species>(`
    SELECT speciesId, species, common FROM Species
  `);

  try {
    const rows = statement.all();
    console.log("rows are", rows);
    return rows;
  } catch (e) {
    console.error("Error: failed listing species", e);
    return [];
  }
};

export default listSpecies;
