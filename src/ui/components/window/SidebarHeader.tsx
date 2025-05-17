import React from 'react';
import { FiMenu } from 'react-icons/fi';

interface SidebarHeaderProps {
  user: User | null;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ user, sidebarCollapsed, toggleSidebar }) => {
  return (
    <div className="sidebar-header">
      {!sidebarCollapsed && <h3>Welcome, {user?.name || 'User'}</h3>}
      <button className="toggle-sidebar-btn" onClick={toggleSidebar}>
        <FiMenu />
      </button>
    </div>
  );
};

export default SidebarHeader;
