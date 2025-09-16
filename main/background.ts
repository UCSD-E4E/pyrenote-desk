import path from "path";
import serve from "electron-serve";
import { createWindow } from "./helpers";
import BetterSqlite3 from "better-sqlite3";
import fs from "fs";
import { execFile } from "child_process";
import { setupQueries as queries } from "./queries";
import { setupMutations as mutations } from "./mutations";
import { app, ipcMain, dialog } from "electron";
import { readFile } from "fs/promises";
import os from "os";
import { spawn } from "child_process";

const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

let dbInstance: BetterSqlite3.Database;
let selectedDbPath: string | null = null;

export const getDatabase = () => {
  console.log("db instance: ", dbInstance)
  return dbInstance;
};

function createDatabase() {
  const dbPath = selectedDbPath || "./pyrenoteDeskDatabase.db";
  let db: BetterSqlite3.Database;

  if (fs.existsSync(dbPath)) {
    db = new BetterSqlite3(dbPath);
  } else {
    console.log("Database does not exist, creating new one");
    //Creates new database if it did not exist already
    db = new BetterSqlite3(dbPath);
    const sqlFilePath = "./magnus.sqlite.sql";
    const sqlFile = fs.readFileSync(sqlFilePath, "utf8");
    db.exec(sqlFile);
  }
  return db;
}

(async () => {
  await app.whenReady();
  dbInstance = createDatabase();

  const mainWindow = createWindow("main", {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isProd) {
    await mainWindow.loadURL("app://./home");
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    //mainWindow.webContents.openDevTools(); //ensure that developer console opens on startup
  }
})();

app.on("window-all-closed", () => {
  app.quit();
});

//Closes database connection right before app quits
app.on("before-quit", async () => {
  if (dbInstance) {
    dbInstance.close();
  }
});

// Setup all queries on backend
for (const query in queries) {
  ipcMain.handle(query, (_event, ...args) => queries[query](...args));
}

// Setup all mutations on backend
for (const mutation in mutations) {
  ipcMain.handle(mutation, (_event, ...args) => mutations[mutation](...args));
}

//Listener for running queries on the database
// ipcMain.handle("db-query", async (_event, query, params) => {
//   try {
//     const stmt = dbInstance.prepare(query);
//     stmt.run(params);
//     return { success: true };
//   } catch (error) {
//     console.error("Failed to run query:", error);
//     throw error;
//   }
// });

// Listener for running the script
ipcMain.handle("run-script", async () => {
  return new Promise((resolve, reject) => {
    execFile("python", ["pyfiles/script.py"], (error, stdout, stderr) => {
      if (error) {
        return reject(stderr);
      }
      //Passes output back to the renderer
      resolve(stdout);
    });
  });
});

ipcMain.on("message", async (event, arg) => {
  event.reply("message", `${arg} World!`);
});

ipcMain.on("save-file", async (event, { filename, content }) => {
  try {
    fs.writeFileSync(filename, content);
    event.reply("save-file-success", "File saved successfully!");
  } catch (err) {
    console.error("Error writing file:", err);
    event.reply("save-file-error", "Failed to save file.");
  }
});

ipcMain.handle("save-dialog", async (_event, _data) => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: "Save File",
    defaultPath: "data.json",
    filters: [{ name: "JSON Files", extensions: ["json"] }],
  });
  return canceled ? null : filePath;
});

// FOR VERIFY PAGE \/ \/ \/

ipcMain.handle(
  "read-file-for-verification",
  async (_event, filePath: string) => {
    try {
      const buffer = await readFile(filePath); // or no encoding for Buffer
      const transportedBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      );
      return {
        name: path.basename(filePath), // get filename only
        extension: path.extname(filePath),
        filePath: filePath,
        data: transportedBuffer,
      };
    } catch (_err) {
      return {};
    }
  },
);

ipcMain.handle("pick-files-for-verification", async (_event) => {
  // need to do this to get FULL file paths
  const result = await dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "All Files", extensions: ["json", "mp3", "wav"] }],
  });

  if (result.canceled) {
    return [];
  }

  const filesWithData = await Promise.all(
    result.filePaths.map(async (filePath) => {
      const buffer = await readFile(filePath); // returns Buffer
      const transportedBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      );
      return {
        name: path.basename(filePath), // get filename only
        extension: path.extname(filePath),
        filePath: filePath,
        data: transportedBuffer,
      };
    }),
  );
  return filesWithData;
});

// ipcMain handle to set db path
ipcMain.handle('set-db-path', (_event, dbPath: string) => {
  if (dbInstance) {
    dbInstance.close();
  }
  selectedDbPath = dbPath; //set global selected db path to new dbpath
  dbInstance = createDatabase();
  return { success: true };
});

// FOR DATABASE PAGE
// Creating new database
ipcMain.handle('create-new-database', async (_event, { name, filepath }) => {
  try {
    // Check if country name already exists
    const masterDbPath = path.join(process.cwd(), 'renderer', 'public', 'masterdb.json');
    let masterDb = { databases: [] };
    if (fs.existsSync(masterDbPath)) {
      const content = await readFile(masterDbPath, 'utf8');
      masterDb = JSON.parse(content);
      
      // Check for duplicate country name
      if (masterDb.databases.some(db => db.Country.toLowerCase() === name.toLowerCase())) {
        return { success: false, error: 'Error: Country already exists. Please name something else' };
      }
    }

    //Creates new database along with tables in databases folder
    const dbPath = path.join(process.cwd(), filepath);
    const db = new BetterSqlite3(dbPath);
    const sqlFilePath = path.join(process.cwd(), "magnus.sqlite.sql");
    const sqlFile = fs.readFileSync(sqlFilePath, "utf8");
    db.exec(sqlFile);
    db.close();

    //Adds new database to masterdb.json
    const newId = Math.max(0, ...masterDb.databases.map(db => db.ID)) + 1; //increment id by 1
    masterDb.databases.push({
      ID: newId,
      Country: name,
      filepath: filepath
    });

    fs.writeFileSync(masterDbPath, JSON.stringify(masterDb, null, 2));

    return { success: true };
  } catch (error) {
    console.error('Error creating new database:', error);
    return { success: false, error: error.message };
  }
});

// Deletes database
ipcMain.handle('delete-database', async (_event, { filepath, country }) => {
  try {
    const dbPath = path.join(process.cwd(), filepath);
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }

    const masterDbPath = path.join(process.cwd(), 'renderer', 'public', 'masterdb.json');
    if (fs.existsSync(masterDbPath)) {
      const content = await readFile(masterDbPath, 'utf8');
      const masterDb = JSON.parse(content);
      
      //remove by filtering out the deleted country, and then rewrite the filtered content back to masterdb.json
      masterDb.databases = masterDb.databases.filter(db => db.Country !== country);
      fs.writeFileSync(masterDbPath, JSON.stringify(masterDb, null, 2));
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting database:', error);
    return { success: false, error: error.message };
  }
});

// Edits database
ipcMain.handle('edit-database', async (_event, { oldName, newName, filepath }) => {
  try {
    const masterDbPath = path.join(process.cwd(), 'renderer', 'public', 'masterdb.json');
    if (fs.existsSync(masterDbPath)) {
      const content = await readFile(masterDbPath, 'utf8');
      const masterDb = JSON.parse(content);
      
      // Check for duplicate
      if (masterDb.databases.some(db => 
        db.Country.toLowerCase() === newName.toLowerCase() && 
        db.Country !== oldName
      )) {
        return { success: false, error: 'Error: Country already exists. Please name something else' };
      }

      //find db that will be edited
      const dbIndex = masterDb.databases.findIndex(db => db.Country === oldName);

      //if country found (it should be impossible for it not to be found), set the new name for the db
      if (dbIndex !== -1) {
        masterDb.databases[dbIndex].Country = newName;
        fs.writeFileSync(masterDbPath, JSON.stringify(masterDb, null, 2));
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error editing database:', error);
    return { success: false, error: error.message };
  }
});


ipcMain.handle("saveMultipleRecordings", async (_event, { files, deploymentId, driveLabel }) => {
  //const selectedDbPath = selectedDbPath; // ← however you expose this
  const savedIds: number[] = [];

  for (const file of files) {
    const tempPath = path.join(os.tmpdir(), file.name);
    fs.writeFileSync(tempPath, Buffer.from(file.buffer));

    const pythonScript = path.join(__dirname, "../pyfiles/script.py");
    const args = [
      "--save", tempPath,
      "--deployment", deploymentId.toString(),
      "--db", selectedDbPath
    ];
    if (driveLabel) args.push("--drive", driveLabel);

    await new Promise<void>((resolve, reject) => {
      const proc = spawn("python3", [pythonScript, ...args]);

      proc.stdout.on("data", (data) => {
        const match = data.toString().match(/recordingId=(\d+)/);
        if (match) savedIds.push(Number(match[1]));
        console.log("PYTHON STDOUT:", data.toString());
      });

      proc.stderr.on("data", (data) => {
        console.error("PYTHON STDERR:", data.toString());
      });

      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Python script failed with code ${code}`));
      });
    });
  }

  return savedIds;
});
