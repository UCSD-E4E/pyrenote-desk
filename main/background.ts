import path from "path";
import { app, ipcMain } from "electron";
import serve from "electron-serve";
import { createWindow } from "./helpers";
import BetterSqlite3 from "better-sqlite3";
import fs from "fs";
import { execFile } from "child_process";
import { setupQueries as queries } from "./queries";

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
app.on("before-quit", async (event) => {
  if (dbInstance) {
    dbInstance.close();
  }
});

// Setup all queries
for (const query in queries) {
  ipcMain.handle(query, queries[query]);
}

//Listener for running queries on the database
ipcMain.handle("db-query", async (event, query, params) => {
  try {
    const stmt = dbInstance.prepare(query);
    stmt.run(params);
    return { success: true };
  } catch (error) {
    console.error("Failed to run query:", error);
    throw error;
  }
});

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
