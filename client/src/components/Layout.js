// src/components/Layout.js
// src/components/Layout.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Layout.css'; // Create this for styling the layout

const Layout = ({ children }) => {
  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="logo">LSEED Insight</div>
        <nav>
          <ul>
            <li>
              <Link to="/">Dashboard</Link>
            </li>
            <li>
              <Link to="/reports">Reports</Link>
            </li>
            <li>
              <Link to="/social-enterprises">Social Enterprises</Link>
            </li>
            <li>
              <Link to="/analytics">Analytics</Link>
            </li>
            <li>
              <Link to="/scheduling">Scheduling</Link>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="content">
        <header className="header">
          <input type="date" /> {/* Mock date picker */}
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
};

export default Layout;

