import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './pages/Home';
import Reports from './pages/Reports';
import SocialEnterprises from './pages/SocialEnterprises';
import Analytics from './pages/Analytics';
import Scheduling from './pages/Scheduling';

function App() {
  const [backendData, setBackendData] = useState({ users: [] }); // Default to an empty array for 'users'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:4000/api") // Make sure to call the backend server correctly
      .then((response) => response.json())
      .then((data) => {
        setBackendData(data); // Set the entire response (with 'users')
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<Home backendData={backendData} loading={loading} error={error} />}
        />
        <Route path="/reports" element={<Reports />} />
        <Route path="/social-enterprises" element={<SocialEnterprises />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/scheduling" element={<Scheduling />} />
      </Routes>
    </Router>
  );
}

export default App;
