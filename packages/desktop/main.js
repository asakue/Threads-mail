const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { spawn } = require('node:child_process');

let backendProcess = null;

function ensureBackendRunning(onReady) {
  const req = http.get('http://127.0.0.1:3001/health', (res) => {
    if (res.statusCode === 200) {
      console.log('[Desktop] Backend is already running on 127.0.0.1:3001');
      if (onReady) onReady();
      return;
    }
  });

  req.on('error', () => {
    console.log('[Desktop] Starting local backend server...');
    const candidatePaths = [
      path.join(__dirname, 'backend-dist', 'server.js'),
      path.join(__dirname, '..', 'backend', 'dist', 'server.js'),
    ];
    const serverScript = candidatePaths.find((p) => fs.existsSync(p));

    if (serverScript) {
      try {
        backendProcess = spawn(process.execPath, [serverScript], {
          env: {
            ...process.env,
            ELECTRON_RUN_AS_NODE: '1',
            PORT: '3001',
            NODE_ENV: 'production',
          },
          stdio: 'ignore',
        });

        backendProcess.on('error', (err) => {
          console.warn('[Desktop] Failed to spawn backend process:', err);
        });

        // Give server 600ms to bind port
        setTimeout(() => {
          if (onReady) onReady();
        }, 600);
      } catch (err) {
        console.warn('[Desktop] Backend spawn exception:', err);
        if (onReady) onReady();
      }
    } else {
      if (onReady) onReady();
    }
  });
}

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
  ensureBackendRunning(() => {
    createWindow();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch {}
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
