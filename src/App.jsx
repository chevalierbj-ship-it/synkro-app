import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import Landing from './pages/Landing';
import Organizer from './pages/Organizer';
import Participant from './pages/Participant';
import Admin from './pages/Admin';
import Pricing from './pages/Pricing';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/create" element={<Organizer />} />
          <Route path="/participant" element={<Participant />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/pricing" element={<Pricing />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
