// src/pages/SocialEnterprises.js
import React, { useState, useEffect } from 'react';

const SocialEnterprises = () => {
  const [enterprises, setEnterprises] = useState([]);

  useEffect(() => {
    // Fetch social enterprise data
    fetch("/api/social-enterprises")
      .then(response => response.json())
      .then(data => setEnterprises(data));
  }, []);

  return (
    <div>
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
  );
};

export default SocialEnterprises;
