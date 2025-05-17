import { BrowserWindow, ipcMain, WebContents } from 'electron';
import Docker from 'dockerode';

export function isDev() {
  return process.env.NODE_ENV === 'development';
}

// Track which handlers have been registered to avoid duplicates
const registeredHandlers = new Set();

export function ipcMainHandle<K extends keyof EventPayloadMapping, T>(
  channel: K,
  handler: (data: EventPayloadMapping[K]) => Promise<T>
) {
  // Check if handler is already registered and remove it first
  if (registeredHandlers.has(channel)) {
    try {
      ipcMain.removeHandler(channel);
    } catch (e) {
      console.log(`Failed to remove existing handler for ${channel}`, e);
    }
  }
  
  // Register the handler and track it
  ipcMain.handle(channel, async (_event, data) => {
    return await handler(data);
  });
  
  registeredHandlers.add(channel);
}

export function ipcMainOn<K extends keyof EventPayloadMapping>(
  channel: K,
  handler: (data: EventPayloadMapping[K]) => void
) {
  // Remove all existing listeners to prevent duplicates
  ipcMain.removeAllListeners(channel);
  
  ipcMain.on(channel, (_event, data) => {
    handler(data);
  });
}

export function ipcWebContentsSend<K extends keyof EventPayloadMapping>(
  channel: K,
  webContents: WebContents,
  data: EventPayloadMapping[K]
) {
  webContents.send(channel, data);
}

export function getWorkflowsFromStore(store: any): Workflow[] {
  return store.get('workflows', []);
}

//commandHandlers.ts

export function isIdeCommand(command: string): boolean {
  const idePatterns = [
    /code/i, // VS Code
    /visual studio code/i,
    /vscode/i,
    /intellij/i, // IntelliJ
    /webstorm/i, // WebStorm
    /pycharm/i, // PyCharm
    /phpstorm/i, // PHPStorm
    /atom/i, // Atom
    /sublime/i, // Sublime Text
    /eclipse/i, // Eclipse
    /android studio/i // Android Studio
  ];
  
  return idePatterns.some(pattern => pattern.test(command));
}

const docker = new Docker(); // Uses default socket

// Helper to check if Docker is running
export async function isDockerRunning(mainWindow?: BrowserWindow): Promise<boolean> {
  try {
    await docker.version();
    return true;
  } catch (err: any) {

    if (mainWindow) {
      mainWindow.webContents.send('toast-notification', {
        type: 'error',
        message: `Docker check failed: ${err.code || err.message || 'Unknown error'}` 
      });
    }
    return false;
  }
}

// Helper to list containers
export async function listDockerContainers(all = false) {
  try {
    const containers = await docker.listContainers({ all });
    if (process.env.NODE_ENV !== 'production') {
      console.log('Docker containers:', containers);
    }
    return containers.map(c => ({
      Id: c.Id,
      Names: c.Names,
      Image: c.Image,
      State: c.State,
      Status: c.Status
    }));
  } catch (e) {
    return [];
  }
}

// Helper to start container
export async function startDockerContainer(containerId: string) {
  try {
    const container = docker.getContainer(containerId);
    await container.start();
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// Helper to stop container
export async function stopDockerContainer(containerId: string) {
  try {
    const container = docker.getContainer(containerId);
    await container.stop();
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

