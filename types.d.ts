type FrameWindowAction = 'minimize' | 'maximize' | 'close';
type CommandType = 'app' | 'terminal' | 'url' | 'docker';

type ConfirmModalProps =
  | {
      // Logout modal props
      type: 'logout';
      isOpen: boolean;
      onConfirm: () => void;
      onCancel: () => void;
    }
  | {
      // Delete modal props
      type: 'delete';
      isOpen: boolean;
      itemName: string;
      onConfirm: () => void;
      onCancel: () => void;
    };

type ThemeContextType = {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
};

type User = {
  id: string;
  email: string;
  name: string;
};

type AuthResponse = {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
};

type SignUpData = {
  email: string;
  password: string;
  name: string;
};

type SignInData = {
  email: string;
  password: string;
};

interface SystemInfo {
  totalMemoryMB: number;
}

type WorkflowItem = {
  id: string;
  text: string;
  completed: boolean;
};

type EventPayloadMapping = {
  statistics: Statistics;
  getStaticData: null;
  changeView: View;
  sendFrameAction: FrameWindowAction;
  signUp: SignUpData;
  signIn: SignInData;
  verifyToken: string;

  saveAuthToken: string;
  checkEmail: { email: string };
  'restore-auth-token': string;

  createWorkflow: { token: string; name: string };
  getUserWorkflows: string;
  updateWorkflowVisibility: { token: string; visible: boolean };
  getWorkflowVisibility: string;
  deleteWorkflow: { token: string, id: string };

  getWorkflowById: { token: string, id: string };
  updateWorkflowCommands: { token: string, id: string, commands: CommandItem[] };
  executeCommand: { 
    type: CommandType;
    command: string;
    commands?: string[];
    workingDirectory?: string;
    useTerminalWindow?: boolean;
    containerId?: string;
    dockerAction?: 'start' | 'stop';
  };
  selectFile: null;
  selectFolder: null;

  showContextMenu: null;

  getSystemStats: null;
  'system-stats-update': { 
    cpuUsage: number; 
    ramUsage: number; 
    systemInfo?: SystemInfo;
  };

  clipboardOperation: { operation: 'cut' | 'copy' | 'paste' | 'selectAll' };

  updateWorkflowOrder: { token: string; workflowIds: string[] };

  runWorkflow: { authToken: string; workflowId: string };

  updateWorkflowFavorite: {
    token: string;
    id: string;
    isFavorite: boolean;
  };

  'docker-status': null;
  'docker-list-containers': { all: boolean };
  'docker-start-container': { id: string };
  'docker-stop-container': { id: string };

  'getClipboardHistory': null;
  'clearClipboardHistory': null;
  'copyClipboardItem': { index: number };
};

type CommandRunResult = {
  id: string;
  success: boolean;
  message?: string;
};

type WorkflowRunResult = {
  success: boolean;
  message?: string;
  results?: CommandRunResult[]; 
  offline?: boolean; 
};

//Interfaces

interface StoreSchema {
  authToken?: string;
  user?: User;
  workflows?: Workflow[];
}

interface Window {
    electron: {
      signUp: (userData: SignUpData) => Promise<AuthResponse>;
      signIn: (credentials: SignInData) => Promise<AuthResponse>;
      verifyToken: (token: string) => Promise<AuthResponse & { potentialOffline?: boolean; offlineMode?: boolean; user?: User }>;
      createWorkflow: (name: string) => Promise<{ success: boolean; workflow?: Workflow; message?: string }>;
      getUserWorkflows: () => Promise<{ success: boolean; workflows?: Workflow[]; message?: string; offline?: boolean }>;
      updateWorkflowVisibility: (token: string, visible: boolean) => Promise<{ success: boolean; message?: string }>;
      getWorkflowVisibility: (token: string) => Promise<{ success: boolean; workflowsVisible: boolean; message?: string }>;
      updateWorkflowOrder: (workflowIds: string[]) => Promise<{ success: boolean; message?: string }>;
      updateWorkflowFavorite: (id: string, isFavorite: boolean) => Promise<{ success: boolean; message?: string }>;
      getWorkflowById: (id: string) => Promise<{ success: boolean; workflow?: Workflow; message?: string; offline?: boolean }>;
      getInstalledApps: (forceRefresh?: boolean) => Promise<{ success: boolean; apps?: InstalledApp[]; message?: string }>;
      updateWorkflowCommands: (id: string, commands: CommandItem[]) => Promise<{ success: boolean; message?: string }>;
      executeCommand: (payload: {
        type: CommandType;
        command: string;
        workingDirectory?: string;
        commands?: string[];
        useTerminalWindow?: boolean;
        containerId?: string;
        dockerAction?: 'start' | 'stop';
      }) => Promise<{
        success: boolean;
        message?: string;
        results?: any[];
      }>;
      selectFile: () => Promise<{ success: boolean; filePath?: string }>;
      selectFolder: () => Promise<{ success: boolean; folderPath?: string }>;
      runWorkflow: (id: string) => Promise<WorkflowRunResult>; // <-- Update return type
      onMenuAction: (callback: (action: string) => void) => () => void;
      ipcRenderer: {
        on: (channel: string, callback: (...args: any[]) => void) => () => void;
        send: (channel: string, data?: any) => void;
      };
      deleteWorkflow: (id: string) => Promise<{ success: boolean; message?: string }>;
      onRestoreAuthToken: (callback: (data: { token: string, user?: User }) => void) => () => void;
      saveAuthToken: (token: string) => Promise<void>;
      onSystemStatsUpdate: any;
      getSystemStats: () => Promise<{
        success: boolean;
        cpuUsage?: number;
        ramUsage?: number;
        systemInfo?: {
          totalMemoryMB?: number;
        };
        message?: string;
      }>;
      dockerStatus: () => Promise<{ running: boolean }>;
      dockerListContainers: (options: { all: boolean }) => Promise<{ containers: any[] }>;
      dockerStartContainer: (options: { id: string }) => Promise<{ success: boolean; message?: string }>;
      dockerStopContainer: (options: { id: string }) => Promise<{ success: boolean; message?: string }>;
  
      // Clipboard history methods
      getClipboardHistory: () => Promise<string[]>;
      clearClipboardHistory: () => Promise<{ success: boolean }>;
      copyClipboardItem: (index: number) => Promise<{ success: boolean }>;
  
      getAnalytics: (token: string) => Promise<{
        totalWorkflows: number;
        completedWorkflows: number;
        favoriteWorkflows: number;
        totalCommands: number;
        mostCommonCommandType: string | null;
        mostCommonCommandTypeCount?: number;
        launchesPerWorkflow?: { [workflowId: string]: number };
        mostLaunchedWorkflowId?: string | null;
        mostLaunchedWorkflowName?: string | null;
        mostLaunchedWorkflowCount?: number;
        success?: boolean;
        message?: string;
      }>;
      getWorkflowsForTrayMenu: () => Promise<{ success: boolean; workflows: Workflow[]; message?: string }>;
      executeWorkflowFromTray: (workflowId: string) => Promise<WorkflowRunResult>; 
      onWorkflowStepUpdate: (callback: (data: { commandId: string | null }) => void) => () => void; 
    };
}
  
interface User {
  id: string;
  name: string;
  email: string;
}

interface Workflow {
  _id: string;
  name: string;
  commands: CommandItem[];
  createdAt: Date | string;
  updatedAt?: Date | string;
  isFavorite?: boolean;
  order?: number;
}

interface CommandItem {
  id: string; 
  type: 'app' | 'terminal' | 'url' | 'docker'; 
  command: string;
  commands?: string[];
  description?: string;
  workingDirectory?: string;
  useTerminalWindow?: boolean;
  containerId?: string; 
  dockerAction?: 'start' | 'stop';
  delaySeconds?: number;
}

interface Repository {
  name: string;
  owner: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  url: string;
}

interface NewsItem {
  title: string;
  source: string;
  description: string;
  url: string;
  published_at: string;
}

interface DashboardItemsContext {
  workflows: Workflow[];
  setWorkflows: React.Dispatch<React.SetStateAction<Workflow[]>>;
  isLoading: boolean;
}

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  danger?: boolean;
  icon?: React.ReactNode;
}

interface DashboardProps {
  user: User | null;
  // onLogout: () => void;
}

interface InstalledApp {
  name: string;
  path: string;
  icon?: string;
}

interface WorkflowDetailProps {
  authToken: string;
}

interface WorkflowCreationModalProps {
  onClose: () => void;
  onWorkflowCreated: (workflow: Workflow) => void;
}

interface SidebarContentProps {
  workflows: Workflow[];
  isLoading: boolean;
  sidebarCollapsed: boolean;
  workflowsVisible: boolean;
  toggleWorkflowsVisibility: () => void;
  handleWorkflowClick: (workflowId: string) => void;
  handleWorkflowReorder: (result: any) => void;
  handleToggleFavorite: (workflowId: string) => void;
  handleDeleteClick: (workflowId: string) => void;
  handleRunWorkflow: (workflowId: string) => void;
  clipboardHistory: string[];
  handleClipboardClick: (idx: number) => void;
}
