import React, { useState, useEffect, useCallback, useRef } from 'react'; // Add useRef
import { useParams } from 'react-router-dom';
import { 
  FiPlay, FiTerminal, FiPlusCircle, 
  FiTrash2, FiPlayCircle, FiLoader, FiEdit, FiHome, FiX, FiRefreshCw, FiLink, FiFile,
  FiChevronDown, FiChevronUp, FiDownload, FiClock, FiPlus, FiPauseCircle, FiCopy
} from 'react-icons/fi';
import { FaDocker } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './WorkflowDetail.css';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { executeWorkflow } from '../../services/commandHandler';

// Add CSS-in-JS for hover effect (or add to your CSS file)
const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0.5rem 0',
  opacity: 1,
  transition: 'opacity 0.2s'
};

const hiddenRowStyle: React.CSSProperties = {
  ...actionRowStyle,
  opacity: 0,
  pointerEvents: 'none'
};

const ActionModal = React.memo(({
  newCommand, 
  editingCommandId,
  handleCommandTypeChange,
  handleCommandChange,
  browseForPath,
  browseForWorkingDirectory,
  handleUseTerminalWindowChange,
  cancelCommandForm,
  addCommand,
  isSaving,
  dockerStatus,
  dockerContainers,
  selectedDockerContainerId,
  setSelectedDockerContainerId,
  dockerAction,
  setDockerAction,
  refreshDockerContainers,
  installedApps,
  isLoadingApps,
  handleAppSelection // This handler now receives the full app object or null
}: {
  newCommand: CommandItem;
  editingCommandId: string | null;
  handleCommandTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleCommandChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  browseForPath: () => Promise<void>;
  browseForWorkingDirectory: () => Promise<void>;
  handleUseTerminalWindowChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cancelCommandForm: () => void;
  addCommand: () => Promise<void>;
  isSaving: boolean;
  dockerStatus: { running: boolean };
  dockerContainers: any[];
  selectedDockerContainerId: string | null;
  setSelectedDockerContainerId: (id: string) => void;
  dockerAction: 'start' | 'stop';
  setDockerAction: (action: 'start' | 'stop') => void;
  refreshDockerContainers: () => void;
  installedApps: InstalledApp[];
  isLoadingApps: boolean;
  handleAppSelection: (app: InstalledApp | null) => void; // Update handler signature
}) => {
  const [isAppDropdownOpen, setIsAppDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for click outside detection

  // Find the selected app details for displaying icon/name
  const selectedApp = installedApps.find(app => app.path === newCommand.command);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAppDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => setIsAppDropdownOpen(!isAppDropdownOpen);

  const selectApp = (app: InstalledApp | null) => {
    handleAppSelection(app);
    setIsAppDropdownOpen(false);
  };

  return (
    <div className="action-modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) cancelCommandForm();
    }}>
      <div className="action-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="action-modal-header">
          <h3>{editingCommandId ? "Edit Action" : "Add New Action"}</h3>
          <button className="close-modal-btn" onClick={cancelCommandForm}>
            <FiX size={20} />
          </button>
        </div>
        
        <div className="form-group">
          <label>Action Type</label>
          <select 
            value={newCommand.type} 
            onChange={handleCommandTypeChange}
          >
            <option value="app">Open Application</option>
            <option value="terminal">Run Terminal Command</option>
            <option value="docker">Run Docker Container</option>
            <option value="url">Open URL</option>
          </select>
        </div>
        
        {/* Conditional rendering for Action Types */}
        {newCommand.type === 'app' ? (
          <div className="form-group">
            <label>Application</label>
            {isLoadingApps ? (
              <div className="loading-apps">Loading applications... <FiLoader className="spin-icon" /></div>
            ) : (
              <div className="app-selection-container" ref={dropdownRef}>
                {/* Custom Dropdown Trigger */}
                <button type="button" className="custom-dropdown-trigger" onClick={toggleDropdown}>
                  <span className="selected-app-display">
                    {/* {selectedApp?.icon && <img src={selectedApp.icon} alt="" className="selected-app-icon" />} */}
                    <span>{selectedApp?.name || "Select from list or browse"}</span>
                  </span>
                  {isAppDropdownOpen ? <FiChevronUp /> : <FiChevronDown />}
                </button>

                {/* Custom Dropdown List */}
                {isAppDropdownOpen && (
                  <div className="custom-dropdown-list">
                    {installedApps.length > 0 ? (
                      installedApps.map((app) => (
                        <div
                          key={app.path}
                          className={`custom-dropdown-item ${newCommand.command === app.path ? 'selected' : ''}`}
                          onClick={() => selectApp(app)}
                        >
                          {/* Only show icon if present */}
                          {/* {app.icon && <img src={app.icon} alt="" className="dropdown-item-icon" />} */}
                          <span className="dropdown-item-name">{app.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="custom-dropdown-item disabled">No applications found</div>
                    )}
                  </div>
                )}

                {/* Manual Path Input and Browse */}
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                   <input
                     type="text"
                     name="command"
                     value={newCommand.command}
                     onChange={handleCommandChange}
                     placeholder="Or enter/browse application path"
                     style={{ flexGrow: 1, marginRight: '8px' }}
                   />
                   <button type="button" className="browse-btn" onClick={browseForPath} title="Browse for application path">
                     <FiFile />
                   </button>
                </div>
                {installedApps.length === 0 && !isLoadingApps && (
                   <p className="no-apps-found" style={{marginTop: '8px'}}>Could not auto-detect applications. Please browse or enter the path manually.</p>
                )}
              </div>
            )}
          </div>
        ) : newCommand.type === 'terminal' ? (
          <div className="form-group command-input-group">
            <label>Terminal Commands</label>
            <textarea
              name="command"
              value={newCommand.command}
              onChange={handleCommandChange}
              placeholder="Enter one command per line. Commands will run in sequence."
              rows={5}
            />
          </div>
        ) : newCommand.type === 'url' ? (
          <div className="form-group command-input-group">
            <label>URL</label>
            <input
              type="text"
              name="command"
              value={newCommand.command}
              onChange={handleCommandChange}
              placeholder={'https://example.com'}
            />
          </div>
        ) : null /* Docker type has its own section */}

        {(newCommand.type === 'app' || newCommand.type === 'terminal') && (
          <div className="form-group command-input-group">
            <label>Working Directory (Optional)</label>
            <input
              type="text"
              name="workingDirectory"
              value={newCommand.workingDirectory || ''}
              onChange={handleCommandChange}
              placeholder="Select a working folder"
            />
            <button className="browse-btn" onClick={browseForWorkingDirectory}>
              <FiHome />
            </button>
          </div>
        )}
        
        {newCommand.type === 'terminal' && (
          <div className="toggle-switch-container">
            <label className="toggle-switch-label">
              <span className="toggle-switch">
                <input
                  type="checkbox"
                  name="useTerminalWindow"
                  checked={newCommand.useTerminalWindow || false}
                  onChange={handleUseTerminalWindowChange}
                />
                <span className="toggle-slider"></span>
              </span>
              Open in Terminal Window
            </label>
            <small>When enabled, commands will run in a new terminal window</small>
          </div>
        )}

        {newCommand.type === 'docker' && (
          <div>
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
              <span>
                Docker status:{" "}
                <span style={{ color: dockerStatus.running ? 'green' : 'red', fontWeight: 'bold' }}>
                  {dockerStatus.running ? 'Running' : 'Not Running'}
                </span>
              </span>
              <button
                style={{
                  marginLeft: 8,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
                onClick={refreshDockerContainers}
                title="Refresh Docker containers"
                type="button"
              >
                <FiRefreshCw size={18} />
              </button>
            </div>
            {!dockerStatus.running ? (
              <div style={{ color: 'red', marginBottom: 8 }}>
                Docker is not running. Please start Docker to use this action.
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label>Container</label>
                  <select
                    value={selectedDockerContainerId || ''}
                    onChange={e => setSelectedDockerContainerId(e.target.value)}
                  >
                    <option value="">Select a container</option>
                    {dockerContainers.map(c => (
                      <option key={c.Id} value={c.Id}>
                        {c.Names?.[0]?.replace(/^\//, '') || c.Id.slice(0, 12)} ({c.Image}) [{c.State}]
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Action</label>
                  <select
                    value={dockerAction}
                    onChange={e => setDockerAction(e.target.value as 'start' | 'stop')}
                  >
                    <option value="start">Start</option>
                    <option value="stop">Stop</option>
                  </select>
                </div>
              </>
            )}
          </div>
        )}
        
        <div className="form-group">
          <label>Description (Optional)</label>
          <input
            type="text"
            name="description"
            value={newCommand.description || ''}
            onChange={handleCommandChange}
            placeholder="Enter a brief description"
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-btn"
            onClick={cancelCommandForm}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="save-btn"
            onClick={addCommand}
            disabled={
              !(
                (newCommand.type === 'docker'
                  ? dockerStatus.running && selectedDockerContainerId && dockerAction
                  : newCommand.command.trim()
                ) && !isSaving
              )
            }
          >
            {isSaving ? 'Saving...' : (editingCommandId ? 'Update' : 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
});

// Add this new modal for editing delay
const DelayModal = ({
  isOpen,
  delaySeconds,
  onSave,
  onCancel,
}: {
  isOpen: boolean;
  delaySeconds: number;
  onSave: (seconds: number) => void;
  onCancel: () => void;
}) => {
  const [value, setValue] = useState(delaySeconds);

  useEffect(() => {
    setValue(delaySeconds);
  }, [delaySeconds]);

  if (!isOpen) return null;
  return (
    <div className="action-modal-overlay" onClick={onCancel}>
      <div className="action-modal-content" onClick={e => e.stopPropagation()}>
        <div className="action-modal-header">
          <h3>Edit Delay</h3>
          <button className="close-modal-btn" onClick={onCancel}><FiX size={20} /></button>
        </div>
        <div className="form-group">
          <label>Delay (seconds)</label>
          <input
            type="number"
            min={0}
            value={value}
            onChange={e => setValue(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div className="form-actions">
          <button className="cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="save-btn" onClick={() => onSave(value)} disabled={value < 0}>Save</button>
        </div>
      </div>
    </div>
  );
};

// Helper function to normalize URL
const normalizeUrl = (url: string): string => {
  url = url.trim();
  if (!url) return '';
  if (!/^(https?:\/\/)/i.test(url)) {
    return `https://${url}`;
  }
  return url;
};

const WorkflowDetail: React.FC<WorkflowDetailProps> = () => {
  const { id } = useParams<{ id: string }>();  
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commands, setCommands] = useState<CommandItem[]>([]);
  const [newCommand, setNewCommand] = useState<CommandItem>({
    id: '',
    type: 'app',
    command: '',
    description: '',
    workingDirectory: '',
    useTerminalWindow: false,
    delaySeconds: undefined,
  });
  const [showCommandForm, setShowCommandForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [runningCommandId, setRunningCommandId] = useState<string | null>(null);
  const [executionResults, setExecutionResults] = useState<{[id: string]: {success: boolean, message?: string, results?: any}}>({});
  const [editingCommandId, setEditingCommandId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Docker state
  const [dockerStatus, setDockerStatus] = useState<{ running: boolean }>({ running: false });
  const [dockerContainers, setDockerContainers] = useState<any[]>([]);
  const [selectedDockerContainerId, setSelectedDockerContainerId] = useState<string | null>(null);
  const [dockerAction, setDockerAction] = useState<'start' | 'stop'>('start');

  // State for installed applications
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);

  // Delay modal state
  const [delayModalIndex, setDelayModalIndex] = useState<number | null>(null);
  const [delayModalValue, setDelayModalValue] = useState<number>(1);

  // Insert new action after a given index
  const insertActionAt = (index: number) => {
    setEditingCommandId(null);
    setNewCommand({
      id: '',
      type: 'app',
      command: '',
      description: '',
      workingDirectory: '',
      useTerminalWindow: false,
      delaySeconds: undefined,
    });
    setShowCommandForm(true);
    // Store the index where to insert
    setTimeout(() => setInsertIndex(index + 1), 0);
  };
  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  // Track which card is hovered
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    let fetchTimeout: NodeJS.Timeout | null = null;
    
    const fetchWorkflowDetails = async () => {
      if (!id || !isMounted) {
        return;
      }
      try {
        setIsLoading(true);
        // Fetch workflow from local electron-store via IPC
        const response = await window.electron.getWorkflowById(id as string);
        if (!isMounted) return;
        if (response.success && response.workflow) {
          setWorkflow(response.workflow);
          setCommands(response.workflow.commands || []);
          setError(null);
        } else {
          setWorkflow(null);
          setCommands([]);
          setError('Workflow not found');
        }
      } catch (err) {
        if (!isMounted) return;
        setError('Error loading workflow details');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    if (id) {
      fetchTimeout = setTimeout(() => {
        fetchWorkflowDetails();
      }, 100);
    }
    return () => {
      isMounted = false;
      if (fetchTimeout) {
        clearTimeout(fetchTimeout);
      }
    };
  }, [id]);

  useEffect(() => {
    const unsubscribe = window.electron.onMenuAction?.((action) => {
      console.log('WorkflowDetail received menu action:', action);
      if (action === 'run-workflow' && commands.length > 0) {
        runAllCommands();
      }
    });
    
    return () => unsubscribe && unsubscribe();
  }, [commands]);

  useEffect(() => {
    if (showCommandForm && newCommand.type === 'docker') {
      refreshDockerContainers();
    }
  }, [showCommandForm, newCommand.type]);

  useEffect(() => {
    const fetchApps = async () => {
      if (showCommandForm && newCommand.type === 'app') {
        setIsLoadingApps(true);
        setInstalledApps([]); // Clear previous list
        try {
          console.log("Requesting installed apps from main process (forcing refresh)...");
          // Pass forceRefresh: true to bypass cache during debugging
          const result = await window.electron.getInstalledApps(true); 
          console.log("Received apps:", result);
          if (result.success && Array.isArray(result.apps)) {
            setInstalledApps(result.apps);
          } else {
            console.error("Failed to fetch apps:", result.message);
            toast.error(`Could not load applications: ${result.message || 'Unknown error'}`);
          }
        } catch (err: any) {
          console.error("Error fetching installed apps:", err);
          // toast.error(`Error loading applications: ${err.message}`);
        } finally {
          setIsLoadingApps(false);
        }
      }
    };

    fetchApps();
  }, [showCommandForm, newCommand.type]);

  useEffect(() => {
    // Ensure the API exists before subscribing
    if (window.electron?.onWorkflowStepUpdate) {
      // Add explicit type for 'data'
      const unsubscribe = window.electron.onWorkflowStepUpdate((data: { commandId: string | null }) => {
        console.log('[Renderer Callback] Workflow step update received:', data);
        setRunningCommandId(data.commandId); // Update state based on message
      });

      // Cleanup listener on component unmount
      return () => {
        unsubscribe();
        setRunningCommandId(null); // Ensure highlight is cleared on unmount/navigation
      };
    }
  }, []); // Empty dependency array ensures this runs once on mount

  const refreshDockerContainers = async () => {
    try {
      const statusResult = await window.electron.dockerStatus();
      console.log('Docker status from main process:', statusResult);
      setDockerStatus(statusResult);

      if (statusResult.running) {
        try {
          const listResult = await window.electron.dockerListContainers({ all: true });
          console.log('Docker containers from main process:', listResult);
          if (listResult && Array.isArray(listResult.containers)) {
            setDockerContainers(listResult.containers);
          } else {
            console.warn('Received invalid container list:', listResult);
            setDockerContainers([]);
          }
        } catch (listError: any) {
          console.error('Error listing Docker containers:', listError);
          setDockerContainers([]);
        }
      } else {
        setDockerContainers([]);
      }
    } catch (statusError: any) {
      console.error('Error checking Docker status:', statusError);
      setDockerStatus({ running: false });
      setDockerContainers([]);
    }
  };

  const handleCommandTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as CommandType;
    setNewCommand({
      ...newCommand,
      type: newType,
      command: '', // Reset command when type changes
      commands: undefined,
      workingDirectory: '',
      useTerminalWindow: false,
      description: '', // Reset description too
      containerId: newType !== 'docker' ? undefined : newCommand.containerId,
      dockerAction: newType !== 'docker' ? undefined : newCommand.dockerAction,
    });
    if (newType === 'docker') {
      setSelectedDockerContainerId(null);
      setDockerAction('start');
      refreshDockerContainers();
    }
  };

  const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'command' && newCommand.type === 'terminal') {
      const commands = value.split('\n').filter(cmd => cmd.trim() !== '');
      
      setNewCommand({
        ...newCommand,
        command: value,
        commands: commands.length > 0 ? commands : undefined
      });
    } else {
      setNewCommand({
        ...newCommand,
        [name]: value
      });
    }
  };

  const handleAppSelection = useCallback((selectedApp: InstalledApp | null) => {
    setNewCommand(prev => {
      const newPath = selectedApp?.path || "";
      const previousSelectedApp = installedApps.find(app => app.path === prev.command);
      const shouldUpdateDescription = !prev.description || (previousSelectedApp && prev.description === previousSelectedApp.name);
      
      return {
        ...prev,
        command: newPath,
        description: selectedApp ? `Open ${selectedApp.name}` : "",
      };
    });
  }, [installedApps]);

  const browseForPath = async () => {
    try {
      const response = await window.electron.selectFile();
      if (response.success && response.filePath) {
        setNewCommand(prev => ({ // Use functional update
          ...prev,
          command: response.filePath ?? "",
        }));
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      toast.error('Failed to select file.');
    }
  };

  const browseForWorkingDirectory = async () => {
    try {
      const response = await window.electron.selectFolder();
      if (response.success && response.folderPath) {
        setNewCommand({
          ...newCommand,
          workingDirectory: response.folderPath
        });
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
    }
  };

  const handleUseTerminalWindowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCommand({
      ...newCommand,
      useTerminalWindow: e.target.checked
    });
  };

  const addCommand = async () => {
    if (newCommand.type === 'docker') {
      if (!dockerStatus.running || !selectedDockerContainerId || !dockerAction) {
        toast.error("Please ensure Docker is running and select a container and action.");
        return;
      }
      const selectedContainer = dockerContainers.find(c => c.Id === selectedDockerContainerId);
      const containerName = selectedContainer?.Names?.[0]?.replace(/^\//, '') || selectedDockerContainerId.slice(0, 12);
      const dockerCmdDisplay = `docker ${dockerAction} ${containerName}`;
      const commandToAdd: CommandItem = {
        ...newCommand,
        id: editingCommandId || Date.now().toString(),
        command: dockerCmdDisplay,
        containerId: selectedDockerContainerId,
        dockerAction,
        type: 'docker'
      };
      let updatedCommands: CommandItem[];
      if (insertIndex !== null) {
        updatedCommands = [
          ...commands.slice(0, insertIndex),
          commandToAdd,
          ...commands.slice(insertIndex),
        ];
      } else if (editingCommandId) {
        updatedCommands = commands.map(cmd => cmd.id === editingCommandId ? commandToAdd : cmd);
      } else {
        updatedCommands = [...commands, commandToAdd];
      }
      setIsSaving(true);
      try {
        const response = await window.electron.updateWorkflowCommands(id as string, updatedCommands);
        if (response.success) {
          setCommands(updatedCommands);
          cancelCommandForm();
          setInsertIndex(null);
        } else {
          toast.error(`Failed to save action: ${response.message}`);
        }
      } catch (error: any) {
        toast.error(`Error saving Docker action: ${error.message}`);
      } finally {
        setIsSaving(false);
      }
      return;
    }
    let finalCommand = newCommand.command.trim();
    if (newCommand.type === 'url') {
      finalCommand = normalizeUrl(finalCommand);
      if (!finalCommand) {
        toast.warn("URL cannot be empty.");
        return;
      }
    } else if (newCommand.type === 'app' && !finalCommand) {
      toast.warn("Please select an application from the list.");
      return;
    } else if (!finalCommand) {
      toast.warn("Command/Path cannot be empty.");
      return;
    }
    try {
      setIsSaving(true);
      let updatedCommands: CommandItem[];
      let commandToAdd: CommandItem = {
        ...newCommand,
        id: editingCommandId || Date.now().toString(),
        command: finalCommand,
      };
      if (commandToAdd.type === 'app' && !commandToAdd.description) {
        const appName = installedApps.find(app => app.path === finalCommand)?.name;
        commandToAdd.description = appName || `Open ${finalCommand}`;
      } else if (commandToAdd.type === 'url' && !commandToAdd.description) {
        commandToAdd.description = `Open ${finalCommand}`;
      }
      if (commandToAdd.type === 'terminal') {
        const commandLines = commandToAdd.command.split('\n').filter(cmd => cmd.trim() !== '');
        commandToAdd.commands = commandLines.length > 0 ? commandLines : undefined;
      }
      if (insertIndex !== null) {
        updatedCommands = [
          ...commands.slice(0, insertIndex),
          commandToAdd,
          ...commands.slice(insertIndex),
        ];
      } else if (editingCommandId) {
        updatedCommands = commands.map(cmd =>
          cmd.id === editingCommandId ? commandToAdd : cmd
        );
      } else {
        updatedCommands = [...commands, commandToAdd];
      }
      const response = await window.electron.updateWorkflowCommands(id as string, updatedCommands);
      if (response.success) {
        setCommands(updatedCommands);
        cancelCommandForm();
        setInsertIndex(null);
      } else {
        toast.error(`Failed to save action: ${response.message}`);
      }
    } catch (error: any) {
      toast.error(`Error saving action: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const removeCommand = async (commandId: string) => {
    try {
      setIsSaving(true);
      const updatedCommands = commands.filter(cmd => cmd.id !== commandId);
      const response = await window.electron.updateWorkflowCommands(id as string, updatedCommands);
      if (response.success) {
        setCommands(updatedCommands);
      } else {
        // Optionally show error
      }
    } catch (error) {
      // Optionally show error
    } finally {
      setIsSaving(false);
    }
  };

  const executeCommand = async (command: CommandItem) => {
    try {
      let response;

      let commandToExecute = { ...command };
      if (commandToExecute.type === 'url') {
        commandToExecute.command = normalizeUrl(commandToExecute.command);
      }

      response = await window.electron.executeCommand(commandToExecute);

      setExecutionResults(prev => ({
        ...prev,
        [command.id]: {
          success: response.success,
          message: response.message,
          results: response.results
        }
      }));

      return response.success;
    } catch (error: any) {
      console.error('Error executing command:', error);
      const errorMessage = error.message || 'Action failed';
      setExecutionResults(prev => ({
        ...prev,
        [command.id]: {
          success: false,
          message: errorMessage
        }
      }));
      return false;
    }
  };

  const runAllCommands = async () => {
    if (isRunningAll || !commands.length || !id) return;
    
    setIsRunningAll(true);
    setExecutionResults({}); 
    
    try {
      // Use local executeWorkflow (no authToken)
      const backendResult: WorkflowRunResult = await executeWorkflow(id); 
      const newResults: { [id: string]: { success: boolean; message?: string; results?: any } } = {};
      if (backendResult.results && Array.isArray(backendResult.results)) {
        backendResult.results.forEach((res: any) => {
          if (res && res.id) {
            newResults[res.id] = {
              success: res.success,
              message: res.message,
              results: res.results
            };
          }
        });
      }
      setExecutionResults(newResults);
      if (!backendResult.success) {
        // Optionally show error
      } 
    } catch (error: any) {
      const errorResults: { [id: string]: { success: boolean; message?: string } } = {};
      commands.forEach(cmd => {
        errorResults[cmd.id] = { success: false, message: 'Action failed' };
      });
      setExecutionResults(errorResults);
    } finally {
      setIsRunningAll(false);
      setRunningCommandId(null); 
    }
  };

  const startEditingCommand = (command: CommandItem) => {
    setEditingCommandId(command.id);

    const commandToEdit = { ...command };

    if (command.type === 'terminal' && command.commands && command.commands.length > 0) {
      commandToEdit.command = command.commands.join('\n');
    }

    setNewCommand(commandToEdit);

    if (command.type === 'docker') {
      setSelectedDockerContainerId(command.containerId || null);
      setDockerAction(command.dockerAction || 'start');
      refreshDockerContainers();
    }

    setShowCommandForm(true);
  };

  const cancelCommandForm = () => {
    setShowCommandForm(false);
    setEditingCommandId(null);
    setNewCommand({
      id: '',
      type: 'app',
      command: '',
      description: '',
      workingDirectory: '',
      useTerminalWindow: false,
      containerId: undefined,
      dockerAction: undefined,
      delaySeconds: undefined,
    });
    setSelectedDockerContainerId(null);
    setDockerAction('start');
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) {
      return;
    }
    try {
      setIsSaving(true);
      const newCommands: CommandItem[] = [...commands];
      const [movedCommand] = newCommands.splice(result.source.index, 1);
      newCommands.splice(result.destination.index, 0, movedCommand);
      setCommands(newCommands);
      const response = await window.electron.updateWorkflowCommands(id as string, newCommands);
      if (!response.success) {
        // Optionally show error
      }
    } catch (error) {
      // Optionally show error
    } finally {
      setIsSaving(false);
    }
  };

  const exportActions = () => {
    if (!workflow) return;
    const exportData = {
      codemateExport: true,
      exportedAt: new Date().toISOString(),
      workflowName: workflow.name,
      actions: commands,
    };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.name || 'workflow'}-actions.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const openDelayModal = (idx: number) => {
    setDelayModalIndex(idx);
    setDelayModalValue(commands[idx]?.delaySeconds || 1);
  };

  const saveDelay = async (seconds: number) => {
    if (delayModalIndex === null) return;
    const updatedCommands = commands.map((cmd, idx) =>
      idx === delayModalIndex ? { ...cmd, delaySeconds: seconds } : cmd
    );
    setIsSaving(true);
    try {
      const response = await window.electron.updateWorkflowCommands(id as string, updatedCommands);
      if (response.success) {
        setCommands(updatedCommands);
      }
      setDelayModalIndex(null);
    } catch (e) {
      toast.error('Failed to save delay');
    } finally {
      setIsSaving(false);
    }
  };

  const duplicateAction = async (index: number) => {
    if (index < 0 || index >= commands.length) return;

    const originalCommand = commands[index];
    const duplicatedCommand: CommandItem = {
      ...JSON.parse(JSON.stringify(originalCommand)),
      id: Date.now().toString(),
    };

    const updatedCommands = [
      ...commands.slice(0, index + 1),
      duplicatedCommand,
      ...commands.slice(index + 1),
    ];

    setIsSaving(true);
    try {
      const response = await window.electron.updateWorkflowCommands(id as string, updatedCommands);
      if (response.success) {
        setCommands(updatedCommands);
      } else {
        toast.error(`Error duplicating action: ${response.message}`);
      }
    } catch (error: any) {
      toast.error(`Error duplicating action: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading workflow details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Workflow</h3>
        <p>{error}</p>
        <button onClick={() => window.history.back()}>Go Back</button>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="error-container">
        <div className="error-icon">🔎</div>
        <h3>Workflow Not Found</h3>
        <p>The workflow you're looking for doesn't exist or has been deleted.</p>
        <button onClick={() => window.history.back()}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="workflow-detail-container">
      {/* <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} /> */}
      <div className="workflow-detail-content">
        <div className="commands-section">
          <div className="section-header">
            <div className="workflow-title-section">
              <div className="workflow-title-main">
                <h2>{workflow?.name || 'Workflow Details'}</h2>
                {commands.length > 0 && (
                  <button 
                    className={`run-all-btn ${isRunningAll ? 'running' : ''}`}
                    onClick={runAllCommands}
                    disabled={isRunningAll}
                    title="Run all commands in sequence"
                  >
                    {isRunningAll ? (
                      <>
                        <FiLoader className="spin-icon" />
                        <span>Running...</span>
                      </>
                    ) : (
                      <>
                        <FiPlayCircle />
                        <span>Run All Actions</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="workflow-title-actions">
                <button 
                  className="export-actions-btn"
                  onClick={exportActions}
                  title="Export all actions as JSON"
                  style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <FiDownload />
                  <span style={{ fontSize: '0.95em' }}>Export Actions</span>
                </button>
                <button 
                  className="add-command-btn"
                  onClick={() => setShowCommandForm(true)}
                  disabled={showCommandForm}
                >
                  <FiPlusCircle />
                  <span>Add Action</span>
                </button>
              </div>
            </div>
          </div>
                 
          {commands.length > 0 ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="commands-list">
                {(provided) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="commands-list"
                  >
                    {commands.map((cmd, index) => (
                      <React.Fragment key={cmd.id}>
                        <Draggable 
                          key={cmd.id} 
                          draggableId={cmd.id} 
                          index={index} 
                          isDragDisabled={isRunningAll || runningCommandId !== null}
                        >
                          {(provided, snapshot) => {
                            const isExecuting = runningCommandId === cmd.id;
                            if (isExecuting) { // Log only when it should be executing
                              console.log(`[Render Check] Card ${cmd.id}: isExecuting=${isExecuting}, runningCommandId=${runningCommandId}`);
                            }
                            return (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`command-card ${snapshot.isDragging ? 'dragging' : ''} ${isExecuting ? 'executing' : ''}`}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                              >
                                <div className="command-info">
                                  <div className="command-type-icon">
                                    {cmd.type === 'url' ? (
                                      <FiLink />
                                    ) : cmd.type === 'app' ? (
                                      <FiPlay />
                                    ) : cmd.type === 'terminal' ? (
                                      <FiTerminal />
                                    ) : cmd.type === 'docker' ? (
                                      <FaDocker />
                                    ) : (
                                      <FiPlay />
                                    )}
                                  </div>
                                  
                                  <div className="command-details">
                                    <h4>{cmd.description || (cmd.type === 'url' ? `Open ${cmd.command}` : cmd.command)}</h4>
                                    {cmd.type === 'terminal' && cmd.commands && cmd.commands.length > 1 ? (
                                      <div className="multi-command-container">
                                        <p className="command-text multi-command-count">
                                          {cmd.commands.length} commands in sequence
                                        </p>
                                        <div className="multi-command-list">
                                          {cmd.commands.map((subCmd, idx) => (
                                            <p key={idx} className="command-text multi-command-item">
                                              {idx + 1}. {subCmd}
                                            </p>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="command-text">{cmd.command}</p>
                                    )}
                                    {cmd.workingDirectory && (
                                      <p className="command-directory">
                                        Working directory: {cmd.workingDirectory}
                                      </p>
                                    )}
                                    <p className="command-type">
                                      {cmd.type === 'app' ? 'Application' : 
                                       cmd.type === 'terminal' ? 
                                         (cmd.useTerminalWindow ? 'Terminal (New Window)' : 'Terminal Command') : 
                                       cmd.type === 'docker' ? 
                                         `Docker (${cmd.dockerAction} container)` : 
                                       cmd.type === 'url' ? 
                                         'Open URL' : 
                                          'Action'}
                                    </p>
                                    {executionResults[cmd.id] && (
                                      <p className={`execution-result ${executionResults[cmd.id].success ? 'success' : 'error'}`}>
                                        {executionResults[cmd.id].message || (executionResults[cmd.id].success ? 'Executed successfully' : 'Failed')}
                                      </p>
                                    )}
                                    {cmd.delaySeconds !== undefined && (
                                      <div className="command-delay-indicator" title={`Delay: ${cmd.delaySeconds}s`}>
                                        <FiClock size={14} /> {cmd.delaySeconds}s
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="command-actions">
                                  <button 
                                    className={`execute-btn ${runningCommandId === cmd.id ? 'running' : ''} ${
                                      executionResults[cmd.id]?.success ? 'success' : executionResults[cmd.id] ? 'error' : ''
                                    }`}
                                    onClick={() => executeCommand(cmd)}
                                    disabled={isRunningAll || runningCommandId !== null}
                                    title="Execute"
                                  >
                                    {runningCommandId === cmd.id ? <FiLoader className="spin-icon" /> : <FiPlay />}
                                  </button>
                                  
                                  <button 
                                    className="edit-btn"
                                    onClick={() => startEditingCommand(cmd)}
                                    disabled={isRunningAll || runningCommandId !== null || showCommandForm}
                                    title="Edit"
                                  >
                                    <FiEdit />
                                  </button>
                                  
                                  <button 
                                    className="delete-btn"
                                    onClick={() => removeCommand(cmd.id)}
                                    disabled={isRunningAll || runningCommandId !== null}
                                    title="Delete"
                                  >
                                    <FiTrash2 />
                                  </button>
                                </div>
                                <div 
                                  className="card-bottom-actions"
                                  style={{ display: hoveredIndex === index ? 'flex' : 'none' }} 
                                >
                                  <button 
                                    className="add-action-below-btn" 
                                    onClick={() => insertActionAt(index)} 
                                    title="Add Action Below"
                                  >
                                    <FiPlus size={16} /> Action
                                  </button>
                                  <button 
                                    className="add-delay-below-btn" 
                                    onClick={() => openDelayModal(index)} 
                                    title="Edit Delay Below"
                                  >
                                    <FiPauseCircle size={16} /> Delay ({cmd.delaySeconds ?? 0}s)
                                  </button>
                                  <button
                                    className="duplicate-action-btn"
                                    onClick={() => duplicateAction(index)} 
                                    title="Duplicate Action Below"
                                  >
                                    <FiCopy size={16} /> Duplicate
                                  </button>
                                </div>
                              </div>
                            );
                          }}
                        </Draggable>
                      </React.Fragment>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="no-commands">
              <p>No actions added yet. Click "Add Action" to automate something for this workflow.</p>
            </div>
          )}
        </div>
      </div>
      {showCommandForm && (
        <ActionModal 
          newCommand={newCommand}
          editingCommandId={editingCommandId}
          handleCommandTypeChange={handleCommandTypeChange}
          handleCommandChange={handleCommandChange}
          browseForPath={browseForPath}
          browseForWorkingDirectory={browseForWorkingDirectory}
          handleUseTerminalWindowChange={handleUseTerminalWindowChange}
          cancelCommandForm={cancelCommandForm}
          addCommand={addCommand}
          isSaving={isSaving}
          dockerStatus={dockerStatus}
          dockerContainers={dockerContainers}
          selectedDockerContainerId={selectedDockerContainerId}
          setSelectedDockerContainerId={setSelectedDockerContainerId}
          dockerAction={dockerAction}
          setDockerAction={setDockerAction}
          refreshDockerContainers={refreshDockerContainers}
          installedApps={installedApps}
          isLoadingApps={isLoadingApps}
          handleAppSelection={handleAppSelection}
        />
      )}
      <DelayModal
        isOpen={delayModalIndex !== null}
        delaySeconds={delayModalValue}
        onSave={saveDelay}
        onCancel={() => setDelayModalIndex(null)}
      />
    </div>
  );
};

export default WorkflowDetail;
