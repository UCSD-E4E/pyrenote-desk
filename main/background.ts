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

const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

let dbInstance: BetterSqlite3.Database;

export const getDatabase = () => {
  return dbInstance;
};

function createDatabase() {
  const dbPath = "./pyrenoteDeskDatabase.db";
  let db: BetterSqlite3.Database;

  if (fs.existsSync(dbPath)) {
    db = new BetterSqlite3(dbPath);
  } else {
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
    mainWindow.webContents.openDevTools();
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
