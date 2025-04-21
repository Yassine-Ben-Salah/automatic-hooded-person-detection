const axios = require('axios');
const Detection = require('../models/Detection');

class DetectionService {
  constructor(io) {
    this.io = io;
    this.intervalId = null;
    this.pollInterval = 2000; // Poll every 2 seconds
    this.isPolling = false;
    this.modelApiUrl = process.env.MODEL_API_URL || 'http://localhost:5000';
    this.connectionErrors = 0;
  }

  // Start polling the detection API
  startPolling() {
    if (this.isPolling) return;
    
    console.log('Starting detection polling service...');
    console.log(`Will poll the model API at ${this.modelApiUrl}`);
    this.isPolling = true;
    
    this.intervalId = setInterval(async () => {
      try {
        await this.pollDetections();
      } catch (error) {
        console.error('Error polling detections:', error);
      }
    }, this.pollInterval);
  }

  // Stop polling
  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isPolling = false;
      console.log('Detection polling service stopped');
    }
  }

  // Poll the detection API and save results
  async pollDetections() {
    try {
      // Add a timeout of 2 seconds to prevent hanging
      const response = await axios.get(`${this.modelApiUrl}/detections`, {
        timeout: 2000
      });
      
      // Reset error counter on successful connection
      if (this.connectionErrors > 0) {
        console.log('Successfully reconnected to model API');
        this.connectionErrors = 0;
      }
      
      const { detections } = response.data;
      
      if (!detections || detections.length === 0) return;
      
      // Save and emit only significant detections (confidence > 50%)
      const significantDetections = detections.filter(d => d.confidence > 50);
      
      if (significantDetections.length === 0) return;
      
      // Save detections to database
      const savedDetections = await Promise.all(
        significantDetections.map(async (detection) => {
          const newDetection = new Detection({
            label: detection.label,
            confidence: detection.confidence,
            timestamp: new Date(),
            status: 'pending',
            imageUrl: detection.imageUrl || `https://via.placeholder.com/300/FF0000/FFFFFF?text=${detection.label}`,
            location: detection.location || 'Unknown'
          });
          
          return await newDetection.save();
        })
      );
      
      // Emit to all connected clients
      if (this.io) {
        this.io.emit('newDetection', { detections: savedDetections });
      }
      
      console.log(`Saved ${savedDetections.length} new detections`);
    } catch (error) {
      // Only log detailed errors for the first few failures
      this.connectionErrors++;
      
      if (this.connectionErrors <= 3 || this.connectionErrors % 30 === 0) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          console.log(`Model API connection failed (${this.connectionErrors}): The model server at ${this.modelApiUrl} is not running`);
        } else {
          console.log(`Error in pollDetections (${this.connectionErrors}): ${error.message}`);
        }
      }
    }
  }
}

module.exports = DetectionService; 