import React, { useState, useEffect, useMemo } from 'react';
import './DashboardItems.css'; 
import { FiClock, FiPlay, FiTrendingUp, FiList } from 'react-icons/fi';
import { FaFire } from 'react-icons/fa';
import { executeWorkflow } from '../../../services/commandHandler';
import { useNavigate } from 'react-router-dom';
import { FiExternalLink, FiStar, FiGitBranch } from 'react-icons/fi';
import { FiTerminal, FiGithub, FiDatabase, FiCloud, FiEdit, FiZap, FiGlobe, FiSettings, FiCode, FiMonitor, FiSearch, FiBook, FiCalendar, FiMail, FiBarChart2, FiClipboard, FiX } from 'react-icons/fi';
import { FaDocker, FaSlack, FaTrello, FaFigma } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import ToolsCard from './widgets/ToolsCard';

export const RecentWorkflowsWidget: React.FC<DashboardItemsContext> = ({ workflows, isLoading }) => {
  const [runningWorkflowId, setRunningWorkflowId] = useState<string | null>(null);
  const navigate = useNavigate();
  const recentWorkflows = useMemo(() => {
    return [...(workflows || [])]
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 3);
  }, [workflows]);
  const handleWorkflowClick = (workflowId: string) => {
    navigate(`/workflow/${workflowId}`);
  };
  const runWorkflow = async (workflowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setRunningWorkflowId(workflowId);
      await executeWorkflow(workflowId);
    } catch (error) {
      console.error('Error executing workflow:', error);
    } finally {
      setRunningWorkflowId(null);
    }
  };
  return (
    <div className="widget recent-workflows-widget">
      <h2><FiClock className="widget-icon" /> Recent Workflows</h2>
      <div className="widget-content">
        {recentWorkflows.length === 0 && isLoading ? (
          <div className="loading-card" style={{
            background: 'transparent',
            textAlign: 'center',
            padding: '32px 0',
            color: 'var(--text-color-secondary, #888)',
            fontSize: '1.1em'
          }}>
            <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
            Loading...
          </div>
        ) : recentWorkflows.length > 0 ? (
          <div className="dashboard-list">
            {recentWorkflows.map(workflow => (
              <div
                style={{ border: "1px solid var(--border-color)", marginTop: "5px" }}
                key={workflow._id}
                className="workflow-item-mini"
                onClick={() => handleWorkflowClick(workflow._id)}
              >
                <div className="workflow-item-mini-content">
                  <h3>{workflow.name}</h3>
                  <p className="workflow-item-mini-info">
                    {workflow.commands?.length || 0} actions • Last updated: {
                      new Date(workflow.updatedAt || workflow.createdAt || '').toLocaleDateString()
                    }
                  </p>
                </div>
                <button
                  className={`run-workflow-btn ${runningWorkflowId === workflow._id ? 'running' : ''}`}
                  onClick={(e) => runWorkflow(workflow._id, e)}
                  disabled={runningWorkflowId !== null}
                >
                  <FiPlay />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-widget-state">
            <p>No recent workflows</p>
          </div>
        )}
      </div>
    </div>
);
};

export const TrendingWidget: React.FC = () => {
  const [trending, setTrending] = useState<{ repos: Repository[]; news: NewsItem[]; lastUpdated?: number | string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (window.electron as any).getTrendingContent
      ? (window.electron as any).getTrendingContent()
          .then((data: any) => {
            if (mounted) {
              setTrending(data);
              setLoading(false);
            }
          })
          .catch(() => {
            if (mounted) {
              setTrending(null);
              setLoading(false);
            }
          })
      : window.electron.ipcRenderer && (window.electron.ipcRenderer as any).invoke &&
        (window.electron.ipcRenderer as any).invoke('getTrendingContent')
          .then((data: any) => {
            if (mounted) {
              setTrending(data);
              setLoading(false);
            }
          })
          .catch(() => {
            if (mounted) {
              setTrending(null);
              setLoading(false);
            }
          });
    return () => { mounted = false; };
  }, []);

  const repos = trending?.repos || [];
  const news = trending?.news || [];
  const lastUpdated = trending?.lastUpdated
    ? new Date(trending.lastUpdated).toLocaleString()
    : null;

  // Type guards
  function isRepo(item: any): item is Repository {
    return typeof item.name === 'string' && typeof item.owner === 'string';
  }
  function isNews(item: any): item is NewsItem {
    return typeof item.title === 'string' && typeof item.source === 'string';
  }

  // Interleave repos and news for display
  const interleaved: ({ type: 'repo'; data: Repository } | { type: 'news'; data: NewsItem })[] = [];
  const maxLen = Math.max(repos.length, news.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < repos.length) interleaved.push({ type: 'repo', data: repos[i] });
    if (i < news.length) interleaved.push({ type: 'news', data: news[i] });
  }

  return (
    <div className="widget trending-widget">
      <h2><FaFire className="widget-icon" /> Trending</h2>
      <div className="widget-content trending-content">
        {loading ? (
          <div className="loading-trending">
            <div className="spinner" />
            <span>Loading trending content...</span>
          </div>
        ) : interleaved.length === 0 ? (
          <div className="empty-trending empty-widget-state">
            <p>No trending content available.</p>
          </div>
        ) : (
          <div className="dashboard-list">
            {interleaved.map((item, idx) =>
              item.type === 'repo' && isRepo(item.data) ? (
                <div className="repo-item" key={`repo-${item.data.url}-${idx}`}>
                  <div className="repo-header">
                    <h4>
                      <span className="repo-icon"><FaFire /></span>
                      <a href={item.data.url} target="_blank" rel="noopener noreferrer" className="visit-link" title={item.data.name}>
                        {item.data.owner}/{item.data.name}
                        <FiExternalLink style={{ marginLeft: 4, fontSize: '0.9em' }} />
                      </a>
                    </h4>
                    {item.data.language && (
                      <span className="repo-language">{item.data.language}</span>
                    )}
                  </div>
                  <div className="repo-description">{item.data.description}</div>
                  <div className="repo-stats">
                    <span className="stat"><FiStar className="stat-icon" />{item.data.stars}</span>
                    <span className="stat"><FiGitBranch className="stat-icon" />{item.data.forks}</span>
                  </div>
                </div>
              ) : item.type === 'news' && isNews(item.data) ? (
                <div className="news-item" key={`news-${item.data.url}-${idx}`}>
                  <div className="news-header">
                    <h4>
                      <span className="news-icon"><FaFire /></span>
                      <a href={item.data.url} target="_blank" rel="noopener noreferrer" className="visit-link" title={item.data.title}>
                        {item.data.title}
                        <FiExternalLink style={{ marginLeft: 4, fontSize: '0.9em' }} />
                      </a>
                    </h4>
                  </div>
                  <div className="news-description">{item.data.description}</div>
                  <div className="news-footer">
                    <span className="news-source">{item.data.source}</span>
                    <span>{item.data.published_at ? new Date(item.data.published_at).toLocaleDateString() : ''}</span>
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}
        {lastUpdated && (
          <div className="mock-data-notice" style={{ marginTop: 4 }}>
            Last updated: {lastUpdated}
          </div>
        )}
      </div>
    </div>
  );
};

// Analytics Widget
export const AnalyticsWidget: React.FC<DashboardItemsContext> = ({ workflows, isLoading }) => {
  const [analyticsView, setAnalyticsView] = useState<'summary' | 'chart'>('summary');
  const [totalTimeSavedSeconds, setTotalTimeSavedSeconds] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    window.electron.getTimeSavedSeconds()
      .then(res => {
        if (mounted && res.success) setTotalTimeSavedSeconds(res.timeSavedSeconds || 0);
      })
      .catch(() => { if (mounted) setTotalTimeSavedSeconds(0); });
    return () => { mounted = false; };
  }, []);

  const recentWorkflows = useMemo(() => {
    return [...(workflows || [])]
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 3);
  }, [workflows]);

  // Compute analytics locally
  const analytics = useMemo(() => {
    const totalWorkflow = workflows.length;
    const favoriteWorkflow = workflows.filter(w => w.isFavorite).length;
    const totalCommands = workflows.reduce((acc, w) => acc + (w.commands?.length || 0), 0);
    // Most common command type
    const commandTypeCounts: Record<string, number> = {};
    workflows.forEach(w => w.commands?.forEach(cmd => {
      commandTypeCounts[cmd.type] = (commandTypeCounts[cmd.type] || 0) + 1;
    }));
    let mostCommonCommandType = null;
    let mostCommonCommandTypeCount = 0;
    Object.entries(commandTypeCounts).forEach(([type, count]) => {
      if (count > mostCommonCommandTypeCount) {
        mostCommonCommandType = type;
        mostCommonCommandTypeCount = count;
      }
    });
    // Launches per workflow (mocked as 0 for now)
    const launchesPerWorkflow: Record<string, number> = {};
    // Most launched workflow (mocked as none)
    let mostLaunchedWorkflowId = null;
    let mostLaunchedWorkflowName = null;
    let mostLaunchedWorkflowCount = 0;
    return {
      totalWorkflow,
      favoriteWorkflow,
      totalCommands,
      mostCommonCommandType,
      mostCommonCommandTypeCount,
      launchesPerWorkflow,
      mostLaunchedWorkflowId,
      mostLaunchedWorkflowName,
      mostLaunchedWorkflowCount,
      totalTimeSavedSeconds
    };
  }, [workflows, totalTimeSavedSeconds]);

  const getChartColorForType = (type: string): string => {
    const colorMap: {[key: string]: string} = {
      'app': '#4299E1',
      'terminal': '#68D391',
      'url': '#F6AD55',
      'docker': '#9F7AEA',
    };
    return colorMap[type] || '#CBD5E0';
  };
  // Add a helper to format seconds
  const formatTimeSaved = (seconds: number) => {
    if (!seconds || seconds <= 0) return "0s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [
      h > 0 ? `${h}h` : null,
      m > 0 ? `${m}m` : null,
      s > 0 ? `${s}s` : null,
    ].filter(Boolean).join(' ');
  };
  return (
    <div className="widget trending-widget">
      <h2>
        <FiTrendingUp className="widget-icon" /> Analytics
        <div className="widget-controls">
          <button
            className={`view-toggle-btn ${analyticsView === 'summary' ? 'active' : ''}`}
            onClick={() => setAnalyticsView('summary')}
            title="Summary View"
          >
            <FiList />
          </button>
        </div>
      </h2>
      <div className="dashboard-list">
        {isLoading ? (
          <div className="loading-card" style={{
            background: 'transparent',
            textAlign: 'center',
            padding: '32px 0',
            color: 'var(--text-color-secondary, #888)',
            fontSize: '1.1em'
          }}>
            <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
            Loading...
          </div>
        ) : analytics ? (
          <>
            {analyticsView === 'summary' ? (
              <div className="analytics-container">
                {/* --- Add Total Time Saved --- */}
                <div className="analytics-row">
                  <div className="analytics-stat">
                    <span className="stat-label">Total Workflows</span>
                    <span className="stat-value">{analytics.totalWorkflow}</span>
                  </div>
                  <div className="analytics-stat">
                    <span className="stat-label">Favorites</span>
                    <span className="stat-value">{analytics.favoriteWorkflow}</span>
                  </div>
                </div>
                <div className="analytics-row">
                  <div className="analytics-stat">
                    <span className="stat-label">Total Actions</span>
                    <span className="stat-value">{analytics.totalCommands}</span>
                  </div>
                  <div className="analytics-stat">
                    <span className="stat-label">Workflows Launched</span>
                    <span className="stat-value">{analytics.mostLaunchedWorkflowCount || 0}</span>
                  </div>
                </div>
                {/* --- Time Saved Row --- */}
                <div className="analytics-row">
                  <div className="analytics-stat" style={{ flex: 1 }}>
                    <span className="stat-label">Total Time Saved</span>
                    <span className="stat-value" title={`${analytics.totalTimeSavedSeconds || 0} seconds`}>
                      {formatTimeSaved(analytics.totalTimeSavedSeconds || 0)}
                    </span>
                  </div>
                </div>
                {/* --- existing highlight and launches --- */}
                <div className="analytics-highlight">
                  <div className="highlight-item">
                    <span className="highlight-label">Most Common Action</span>
                    <span className="highlight-value">
                      {analytics.mostCommonCommandType
                        ? `${analytics.mostCommonCommandType} (${analytics.mostCommonCommandTypeCount || 0})`
                        : 'None yet'}
                    </span>
                  </div>
                  <div className="highlight-item">
                    <span className="highlight-label">Most Launched Workflow</span>
                    <span className="highlight-value">
                      {analytics.mostLaunchedWorkflowName
                        ? analytics.mostLaunchedWorkflowName
                        : 'None yet'}
                    </span>
                  </div>
                </div>
                {analytics.launchesPerWorkflow && Object.keys(analytics.launchesPerWorkflow).length > 0 && (
                  <div className="analytics-section">
                    <span className="section-label">Workflow Launches</span>
                    <div className="launches-list">
                      {Object.entries(analytics.launchesPerWorkflow)
                        .sort(([, countA], [, countB]) => Number(countB) - Number(countA))
                        .slice(0, 5)
                        .map(([workflowId, count]) => {
                          const workflow = recentWorkflows.find(t => t._id === workflowId);
                          return (
                            <div key={workflowId} className="launch-item">
                              <span className="launch-name">{workflow?.name || 'Workflow ' + workflowId.substr(-4)}</span>
                              <span className="launch-count">{String(count)}</span>
                            </div>
                          );
                        })
                      }
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="analytics-chart-view">
                {/* Chart view code if needed */}
              </div>
            )}
          </>
        ) : (
          <div className="empty-widget-state">
            <p>No analytics data available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Export ToolsCard for use in other parts of the app
export { ToolsCard };
