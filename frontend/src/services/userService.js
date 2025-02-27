// API service for managing users
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

// Get all users
export const getAllUsers = async () => {
  const response = await fetch(`${API_URL}/users`, {
    method: 'GET',
    headers: {
      ...getAuthHeader()
    }
  });
  
  return handleResponse(response);
};

// Get a specific user by ID
export const getUserById = async (id) => {
  const response = await fetch(`${API_URL}/users/${id}`, {
    method: 'GET',
    headers: {
      ...getAuthHeader()
    }
  });
  
  return handleResponse(response);
};

// Create a new user
export const createUser = async (userData) => {
  const response = await fetch(`${API_URL}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(userData)
  });
  
  return handleResponse(response);
};

// Add balance to user
export const addUserBalance = async (userId, balanceData) => {
  const response = await fetch(`${API_URL}/users/${userId}/add-balance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(balanceData)
  });
  
  return handleResponse(response);
};