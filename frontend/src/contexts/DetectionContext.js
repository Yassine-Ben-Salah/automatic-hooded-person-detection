import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { detectionAPI } from '../services/api';
import { message } from 'antd';

// Create context
const DetectionContext = createContext();

// Get mock detections from localStorage or initialize empty array
const getMockDetectionsFromStorage = () => {
  try {
    const stored = localStorage.getItem('mockDetections');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error retrieving mock detections:', e);
    return [];
  }
};

// Save mock detections to localStorage
const saveMockDetectionsToStorage = (mockDetections) => {
  try {
    localStorage.setItem('mockDetections', JSON.stringify(mockDetections));
  } catch (e) {
    console.error('Error saving mock detections:', e);
  }
};

export const DetectionProvider = ({ children }) => {
  const [detections, setDetections] = useState([]);
  const [mockDetections, setMockDetections] = useState(getMockDetectionsFromStorage());
  const [totalDetections, setTotalDetections] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [availableLabels, setAvailableLabels] = useState(['Assault', 'Balaclava', 'Intrusion', 'Suspect', 'Weapons', 'Bags Theft', 'Undefined']);
  
  // Save mock detections to localStorage when they change
  useEffect(() => {
    saveMockDetectionsToStorage(mockDetections);
  }, [mockDetections]);
  
  // Check backend connectivity
  const checkBackendConnectivity = useCallback(async () => {
    try {
      await detectionAPI.getDetections({ limit: 1 });
      setBackendAvailable(true);
      return true;
    } catch (err) {
      setBackendAvailable(false);
      return false;
    }
  }, []);
  
  // Fetch detections with pagination and filters
  const fetchDetections = useCallback(async (page = 1, limit = 10, filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = {
        page,
        limit,
        ...filters
      };
      
      // First check if backend is available
      const isBackendAvailable = await checkBackendConnectivity();
      
      if (isBackendAvailable) {
        const response = await detectionAPI.getDetections(params);
        setDetections(response.data.detections);
        setTotalDetections(response.data.total);
        return response.data;
      } else {
        throw new Error('Backend not available');
      }
    } catch (err) {
      console.warn('Using mock detections due to API error:', err);
      
      // Generate filtered mock data from local storage
      const mockData = generateFilteredMockDetections(mockDetections, page, limit, filters);
      setDetections(mockData.detections);
      setTotalDetections(mockData.total);
      
      // Don't show error for better UX
      setError(null);
      return mockData;
    } finally {
      setLoading(false);
    }
  }, [checkBackendConnectivity, mockDetections]);
  
  // Get a single detection by ID
  const getDetection = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if backend is available
      const isBackendAvailable = await checkBackendConnectivity();
      
      if (isBackendAvailable) {
        const response = await detectionAPI.getDetection(id);
        return response.data;
      } else {
        // Find detection in mock data
        const mockDetection = mockDetections.find(d => d._id === id);
        if (mockDetection) {
          return { detection: mockDetection };
        } else {
          throw new Error(`Detection with ID ${id} not found`);
        }
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch detection';
      setError(errorMsg);
      message.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [checkBackendConnectivity, mockDetections]);
  
  // Update detection status or add notes
  const updateDetection = useCallback(async (id, updateData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if backend is available
      const isBackendAvailable = await checkBackendConnectivity();
      console.log(`Backend availability: ${isBackendAvailable}, updating detection id: ${id}`, updateData);
      
      if (isBackendAvailable) {
        const response = await detectionAPI.updateDetection(id, updateData);
        
        // Update the local state to reflect changes
        setDetections(prevDetections => {
          const newDetections = prevDetections.map(detection => 
            detection._id === id ? { ...detection, ...updateData } : detection
          );
          console.log('Updated detections in context:', newDetections);
          return newDetections;
        });
        
        // Also update the mock detections to keep them in sync
        setMockDetections(prevMocks => {
          const newMocks = prevMocks.map(detection => 
            detection._id === id ? { ...detection, ...updateData } : detection
          );
          // Immediately save to localStorage
          saveMockDetectionsToStorage(newMocks);
          return newMocks;
        });
        
        message.success('Detection updated successfully');
        return response.data;
      } else {
        console.log('Updating in offline mode:', id, updateData);
        
        // Check if the detection exists in mock data
        const foundDetection = mockDetections.find(d => d._id === id);
        if (!foundDetection) {
          console.error(`Detection with ID ${id} not found in mock data`);
          message.warning('Detection not found in local data');
          throw new Error('Detection not found in local data');
        }
        
        // Update in mock storage
        const updatedMockDetections = mockDetections.map(detection => 
          detection._id === id ? { ...detection, ...updateData } : detection
        );
        
        // Save to localStorage immediately to persist changes
        saveMockDetectionsToStorage(updatedMockDetections);
        setMockDetections(updatedMockDetections);
        
        // Also update current detections
        setDetections(prevDetections => {
          const newDetections = prevDetections.map(detection => 
            detection._id === id ? { ...detection, ...updateData } : detection
          );
          console.log('Updated detections in offline mode:', newDetections);
          return newDetections;
        });
        
        message.success('Detection updated successfully (offline mode)');
        return { detection: { _id: id, ...updateData } };
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to update detection';
      console.error('Error in updateDetection:', errorMsg, err);
      setError(errorMsg);
      message.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [checkBackendConnectivity, mockDetections]);
  
  // Fetch detection stats for dashboard
  const fetchDetectionStats = useCallback(async (timeRange = 'week') => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if backend is available
      const isBackendAvailable = await checkBackendConnectivity();
      
      if (isBackendAvailable) {
        const response = await detectionAPI.getStats(timeRange);
        return response.data;
      } else {
        throw new Error('Backend not available');
      }
    } catch (err) {
      console.warn('Using mock data due to API error:', err);
      
      // Generate mock data from local storage
      const mockData = generateMockStats(timeRange, mockDetections);
      
      // Don't show error message for dashboard to ensure good UX
      setError(null);
      return mockData;
    } finally {
      setLoading(false);
    }
  }, [checkBackendConnectivity, mockDetections]);
  
  // Generate mock statistics data for offline/development use
  const generateMockStats = (timeRange, mockData = []) => {
    const today = new Date();
    const dailyCounts = [];
    
    // Generate daily counts for the past week
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dailyCounts.push({
        date: date.toISOString(),
        count: Math.floor(Math.random() * 10) + 1
      });
    }
    
    // Get current detections for today's count
    const mocksToUse = mockData.length > 0 ? mockData : mockDetections;
    const todayCount = mocksToUse.length > 0 ? mocksToUse.length : dailyCounts[6].count;
    const weeklyCount = dailyCounts.reduce((sum, day) => sum + day.count, 0) + todayCount;
    
    // Create a label distribution based on actual detections if available
    const byLabel = {
      'Assault': 0,
      'Balaclava': 0,
      'Intrusion': 0,
      'Suspect': 0,
      'Weapons': 0,
      'Bags Theft': 0,
      'Undefined': 0
    };
    
    // Update label counts with real detections
    if (mocksToUse.length > 0) {
      mocksToUse.forEach(detection => {
        if (detection.label) {
          byLabel[detection.label] = (byLabel[detection.label] || 0) + 1;
        }
      });
    } else {
      // Add some random numbers if no detections
      Object.keys(byLabel).forEach(key => {
        byLabel[key] = Math.floor(Math.random() * 10) + 3;
      });
    }
    
    // Calculate status distribution
    const statusCounts = {
      'pending': 0,
      'confirmed': 0,
      'false_alarm': 0,
      'reviewed': 0
    };
    
    // Count status from real detections
    if (mocksToUse.length > 0) {
      mocksToUse.forEach(detection => {
        if (detection.status && statusCounts.hasOwnProperty(detection.status)) {
          statusCounts[detection.status] += 1;
        } else {
          statusCounts['pending'] += 1;
        }
      });
    } else {
      // Add some random numbers if no detections
      statusCounts.pending = 15;
      statusCounts.confirmed = 10;
      statusCounts.false_alarm = 5;
      statusCounts.reviewed = 2;
    }
    
    // Mock data with realistic distribution
    return {
      total: todayCount + 20,
      today: todayCount,
      weekly: weeklyCount,
      byLabel: byLabel,
      byStatus: statusCounts,
      dailyCounts: dailyCounts
    };
  };
  
  // Fetch detection labels for filters
  const fetchDetectionLabels = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if backend is available
      const isBackendAvailable = await checkBackendConnectivity();
      
      if (isBackendAvailable) {
        const response = await detectionAPI.getLabels();
        const labels = response.data.labels;
        setAvailableLabels(labels);
        return labels;
      } else {
        // Return hardcoded labels
        const defaultLabels = ['Assault', 'Balaclava', 'Intrusion', 'Suspect', 'Weapons', 'Bags Theft', 'Undefined'];
        setAvailableLabels(defaultLabels);
        return defaultLabels;
      }
    } catch (err) {
      console.warn('Using hardcoded labels due to API error:', err);
      const defaultLabels = ['Assault', 'Balaclava', 'Intrusion', 'Suspect', 'Weapons', 'Bags Theft', 'Undefined'];
      setAvailableLabels(defaultLabels);
      return defaultLabels;
    } finally {
      setLoading(false);
    }
  }, [checkBackendConnectivity]);

  // Clear any errors
  const clearError = () => setError(null);

  // Generate filtered mock detections for testing/development
  const generateFilteredMockDetections = (existingMocks, page, limit, filters) => {
    // If we have no mocks yet, generate some base mocks
    if (existingMocks.length === 0) {
      const labels = ['Assault', 'Balaclava', 'Intrusion', 'Suspect', 'Weapons', 'Bags Theft', 'Undefined'];
      const statuses = ['pending', 'confirmed', 'false_alarm', 'reviewed'];
      const totalNew = 20;
      
      const newMocks = [];
      for (let i = 0; i < totalNew; i++) {
        const date = new Date();
        date.setMinutes(date.getMinutes() - i * 30); // Space them out by 30 minutes
        
        newMocks.push({
          _id: `mock-detection-${i}`,
          label: labels[Math.floor(Math.random() * labels.length)],
          confidence: Math.floor(Math.random() * 30) + 70, // 70-99% confidence
          timestamp: date.toISOString(),
          status: statuses[Math.floor(Math.random() * statuses.length)],
          imageUrl: `https://via.placeholder.com/300/FF0000/FFFFFF?text=Detection_${i}`,
          location: 'Main Camera',
          notes: i % 3 === 0 ? 'Suspicious activity detected' : ''
        });
      }
      
      // Save the new mocks for future use
      setMockDetections(newMocks);
      
      // Apply filters to the new mocks
      return applyFiltersAndPagination(newMocks, page, limit, filters);
    } else {
      // Apply filters to existing mocks
      return applyFiltersAndPagination(existingMocks, page, limit, filters);
    }
  };
  
  // Helper function to apply filters and pagination consistently
  const applyFiltersAndPagination = (detectionList, page, limit, filters) => {
    // Start with all detections
    let filteredMocks = [...detectionList];
    
    // Apply label filter if present
    if (filters.label) {
      filteredMocks = filteredMocks.filter(d => d.label === filters.label);
    }
    
    // Apply status filter if present
    if (filters.status) {
      filteredMocks = filteredMocks.filter(d => d.status === filters.status);
    }
    
    // Apply date range filter if present
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate).getTime();
      const endDate = new Date(filters.endDate).getTime();
      filteredMocks = filteredMocks.filter(d => {
        const detectionDate = new Date(d.timestamp).getTime();
        return detectionDate >= startDate && detectionDate <= endDate;
      });
    }
    
    // Apply search filter if present
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredMocks = filteredMocks.filter(d => 
        (d._id && d._id.toLowerCase().includes(searchLower)) ||
        (d.notes && d.notes.toLowerCase().includes(searchLower)) ||
        (d.label && d.label.toLowerCase().includes(searchLower))
      );
    }
    
    // Calculate total before pagination
    const total = filteredMocks.length;
    
    // Apply pagination
    const startIdx = (page - 1) * limit;
    const endIdx = Math.min(startIdx + limit, filteredMocks.length);
    const paginatedResults = filteredMocks.slice(startIdx, endIdx);
    
    return {
      detections: paginatedResults,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  };

  const value = {
    detections,
    totalDetections,
    loading,
    error,
    backendAvailable,
    fetchDetections,
    getDetection,
    updateDetection,
    fetchDetectionStats,
    fetchDetectionLabels,
    clearError,
    availableLabels
  };

  return (
    <DetectionContext.Provider value={value}>
      {children}
    </DetectionContext.Provider>
  );
};

// Custom hook to use the detection context
export const useDetection = () => {
  const context = useContext(DetectionContext);
  if (context === undefined) {
    throw new Error('useDetection must be used within a DetectionProvider');
  }
  return context;
};

// Add default export for the context
export default DetectionContext; 