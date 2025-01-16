import React from 'react';
import Layout from '../components/Layout';
import '../styles/Reports.css';

const Reports = () => {
  const reports = [
    { id: 1, name: 'Report 1', date: '2025-01-10' },
    { id: 2, name: 'Report 2', date: '2025-01-15' },
  ];

  return (
    <Layout>
      <div className="reports-container">
        <h2>Reports</h2>
        <table className="reports-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>{report.id}</td>
                <td>{report.name}</td>
                <td>{report.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default Reports;
