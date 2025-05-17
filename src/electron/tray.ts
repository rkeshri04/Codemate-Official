import { BrowserWindow, Menu, Tray, app, clipboard, Notification } from 'electron';
import { getAssetPath } from './pathResolver.js';
import path from 'path';
import { getClipboardHistory, addToClipboardHistory } from './contextMenu.js';
import { executeWorkflowFromStore } from './handlers/commandHandlers.js';
import { takeAndSaveScreenshot } from './handlers/screenshotHandlers.js'; // Updated import

let tray: Tray | null = null;
let _mainWindow: BrowserWindow;
let _store: any;

export function createTray(mainWindow: BrowserWindow, store: any) {
  _mainWindow = mainWindow;
  _store = store;

  tray = new Tray(
    path.join(
      getAssetPath(),
      process.platform === 'darwin' ? 'trayIconTemplate.png' : 'trayIcon.png'
    )
  );

  refreshTray();

  // Poll clipboard even when app is in background
  let lastClipboardContent = clipboard.readText();
  const clipboardWatcher = setInterval(() => {
    try {
      const currentContent = clipboard.readText();
      if (currentContent && currentContent !== lastClipboardContent) {
        lastClipboardContent = currentContent;
        addToClipboardHistory(currentContent);
        refreshTray();
      }
    } catch (err) {
      console.error('Error checking clipboard in tray:', err);
    }
  }, 1000);

  // Rebuild menu on clipboard or workflows change
  setInterval(refreshTray, 2000);

  // Clean up on app exit
  app.on('before-quit', () => {
    clearInterval(clipboardWatcher);
  });
}

export function refreshTray() {
  if (!tray || !_mainWindow || !_store) return;
  const clipboardHistory = getClipboardHistory();
  const workflows: Workflow[] = _store.get('workflows', []) || [];

  const menu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        _mainWindow.show();
        if (app.dock) app.dock.show();
      },
    },
    {
      label: 'Run Workflow',
      submenu: workflows.length
        ? workflows.map((workflow) => ({
            label: workflow.name,
            enabled: !!workflow._id,
            click: async () => {
              console.log('[Tray] Run Workflow clicked:', workflow._id, workflow.name);
              _mainWindow.webContents.send('tray-workflow-execution-started', workflow._id);
              if (typeof workflow._id === 'string') {
                await executeWorkflowFromStore(workflow._id, _store, _mainWindow);
              } else {
                console.error('Workflow ID is not a string:', workflow._id);
              }
            },
          }))
        : [{ label: 'No workflows', enabled: false }],
    },
    {
      label: 'Clipboard History',
      submenu: clipboardHistory.length
        ? clipboardHistory.map((item, idx) => ({
            label: item.length > 40 ? item.slice(0, 40) + '...' : item,
            click: () => {
              clipboard.writeText(item);
              new Notification({ title: 'Clipboard', body: 'Text copied to clipboard' }).show();
            },
          }))
        : [{ label: 'No items', enabled: false }],
    },
    { type: 'separator' },
    {
      label: 'Take Screenshot',
      click: async () => {
        console.log('[Tray] Take Screenshot clicked');
        try {
          await takeAndSaveScreenshot(); // Call the function directly
        } catch (error) {
          console.error('Error taking screenshot from tray:', error);
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit(),
    },
  ]);
  tray.setContextMenu(menu);
}
