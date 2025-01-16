import React from 'react';
import Layout from '../components/Layout';
import '../styles/Home.css';

const Home = ({ backendData }) => {
  // Check the data received in backendData
  console.log("Backend data received:", backendData);

  return (
    <Layout>
      <div className="home-container">
        <h2>Home Page</h2>
        {backendData.users && backendData.users.length === 0 ? (
          <p>No data available.</p>
        ) : (
          backendData.users.map((user, i) => (
            <div key={i} className="user-card">
              <p><strong>Sample ID:</strong> {user.sampleID}</p>
              <p><strong>Sample Data 1:</strong> {user["sample data 1"]}</p>
              <p><strong>Sample Data 2:</strong> {user["sample data 2"]}</p>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
};

export default Home;
