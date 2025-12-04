import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';

// Lazy loading des pages pour optimiser les performances
const Landing = lazy(() => import('./pages/Landing'));
const Organizer = lazy(() => import('./pages/Organizer'));
const Participant = lazy(() => import('./pages/Participant'));
const Admin = lazy(() => import('./pages/Admin'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));

// Composant de chargement pendant le lazy loading
const LoadingFallback = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)',
    color: 'white',
    fontSize: '24px',
    fontWeight: '700'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        marginBottom: '20px',
        fontSize: '48px',
        animation: 'pulse 2s ease-in-out infinite'
      }}>
        ✨
      </div>
      <div>Chargement...</div>
    </div>
  </div>
);

function App() {
  return (
    <UserProvider>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/create" element={<Organizer />} />
            <Route path="/participant" element={<Participant />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </Suspense>
      </Router>
    </UserProvider>
  );
}

export default App;
