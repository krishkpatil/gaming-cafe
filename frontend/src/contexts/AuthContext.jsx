import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://127.0.0.1:5000/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check if user is logged in on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log("User data from localStorage:", parsedUser);
        setUser(parsedUser);
      } catch (err) {
        console.error('Error parsing user data from localStorage', err);
        logout();
      }
    }
    
    setLoading(false);
  }, []);

  // Login function
  const login = async (username, password) => {
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const error = data.message || 'Login failed';
        setError(error);
        throw new Error(error);
      }
      
      // Store token and user data
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Update state
      setUser(data.user);
      
      // Redirect to home page
      navigate('/');
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

// Signup function
const signup = async (userData) => {
  setError(null);
  
  try {
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: userData.username,
        password: userData.password,
        gender: userData.gender || 'male' // Include gender, default to male
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const error = data.message || 'Signup failed';
      setError(error);
      throw new Error(error);
    }
    
    // Redirect to login page
    navigate('/login');
    
    return data;
  } catch (err) {
    setError(err.message);
    throw err;
  }
};

  // Logout function
  const logout = () => {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Update state
    setUser(null);
    
    // Redirect to login page
    navigate('/login');
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Check if user is admin - with extra type checking and debugging
  const isAdmin = () => {
    
    if (!user) {
      console.log("No user is logged in");
      return false;
    }
    
    // Handle different types of is_admin values
    if (typeof user.is_admin === 'string') {
      return user.is_admin.toLowerCase() === 'true';
    }
    
    return Boolean(user.is_admin);
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    isAuthenticated,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;