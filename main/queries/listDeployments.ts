import { getDatabase } from "../background";
import { Deployment } from "../schema";

const listDeployments = async (): Promise<Deployment[]> => {
  const db = getDatabase();
  const statement = db.prepare<never[], Deployment>(`
    SELECT * FROM deployment
  `);
  try {
    const rows = statement.all();
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed listing deployments", e);
  }
  return Promise.resolve([]);
};

export default listDeployments;
