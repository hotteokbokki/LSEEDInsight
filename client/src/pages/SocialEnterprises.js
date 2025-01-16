import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import '../styles/SocialEnterprises.css';

const SocialEnterprises = () => {
  const [enterprises, setEnterprises] = useState([]);

  useEffect(() => {
    fetch("/api/social-enterprises")
      .then((response) => response.json())
      .then((data) => setEnterprises(data));
  }, []);

  return (
    <Layout>
      <div className="social-enterprises-container">
        <h2>Social Enterprises</h2>
        <div className="enterprise-list">
          {enterprises.length === 0 ? (
            <p>Loading...</p>
          ) : (
            enterprises.map((enterprise, index) => (
              <div key={index} className="enterprise-card">
                <p><strong>Name:</strong> {enterprise.name}</p>
                <p><strong>Description:</strong> {enterprise.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SocialEnterprises;
