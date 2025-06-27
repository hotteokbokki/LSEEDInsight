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

  // Assuming 'user.role' is a comma-separated string, check if any role is allowed
  const userRoles = user.role.split(',').map(role => role.trim());
  const isAllowed = userRoles.some(role => allowedRoles.includes(role));

  if (!isAllowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

const MainContent = () => {
  const { user, loading } = useAuth();
  const [isCoordinatorView, setIsCoordinatorView] = useState(true); 
  const [hasBothRoles, setHasBothRoles] = useState(false);

  // Function to handle the view change
  const handleViewChange = () => {
    setIsCoordinatorView((prev) => !prev);
  };

  // Check user roles when the user data loads
  useEffect(() => {
    if (user && user.roles) {
      // ✅ Correctly handles both Array and string roles
      const roles = Array.isArray(user.roles) ? user.roles : user.roles.split(',').map(roles => roles.trim());
      
      const isCoordinator = roles.includes("LSEED-Coordinator");
      const isMentor = roles.includes("Mentor");
      
      setHasBothRoles(isCoordinator && isMentor);

      if (isCoordinator) {
        setIsCoordinatorView(true);
      } else {
        setIsCoordinatorView(false);
      }
    } else {
      // If no user or role, default to no roles and a default view
      console.log("No user or role found, setting default state.");
      setHasBothRoles(false);
      setIsCoordinatorView(true);
    }
  }, [user]);

  if (loading) return <div>Loading...</div>;

  return (
    <Box sx={{ display: "flex", width: "100%", minHeight: "100vh" }}>
      {user && <Sidebar isCoordinatorView={isCoordinatorView}/>}
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
        {/* Pass the toggle state and handler to the Topbar */}
        {user && (
          <Topbar
            isCoordinatorView={isCoordinatorView}
            handleViewChange={handleViewChange}
            hasBothRoles={hasBothRoles}
          />
        )}
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/signup" element={<Signup />} />

          {/* CHANGED: Pass the toggle state to the Dashboard */}
          <Route
            path="/dashboard"
            element={
              user ? (
                <Dashboard
                  userRole={user?.role}
                  isCoordinatorView={isCoordinatorView}
                  hasBothRoles={hasBothRoles}
                />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* User Routes (rest of your routes remain the same) */}
          <Route path="/socialenterprise" element={user ? <SocialEnterprise userRole={user?.role} /> : <Navigate to="/" />} />
          <Route path="/mentors" element={user ? <Mentors userRole={user?.role} /> : <Navigate to="/" />} />
          <Route path="/analytics" element={user ? <Analytics userRole={user?.role}/> : <Navigate to="/" />} />
          <Route path="/reports" element={user ? <Reports /> : <Navigate to="/" />} />
          <Route path="/scheduling" element={user ? <Scheduling userRole={user?.role}/> : <Navigate to="/" />} />
          <Route path="/assess" element={user ? <EvaluatePage userRole={user?.role}/> : <Navigate to="/" />} />
          <Route path="/se-analytics/:id" element={<SEAnalytics />} />
          <Route path="/mentor-analytics/:id" element={<MentorAnalytics />} />
          <Route path="/mentorships" element={<Mentorships />} />
          <Route path="/analytics-mentorship" element={<MentorshipAnalytics />} />
          <Route path="/admin" element={user ? <Admin /> : <Navigate to="/" />} />
          <Route path="/programs" element={user ? <ProgramPage /> : <Navigate to="/" />} />
          <Route path="/financial-analytics" element={user ? <FinancialAnalytics /> : <Navigate to="/" />} />


          {/* Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={["Administrator", "LSEED-Director"]} />}>
            <Route path="/admin" element={<Admin />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["LSEED-Coordinator", "Mentor"]} />}>
            <Route path="/socialenterprise" element={<SocialEnterprise />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["LSEED-Coordinator"]} />}>
            <Route path="/mentors" element={<Mentors />} />
            <Route path="/seanalytics" element={<SEAnalytics />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["LSEED-Coordinator", "Guest User"]} />}>
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["LSEED-Coordinator", "Mentor"]} />}>
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