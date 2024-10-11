import path from 'path'
import { app, ipcMain } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
//to create and communicate with database
import Database from 'better-sqlite3';
import fs from 'fs';

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

let dbInstance: any;

function createDatabase() {
  const dbPath = './mydatabase.db';
  let db: any;

  if (fs.existsSync(dbPath)) {
    //if file exists, you assume that schema has already been added and there may even be data potentially
    console.log("file existed");
    db = new Database(dbPath);
  }
  else{
    console.log("file did NOT exist. creating now");
    // Load SQL schema
    db = new Database(dbPath);

    const sqlFilePath = './magnus.sqlite.sql';
    const sqlFile = fs.readFileSync(sqlFilePath, 'utf8');
    // Execute SQL file to set up schema
    db.exec(sqlFile);
  }

  console.log('Database initialized!');
  return db; // Return the database instance
}

;(async () => {
  await app.whenReady()

  dbInstance = createDatabase();

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // added to use contextBridge for database
      nodeIntegration:false, //prevents malicious attackers by not allowing thigns like import fs to get rendered in renderer
    },
  })

  if (isProd) {
    await mainWindow.loadURL('app://./home')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/home`)
    mainWindow.webContents.openDevTools()
  }
})()

app.on('window-all-closed', () => {
  app.quit()
})

app.on('before-quit', async (event) => {
  console.log('App is quitting, database is automatically saved');
  if (dbInstance) {
      dbInstance.close();  // Close the database connection
      console.log('Database connection closed.');
  }
});

// Listener for the event called db-query, so that renderer can interact with db
ipcMain.handle('db-query', async (event, query, params) => {
  try {
      // Prepare and execute the query
      const stmt = dbInstance.prepare(query); // Prepare the statement
      //const result = stmt.all(params); // Execute with parameters
      stmt.run(params); // Execute the query without returning data
      return { success: true }; // Indicate successful execution

      // If the query returned results, return them
      //return result; // Send rows back to the renderer process
  } catch (error) {
      console.error("Failed to run query:", error);
      throw error;  // Rethrow the error so it can be caught in the renderer
  }
});

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`)
})
