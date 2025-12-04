import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Organizer from './pages/Organizer';
import Participant from './pages/Participant';
import Admin from './pages/Admin';
import Pricing from './pages/Pricing';  // ← AJOUTE CETTE LIGNE

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/create" element={<Organizer />} />
        <Route path="/participant" element={<Participant />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/pricing" element={<Pricing />} />  {/* ← AJOUTE CETTE LIGNE */}
      </Routes>
    </Router>
  );
}

export default App;
