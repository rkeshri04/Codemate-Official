import { app, BrowserWindow, globalShortcut } from 'electron';
import Store from 'electron-store';
import { isDev } from './util.js';
import { getPreloadPath, getUIPath } from './pathResolver.js';
import { createTray } from './tray.js';
import { createMenu } from './menu.js';
import { setupContextMenu } from './contextMenu.js';
import { setupWindowManager } from './windowManager.js';
import { setupWorkflowHandlers } from './handlers/workflowHandler.js';
import { setupCommandHandlers } from './handlers/commandHandlers.js';
import { setupScreenshotHandlers, takeAndSaveScreenshot } from './handlers/screenshotHandlers.js';

import fs from 'fs';
import path from 'path';

import pkg from 'electron-updater';
const { autoUpdater } = pkg;

// Migration from previous encryption key for added security
const storePath = path.join(app.getPath('userData'), 'user-preferences.json');

let store: Store<StoreSchema>;
try {
  store = new Store<StoreSchema>({
    name: 'user-preferences',
    encryptionKey: "superuimpor9403o4[[[r9iinfkit0t9riiujenggj]]]",
  });
} catch (e: any) {
  console.error('Failed to load store, attempting migration:', e);
  // Try to delete the old file if loading failed
  try {
    if (fs.existsSync(storePath)) {
      fs.unlinkSync(storePath);
    } else {
      console.log('Store file not found, creating new one...');
    }
    store = new Store<StoreSchema>({
      name: 'user-preferences',
      encryptionKey: process.env.encryptionKey,
    });
  } catch (deleteErr) {
    console.error('Failed to delete or recreate store:', deleteErr);
    // Consider notifying the user or quitting gracefully
    app.quit();
    // Throw error to prevent further execution if store is critical
    throw new Error("Failed to initialize persistent storage.");
  }
}

// Enable GlobalShortcutsPortal for Wayland sessions
app.commandLine.appendSwitch('enable-features', 'GlobalShortcutsPortal');

// --- Protocol Handler Setup ---
const PROTOCOL = 'codemate';
let openUrlOnReady: string | null = null;

if (process.defaultApp) {
  // In development, path will be electron, not app name
  if (process.argv.length >= 2) {
    // Correctly pass the main script argument
    const mainScriptArg = path.resolve(process.argv[1]);
    if (app.isPackaged === false) { // Double check we are in dev
        app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [mainScriptArg]);
    } else {
        // Fallback for packaged app if process.defaultApp is somehow true
        app.setAsDefaultProtocolClient(PROTOCOL);
    }
  } else {
    console.warn('[Protocol] Could not register DEV protocol client: process.argv too short.');
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL);
}

let mainWindow: BrowserWindow | null = null;

app.on('ready', async () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: getPreloadPath(),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: true,
    },
    width: 1200,
    height: 800,
    minWidth: 650,
    minHeight: 480,
    frame: true,
  });

  // Enable the default web contents context menu
  setupContextMenu(mainWindow);

  // Register global shortcuts
  registerGlobalShortcuts(mainWindow);

  // Set up the window manager (handles close events, etc.)
  const windowManager = setupWindowManager(mainWindow);

  mainWindow.webContents.on('did-finish-load', () => {
    if (openUrlOnReady && mainWindow) {
      mainWindow.webContents.send('protocol-url', openUrlOnReady);
      openUrlOnReady = null;
    }
  });

  if (isDev()) {
    mainWindow.loadURL('http://localhost:5123');
  } else {
    mainWindow.loadFile(getUIPath());
  }
  
  // Check for updates
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', () => {
    if (mainWindow) {
      mainWindow.webContents.send('update-available');
    }
  });
  autoUpdater.on('update-downloaded', () => {
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded');
    }
  });

  createMenu(mainWindow, store);

  // Setup IPC handlers
  setupWorkflowHandlers(mainWindow, store);
  setupCommandHandlers(mainWindow, store);
  setupScreenshotHandlers(mainWindow);

  createTray(mainWindow, store);

  // Clean up on app quit
  app.on('will-quit', () => {
    windowManager.cleanup();
    globalShortcut.unregisterAll(); // Ensure shortcuts are unregistered
  });
});

// macOS: handle codemate:// links
app.on('open-url', (event, urlLink) => {
  event.preventDefault();
  if (app.isReady() && mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    // Ensure webContents are available before sending
    if (mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
        mainWindow.webContents.send('protocol-url', urlLink);
    } else {
        console.warn('[Protocol] mainWindow.webContents not available in open-url, caching URL.');
        openUrlOnReady = urlLink; // Cache if webContents not ready
    }
  } else {
    openUrlOnReady = urlLink; // Cache the URL
  }
});

// Windows/Linux: handle codemate:// links when app is launched again
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, argv) => {
    const protocolUrl = argv.find(arg => arg.startsWith(PROTOCOL + '://'));
    
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      if (protocolUrl) {
        // Ensure webContents are available before sending
        if (mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
            mainWindow.webContents.send('protocol-url', protocolUrl);
        } else {
             console.warn('[Protocol] mainWindow.webContents not available in second-instance when sending URL.');
        }
      }
    } else {
        // This case might happen if the first instance is still initializing.
        // Cache the URL to be processed once mainWindow is ready.
        if (protocolUrl) {
            openUrlOnReady = protocolUrl;
        }
    }
  });
}

function registerGlobalShortcuts(mainWindow: BrowserWindow) {
  globalShortcut.unregisterAll(); // Clear existing shortcuts first

  // Register Screenshot Shortcut
  const ret = globalShortcut.register('CmdOrCtrl+Shift+S', async () => {
    await takeAndSaveScreenshot();
  });

  if (!ret) {
    console.error('Failed to register screenshot shortcut');
  } else {
  }
}