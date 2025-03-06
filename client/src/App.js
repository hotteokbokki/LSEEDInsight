import React, { useEffect } from "react";
import { Box } from "@mui/material";

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
import SEAnalytics from "./scenes/seanalytics";
import MentorAnalytics from "./scenes/mentoranalytics";
import Mentorships from "./scenes/mentorships";
import Sidebar from "./scenes/global/Sidebar";
import Topbar from "./scenes/global/Topbar";
import Unauthorized from "./scenes/unauthorized";
import { ColorModeContext, useMode } from "./theme";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Cookies from "js-cookie";

import { useLocation } from "react-router-dom";

const App = () => {
  const [theme, colorMode] = useMode();
  

  return (
    <AuthContextProvider>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box sx={{ display: "flex", minHeight: "100vh" }}>
            <MainContent />
          </Box>
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
  const location = useLocation();

  useEffect(() => {
    if (!loading && user) {
      console.log("[App.js] Logged in user:", user);
      console.log("[App.js] User ID:", user.id);

      console.log("[App.js] All Cookies:", document.cookie);

      const sessionId = Cookies.get("session_id");
      console.log("[App.js] User session:", sessionId);
    }
  }, [user, loading]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [location]);

  if (loading) return <div>Loading...</div>;

  return (
    <Box sx={{ display: "flex", width: "100%", minHeight: "100vh" }}>
      {user && <Sidebar />}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {user && <Topbar />}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            padding: "20px",
          }}
        >
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* User Routes */}
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
            <Route path="/socialenterprise" element={user ? <SocialEnterprise /> : <Navigate to="/" />} />
            <Route path="/mentors" element={user ? <Mentors /> : <Navigate to="/" />} />
            <Route path="/analytics" element={user ? <Analytics /> : <Navigate to="/" />} />
            <Route path="/reports" element={user ? <Reports /> : <Navigate to="/" />} />
            <Route path="/scheduling" element={user ? <Scheduling /> : <Navigate to="/" />} />
            <Route path="/assess" element={user ? <AssessSEPage /> : <Navigate to="/" />} />
            <Route path="/se-analytics/:id" element={<SEAnalytics />} />
            <Route path="/mentor-analytics/:id" element={<MentorAnalytics />} />
            <Route path="/mentorships" element={<Mentorships />} />
            <Route path="/admin" element={user ? <Admin /> : <Navigate to="/" />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={["Administrator"]} />}>
              <Route path="/admin" element={<Admin />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["LSEED", "Mentor"]} />}>
              <Route path="/socialenterprise" element={<SocialEnterprise />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["LSEED"]} />}>
              <Route path="/mentors" element={<Mentors />} />
              <Route path="/seanalytics" element={<SEAnalytics />} />
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
        </Box>
      </Box>
    </Box>
  );
};

export default App;
