// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import '../styles/Home.css';

const Home = ({ backendData }) => {
  return (
    <Layout>
      <div className="home-container">
        <h2>Home Page</h2>
        {(typeof backendData.users === 'undefined') ? (
          <p>loading...</p>
        ) : (
          backendData.users.map((user, i) => (
            <p key={i}>{user}</p>
          ))
        )}
      </div>
    </Layout>
  );
};

export default Home;
