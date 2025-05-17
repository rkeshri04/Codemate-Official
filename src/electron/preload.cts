import { contextBridge, ipcRenderer, shell } from 'electron';

// Get user's preferred color scheme
const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;


// Listen for menu actions from the main process
ipcRenderer.on('menu-action', (event, action) => {
  // Dispatch a custom DOM event that React components can listen for
  document.dispatchEvent(new CustomEvent('menu-action', { detail: action }));
});

contextBridge.exposeInMainWorld('electron', {
  createWorkflow: (name: string) => ipcRenderer.invoke('createWorkflow', { name }),
  getUserWorkflows: () => ipcRenderer.invoke('getUserWorkflows'),
  getWorkflowById: (id: string) => ipcRenderer.invoke('getWorkflowById', { id }),
  updateWorkflowCommands: (id: string, commands: any[]) => ipcRenderer.invoke('updateWorkflowCommands', { id, commands }),
  deleteWorkflow: (id: string) => ipcRenderer.invoke('deleteWorkflow', { id }),
  updateWorkflowOrder: (workflowIds: string[]) => ipcRenderer.invoke('updateWorkflowOrder', { workflowIds }),
  updateWorkflowFavorite: (id: string, isFavorite: boolean) => ipcRenderer.invoke('updateWorkflowFavorite', { id, isFavorite }),

  // Execute command with optional working directory and commands array
  executeCommand: (data: { 
    type: 'app' | 'terminal' | 'url' | 'docker'; 
    command: string; 
    workingDirectory?: string;
    commands?: string[];
    useTerminalWindow?: boolean;
    containerId?: string; // Added for docker type
    dockerAction?: 'start' | 'stop'; // Added for docker type
  }) => 
    ipcRenderer.invoke('executeCommand', data), // Pass the whole data object
    
  // Select file dialog
  selectFile: () => 
    ipcRenderer.invoke('selectFile'),
    
  // Select folder dialog
  selectFolder: () => 
    ipcRenderer.invoke('selectFolder'),

  // Get installed applications
  getInstalledApps: () => ipcRenderer.invoke('get-installed-apps'),
  
  // Frame actions
  sendFrameAction: (payload: FrameWindowAction) => ipcRenderer.send('sendFrameAction', payload),
  
  // Theme detection
  prefersDarkMode: prefersDarkMode,
  
  // Subscribe to theme changes
  subscribeThemeChange: (callback: (isDark: boolean) => void) => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => callback(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  },
  
  // System monitoring
  getSystemStats: () => ipcRenderer.invoke('getSystemStats'),
  
  // Add a listener for system stats updates
  onSystemStatsUpdate: (callback: (stats: { cpuUsage: number, ramUsage: number }) => void) => {
    const listener = (_event: any, stats: { cpuUsage: number, ramUsage: number }) => {
      callback(stats);
    };
    
    ipcRenderer.on('system-stats-update', listener);
    
    // Return a function to remove the listener
    return () => {
      ipcRenderer.removeListener('system-stats-update', listener);
    };
  },
  
  // Context menu for text input fields
  showContextMenu: () => ipcRenderer.invoke('showContextMenu'),
  
  // Clipboard operations
  clipboardOperation: (operation: 'cut' | 'copy' | 'paste' | 'selectAll') => 
    ipcRenderer.invoke('clipboardOperation', { operation }),

  // Clipboard history methods
  getClipboardHistory: () => ipcRenderer.invoke('getClipboardHistory'),
  clearClipboardHistory: () => ipcRenderer.invoke('clearClipboardHistory'),
  copyClipboardItem: (index: number) => ipcRenderer.invoke('copyClipboardItem', { index }),
  
  // --- Add listener for workflow step updates ---
  onWorkflowStepUpdate: (callback: (data: { commandId: string | null }) => void) => {
    const listener = (_event: any, data: { commandId: string | null }) => {
      // --- Add Logging ---
      console.log('[IPC Receive Preload] workflow-step-update:', data);
      // --- End Logging ---
      callback(data);
    };
    ipcRenderer.on('workflow-step-update', listener);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('workflow-step-update', listener);
    };
  },
  // --- End listener ---

  // Add menu event listener
  onMenuAction: (callback: (action: string) => void) => {
    console.log('Registering menu action listener');
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log('Menu action event received:', customEvent.detail);
      callback(customEvent.detail);
    };
    
    document.addEventListener('menu-action', handler);
    
    // Return cleanup function
    return () => {
      document.removeEventListener('menu-action', handler);
    };
  },

  // Expose ipcRenderer for sending messages directly
  ipcRenderer: {
    on: (channel: string, callback: (...args: any[]) => void) => {
      const validChannels = ['create-new-workflow', 'run-selected-workflow', 'toggle-sidebar', 
        'toggle-theme', 'menu-action', 'open-terminal', 'add-action-to-workflow', 'show-keyboard-shortcuts'];
      if (validChannels.includes(channel)) {
        const newCallback = (_: any, ...args: any[]) => callback(...args);
        ipcRenderer.on(channel, newCallback);
        return () => ipcRenderer.removeListener(channel, newCallback);
      }
      return () => {};
    },
    send: (channel: string, data?: any) => {
      const validChannels = ['open-terminal'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    }
  },

  // Docker functions
  dockerStatus: () => ipcRenderer.invoke('docker-status'),
  dockerListContainers: (options: { all: boolean }) => ipcRenderer.invoke('docker-list-containers', options),
  dockerStartContainer: (options: { id: string }) => ipcRenderer.invoke('docker-start-container', options),
  dockerStopContainer: (options: { id: string }) => ipcRenderer.invoke('docker-stop-container', options),

  // Add offline workflow creation
  createWorkflowOffline: (name: string) => 
    ipcRenderer.invoke('createWorkflowOffline', { name }),
    
  syncOfflineWorkflows: () => 
    ipcRenderer.invoke('syncOfflineWorkflows'),

  // Run a workflow by ID
  runWorkflow: (id: string) => ipcRenderer.invoke('runWorkflow', { id }),

  // Add this line to expose trending/news fetch to renderer
  getTrendingContent: () => ipcRenderer.invoke('getTrendingContent'),
  getTimeSavedSeconds: () => ipcRenderer.invoke('getTimeSavedSeconds'),
});

// Set up listeners for menu actions
contextBridge.exposeInMainWorld('menuActions', {
  onCreateNewWorkflow: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('create-new-workflow', listener);
    return () => ipcRenderer.removeListener('create-new-workflow', listener);
  },
  
  onToggleTheme: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('toggle-theme', listener);
    return () => ipcRenderer.removeListener('toggle-theme', listener);
  },
  
  onToggleSidebar: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('toggle-sidebar', listener);
    return () => ipcRenderer.removeListener('toggle-sidebar', listener);
  },
  
  onRunCurrentWorkflow: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('run-current-workflow', listener);
    return () => ipcRenderer.removeListener('run-current-workflow', listener);
  },
  
  onEditCurrentWorkflow: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('edit-current-workflow', listener);
    return () => ipcRenderer.removeListener('edit-current-workflow', listener);
  },
  
  onAddActionToWorkflow: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('add-action-to-workflow', listener);
    return () => ipcRenderer.removeListener('add-action-to-workflow', listener);
  },
  
  onShowKeyboardShortcuts: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('show-keyboard-shortcuts', listener);
    return () => ipcRenderer.removeListener('show-keyboard-shortcuts', listener);
  },

});

// Listen for menu actions
ipcRenderer.on('create-new-workflow', () => {
  document.dispatchEvent(new CustomEvent('menu-new-workflow'));
});

ipcRenderer.on('run-selected-workflow', () => {
  document.dispatchEvent(new CustomEvent('menu-run-workflow'));
});

ipcRenderer.on('toggle-sidebar', () => {
  document.dispatchEvent(new CustomEvent('menu-toggle-sidebar'));
});

ipcRenderer.on('toggle-theme', () => {
  document.dispatchEvent(new CustomEvent('menu-toggle-theme'));
});

// Set up context menu for text fields
document.addEventListener('DOMContentLoaded', () => {
  const handleContextMenu = (e: MouseEvent) => {
    // Only show for text input elements
    const target = e.target as HTMLElement;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (document.activeElement && (document.activeElement as HTMLElement).isContentEditable)
    ) {
      e.preventDefault();
      ipcRenderer.invoke('showContextMenu');
    }
  };
  
  document.addEventListener('contextmenu', handleContextMenu);
});

// Add keyboard event listeners to handle common shortcuts
document.addEventListener('keydown', (e) => {
  // Only handle if Ctrl or Cmd is pressed
  if (e.ctrlKey || e.metaKey) {
    // Handle common shortcuts
    switch (e.key.toLowerCase()) {
      case 'c':
        // Only enable copy on input fields or if there is selected text within an input
        if (document.activeElement instanceof HTMLInputElement || 
            document.activeElement instanceof HTMLTextAreaElement ||
            (document.activeElement && (document.activeElement as HTMLElement).isContentEditable)) {
          ipcRenderer.invoke('clipboardOperation', { operation: 'copy' });
        }
        break;
      case 'v':
        if (document.activeElement instanceof HTMLInputElement || 
            document.activeElement instanceof HTMLTextAreaElement ||
            (document.activeElement && (document.activeElement as HTMLElement).isContentEditable)) {
          ipcRenderer.invoke('clipboardOperation', { operation: 'paste' });
        }
        break;
      case 'x':
        if (document.activeElement instanceof HTMLInputElement || 
            document.activeElement instanceof HTMLTextAreaElement ||
            (document.activeElement && (document.activeElement as HTMLElement).isContentEditable)) {
          ipcRenderer.invoke('clipboardOperation', { operation: 'cut' });
        }
        break;
      case 'a':
        // Only allow select all in input fields
        if (document.activeElement instanceof HTMLInputElement || 
            document.activeElement instanceof HTMLTextAreaElement ||
            (document.activeElement && (document.activeElement as HTMLElement).isContentEditable)) {
          ipcRenderer.invoke('clipboardOperation', { operation: 'selectAll' });
        }
        break;
    }
  }
});


