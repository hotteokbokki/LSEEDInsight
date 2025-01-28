import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate} from 'react-router-dom';
import { AuthContextProvider, useAuth } from './context/authContext';
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
  const [theme, colorMode] = useMode();

  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath === '/') {
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
            <MainContent isLoginPage={isLoginPage} />
          </div>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </AuthContextProvider>
  );
};

const MainContent = ({ isLoginPage }) => {
  const { user, loading } = useAuth(); // Access user from context

  useEffect(() => {
    if (!loading) {
      console.log('Logged in user:', user);
    }
  }, [user, loading]);

  // Wait until loading is complete
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {user && <Sidebar />}
      <main className="content">
        {user && <Topbar />}
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          {/* If user is authenticated, show dashboard, else redirect to login */}
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/socialenterprise" element={user ? <SocialEnterprise /> : <Navigate to="/" />} />
          <Route path="/mentors" element={user ? <Mentors /> : <Navigate to="/" />} />
          <Route path="/analytics" element={user ? <Analytics /> : <Navigate to="/" />} />
          <Route path="/reports" element={user ? <Reports /> : <Navigate to="/" />} />
          <Route path="/scheduling" element={user ? <Scheduling /> : <Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
};

export default App;
