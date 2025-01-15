// src/pages/Analytics.js
import React, { useState, useEffect } from 'react';

const Analytics = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch analytics data
    fetch("/api/analytics")
      .then(response => response.json())
      .then(data => setData(data));
  }, []);

  return (
    <div>
      <h2>Analytics</h2>
      {data ? (
        <div>
          <p>Performance: {data.performance}</p>
          <p>Revenue: {data.revenue}</p>
          {/* Add other analytics data */}
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Analytics;
