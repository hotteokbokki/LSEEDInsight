// src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './pages/Home';
import Reports from './pages/Reports';
import SocialEnterprises from './pages/SocialEnterprises';
import Analytics from './pages/Analytics';
import Scheduling from './pages/Scheduling';

function App() {
  const [backendData, setBackendData] = useState([{}]);

  useEffect(() => {
    fetch("/api")
      .then(response => response.json())
      .then(data => {
        setBackendData(data);
      });
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home backendData={backendData} />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/social-enterprises" element={<SocialEnterprises />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/scheduli`ng" element={<Scheduling />} />
      </Routes>
    </Router>
  );
}

export default App;
