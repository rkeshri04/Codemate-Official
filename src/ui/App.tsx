import { useState } from 'react';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  return (
    <Routes>
      <Route path="/" element={
        <Navigate to="/dashboard" replace />
      } />
      <Route
        path="/"
        element={
            <Dashboard user={currentUser} />
        }
      >
        <Route path="dashboard" element={<WorkflowsList />} />
        <Route path="workflow/:id" element={<WorkflowDetail authToken={localStorage.getItem('authToken') || ''} />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
    </Routes>
  );
}
