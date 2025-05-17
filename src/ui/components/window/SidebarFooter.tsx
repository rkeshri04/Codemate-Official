import React from 'react';
import { FiPlus } from 'react-icons/fi';

interface SidebarFooterProps {
  sidebarCollapsed: boolean;
  openWorkflowModal: () => void;
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({ sidebarCollapsed, openWorkflowModal }) => {
  return (
    <div className="sidebar-footer">
      <button className="add-workflow-btn" onClick={openWorkflowModal} title="Add New Workflow">
        <FiPlus size={sidebarCollapsed ? 20 : 16} />
        {!sidebarCollapsed && <span>New Workflow</span>}
      </button>
    </div>
  );
};

export default SidebarFooter;
