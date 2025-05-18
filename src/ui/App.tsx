import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './screens/Dashboard';
import WorkflowsList from './components/dashboard/DashboardItems';
import WorkflowDetail from './screens/[id]';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import './App.css';
import React, { useEffect, useState } from 'react';
import { TermsPrivacyModal } from './components/modals/TermsPrivacyModal';

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
  const [termsChecked, setTermsChecked] = useState(false);
  const [showModal, setShowModal] = useState<'terms' | 'privacy' | null>(null);

  useEffect(() => {
    // Check both flags in parallel
    Promise.all([
      window.electron.getTermsAccepted(),
      window.electron.getPrivacyAccepted ? window.electron.getPrivacyAccepted() : Promise.resolve({ accepted: false })
    ]).then(([termsRes, privacyRes]) => {
      if (!termsRes.accepted) {
        setShowModal('terms');
      } else if (!privacyRes.accepted) {
        setShowModal('privacy');
      }
      setTermsChecked(true);
    });
  }, []);

  const handleAgree = async () => {
    if (showModal === 'terms') {
      await window.electron.setTermsAccepted();
      // Now check privacy
      const privacyRes = window.electron.getPrivacyAccepted
        ? await window.electron.getPrivacyAccepted()
        : { accepted: false };
      if (!privacyRes.accepted) {
        setShowModal('privacy');
      } else {
        setShowModal(null);
      }
    } else if (showModal === 'privacy') {
      await window.electron.setPrivacyAccepted();
      setShowModal(null);
    }
  };

  if (!termsChecked) return null; // Wait for check before rendering

  return (
    <>
      <TermsPrivacyModal
        open={!!showModal}
        type={showModal}
        onClose={() => {}}
      />
      {showModal ? null : (
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
      )}
      {showModal && (
        <div style={{
          position: 'fixed',
          zIndex: 1100,
          left: 0, right: 0, bottom: 0,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <button
            style={{
              marginTop: 24,
              padding: '10px 28px',
              fontSize: 17,
              borderRadius: 8,
              background: 'var(--primary-color)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
            onClick={handleAgree}
            autoFocus
          >
            Yes, I agree
          </button>
        </div>
      )}
    </>
  );
}
