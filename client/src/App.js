import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom'; // Removed Router import
import { AuthContextProvider } from './context/authContext'; // Import the AuthContextProvider to manage authentication
import Login from './scenes/login';
import Dashboard from './scenes/dashboard';
import SocialEnterprise from './scenes/socialenterprise';
import Mentors from './scenes/mentors';
import Analytics from './scenes/analytics';
import Reports from './scenes/reports';
import Scheduling from './scenes/scheduling';
import Sidebar from './scenes/global/Sidebar';
import Topbar from './scenes/global/Topbar'; 
import { ColorModeContext, useMode } from './theme'; 
import { ThemeProvider } from '@mui/material/styles'; 
import CssBaseline from '@mui/material/CssBaseline';

const App = () => {
  const [isLoginPage, setIsLoginPage] = useState(false);

  // Get the theme and colorMode functions from useMode hook
  const [theme, colorMode] = useMode();

  useEffect(() => {
    const currentPath = window.location.pathname;
    // Check if the current page is the login page
    if (currentPath === "/") {
      setIsLoginPage(true);
    } else {
      setIsLoginPage(false);
    }
  }, []);

  return (
    <AuthContextProvider>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <div className="app">
            {/* Only show Sidebar and Topbar if it's not the login page */}
            {!isLoginPage && <Sidebar />}
            <main className="content">
              {!isLoginPage && <Topbar />}
              <Routes>
                {/* Define your routes here */}
                <Route path="/" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/socialenterprise" element={<SocialEnterprise />} />
                <Route path="/mentors" element={<Mentors />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/scheduling" element={<Scheduling />} />
              </Routes>
            </main>
          </div>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </AuthContextProvider>
  );
};

export default App;



/* 

import { ColorModeContext, useMode } from "./theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import Topbar from "./scenes/global/Topbar";
import Sidebar from "./scenes/global/Sidebar";
import Dashboard from "./scenes/dashboard";
import SocialEnterprise from "./scenes/socialenterprise";
import Mentors from "./scenes/mentors";
import Analytics from "./scenes/analytics";
import Reports from "./scenes/reports";
import Scheduling from "./scenes/scheduling";
import Login from "./scenes/login";
import { Routes, Route, useLocation } from "react-router-dom";


function App() {
 const [backendData, setBackendData] = useState({ users: [] }); // Default to an empty array for 'users'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:4000/api") // Make sure to call the backend server correctly
      .then((response) => response.json())
      .then((data) => {
        setBackendData(data); // Set the entire response (with 'users')
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<Home backendData={backendData} loading={loading} error={error} />}
        />
        <Route path="/reports" element={<Reports />} />
        <Route path="/social-enterprises" element={<SocialEnterprises />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/scheduling" element={<Scheduling />} />
      </Routes>
    </Router>
  );
  ---------------------
  const [theme, colorMode] = useMode();
  const location = useLocation();

  const isLoginPage = location.pathname === '/'; // Checks if user is in login page
  
  console.log(location.pathname + "this is the console log");

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="app">
          {!isLoginPage && <Sidebar />}
          
          <main className="content">
          {!isLoginPage && <Topbar />}
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/socialenterprise" element={<SocialEnterprise />} />
              <Route path="/mentors" element={<Mentors />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/scheduling" element={<Scheduling />} />
            </Routes>

          </main>
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
*/
