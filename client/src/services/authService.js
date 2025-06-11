import axios from 'axios';

// Base URL for API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Access protected resource
export const getProtectedResource = async () => {
  try {
    const response = await axios.get(`${API_URL}/protected`, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Access denied';
  }
};
