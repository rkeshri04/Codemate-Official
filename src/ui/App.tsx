import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './screens/Dashboard';
import WorkflowsList from './components/dashboard/DashboardItems';
import WorkflowDetail from './screens/[id]';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import './App.css';

export default function AppWrapper() {
  return (
    <ThemeProvider>
      <Router>
        <App />
      </Router>
    </ThemeProvider>
  );
}

function App() {

  return (
    <Routes>
      <Route path="/" element={
        <Navigate to="/dashboard" replace />
      } />
      <Route
        path="/"
        element={
            <Dashboard />
        }
      >
        <Route path="dashboard" element={<WorkflowsList />} />
        <Route path="workflow/:id" element={<WorkflowDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
