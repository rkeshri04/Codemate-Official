import { BrowserWindow, Menu, app, shell, MenuItemConstructorOptions } from 'electron';
import { isDev } from './util.js';
import { executeWorkflowFromStore } from './handlers/commandHandlers.js';
import { takeAndSaveScreenshot } from './handlers/screenshotHandlers.js'; // Updated import

// Store reference for refresh
let _mainWindow: BrowserWindow;
let _store: any;

export function createMenu(mainWindow: BrowserWindow, store: any) {
  _mainWindow = mainWindow;
  _store = store;

  refreshMenu();
  setInterval(refreshMenu, 2000);

  mainWindow.webContents.on('ipc-message', (event, channel) => {
    switch (channel) {
      case 'run-current-workflow':
        break;
    }
  });
}

export function refreshMenu() {
  if (!_mainWindow || !_store) return;
  const workflows: Workflow[] = _store.get('workflows', []) || [];
  const isMac = process.platform === 'darwin';
  const appName = 'Codemate';

  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{
      label: appName,
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const }
      ]
    }] : []),
    {
      label: 'Workflow',
      submenu: [
        {
          label: 'New Workflow',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            _mainWindow.webContents.send('menu-action', 'new-workflow');
          }
        },
        { type: 'separator' as const },
        {
          label: 'Run Selected Workflow',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            _mainWindow.webContents.send('menu-action', 'run-workflow');
          }
        },
        {
          label: 'Run Workflow',
          submenu: workflows.length
            ? workflows.map((workflow) => ({
                label: workflow.name,
                enabled: !!workflow._id,
                click: async () => {
                  console.log('[Menu] Run Workflow clicked:', workflow._id, workflow.name);
                  _mainWindow.webContents.send('menu-workflow-execution-started', workflow._id);
                  if (typeof workflow._id === 'string') {
                    await executeWorkflowFromStore(workflow._id, _store, _mainWindow);
                  } else {
                    console.error('Workflow ID is not a string:', workflow._id);
                  }
                },
              }))
            : [{ label: 'No workflows', enabled: false }],
        },
        { type: 'separator' as const },
        {
          label: 'Take Screenshot',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: async () => {
            console.log('[Menu] Take Screenshot clicked');
            try {
              await takeAndSaveScreenshot(); // Call the function directly
            } catch (error) {
              console.error('Error taking screenshot from menu:', error);
            }
          }
        },
        { type: 'separator' as const },
        ...(!isMac ? [{ role: 'quit' as const }] : [])
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            _mainWindow.webContents.send('menu-action', 'toggle-sidebar');
          }
        },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const },
        ...(isDev() ? [
          { type: 'separator' as const },
          { role: 'toggleDevTools' as const },
          { role: 'reload' as const },
          { role: 'forceReload' as const },
        ] : [])
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' as const },
        { role: 'zoom' as const },
        ...(isMac ? [
          { type: 'separator' as const },
          { type: 'separator' as const },
        ] : [
          { role: 'close' as const }
        ])
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click: () => shell.openExternal('https://github.com/rkeshri/codemate')
        },
        {
          label: 'Documentation',
          click: () => shell.openExternal('https://github.com/rkeshri/codemate/wiki')
        },
        {
          label: 'Report Issues',
          click: () => shell.openExternal('https://github.com/rkeshri/codemate/issues')
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
