import { app, BrowserWindow } from 'electron';
import { ipcMainOn } from './util.js';
import { getSystemStats } from './systemStats.js';

export function setupWindowManager(mainWindow: BrowserWindow) {
  let willClose = false;
  let statsInterval: NodeJS.Timeout | null = null;

  // Set up system stats interval
  mainWindow.on('show', () => {
    if (!statsInterval) {
      statsInterval = setInterval(() => {
        try {
          const stats = getSystemStats();
          mainWindow.webContents.send('system-stats-update', stats);
        } catch (err) {
          console.error('Error sending system stats:', err);
        }
      }, 2000);
    }
  });

  mainWindow.on('hide', () => {
    if (statsInterval) {
      clearInterval(statsInterval);
      statsInterval = null;
    }
  });

  // Initial stats setup
  statsInterval = setInterval(() => {
    try {
      const stats = getSystemStats();
      mainWindow.webContents.send('system-stats-update', stats);
    } catch (err) {
      console.error('Error sending system stats:', err);
    }
  }, 2000);

  // Handle close events
  mainWindow.on('close', (e) => {
    if (willClose) {
      return;
    }

    e.preventDefault();
    mainWindow.hide();

    if (app.dock) {
      app.dock.hide();
    }
  });

  app.on('before-quit', () => {
    willClose = true;
  });

  mainWindow.on('show', () => {
    willClose = false;
  });

  ipcMainOn('sendFrameAction', (payload: FrameWindowAction) => {
    switch (payload) {
      case 'close':
        mainWindow.close();
        break;
      case 'maximize':
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize();
        } else {
          mainWindow.maximize();
        }
        break;
      case 'minimize': 
        mainWindow.minimize();
        break;
    }
  });

  return {
    cleanup: () => {
      if (statsInterval) {
        clearInterval(statsInterval);
        statsInterval = null;
      }
    }
  };
}
