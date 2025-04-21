import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DetectionProvider } from './contexts/DetectionContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './components/dashboard/Dashboard';
import UserManagement from './components/admin/UserManagement';
import Alerts from './components/alerts/Alerts';
import DetectionHistory from './components/detection/DetectionHistory';
import LiveView from './components/detection/LiveView';
import ModelManagement from './components/model/ModelManagement';
import Profile from './components/profile/Profile';
import { Result, Button } from 'antd';
import { Link } from 'react-router-dom';

// Simple NotFound component
const NotFound = () => (
  <Result
    status="404"
    title="404"
    subTitle="Sorry, the page you visited does not exist."
    extra={
      <Link to="/dashboard">
        <Button type="primary">Back to Dashboard</Button>
      </Link>
    }
  />
);

// Protected Route component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user } = useAuth();
  
  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if route requires admin rights
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <DetectionProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes - all wrapped in MainLayout */}
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="history" element={<DetectionHistory />} />
              <Route path="live" element={<LiveView />} />
              <Route path="profile" element={<Profile />} />
              
              {/* Admin-only routes */}
              <Route path="users" element={
                <ProtectedRoute adminOnly={true}>
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route path="model" element={
                <ProtectedRoute adminOnly={true}>
                  <ModelManagement />
                </ProtectedRoute>
              } />
            </Route>
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DetectionProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
