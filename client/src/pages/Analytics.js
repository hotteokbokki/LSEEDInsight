// src/pages/Analytics.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AnalyticsChart from '../components/AnalyticsSample'; // Import the donut chart
import '../styles/Analytics.css';

const Analytics = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((response) => response.json())
      .then((data) => setData(data));
  }, []);

  return (
    <Layout>
      <div className="analytics-container">
        <h2>Analytics</h2>
        <div className="analytics-overview">
          <div className="analytics-card">
            <p><strong>Performance:</strong> {data?.performance || 'Loading...'}</p>
          </div>
          <div className="analytics-card">
            <p><strong>Revenue:</strong> {data?.revenue || 'Loading...'}</p>
          </div>
        </div>
        <div className="analytics-chart">
          <h3>Revenue Distribution</h3>
          <AnalyticsChart />
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
