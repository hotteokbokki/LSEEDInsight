import React from "react";
import { Box } from "@mui/material";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthContextProvider, useAuth } from "./context/authContext";
import ScrollToTop from "./components/ScrollToTop"; 
import Login from "./scenes/login";
import Dashboard from "./scenes/dashboard";
import SocialEnterprise from "./scenes/socialenterprise";
import Mentors from "./scenes/mentors";
import Admin from "./scenes/admin";
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
import { ColorModeContext, useMode } from "./theme";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import MentorshipAnalytics from "./scenes/analytics-mentorship";
import MentorDashboard from "./scenes/mentordashboard";

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

  if (loading) return <div>Loading...</div>;

  return (
    <Box sx={{ display: "flex", width: "100%", minHeight: "100vh" }}>
      {user && <Sidebar />}
      <Box
        id="main-content" // ✅ Added ID for ScrollToTop.js to target
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflowY: "auto", // ✅ Ensures only the right side scrolls
          padding: "20px",
        }}
      >
        {user && <Topbar />}
        <ScrollToTop /> {/* ✅ Scrolls only the right content */}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* User Routes */}
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/socialenterprise" element={user ? <SocialEnterprise /> : <Navigate to="/" />} />
          <Route path="/mentor-dashboard" element={user ? <MentorDashboard /> : <Navigate to="/" />} />
          <Route path="/mentors" element={user ? <Mentors /> : <Navigate to="/" />} />
          <Route path="/analytics" element={user ? <Analytics /> : <Navigate to="/" />} />
          <Route path="/reports" element={user ? <Reports /> : <Navigate to="/" />} />
          <Route path="/scheduling" element={user ? <Scheduling userRole={user?.role}/> : <Navigate to="/" />} />
          <Route path="/assess" element={user ? <EvaluatePage userRole={user?.role}/> : <Navigate to="/" />} />
          <Route path="/se-analytics/:id" element={<SEAnalytics />} />
          <Route path="/mentor-analytics/:id" element={<MentorAnalytics />} />
          <Route path="/mentorships" element={<Mentorships />} />
          <Route path="/analytics-mentorship" element={<MentorshipAnalytics />} />
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
            <Route path="/assess" element={<EvaluatePage />} />
          </Route>

          {/* Catch-all: Redirect unauthorized access */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default App;
