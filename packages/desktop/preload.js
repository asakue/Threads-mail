const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('viberyDesktop', {
  platform: process.platform,
  isDesktopApp: true,
  version: '1.0.0',
});
