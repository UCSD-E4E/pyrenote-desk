import { readFile } from "fs/promises";
import path from "path";

interface Database {
  ID: number;
  Country: string;
  filepath: string;
}

const listDatabases = async (): Promise<Database[]> => {
  try {
    const masterDbPath = path.join(process.cwd(), 'renderer', 'public', 'masterdb.json');
    const content = await readFile(masterDbPath, 'utf8');
    const masterDb = JSON.parse(content);
    
    return Promise.resolve(masterDb.databases || []);
  } catch (e) {
    console.log("Error: failed listing databases", e);
    return Promise.resolve([]);
  }
};

export default listDatabases;
