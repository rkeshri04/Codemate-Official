import { BrowserWindow } from 'electron';
import Store from 'electron-store';
import { ipcMainHandle } from '../util.js';
import { refreshMenu } from '../menu.js';
import { refreshTray } from '../tray.js';


export function setupWorkflowHandlers(mainWindow: BrowserWindow, store: Store<StoreSchema>) {
  // Create a new workflow
  ipcMainHandle('createWorkflow', async (data: { name: string }) => {
    const workflows = store.get('workflows', []);
    const newWorkflow = {
      _id: Date.now().toString(),
      name: data.name,
      commands: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.set('workflows', [...workflows, newWorkflow]);
    refreshMenu();
    refreshTray();
    return { success: true, workflow: newWorkflow };
  });

  // Get all workflows
  ipcMainHandle('getUserWorkflows', async () => {
    const workflows = store.get('workflows', []);
    return { success: true, workflows };
  });

  // Get workflow by ID
  ipcMainHandle('getWorkflowById', async (data: { id: string }) => {
    const workflows = store.get('workflows', []);
    const workflow = workflows.find((t: any) => t._id === data.id);
    if (workflow) {
      return { success: true, workflow };
    }
    return { success: false, message: 'Workflow not found' };
  });

  // Update workflow commands
  ipcMainHandle('updateWorkflowCommands', async (data: { id: string; commands: any[] }) => {
    let workflows = store.get('workflows', []);
    const idx = workflows.findIndex((t: any) => t._id === data.id);
    if (idx !== -1) {
      workflows[idx].commands = data.commands;
      workflows[idx].updatedAt = new Date().toISOString();
      store.set('workflows', workflows);
      refreshMenu();
      refreshTray();
      return { success: true, workflow: workflows[idx] };
    }
    return { success: false, message: 'Workflow not found' };
  });

  // Delete workflow
  ipcMainHandle('deleteWorkflow', async (data: { id: string }) => {
    let workflows = store.get('workflows', []);
    workflows = workflows.filter((t: any) => t._id !== data.id);
    store.set('workflows', workflows);
    refreshMenu();
    refreshTray();
    return { success: true };
  });

  // Update workflow order
  ipcMainHandle('updateWorkflowOrder', async (data: { workflowIds: string[] }) => {
    let workflows = store.get('workflows', []);
    // Only include workflows that exist, and filter out undefined
    const reordered = data.workflowIds
      .map(id => workflows.find((w: any) => w._id === id))
      .filter((w): w is Workflow => Boolean(w));
    store.set('workflows', reordered);
    refreshMenu();
    refreshTray();
    return { success: true, workflows: reordered };
  });

  // Update workflow favorite (optional, if you have this field)
  ipcMainHandle('updateWorkflowFavorite', async (data: { id: string; isFavorite: boolean }) => {
    let workflows = store.get('workflows', []);
    const idx = workflows.findIndex((t: any) => t._id === data.id);
    if (idx !== -1) {
      workflows[idx].isFavorite = data.isFavorite;
      store.set('workflows', workflows);
      refreshMenu();
      refreshTray();
      return { success: true, workflow: workflows[idx] };
    }
    return { success: false, message: 'Workflow not found' };
  });

  // Run workflow by ID (local/offline)
  ipcMainHandle('runWorkflow', async (data: { id?: string; workflowId?: string }) => {
    // Accept both { id } and { workflowId } for compatibility
    const workflowId = data.id || data.workflowId;
    if (!workflowId) return { success: false, message: 'Workflow ID is required' };
    const { executeWorkflowFromStore } = await import('./commandHandlers.js');
    return await executeWorkflowFromStore(workflowId, store, mainWindow);
  });
}
