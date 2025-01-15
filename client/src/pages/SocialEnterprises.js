// src/pages/SocialEnterprises.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout'; // Import the Layout component
import '../styles/SocialEnterprises.css'; // Import the Social Enterprises CSS

const SocialEnterprises = () => {
  const [enterprises, setEnterprises] = useState([]);

  useEffect(() => {
    fetch("/api/social-enterprises")
      .then(response => response.json())
      .then(data => setEnterprises(data));
  }, []);

  return (
    <Layout>
      <div className="social-enterprises-container">
        <h2>Social Enterprises</h2>
        {enterprises.length === 0 ? (
          <p>Loading...</p>
        ) : (
          <ul>
            {enterprises.map((enterprise, index) => (
              <li key={index}>{enterprise.name}</li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
};

export default SocialEnterprises;
