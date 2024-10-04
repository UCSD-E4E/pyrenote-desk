import path from 'path';
import { app, ipcMain } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';
import initSqlJs from 'sql.js';
import fs from 'fs';

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

// Global variable to store the database instance
let dbInstance: any;

// Function to create the database and load the schema
async function createDatabase() {
  const SQL = await initSqlJs();

  // Load SQL file or create new database
  const sqlFilePath = './magnus.sqlite.sql';  // Use proper path handling
  const sqlFile = fs.readFileSync(sqlFilePath, 'utf8');

  const db = new SQL.Database(); // Create an in-memory SQL.js database
  db.run(sqlFile);  // Load schema from file

  console.log('Database initialized!');
  return db; // Return the database instance
}

// Async function to initialize the app and database
(async () => {
  await app.whenReady();

  // Initialize the database once at the start
  dbInstance = await createDatabase();

  // Create the main window
  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // added by me to use contextBridge
      nodeIntegration:false, //prevents malicious attackers by not allowing thigns like import fs to get rendered in renderer
    },
  });

  if (isProd) {
    await mainWindow.loadURL('app://./home');
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }
})();

/*
//returning weird things
// Handle IPC requests for database queries from the renderer
ipcMain.handle('db-query', async (event, query, params) => {
  try {
    const result = dbInstance.run(query, params); // Execute the query on the main process
    return result;
  } catch (error) {
    console.error('Database Error:', error);
    throw error;
  }
});
*/

//listener for the event called db-query
ipcMain.handle('db-query', async (event, query, params) => {
  try {
      // Execute the query
      const result = dbInstance.exec(query, params);
      
      // If the query returned results, we format and send them back
      if (result && result.length > 0) {
          const rows = result[0].values;  // Accessing the actual rows
          return rows; // Send rows back to the renderer process
      }
      
      // If no rows are returned, return an empty array or message
      return [];
  } catch (error) {
      console.error("Failed to run query:", error);
      throw error;  // Rethrow the error so it can be caught in the renderer
  }
});

// Handle other IPC events, if necessary
ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`);
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  app.quit();
});
