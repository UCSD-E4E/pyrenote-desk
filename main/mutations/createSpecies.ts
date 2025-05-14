import { getDatabase } from "../background";
import { Species } from "../schema";

type CreateParams = {
  species: string;
  common: string;
};

const createSpecies = async ({ species, common }: CreateParams): Promise<Species | undefined> => {
  const db = getDatabase();
  const statement = db.prepare<CreateParams, Species>(
    `INSERT INTO Species (species, common) VALUES (@species, @common) RETURNING *`
  );
  try {
    const row = statement.get({ species, common });
    console.log(`Successfully inserted species into database: ${db.name}`);
    return Promise.resolve(row);
  } catch (e) {
    console.log("Error: failed to create species", e);
    throw e;
  }
};

export default createSpecies; 