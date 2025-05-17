import React, { useState, useRef, useEffect } from 'react';
import { FiLogOut, FiUser, FiMoon, FiSun } from 'react-icons/fi';
import { useTheme } from '../../../context/ThemeContext';

interface MainHeaderProps {
  user: User | null;
  confirmLogout: () => void;
}

const MainHeader: React.FC<MainHeaderProps> = ({ user, confirmLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const toggleUserMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowUserMenu(prev => !prev);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="dashboard-header app-region-drag">
      <h1>Codemate</h1>
      <div className="header-actions app-region-no-drag">
        {/* User profile menu */}
        <div className="user-menu-container" ref={userMenuRef}>
          <button
            className="user-avatar-btn"
            onClick={toggleUserMenu}
          >
            <div className="user-avatar">
              {user?.name?.charAt(0) || <FiUser />}
            </div>
          </button>

          {showUserMenu && (
            <div className="user-menu">
              {/* <div className="user-info">
                <h4>{user?.name}</h4>
                <p>{user?.email}</p>
              </div> */}

              <button className="menu-item" onClick={toggleTheme}>
                {theme === 'light' ? <FiMoon className="menu-icon" /> : <FiSun className="menu-icon" />}
                {theme === 'light' ? <span>Toggle dark mode</span> : <span>Toggle light mode</span>}
              </button>

              {/* <button className="menu-item" onClick={confirmLogout}>
                <FiLogOut className="menu-icon" />
                <span>Logout</span>
              </button> */}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default MainHeader;
