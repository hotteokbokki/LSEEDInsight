import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContextProvider, useAuth } from "./context/authContext";
import Login from "./scenes/login";
import Dashboard from "./scenes/dashboard";
import SocialEnterprise from "./scenes/socialenterprise";
import Mentors from "./scenes/mentors";
import Analytics from "./scenes/analytics";
import Reports from "./scenes/reports";
import Scheduling from "./scenes/scheduling";
import Sidebar from "./scenes/global/Sidebar";
import Topbar from "./scenes/global/Topbar";
import { ColorModeContext, useMode } from "./theme";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useEffect } from "react";

const App = () => {
  const [theme, colorMode] = useMode();

  return (
    <AuthContextProvider>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <div className="app">
            <MainContent />
          </div>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </AuthContextProvider>
  );
};

const MainContent = () => {
  const { user, loading } = useAuth();

  // useEffect(() => {
  //   if (!loading && user) {
  //     console.log('Logged in user:', user);
  //     console.log('user role:', user.role);
  //   }
  // }, [user, loading]);

  if (loading) return <div>Loading...</div>; // Show a loading screen while user authentication is being checked

  return (
    <>
      {user && <Sidebar />}
      <main className="content">
        {user && <Topbar />}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/socialenterprise" element={user ? <SocialEnterprise /> : <Navigate to="/" />} />
          <Route path="/mentors" element={user ? <Mentors /> : <Navigate to="/" />} />
          <Route path="/analytics" element={user ? <Analytics /> : <Navigate to="/" />} />
          <Route path="/reports" element={user ? <Reports /> : <Navigate to="/" />} />
          <Route path="/scheduling" element={user ? <Scheduling /> : <Navigate to="/" />} />
          {/* Protected Routes - Only for Logged-in Users */}
          {user ? (
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              {["LSEED", "Mentor"].includes(user.role) && (
                <Route path="/socialenterprise" element={<SocialEnterprise />} />
              )}
              {user.role === "LSEED" && <Route path="/mentors" element={<Mentors />} />}
              {["LSEED", "Guest User"].includes(user.role) && <Route path="/analytics" element={<Analytics />} />}
              {["LSEED", "Guest User"].includes(user.role) && <Route path="/reports" element={<Reports />} />}
              {["LSEED", "Mentor"].includes(user.role) && <Route path="/scheduling" element={<Scheduling />} />}
            </>
          ) : (
            <Route path="*" element={<Navigate to="/" />} />
          )}
        </Routes>
      </main>
    </>
  );
};

export default App;
