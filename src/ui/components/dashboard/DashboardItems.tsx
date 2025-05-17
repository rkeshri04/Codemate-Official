import React from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  RecentWorkflowsWidget,
  TrendingWidget,
  AnalyticsWidget,
  ToolsCard
} from './DashboardWidgets';

const WorkflowsList: React.FC = ({}) => {
  const { workflows, setWorkflows, isLoading } = useOutletContext<DashboardItemsContext>();
  return (
    <div className="dashboard-content-container">
      <div className="dashboard-widgets">
        <RecentWorkflowsWidget workflows={workflows} setWorkflows={setWorkflows} isLoading={isLoading} />
        <TrendingWidget />
        <AnalyticsWidget workflows={workflows} setWorkflows={setWorkflows} isLoading={isLoading} />
        <ToolsCard />
        {/* <FrequentWorkflowsWidget /> */}
      </div>
    </div>
  );
};

export default WorkflowsList;
