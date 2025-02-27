// API service for dashboard statistics
const API_URL = 'http://127.0.0.1:5000/api';

// Helper function to handle API errors
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    const error = (data && data.message) || response.statusText;
    return Promise.reject(error);
  }
  
  return data;
};

// Get the authentication token from local storage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return {};
  }
  
  return {
    'Authorization': `Bearer ${token}`
  };
};

// Get dashboard statistics
export const getDashboardStats = async () => {
  const response = await fetch(`${API_URL}/dashboard/stats`, {
    method: 'GET',
    headers: {
      ...getAuthHeader()
    }
  });
  
  return handleResponse(response);
};

// Get transaction history
export const getTransactionHistory = async () => {
  const response = await fetch(`${API_URL}/transactions`, {
    method: 'GET',
    headers: {
      ...getAuthHeader()
    }
  });
  
  return handleResponse(response);
};