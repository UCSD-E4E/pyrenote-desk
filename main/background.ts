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
  const dbPath = './mydatabase.db';
  let db: any;

  // Load SQL file or create new database
  const sqlFilePath = './magnus.sqlite.sql';  // Use proper path handling
  const sqlFile = fs.readFileSync(sqlFilePath, 'utf8');

  //const db = new SQL.Database(); // Create an in-memory SQL.js database
  //db.run(sqlFile);  // Load schema from file
  if (fs.existsSync(dbPath)) {
    //if file exists, you assume that schema has already been added and there may even be data potentially
    console.log("file existed");
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    console.log("file did NOT exist");
    db = new SQL.Database();
    db.run(sqlFile);  // Load schema from file
  }

  console.log('Database initialized!');
  return db; // Return the database instance
}

async function saveDatabase() {
  if (dbInstance) {
    const dbPath = './mydatabase.db';
    console.log("Saving database...");
    const data = dbInstance.export(); // Export the database contents to a Uint8Array
    fs.writeFileSync(dbPath, Buffer.from(data)); // Write the exported data to the file
    console.log("Database saved!");
  }
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
      contextIsolation: true, // added to use contextBridge for database
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

// This will trigger just before the app quits
app.on('before-quit', async (event) => {
  console.log('App is quitting, saving the database...');
  await saveDatabase();  // Call the save function before quitting
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  app.quit();
});
