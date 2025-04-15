import path from 'path'
import { app, ipcMain, dialog } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import * as fs from "fs";
import { readFile } from "fs/promises";

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

;(async () => {
  await app.whenReady()

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
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

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`)
})

ipcMain.on('save-file', async (event, { filename, content }) => {
  try {
	fs.writeFileSync(filename, content);
	event.reply("save-file-success", "File saved successfully!");
  } catch (err) {
    console.error("Error writing file:", err);
    event.reply("save-file-error", "Failed to save file.");
  }
})

ipcMain.handle('save-dialog', async (event, data) => {
	const { filePath, canceled } = await dialog.showSaveDialog({
		title: 'Save File',
		defaultPath: 'data.json',
		filters: [{ name: 'JSON Files', extensions: ['json'] }]
	});
	return canceled ? null : filePath;
});

// FOR VERIFY PAGE \/ \/ \/
  
ipcMain.handle('read-file-for-verification', async (event, filePath: string) => {
	try {
		const buffer = await readFile(filePath); // or no encoding for Buffer
		const transportedBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
		return {
			name: path.basename(filePath), // get filename only
			extension: path.extname(filePath),
			filePath: filePath,
			data: transportedBuffer,
		};
	} catch (err) {
		return {};
	}
});

ipcMain.handle('pick-files-for-verification', async (event) => { // need to do this to get FULL file paths
	const result = await dialog.showOpenDialog({
	  	properties: ['openFile', 'multiSelections'],
		filters: [{ name: 'All Files', extensions: ['json', 'mp3', 'wav'] }],
	});

	if (result.canceled) {
		return [];
	}

	const filesWithData = await Promise.all(
		result.filePaths.map(async (filePath) => {
			const buffer = await readFile(filePath); // returns Buffer
			const transportedBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
			return {
				name: path.basename(filePath), // get filename only
				extension: path.extname(filePath),
				filePath: filePath,
				data: transportedBuffer,
			};
		})
	);
	return filesWithData; 
});
