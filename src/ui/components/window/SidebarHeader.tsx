import React from 'react';
import { FiMenu } from 'react-icons/fi';



const SidebarHeader: React.FC<SidebarHeaderProps> = ({ sidebarCollapsed, toggleSidebar }) => {
  return (
    <div className="sidebar-header">
      <button className="toggle-sidebar-btn" onClick={toggleSidebar}>
        <FiMenu />
      </button>
    </div>
  );
};

export default SidebarHeader;
