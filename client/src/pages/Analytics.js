// src/pages/Analytics.js
import React, { useState, useEffect } from 'react';
import '../styles/Analytics.css'; // Import the Analytics CSS

const Analytics = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then(response => response.json())
      .then(data => setData(data));
  }, []);

  return (
    <div className="analytics-container">
      <h2>Analytics</h2>
      {data ? (
        <div>
          <p>Performance: {data.performance}</p>
          <p>Revenue: {data.revenue}</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Analytics;
