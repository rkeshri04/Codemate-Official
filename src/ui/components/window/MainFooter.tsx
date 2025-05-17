import React from 'react';
import SystemMonitor from './SystemMonitor';

const MainFooter: React.FC = () => {
  return (
    <footer className="dashboard-footer">
      <SystemMonitor />
    </footer>
  );
};

export default MainFooter;
