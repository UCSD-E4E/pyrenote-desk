import { readFile } from "fs/promises";
import path from "path";
import fs from "fs";
import BetterSqlite3 from "better-sqlite3";

interface Database {
  ID: number;
  Country: string;
  filepath: string;
}

const DEFAULT_DB = {
  ID: 1,
  Country: "Pyrenote Desk",
  filepath: "./databases/pyrenoteDeskDatabase.db",
};

async function initMasterDb(): Promise<Database[]> {
  const cwd = process.cwd();
  const masterDbPath = path.join(cwd, "renderer", "public", "masterdb.json");
  const publicDir = path.dirname(masterDbPath);
  const defaultDbPath = path.join(cwd, DEFAULT_DB.filepath);
  const databasesDir = path.dirname(defaultDbPath);

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  if (!fs.existsSync(databasesDir)) {
    fs.mkdirSync(databasesDir, { recursive: true });
  }

  if (!fs.existsSync(defaultDbPath)) {
    const sqlFilePath = path.join(cwd, "magnus.sqlite.sql");
    const sqlFile = fs.readFileSync(sqlFilePath, "utf8");
    const db = new BetterSqlite3(defaultDbPath);
    db.exec(sqlFile);
    db.close();
  }

  const masterDb = { databases: [DEFAULT_DB] };
  fs.writeFileSync(masterDbPath, JSON.stringify(masterDb, null, 2));
  return masterDb.databases;
}

export async function ensureMasterDbInitialized(): Promise<void> {
  const masterDbPath = path.join(process.cwd(), "renderer", "public", "masterdb.json");
  if (!fs.existsSync(masterDbPath)) {
    await initMasterDb();
  }
}

const listDatabases = async (): Promise<Database[]> => {
  const masterDbPath = path.join(process.cwd(), "renderer", "public", "masterdb.json");
  if (!fs.existsSync(masterDbPath)) {
    return initMasterDb();
  }
  try {
    const content = await readFile(masterDbPath, "utf8");
    const masterDb = JSON.parse(content);
    return masterDb.databases || [];
  } catch (e) {
    console.log("Error: failed listing databases", e);
    return Promise.resolve([]);
  }
};

export default listDatabases;
