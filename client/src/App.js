import React, { useEffect } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthContextProvider, useAuth } from "./context/authContext";
import Login from "./scenes/login";
import Dashboard from "./scenes/dashboard";
import SocialEnterprise from "./scenes/socialenterprise";
import Mentors from "./scenes/mentors";
import Admin from "./scenes/admin";
import Analytics from "./scenes/analytics";
import Reports from "./scenes/reports";
import Scheduling from "./scenes/scheduling";
import AssessSEPage from "./scenes/assess";
import Sidebar from "./scenes/global/Sidebar";
import Topbar from "./scenes/global/Topbar";
import Unauthorized from "./scenes/unauthorized";
import { ColorModeContext, useMode } from "./theme";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Cookies from 'js-cookie';  // You can use js-cookie to easily work with cookies

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

const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

const MainContent = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      console.log("Logged in user:", user);

      console.log("All Cookies:", document.cookie);

      const sessionId = Cookies.get('sessionId');  // js-cookie automatically decodes the cookie value
      console.log("User session:", sessionId);
    }
  }, [user, loading]);

  if (loading) return <div>Loading...</div>; // Show a loading screen while user authentication is being checked

  return (
    <>
      {user && <Sidebar />}
      <main className="content">
        {user && <Topbar />}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/admin" element={user ? <Navigate to="/admin" /> : <Admin />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* User Routes */}
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/socialenterprise" element={user ? <SocialEnterprise /> : <Navigate to="/" />} />
          <Route path="/mentors" element={user ? <Mentors /> : <Navigate to="/" />} />
          <Route path="/analytics" element={user ? <Analytics /> : <Navigate to="/" />} />
          <Route path="/reports" element={user ? <Reports /> : <Navigate to="/" />} />
          <Route path="/scheduling" element={user ? <Scheduling /> : <Navigate to="/" />} />
          <Route path="/assess" element={user ? <AssessSEPage /> : <Navigate to="/" />} />

          {/* Protected Routes - Only for Logged-in Users */}
          <Route element={<ProtectedRoute allowedRoles={["LSEED", "Mentor"]} />}>
            <Route path="/socialenterprise" element={<SocialEnterprise />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["LSEED"]} />}>
            <Route path="/mentors" element={<Mentors />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["LSEED", "Guest User"]} />}>
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["LSEED", "Mentor"]} />}>
            <Route path="/scheduling" element={<Scheduling />} />
            <Route path="/assess" element={<AssessSEPage />} />
          </Route>

          {/* Catch-all: Redirect unauthorized access */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
};

export default App;
