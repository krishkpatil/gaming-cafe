import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, theme } from '@chakra-ui/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import components
import Layout from './components/Layout';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import MachineManagement from './components/MachineManagement';
import SessionManagement from './components/SessionManagement';
import ErrorBoundary from './components/ErrorBoundary';
import UserProfile from './components/UserProfile';  // New user profile component

// Protected route component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  // Show loading state if auth is still being checked
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Check if user is authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  
  // Check if admin is required
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/" />;
  }
  
  // Render children if authenticated and authorized
  return children;
};

// App with Router outside of AuthProvider
const AppWithRouter = () => {
  return (
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  );
};

// Main App component
const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <ErrorBoundary>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected routes - accessible by all users */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Layout>
                  <UserProfile />
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Admin-only routes */}
          <Route 
            path="/users" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <Layout>
                  <UserManagement />
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/machines" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <Layout>
                  <MachineManagement />
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/sessions" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <Layout>
                  <SessionManagement />
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Catch-all route for unknown paths */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </ErrorBoundary>
    </ChakraProvider>
  );
};

export default AppWithRouter;