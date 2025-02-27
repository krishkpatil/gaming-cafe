// API service for managing machines
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

// Get all machines
export const getAllMachines = async () => {
  const response = await fetch(`${API_URL}/machines`, {
    method: 'GET',
    headers: {
      ...getAuthHeader()
    }
  });
  
  return handleResponse(response);
};

// Get a specific machine by ID
export const getMachineById = async (id) => {
  const response = await fetch(`${API_URL}/machines/${id}`, {
    method: 'GET',
    headers: {
      ...getAuthHeader()
    }
  });
  
  return handleResponse(response);
};

// Create a new machine
export const createMachine = async (machineData) => {
  const response = await fetch(`${API_URL}/machines`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(machineData)
  });
  
  return handleResponse(response);
};

// Update machine
export const updateMachine = async (id, machineData) => {
  const response = await fetch(`${API_URL}/machines/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(machineData)
  });
  
  return handleResponse(response);
};

// Update machine status
export const updateMachineStatus = async (id, statusData) => {
  const response = await fetch(`${API_URL}/machines/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(statusData)
  });
  
  return handleResponse(response);
};

// Delete machine
export const deleteMachine = async (id) => {
  const response = await fetch(`${API_URL}/machines/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader()
    }
  });
  
  return handleResponse(response);
};