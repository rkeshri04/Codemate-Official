import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { DropResult } from 'react-beautiful-dnd';
import { useTheme } from '../../context/ThemeContext';
import WorkflowCreationModal from '../components/modals/WorkflowCreationModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import SidebarHeader from '../components/window/SidebarHeader';
import SidebarContent from '../components/window/SidebarContent';
import SidebarFooter from '../components/window/SidebarFooter';
import MainHeader from '../components/window/MainHeader';
import MainFooter from '../components/window/MainFooter';
import './Dashboard.css';

export function Dashboard() {
  const { theme, toggleTheme } = useTheme(); // Keep theme logic if needed at this level
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflowsVisible, setWorkflowsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteWorkflowId, setDeleteWorkflowId] = useState<string | null>(null);
  const [workflowToDeleteName, setWorkflowToDeleteName] = useState<string>("");
  const [clipboardHistory, setClipboardHistory] = useState<string[]>([]);
  const [runningWorkflowId, setRunningWorkflowId] = useState<string | null>(null);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const resizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    const fetchWorkflows = async () => {
      if (!isMounted) return;
      try {
        setIsLoading(true);
        const workflowsResponse = await window.electron.getUserWorkflows();
        if (!isMounted) return;
        if (workflowsResponse.success && workflowsResponse.workflows) setWorkflows(workflowsResponse.workflows);
      } catch (err) { if (!isMounted) return; console.error('Error fetching workflows:', err); }
      finally { if (isMounted) setIsLoading(false); }
    };
    const timeoutId = setTimeout(fetchWorkflows, 100);
    return () => { isMounted = false; clearTimeout(timeoutId); };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchClipboard = async () => {
      const history = await window.electron.getClipboardHistory();
      setClipboardHistory(history);
    };
    fetchClipboard();
    interval = setInterval(fetchClipboard, 2000);
    return () => clearInterval(interval);
  }, []);

  // --- Sidebar Resize Logic ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const newWidth = startWidthRef.current + (e.clientX - startXRef.current);
      if (newWidth >= 200 && newWidth <= 400) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      resizingRef.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // --- Menu Action Handling ---
   useEffect(() => {
    const unsubscribe = window.electron.onMenuAction((action) => {
      console.log('Menu action received:', action);
      switch (action) {
        case 'new-workflow': setShowWorkflowModal(true); break;
        case 'toggle-sidebar': setSidebarCollapsed(!sidebarCollapsed); break;
        case 'toggle-theme': toggleTheme(); break;
      }
    });
    return () => unsubscribe();
  }, [toggleTheme, sidebarCollapsed]);

  // --- Handlers ---
  const handleWorkflowClick = (workflowId: string) => navigate(`/workflow/${workflowId}`);

  const startResizing = (e: React.MouseEvent) => {
    resizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';
  };

  const toggleSidebar = () => {
    const newCollapsedState = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsedState);
    if (newCollapsedState && workflowsVisible) setWorkflowsVisible(false);
  };

  const openWorkflowModal = () => setShowWorkflowModal(true);
  const closeWorkflowModal = () => setShowWorkflowModal(false);

  const handleWorkflowCreated = (workflow: Workflow) => setWorkflows(prev => [workflow, ...prev]);

  const toggleWorkflowsVisibility = async () => {
    setWorkflowsVisible(v => !v);
  };

  const handleWorkflowReorder = async (result: DropResult) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    try {
      const reorderedWorkflows = Array.from(workflows);
      const [movedWorkflow] = reorderedWorkflows.splice(result.source.index, 1);
      reorderedWorkflows.splice(result.destination.index, 0, movedWorkflow);
      setWorkflows(reorderedWorkflows);
      const workflowIds = reorderedWorkflows.map(workflow => workflow._id as string);
      const response = await window.electron.updateWorkflowOrder(workflowIds);
      if (!response.success) console.error('Failed to update workflow order:', response.message);
    } catch (error) { console.error('Error reordering workflows:', error); }
  };

  const handleDeleteClick = (workflowId: string) => {
    const workflowToDelete = workflows.find(workflow => workflow._id === workflowId);
    if (workflowToDelete) {
      setWorkflowToDeleteName(workflowToDelete.name);
      setDeleteWorkflowId(workflowId);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteWorkflowId(null);
    setWorkflowToDeleteName("");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteWorkflowId) return;
    try {
      const response = await window.electron.deleteWorkflow(deleteWorkflowId);
      if (response.success) {
        setWorkflows(workflows.filter(workflow => workflow._id !== deleteWorkflowId));
        if (location.pathname.includes(`/workflow/${deleteWorkflowId}`)) navigate('/dashboard');
        setDeleteWorkflowId(null);
        setWorkflowToDeleteName("");
      } else { console.error('Failed to delete workflow:', response.message); }
    } catch (error) { console.error('Error deleting workflow:', error); }
  };

  const handleToggleFavorite = async (workflowId: string) => {
    try {
      const workflow = workflows.find(t => t._id === workflowId);
      if (!workflow) return;
      const isFavorite = !workflow.isFavorite;
      setWorkflows(prevWorkflows => prevWorkflows.map(t => t._id === workflowId ? { ...t, isFavorite } : t));
      const response = await window.electron.updateWorkflowFavorite(workflowId, isFavorite);
      if (!response.success) {
        console.error('Failed to update favorite status:', response.message);
        setWorkflows(prevWorkflows => prevWorkflows.map(t => t._id === workflowId ? { ...t, isFavorite: !isFavorite } : t));
        return;
      }
      setWorkflows(prevWorkflows => [...prevWorkflows].sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return (a.order || 0) - (b.order || 0);
      }));
    } catch (error) { console.error('Error updating favorite status:', error); }
  };

  const handleClipboardClick = async (idx: number) => {
    await window.electron.copyClipboardItem(idx);
  };

  const handleRunWorkflow = async (workflowId: string) => {
    if (runningWorkflowId) {
      toast.warn("Another workflow is already running.");
      return;
    }
    setRunningWorkflowId(workflowId);
    toast.info(`Running workflow...`);
    try {
      const result = await window.electron.runWorkflow(workflowId);
      if (result.success) {
        toast.success(`Workflow executed successfully.`);
      } else {
        toast.error(`Workflow finished with errors`);
      }
    } catch (error: any) {
      console.error("Error running workflow from sidebar:", error);
      toast.error(`Failed to run workflow: ${error.message || 'Unknown error'}`);
    } finally {
      setRunningWorkflowId(null);
    }
  };

  // --- Render ---
  return (
    <div className="dashboard-container">
      <div
        ref={sidebarRef}
        className={`sidebar custom-scrollbar-y ${sidebarCollapsed ? 'collapsed' : ''} app-region-no-drag`}
        style={{ width: sidebarCollapsed ? '60px' : `${sidebarWidth}px` }}
      >
        <SidebarHeader
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />
        <SidebarContent
          workflows={workflows}
          isLoading={isLoading}
          sidebarCollapsed={sidebarCollapsed}
          workflowsVisible={workflowsVisible}
          toggleWorkflowsVisibility={toggleWorkflowsVisibility}
          handleWorkflowClick={handleWorkflowClick}
          handleWorkflowReorder={handleWorkflowReorder}
          handleToggleFavorite={handleToggleFavorite}
          handleDeleteClick={handleDeleteClick}
          handleRunWorkflow={handleRunWorkflow}
          clipboardHistory={clipboardHistory}
          handleClipboardClick={handleClipboardClick}
        />
        <SidebarFooter
          sidebarCollapsed={sidebarCollapsed}
          openWorkflowModal={openWorkflowModal}
        />
        {/* Sidebar resize handle */}
        <div className="resize-handle" onMouseDown={startResizing}></div>
      </div>
      {/* Main content */}
      <div className="main-content">
        <MainHeader />
        <div className="dashboard-content custom-scrollbar-y">
          {/* This is where nested routes will be rendered */}
          <Outlet context={{ workflows, setWorkflows, isLoading }} />
        </div>
        <MainFooter />
      </div>
      {/* Modals */}
      {showWorkflowModal && (
        <WorkflowCreationModal
          onClose={closeWorkflowModal}
          onWorkflowCreated={handleWorkflowCreated}
        />
      )}
      <ConfirmModal
        type="delete"
        isOpen={deleteWorkflowId !== null}
        itemName={workflowToDeleteName}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
