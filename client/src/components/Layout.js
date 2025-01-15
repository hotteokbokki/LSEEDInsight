// src/components/Layout.js
import React from 'react';
import Sidebar from './Sidebar';
import '../styles/Layout.css'; // You can define the layout-related styles here

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="content">
        {children}
      </div>
    </div>
  );
};

export default Layout;
