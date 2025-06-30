import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthContextProvider");
  }
  // Provide default values to prevent destructuring errors if context is null
  return context || { user: null, login: () => {}, logout: () => {}, loading: true, isMentorView: false, toggleView: () => {} };
};

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Store user session data
  const [loading, setLoading] = useState(true); // Loading state while checking session
  const navigate = useNavigate();
  // Initialize isMentorView based on a sensible default, e.g., if user is primarily a mentor
  // Or, set it to false (coordinator view) if an LSEED user is logged in by default.
  // We will manage this state more robustly within toggleView and based on initial roles.
  const [isMentorView, setIsMentorView] = useState(false); // Default to Coordinator view or a neutral state

  // Check for session in localStorage when the app loads
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user')); // Retrieve user from localStorage
    if (storedUser) {
      setUser(storedUser); // If session exists, set user state
      // When user data is loaded, set initial view based on roles
      if (storedUser.roles.includes("Mentor") && !storedUser.roles.some(r => r.startsWith("LSEED"))) {
        setIsMentorView(true);
      } else if (storedUser.roles.some(r => r.startsWith("LSEED"))) {
        setIsMentorView(false);
      }
      // For users with both roles, the initial state of false means coordinator view.
      // They will then use the toggle to switch.
    }
    setLoading(false); // Done loading
  }, []);

  // Login function to set session and update user state
  const login = async (userData) => {
    try {
      console.log("[authContext] Logging in user:", userData);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      // Set initial view state right after login based on roles
      if (userData.roles.includes("Mentor") && !userData.roles.some(r => r.startsWith("LSEED"))) {
        setIsMentorView(true); // Only mentor, default to mentor view
      } else if (userData.roles.some(r => r.startsWith("LSEED"))) {
        setIsMentorView(false); // LSEED user (or LSEED+Mentor), default to coordinator view
      } else {
        setIsMentorView(false); // Or true, depending on what default you want
      }

      if (userData.roles.includes("Administrator")) { // Check for specific 'Administrator' role for /admin
        navigate("/admin");
      } else if (userData.roles.some(r => r.startsWith("LSEED")) || userData.roles.includes("Mentor")) {
        navigate("/dashboard");
      } else {
        navigate("/dashboard"); // Or another default path
      }
    } catch (error) {
      console.error('Login error: ', error);
      // You might want to display an error message to the user here
    }
  };

  // Logout function to clear session and user state
  const logout = async () => {
    try {
      const response = await axios.post("http://localhost:4000/logout", null, {
        withCredentials: true,
      });

      console.log("[authContext] Logout successful", response.data);

      localStorage.removeItem('user');
      localStorage.removeItem('isMentorView');
      setUser(null);
      setIsMentorView(false); // Reset view state on logout
      navigate('/');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Corrected toggleView function
  const toggleView = () => {
    if (!user || !user.roles) {
      console.error("User or user roles not available for toggling.");
      return;
    }

    const hasMentorRole = user.roles.includes("Mentor");
    const hasLSEEDRole = user.roles.some(r => r.startsWith("LSEED"));

    // Check if the user has both roles to allow toggling
    if (hasMentorRole && hasLSEEDRole) {
      setIsMentorView(prevIsMentorView => {
        const newIsMentorView = !prevIsMentorView;
        console.log(`Toggling view: from ${prevIsMentorView ? 'Mentor' : 'Coordinator'} to ${newIsMentorView ? 'Mentor' : 'Coordinator'}`);
        return newIsMentorView;
      });
    } else {
      console.warn("Toggle attempted by a user without both 'Mentor' and 'LSEED' roles. No action taken.");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout, isMentorView, toggleView, loading }}>
      {children}
    </AuthContext.Provider>
  );
};