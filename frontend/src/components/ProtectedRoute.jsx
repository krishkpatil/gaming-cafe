import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading state if auth is still being checked
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  
  // Render children if authenticated
  return children;
};

export default ProtectedRoute;