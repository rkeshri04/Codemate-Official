import React, { useEffect, useState } from 'react';
import './SystemMonitor.css';

// Create enum for RAM display modes
enum RamDisplayMode {
  PERCENT,
  GB_TOTAL,
  MB
}
          
const SystemMonitor: React.FC = () => {
  const [cpuUsage, setCpuUsage] = useState(0);
  const [ramUsage, setRamUsage] = useState(0);
  const [totalRAM, setTotalRAM] = useState(0); // Total RAM in MB
  const [ramDisplayMode, setRamDisplayMode] = useState<RamDisplayMode>(RamDisplayMode.PERCENT);

  useEffect(() => {
    // Initial load
    window.electron.getSystemStats().then(response => {
      if (response.success && response.cpuUsage !== undefined && response.ramUsage !== undefined) {
        setCpuUsage(response.cpuUsage);
        setRamUsage(response.ramUsage);
        
        // Get total RAM if available
        if (response.systemInfo?.totalMemoryMB) {
          setTotalRAM(response.systemInfo.totalMemoryMB);
        } else {
          // Fallback to a reasonable default
          setTotalRAM(8 * 1024); // 8 GB in MB
        }
      }
    });

    // Subscribe to updates
    const removeListener = window.electron.onSystemStatsUpdate((stats:any) => {
      setCpuUsage(stats.cpuUsage);
      setRamUsage(stats.ramUsage);
      
      if (stats.systemInfo?.totalMemoryMB) {
        setTotalRAM(stats.systemInfo.totalMemoryMB);
      }
    });

    // Clean up
    return () => {
      removeListener();
    };
  }, []);
  
  // Calculate used RAM in MB
  const usedRAMInMB = Math.round((ramUsage / 100) * totalRAM);
  const usedRAMInGB = (usedRAMInMB / 1024).toFixed(1);
  const totalRAMInGB = (totalRAM / 1024).toFixed(1);

  // Cycle through RAM display modes
  const cycleRamDisplayMode = () => {
    setRamDisplayMode((prevMode) => {
      switch(prevMode) {
        case RamDisplayMode.PERCENT:
          return RamDisplayMode.GB_TOTAL;
        case RamDisplayMode.GB_TOTAL:
          return RamDisplayMode.MB;
        case RamDisplayMode.MB:
        default:
          return RamDisplayMode.PERCENT;
      }
    });
  };

  // Get RAM display text based on current mode
  const getRamDisplayText = () => {
    switch(ramDisplayMode) {
      case RamDisplayMode.GB_TOTAL:
        return `${usedRAMInGB}/${totalRAMInGB} GB`;
      case RamDisplayMode.MB:
        return `${usedRAMInMB} MB`;
      case RamDisplayMode.PERCENT:
      default:
        return `${ramUsage}%`;
    }
  };

  return (
    <div className="system-monitor">
      <div className="resource-stat">
        <span className="resource-label">CPU:</span>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${cpuUsage}%`,
              backgroundColor: cpuUsage > 80 ? '#e74c3c' : cpuUsage > 60 ? '#f39c12' : '#2ecc71'
            }} 
          />
        </div>
        <span className="percentage">
          {`${cpuUsage}%`}
        </span>
      </div>

      <div className="resource-stat">
        <span className="resource-label">RAM:</span>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${ramUsage}%`,
              backgroundColor: ramUsage > 80 ? '#e74c3c' : ramUsage > 60 ? '#f39c12' : '#2ecc71'
            }} 
          />
        </div>
        <span className="percentage clickable" onClick={cycleRamDisplayMode}>
          {getRamDisplayText()}
        </span>
      </div>
    </div>
  );
};

export default SystemMonitor;
