import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  
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
    console.log("Logging in user:", userData); // Log user data before storing
    console.log("Parsed Stored User:", JSON.parse(localStorage.getItem("user")));
    localStorage.setItem('user', JSON.stringify(userData)); // Store user in localStorage
    setUser(userData); // Update user state
    navigate('/dashboard'); // Redirect to dashboard after login
  };

   // Logout function to clear session and user state
  const logout = () => {
    localStorage.removeItem('user'); // Remove session from localStorage
    setUser(null); // Clear user state
    navigate('/'); // Redirect to login page after logout
  };

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
