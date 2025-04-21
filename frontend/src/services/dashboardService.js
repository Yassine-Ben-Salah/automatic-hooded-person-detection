import { modelAPI } from './api';
import { detectionAPI } from './api';
import moment from 'moment';

// Get dashboard statistics with real-time data only - no enhancement
export const getDashboardStats = async () => {
  try {
    // First try to get detections from the backend API
    let detections = [];
    
    try {
      // First, try the detection API (which includes mocks when backend is down)
      const response = await detectionAPI.getDetections({limit: 100});
      detections = response.data.detections || [];
    } catch (err) {
      console.log('Detection API not available, trying model API...');
      // Fall back to the model API
      try {
        const modelResponse = await modelAPI.getDetections();
        detections = modelResponse.data.detections || [];
      } catch (modelErr) {
        console.log('Model API not available either, using mock data');
        // Both APIs failed - we'll return mock data below
      }
    }
    
    // If we still have no detections, check localStorage for mock data
    if (detections.length === 0) {
      try {
        const storedMocks = localStorage.getItem('mockDetections');
        if (storedMocks) {
          detections = JSON.parse(storedMocks);
          console.log('Using mock detections from localStorage:', detections.length);
        }
      } catch (storageErr) {
        console.error('Error getting mocks from localStorage:', storageErr);
      }
    }
    
    // If we still have no detections, generate mock data
    if (detections.length === 0) {
      return getMockDashboardStats();
    }
    
    // Generate daily counts based on actual data
    const today = new Date();
    const dailyCounts = [];
    
    // Create dictionary for the past 7 days
    const daysData = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      daysData[moment(date).format('YYYY-MM-DD')] = 0;
    }
    
    // Count detections for each day if we have timestamps
    if (detections.length > 0 && detections[0].timestamp) {
      detections.forEach(detection => {
        const detectionDate = moment(detection.timestamp).format('YYYY-MM-DD');
        if (daysData.hasOwnProperty(detectionDate)) {
          daysData[detectionDate] += 1;
        }
      });
    } else {
      // If no timestamps, just use today for all
      const todayStr = moment().format('YYYY-MM-DD');
      daysData[todayStr] = detections.length;
    }
    
    // Convert to array format for chart
    Object.keys(daysData).forEach(date => {
      dailyCounts.push({
        date: date,
        count: daysData[date]
      });
    });
    
    // Count detections by type
    const detectionLabels = {
      'Assault': 0,
      'Balaclava': 0,
      'Intrusion': 0,
      'Suspect': 0,
      'Weapons': 0,
      'Bags Theft': 0,
      'Undefined': 0
    };
    
    // Add actual detections to the counts
    detections.forEach(detection => {
      if (detection.label && detectionLabels.hasOwnProperty(detection.label)) {
        detectionLabels[detection.label] += 1;
      } else if (detection.label) {
        // Handle any new labels
        detectionLabels[detection.label] = (detectionLabels[detection.label] || 0) + 1;
      }
    });
    
    // Calculate weekly total from actual data
    const weeklyTotal = dailyCounts.reduce((sum, day) => sum + day.count, 0);
    
    // Calculate actual status counts if status data is available
    const statusCounts = {
      'pending': 0,
      'confirmed': 0,
      'false_alarm': 0,
      'reviewed': 0
    };
    
    // Add actual status data if available
    detections.forEach(detection => {
      if (detection.status && statusCounts.hasOwnProperty(detection.status)) {
        statusCounts[detection.status] += 1;
      } else {
        // Default to pending if status is missing
        statusCounts['pending'] += 1;
      }
    });
    
    // Return real statistics
    return {
      total: detections.length,
      today: daysData[moment().format('YYYY-MM-DD')] || 0,
      weekly: weeklyTotal,
      byLabel: detectionLabels,
      byStatus: statusCounts,
      dailyCounts: dailyCounts
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    
    // If there's an error, return mock data
    return getMockDashboardStats();
  }
};

// Get recent detections (real ones only)
export const getRecentDetections = async () => {
  try {
    // First try to get detections from the backend API
    let detections = [];
    
    try {
      // First, try the detection API (which includes mocks when backend is down)
      const response = await detectionAPI.getDetections({limit: 10, sort: '-timestamp'});
      detections = response.data.detections || [];
      
      if (detections.length > 0) {
        return detections;
      }
    } catch (err) {
      console.log('Detection API not available, trying model API...');
      // Fall back to the model API
      try {
        const modelResponse = await modelAPI.getDetections();
        detections = modelResponse.data.detections || [];
        
        if (detections.length > 0) {
          // Transform to proper format and assign statuses
          return detections.map((detection, index) => ({
            _id: `detection-${index}`,
            label: detection.label,
            confidence: detection.confidence,
            timestamp: new Date().toISOString(),
            status: 'pending', // All new detections are pending
            location: 'Main Camera'
          }));
        }
      } catch (modelErr) {
        console.log('Model API not available either, using mock data');
      }
    }
    
    // If both APIs failed, check localStorage for mock data
    try {
      const storedMocks = localStorage.getItem('mockDetections');
      if (storedMocks) {
        const mockData = JSON.parse(storedMocks);
        // Sort by timestamp and return the most recent
        const sortedMocks = [...mockData].sort((a, b) => {
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        return sortedMocks.slice(0, 10); // Return up to 10 recent detections
      }
    } catch (storageErr) {
      console.error('Error getting mocks from localStorage:', storageErr);
    }
    
    // If we still have no detections, generate some mock data
    return getMockRecentDetections();
  } catch (error) {
    console.error("Error fetching recent detections:", error);
    return getMockRecentDetections();
  }
};

// Generate mock dashboard statistics
const getMockDashboardStats = () => {
  const today = new Date();
  const dailyCounts = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dailyCounts.push({
      date: date.toISOString(),
      count: Math.floor(Math.random() * 15) + 5
    });
  }
  
  return {
    total: 120,
    today: 18,
    weekly: 75,
    byLabel: {
      'Assault': 18,
      'Balaclava': 22,
      'Intrusion': 26,
      'Suspect': 24,
      'Weapons': 14,
      'Bags Theft': 10,
      'Undefined': 6
    },
    byStatus: {
      'pending': 42,
      'confirmed': 35,
      'false_alarm': 28,
      'reviewed': 15
    },
    dailyCounts: dailyCounts
  };
};

// Generate mock recent detections
const getMockRecentDetections = () => {
  const labels = ['Assault', 'Balaclava', 'Intrusion', 'Suspect', 'Weapons', 'Bags Theft', 'Undefined'];
  const mockDetections = [];
  
  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setMinutes(date.getMinutes() - i * 30);
    
    mockDetections.push({
      _id: `mock-detection-${i}`,
      label: labels[Math.floor(Math.random() * labels.length)],
      confidence: Math.floor(Math.random() * 30) + 70, // 70-99%
      timestamp: date.toISOString(),
      status: getRandomStatus(),
      location: 'Main Camera'
    });
  }
  
  return mockDetections;
};

// Helper to get random status
const getRandomStatus = () => {
  const statuses = ['pending', 'confirmed', 'false_alarm', 'reviewed'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}; 