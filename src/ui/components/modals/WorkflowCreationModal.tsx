import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiUpload } from 'react-icons/fi';
import './WorkflowCreationModal.css';


const WorkflowCreationModal: React.FC<WorkflowCreationModalProps> = ({ 
  onClose, 
  onWorkflowCreated
}) => {
  const [workflowName, setWorkflowName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importedActions, setImportedActions] = useState<CommandItem[] | null>(null);
  const navigate = useNavigate();

  const handleImportActions = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        const text = await file.text();
        try {
          const data = JSON.parse(text);
          if (!data.codemateExport || !Array.isArray(data.actions)) {
            setError('Invalid Codemate actions file.');
            return;
          }
          setImportedActions(data.actions);
          if (data.workflowName && !workflowName) setWorkflowName(data.workflowName);
          setError('');
        } catch {
          setError('Failed to parse JSON file.');
        }
      };
      input.click();
    } catch (err) {
      setError('Failed to import actions.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflowName.trim()) {
      setError('Workflow name cannot be empty');
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await window.electron.createWorkflow(workflowName);
      if (response.success && response.workflow) {
        if (importedActions && importedActions.length > 0) {
          const updateResp = await window.electron.updateWorkflowCommands(
            response.workflow._id as string,
            importedActions
          );
          if (!updateResp.success) {
            setError(updateResp.message || 'Failed to import actions');
            setIsSubmitting(false);
            return;
          }
          response.workflow.commands = importedActions;
        }
        onWorkflowCreated(response.workflow);
        onClose();
        const workflowId = response.workflow._id;
        if (workflowId) {
          navigate(`/workflow/${workflowId}`);
        }
      } else {
        setError(response.message || 'Failed to create workflow');
      }
    } catch (err) {
      console.error('Error creating workflow:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create New Workflow</h2>
          <button className="close-modal-btn" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} >
          <div className="form-group"
            style={{
              width: 320,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: 8,
            }}
          >
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label 
                htmlFor="workflowName"
                style={{
                  marginBottom: 4,
                  color: 'color-mix(in srgb, var(--text-color) 40%, #888 20%)',
                }}>Workflow Name</label>
              <input
                id="workflowName"
                style={{
                  background: 'var(--background-color)',
                  width: '100%',
                  maxWidth: 320,
                }}
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="Enter workflow name"
                autoFocus
              />
            </div>
            {/* Import Actions Icon Button */}
            <button
              type="button"
              className="import-actions-btn"
              onClick={handleImportActions}
              disabled={isSubmitting}
              title="Import Actions"
            >
              <FiUpload /><span>Import</span>
            </button>
          </div>
          {/* Show imported actions count if present */}
          {importedActions && (
            <div style={{ color: 'green', fontSize: '0.95em', marginBottom: 8, marginTop: 4 }}>
              {importedActions.length} actions imported
            </div>
          )}
          {error && <div className="error-message">{error}</div>}
          <hr style={{
            border: 0,
            borderTop: '2px solid var(--border-color)',
            margin: '10px 0'}} />
          
          <div className="modal-footer">
            <button 
              type="button" 
              className="submit-btn" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={{backgroundColor: "(--var-primary-color)"}}
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Workflow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkflowCreationModal;
