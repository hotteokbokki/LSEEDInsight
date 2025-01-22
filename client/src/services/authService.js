import axios from 'axios';

// Base URL for API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Login request
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password }, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Login failed';
  }
};

// Logout request
export const logout = async () => {
  try {
    await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
  } catch (error) {
    throw error.response?.data?.message || 'Logout failed';
  }
};

// Access protected resource
export const getProtectedResource = async () => {
  try {
    const response = await axios.get(`${API_URL}/protected`, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Access denied';
  }
};
