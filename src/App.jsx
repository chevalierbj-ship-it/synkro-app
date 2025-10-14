import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Landing from './pages/Landing'
import Organizer from './pages/Organizer'
import Participant from './pages/Participant'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/create" element={<Organizer />} />
        <Route path="/respond" element={<Participant />} />
      </Routes>
    </Router>
  )
}

export default App