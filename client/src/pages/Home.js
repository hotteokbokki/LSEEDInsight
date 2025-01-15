// src/pages/Home.js
import React from 'react';

const Home = ({ backendData }) => {
  return (
    <div>
      {(typeof backendData.users === 'undefined') ? (
        <p>loading...</p>
      ) : (
        backendData.users.map((user, i) => (
          <p key={i}>{user}</p>
        ))
      )}
    </div>
  );
};

export default Home;
