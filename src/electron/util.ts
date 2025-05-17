import { ipcMain, WebContents } from 'electron';

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


// Helper to check for network errors
export const isNetworkError = (error: any): boolean => {
  return (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ENOTFOUND' ||
    error.message?.includes('Network Error') ||
    error.message?.includes('connect ECONNREFUSED') ||
    error.message?.includes('timeout') ||
    (error.response === undefined && error.request !== undefined)
  );
};
