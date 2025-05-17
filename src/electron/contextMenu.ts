import { BrowserWindow, Menu, MenuItemConstructorOptions, clipboard } from 'electron';
import { ipcMainHandle } from './util.js';

let clipboardHistory: string[] = [];
let lastClipboardText = '';

export function setupContextMenu(mainWindow: BrowserWindow) {
  mainWindow.webContents.on('context-menu', (event, params) => {
    if (!params.isEditable) {
      return;
    }
    const { editFlags } = params;
    const template: MenuItemConstructorOptions[] = [];

    if (params.isEditable) {
      template.push(
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          enabled: editFlags.canCut,
          click: () => mainWindow.webContents.cut(),
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          enabled: editFlags.canCopy,
          click: () => mainWindow.webContents.copy(),
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          enabled: editFlags.canPaste,
          click: () => mainWindow.webContents.paste(),
        },
        { type: 'separator' },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          enabled: editFlags.canSelectAll,
          click: () => mainWindow.webContents.selectAll(),
        }
      );
    }

    if (template.length > 0) {
      Menu.buildFromTemplate(template).popup({ window: mainWindow });
    }
  });

  // Poll system clipboard for changes (even outside the app)
  setInterval(() => {
    try {
      const current = clipboard.readText();
      if (current && current !== lastClipboardText) {
        lastClipboardText = current;
        addToClipboardHistory(current);
      }
    } catch (err) {
      console.error('Error reading clipboard:', err);
    }
  }, 1000);

  ipcMainHandle('clipboardOperation', async (data: { operation: 'cut' | 'copy' | 'paste' | 'selectAll' }) => {
    try {
      switch (data.operation) {
        case 'cut':
          mainWindow.webContents.cut();
          break;
        case 'copy':
          mainWindow.webContents.copy();
          // Get selected text and add to clipboard history
          mainWindow.webContents.executeJavaScript('window.getSelection().toString()').then((text: string) => {
            if (text && text.trim()) {
              addToClipboardHistory(text);
            }
          });
          break;
        case 'paste':
          mainWindow.webContents.paste();
          break;
        case 'selectAll':
          mainWindow.webContents.selectAll();
          break;
      }
      return { success: true };
    } catch (error) {
      console.error('Clipboard operation error:', error);
      return { success: false, message: 'Failed to perform clipboard operation' };
    }
  });

  ipcMainHandle('getClipboardHistory' as any, async () => {
    return clipboardHistory;
  });

  ipcMainHandle('clearClipboardHistory' as any, async () => {
    clipboardHistory = [];
    return { success: true };
  });

  ipcMainHandle('copyClipboardItem' as any, async (data: { index: number }) => {
    try {
      const index = data.index;
      if (clipboardHistory[index]) {
        clipboard.writeText(clipboardHistory[index]);
        return { success: true };
      }
      return { success: false, message: 'Item not found in clipboard history' };
    } catch (err) {
      console.error('Error copying clipboard item:', err);
      return { success: false, message: 'Failed to copy item' };
    }
  });

  ipcMainHandle('showContextMenu', async () => {
    const menu = Menu.buildFromTemplate([
      { role: 'cut' as const },
      { role: 'copy' as const },
      { role: 'paste' as const },
      { type: 'separator' as const },
      { role: 'selectAll' as const },
    ]);
    menu.popup({ window: mainWindow });
    return { success: true };
  });
}

// Export function to add to clipboard history
export function addToClipboardHistory(text: string) {
  if (!text || !text.trim()) return;
  
  const trimmedText = text.trim();
  
  // Check if text already exists in history
  const existingIndex = clipboardHistory.findIndex(item => item === trimmedText);
  
  if (existingIndex !== -1) {
    // If exists, remove it from its current position
    clipboardHistory.splice(existingIndex, 1);
  }
  
  // Add to beginning
  clipboardHistory.unshift(trimmedText);
  
  // Keep only the most recent 20 items
  clipboardHistory = clipboardHistory.slice(0, 20);
}

export function getClipboardHistory() {
  return clipboardHistory;
}
