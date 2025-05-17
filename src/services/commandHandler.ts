import { toast } from 'react-toastify';

/**
 * Executes all commands in a workflow sequentially
 * @param workflowId ID of the workflow to execute
 * @returns Promise with execution result
 */
export const executeWorkflow = async (
  workflowId: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    // Use the runWorkflow function that handles all the logic in the main process
    const response = await window.electron.runWorkflow(workflowId);
    
    if (response.success) {
      toast.success('Workflow executed successfully');
      return {
        success: true,
      };
    } else {
      toast.error(response.message || 'Failed to run workflow');
      return {
        success: false,
        message: response.message || 'Failed to run workflow'
      };
    }
  } catch (error: any) {
    const errorMessage = error.message || 'Error executing workflow. Please try again.';
    console.error('Error executing workflow:', error);
    toast.error(errorMessage);
    return {
      success: false,
      message: errorMessage
    };
  }
};

/**
 * Execute a single command item
 * @param command Command to execute
 * @returns Promise with execution result
 */
export const executeCommand = async (
  command: CommandItem
): Promise<{ success: boolean; message?: string; results?: any }> => {
  try {
    // For terminal commands with useTerminalWindow flag, use special handling
    if (command.type === 'terminal' && command.useTerminalWindow) {
      // Open in terminal window directly
      const cmdArray = command.commands && command.commands.length > 0 
        ? command.commands 
        : [command.command];
        
      // Send commands directly to open terminal
      window.electron.ipcRenderer.send('open-terminal', {
        commands: cmdArray,
        workingDirectory: command.workingDirectory
      });
      
      toast.success('Command opened in terminal window');
      return { 
        success: true, 
        message: 'Opened in terminal window' 
      };
    }
    
    // Normal execution path for non-terminal or non-window commands
    const response = await window.electron.executeCommand({
      type: command.type,
      command: command.command,
      workingDirectory: command.workingDirectory,
      commands: command.type === 'terminal' ? command.commands : undefined,
      useTerminalWindow: command.useTerminalWindow
    });
    
    console.log('Command execution response:', response);
    
    if (!response.success) {
      console.error('Failed to execute command:', response);
      return {
        success: false,
        message: response.message || 'Failed to execute command',
        results: response.results
      };
    }
    
    return {
      success: true,
      message: response.message || 'Command executed successfully',
      results: response.results
    };
  } catch (error: any) {
    console.error('Error executing command:', error);
    return {
      success: false,
      message: error.message || 'Action failed'
    };
  }
};