import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthContextProvider");
  }
  return context || { user: null, login: () => {}, logout: () => {}, loading: true }; // Default values
};

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Store user session data
  const [loading, setLoading] = useState(true); // Loading state while checking session
  // const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const [isMentorView, setIsMentorView] = useState(false); 
  
  // Check for session in localStorage when the app loads
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user')); // Retrieve user from localStorage
    if (storedUser) {
      setUser(storedUser); // If session exists, set user state
    }
    setLoading(false); // Done loading
  }, []);

  // Login function to set session and update user state
  const login = async (userData) => {
    try{
      console.log("[authContext] Logging in user:", userData); // Log user data before storing
      console.log("[authContext] Parsed Stored User:", JSON.parse(localStorage.getItem("user")));
      if (userData.roles === "Administrator") {
        localStorage.setItem("user", JSON.stringify(userData)); // Store user in localStorage
        setUser(userData); // Update user state
        navigate("/admin"); // Redirect to admin page if user is Administrator
      } else {
        localStorage.setItem("user", JSON.stringify(userData)); // Store user in localStorage
        setUser(userData); // Update user state
        navigate("/dashboard"); // Redirect to dashboard for non-admin users
      }
    } catch(error) {
      console.error('Login error: ', error);
    }
    
  };

  // Logout function to clear session and user state
  const logout = async () => {
    try {
      // Make a request to the backend to log out
      const response = await axios.post("http://localhost:4000/logout", null, {
        withCredentials: true, // Ensure cookies are sent
      });

      console.log("[authContext] Logout successful", response.data);

      // Clear user data from local storage and state
      localStorage.removeItem('user');
      setUser(null);

      navigate('/'); // Redirect to login
    } catch (error) {
      console.error("Error logging out:", error);
      // Optionally, show a toast or alert to the user
    }
  };

  const toggleView = () => {
    if (!user || !user.roles) {
      console.error("User or user roles not available for toggling.");
      return;
    }

    const hasMentorRole = user.roles.includes("Mentor");
    const isLSEEDUser = user.roles.includes("LSEED-Coordinator") || user.roles.includes("Administrator");
    
    // Toggle the state first, then navigate
    setIsMentorView(prev => !prev); 

    // Redirect to the appropriate dashboard
    if (isMentorView) { // If currently in Mentor view, switch to LSEED view.
      setIsMentorView(false); // Update state to Coordinator View
      navigate('/dashboard/lseed');
    } else { // If currently in Coordinator/LSEED view, switch to Mentor view.
      setIsMentorView(true); // Update state to Mentor View
      navigate('/dashboard/mentor');
    }
  };
  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout, isMentorView, toggleView, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
