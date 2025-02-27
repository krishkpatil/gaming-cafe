// API service for managing sessions
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

// Get all sessions
export const getAllSessions = async () => {
  const response = await fetch(`${API_URL}/sessions`, {
    method: 'GET',
    headers: {
      ...getAuthHeader()
    }
  });
  
  return handleResponse(response);
};

// Get active sessions
export const getActiveSessions = async () => {
  const response = await fetch(`${API_URL}/sessions/active`, {
    method: 'GET',
    headers: {
      ...getAuthHeader()
    }
  });
  
  return handleResponse(response);
};

// Start a new session
export const startSession = async (sessionData) => {
  const response = await fetch(`${API_URL}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(sessionData)
  });
  
  return handleResponse(response);
};

// End a session
export const endSession = async (sessionId) => {
  const response = await fetch(`${API_URL}/sessions/${sessionId}/end`, {
    method: 'POST',
    headers: {
      ...getAuthHeader()
    }
  });
  
  return handleResponse(response);
};