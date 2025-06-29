import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthContextProvider, useAuth } from "./context/authContext";
import ScrollToTop from "./components/ScrollToTop";
import Login from "./scenes/login";
import Dashboard from "./scenes/dashboard";
import SocialEnterprise from "./scenes/socialenterprise";
import Mentors from "./scenes/mentors";
import Admin from "./scenes/admin";
import ProgramPage from "./scenes/programs";
import Analytics from "./scenes/analytics";
import Reports from "./scenes/reports";
import Scheduling from "./scenes/scheduling";
import EvaluatePage from "./scenes/assess";
import SEAnalytics from "./scenes/seanalytics";
import MentorAnalytics from "./scenes/mentoranalytics";
import Mentorships from "./scenes/mentorships";
import Sidebar from "./scenes/global/Sidebar";
import Topbar from "./scenes/global/Topbar";
import Unauthorized from "./scenes/unauthorized";
import Signup from "./scenes/signup";
import { ColorModeContext, useMode } from "./theme";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import MentorshipAnalytics from "./scenes/analytics-mentorship";
import MentorDashboard from "./scenes/mentordashboard";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ForgotPassword from "./scenes/forgotpassword";
import ResetPassword from "./scenes/resetpassword";
import FinancialAnalytics from "./scenes/financial-analytics";

const App = () => {
  const [theme, colorMode] = useMode();

  return (
    <GoogleOAuthProvider clientId="1025918978584-niisk93pun37oujtrjdkpra1cn1b8esv.apps.googleusercontent.com">
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
    </GoogleOAuthProvider>
  );
};

const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  // Assuming user.roles is an array from the backend
  const userRoles = Array.isArray(user.roles) ? user.roles : user.roles.split(',').map(role => role.trim());
  const isAllowed = userRoles.some(role => allowedRoles.includes(role));

  if (!isAllowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

const MainContent = () => {
  const { user, loading, isMentorView } = useAuth(); // ⭐️ Get isMentorView from context
  
  if (loading) return <div>Loading...</div>; // Show a loader while the user context loads

  return (
    <Box sx={{ display: "flex", width: "100%", minHeight: "100vh" }}>
      {user && <Sidebar isMentorView={isMentorView} />} {/* ⭐️ Pass isMentorView from context */}
      <Box
        id="main-content"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflowY: "auto",
          padding: "20px",
        }}
      >
        {user && <Topbar />} {/* ⭐️ No props needed anymore! */}
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={user ? <Navigate to="/dashboard/lseed" /> : <Login />} /> {/* ⭐️ Redirect to LSEED dashboard by default */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/signup" element={<Signup />} />

          {/* ⭐️ Use nested routes for the dashboards */}
          <Route path="/dashboard" element={<Navigate to={isMentorView ? "/dashboard/mentor" : "/dashboard/lseed"} replace />} />
          <Route path="/dashboard/lseed" element={<Dashboard />} />
          <Route path="/dashboard/mentor" element={<MentorDashboard />} />

          {/* ⭐️ Use ProtectedRoute for all protected routes */}
          <Route element={<ProtectedRoute allowedRoles={["Administrator", "LSEED-Director", "LSEED-Coordinator"]} />}>
            <Route path="/socialenterprise" element={<SocialEnterprise />} />
            <Route path="/mentors" element={<Mentors />} />
            <Route path="/programs" element={<ProgramPage />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/scheduling" element={<Scheduling />} />
            <Route path="/evaluate" element={<EvaluatePage />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/financial-analytics" element={<FinancialAnalytics />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
          
          <Route element={<ProtectedRoute allowedRoles={["Mentor"]} />}>
            <Route path="/mentorships" element={<Mentorships />} />
            <Route path="/mentor-analytics/:id" element={<MentorAnalytics />} />
            <Route path="/assess" element={<EvaluatePage />} />
          </Route>

          {/* This route should be available to both */}
          <Route element={<ProtectedRoute allowedRoles={["LSEED-Coordinator", "Mentor", "Guest User"]} />}>
            <Route path="/se-analytics/:id" element={<SEAnalytics />} />
          </Route>

          {/* Catch-all route for unmatched paths */}
          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default App;