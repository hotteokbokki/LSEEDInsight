// src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './pages/Home'; // Import Home component
import Reports from './pages/Reports'; // Import Reports component
import SocialEnterprises from './pages/SocialEnterprises'; // Import Social Enterprises component
import Analytics from './pages/Analytics'; // Import Analytics component
import Scheduling from './pages/Scheduling'; // Import Scheduling component

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
      <div>
        {/* Navigation Links */}
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/reports">Reports</Link>
            </li>
            <li>
              <Link to="/social-enterprises">Social Enterprises</Link>
            </li>
            <li>
              <Link to="/analytics">Analytics</Link>
            </li>
            <li>
              <Link to="/scheduling">Scheduling</Link>
            </li>
            <li>
              <Link to="/other">Other Page</Link>
            </li>
          </ul>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home backendData={backendData} />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/social-enterprises" element={<SocialEnterprises />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/scheduling" element={<Scheduling />} />
          <Route path="/other" element={<OtherPage />} />
        </Routes>
      </div>
    </Router>
  );
}

const OtherPage = () => {
  return <div>Other Page</div>;
};

export default App;
