// API service for managing friends
const API_URL = 'http://127.0.0.1:5000/api';

// Helper function to handle API errors
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    const error = (data && data.error) || data.message || response.statusText;
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

// Get all friends
export const getAllFriends = async () => {
  const response = await fetch(`${API_URL}/friends`, {
    method: 'GET',
    headers: {
      ...getAuthHeader()
    }
  });
  
  return handleResponse(response);
};

// Get a specific friend by ID
export const getFriendById = async (id) => {
  const response = await fetch(`${API_URL}/friends/${id}`, {
    method: 'GET',
    headers: {
      ...getAuthHeader()
    }
  });
  
  return handleResponse(response);
};

// Create a new friend
export const createFriend = async (friendData) => {
  const response = await fetch(`${API_URL}/friends`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(friendData)
  });
  
  return handleResponse(response);
};

// Update a friend
export const updateFriend = async (id, friendData) => {
  const response = await fetch(`${API_URL}/friends/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(friendData)
  });
  
  return handleResponse(response);
};

// Delete a friend
export const deleteFriend = async (id) => {
  const response = await fetch(`${API_URL}/friends/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader()
    }
  });
  
  return handleResponse(response);
};