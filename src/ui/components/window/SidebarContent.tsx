import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiHome, FiSettings, FiChevronDown, FiChevronUp, FiGrid, FiMoreVertical,
  FiStar, FiTrash2, FiClipboard, FiChevronRight, FiPlay
} from 'react-icons/fi';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface SidebarContentProps {
  workflows: Workflow[];
  isLoading: boolean;
  sidebarCollapsed: boolean;
  workflowsVisible: boolean;
  toggleWorkflowsVisibility: () => void;
  handleWorkflowClick: (workflowId: string) => void;
  handleWorkflowReorder: (result: DropResult) => void;
  handleToggleFavorite: (workflowId: string) => void;
  handleDeleteClick: (workflowId: string) => void;
  handleRunWorkflow: (workflowId: string) => void;
  clipboardHistory: string[];
  handleClipboardClick: (idx: number) => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  workflows,
  isLoading,
  sidebarCollapsed,
  workflowsVisible: _workflowsVisible, // ignore prop, use local state
  toggleWorkflowsVisibility: _toggleWorkflowsVisibility, // ignore prop, use local handler
  handleWorkflowClick,
  handleWorkflowReorder,
  handleToggleFavorite,
  handleDeleteClick,
  handleRunWorkflow,
  clipboardHistory,
  handleClipboardClick
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [workflowMenuOpen, setWorkflowMenuOpen] = useState<string | null>(null);
  const [clipboardExpanded, setClipboardExpanded] = useState(false);

  // --- Local workflow visibility state, persisted in localStorage ---
  const [workflowsVisible, setWorkflowsVisible] = useState<boolean>(() => {
    const stored = localStorage.getItem('sidebarWorkflowsVisible');
    return stored === null ? true : stored === 'true';
  });
  useEffect(() => {
    localStorage.setItem('sidebarWorkflowsVisible', String(workflowsVisible));
  }, [workflowsVisible]);

  const isWorkflowDetailPage = location.pathname.startsWith('/workflow/');

  const toggleWorkflowMenu = (workflowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWorkflowMenuOpen(prevId => prevId === workflowId ? null : workflowId);
  };

  // Close workflow menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workflowMenuOpen && !((event.target as Element).closest('.sidebar-item-menu') ||
                            (event.target as Element).closest('.workflow-menu-dropdown'))) {
        setWorkflowMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [workflowMenuOpen]);

  const sortedWorkflows = [...workflows].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return (a.order || 0) - (b.order || 0);
  });

  return (
    <div className="sidebar-content">
      {/* Navigation items */}
      <div
        className={`nav-item ${!isWorkflowDetailPage ? 'active' : ''}`}
        onClick={() => navigate('/dashboard')}
      >
        <FiHome className="nav-icon" />
        {!sidebarCollapsed && <span>Home</span>}
      </div>

      {/* Workflow section */}
      <div className="nav-section">
        <div
          className="workflow-header nav-item"
          onClick={() => !sidebarCollapsed && setWorkflowsVisible(v => !v)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <FiSettings className="nav-icon" />
          {!sidebarCollapsed && <span>Workflows</span>}
          {!sidebarCollapsed && (
            <span style={{ marginLeft: 'auto' }}>
              {workflowsVisible ? <FiChevronUp /> : <FiChevronRight />}
            </span>
          )}
        </div>
        {workflowsVisible && !sidebarCollapsed && (
          <div className="workflows-container">
            {isLoading ? (
              <div className="loading-workflows">
                {!sidebarCollapsed && <span>Loading Workflows...</span>}
              </div>
            ) : sortedWorkflows.length > 0 ? (
              <DragDropContext onDragEnd={handleWorkflowReorder}>
                <Droppable droppableId="workflows-droppable">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="workflows-droppable"
                    >
                      {sortedWorkflows.map((workflow, index) => (
                        <Draggable
                          key={workflow._id as string}
                          draggableId={workflow._id as string}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`nav-item workflow-item ${
                                isWorkflowDetailPage && location.pathname === `/workflow/${workflow._id}` ? 'active' : ''
                              } ${snapshot.isDragging ? 'dragging' : ''} ${workflow.isFavorite ? 'favorite' : ''}`}
                            >
                              <div
                                className="workflow-content"
                                onClick={() => handleWorkflowClick(workflow._id as string)}
                              >
                                {workflow.isFavorite && (
                                  <FiStar
                                    className="favorite-icon"
                                    style={{ verticalAlign: 'middle', position: 'relative', marginRight: '4px' }}
                                  />
                                )}
                                <span>{workflow.name}</span>
                              </div>
                              <div
                                className="drag-handle"
                                {...provided.dragHandleProps}
                                title="Drag to reorder"
                              >
                                <FiGrid size={16} />
                              </div>
                              <div className="workflow-menu-container">
                                <button
                                  className="workflow-menu-btn"
                                  onClick={(e) => toggleWorkflowMenu(workflow._id as string, e)}
                                  title="Workflow menu"
                                >
                                  <FiMoreVertical size={16} />
                                </button>

                                {workflowMenuOpen === workflow._id && (
                                  <div className="workflow-menu-dropdown">
                                    
                                    <div
                                      className="workflow-menu-item"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleFavorite(workflow._id as string);
                                        setWorkflowMenuOpen(null);
                                      }}
                                    >
                                      <FiStar />
                                      <span>{workflow.isFavorite ? 'Unfavorite' : 'Favorite'}</span>
                                    </div>
                                    <div
                                      className="workflow-menu-item"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRunWorkflow(workflow._id as string);
                                        setWorkflowMenuOpen(null);
                                      }}
                                    >
                                      <FiPlay />
                                      <span>Run Workflow</span>
                                    </div>
                                    <div
                                      className="workflow-menu-item danger"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(workflow._id as string);
                                        setWorkflowMenuOpen(null);
                                      }}
                                    >
                                      <FiTrash2 />
                                      <span>Delete</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <div className="no-workflows">
                {!sidebarCollapsed && <span>No workflows yet.</span>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clipboard History Section */}
      <div className="clipboard-history-section">
        <div
          className="clipboard-header nav-item"
          onClick={() => setClipboardExpanded((v) => !v)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <FiClipboard className="nav-icon" />
          {!sidebarCollapsed && <span>Clipboard</span>}
          {!sidebarCollapsed && (
            <span style={{ marginLeft: 'auto' }}>
              {clipboardExpanded ? <FiChevronUp /> : <FiChevronRight />}
            </span>
          )}
        </div>
        {clipboardExpanded && !sidebarCollapsed && (
          <div className="clipboard-list">
            {clipboardHistory.length === 0 ? (
              <div className="clipboard-empty">No copied items</div>
            ) : (
              clipboardHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="clipboard-item"
                  title={item}
                  onClick={() => handleClipboardClick(idx)}
                  style={{
                    padding: '6px 10px',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    fontSize: '0.95em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.length > 40 ? item.slice(0, 40) + '...' : item}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarContent;
