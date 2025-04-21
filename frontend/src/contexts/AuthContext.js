import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';
import { message } from 'antd';

// Create auth context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        // Verify the token is valid by fetching user profile
        fetchUserProfile();
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        logout(); // Logout if stored user is invalid
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch user profile
  const fetchUserProfile = async () => {
    setLoading(true);
    
    try {
      const response = await authAPI.getProfile();
      const userData = response.data.user;
      
      // Update user data with fresh data from server
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setIsAuthenticated(true);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // If token is invalid, logout
      if (error.response && error.response.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;
      
      // Store token and user in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update state
      setUser(user);
      setIsAuthenticated(true);
      message.success(`Welcome, ${user.username}!`);
      return user;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      message.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register user
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.register(userData);
      message.success('Registration successful! Please login.');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      message.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Reset state
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    message.info('You have been logged out');
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.updateProfile(profileData);
      const updatedUser = response.data.user;
      
      // Update local storage and state
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      message.success('Profile updated successfully');
      return updatedUser;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      setError(errorMessage);
      message.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const updatePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    setError(null);
    
    try {
      await authAPI.updatePassword({ currentPassword, newPassword });
      message.success('Password updated successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update password';
      setError(errorMessage);
      message.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Clear any errors
  const clearError = () => setError(null);

  // Check if user is admin
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  // Context value
  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
    clearError,
    fetchUserProfile,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 