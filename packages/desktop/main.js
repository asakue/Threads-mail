const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

function createWindow() {
  const iconPath = path.join(__dirname, 'icon.png');
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0A0A0C',
    title: 'Threads',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      devTools: false,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#111114',
      symbolColor: '#EDEDED',
      height: 38,
    },
  });

  // Determine what to load
  const appUrl = process.env.VIBERY_APP_URL;
  const packagedDist = path.join(__dirname, 'client-dist', 'index.html');
  const monorepoDist = path.join(__dirname, '..', 'client', 'dist', 'index.html');

  if (appUrl) {
    mainWindow.loadURL(appUrl);
  } else if (fs.existsSync(packagedDist)) {
    mainWindow.loadFile(packagedDist);
  } else if (fs.existsSync(monorepoDist)) {
    mainWindow.loadFile(monorepoDist);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  // Open external links in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
