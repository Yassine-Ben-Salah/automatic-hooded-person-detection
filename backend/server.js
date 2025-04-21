const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const DetectionService = require('./services/detectionService');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const detectionRoutes = require('./routes/detections');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/detection-appp')
.then(() => {
  console.log('MongoDB connected');
  
  // Start detection service after successful DB connection
  const detectionService = new DetectionService(io);
  detectionService.startPolling();
  
  // Store service in app for potential use elsewhere
  app.set('detectionService', detectionService);
})
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/detections', detectionRoutes);

// WebSocket connection for real-time detections
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Make io accessible to routes
app.set('io', io);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'build', 'index.html'));
  });
}

// Start the server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  
  // Stop polling service
  const detectionService = app.get('detectionService');
  if (detectionService) {
    detectionService.stopPolling();
  }
  
  // Close server
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close MongoDB connection without callback
    try {
      mongoose.connection.close();
      console.log('MongoDB connection closed');
      process.exit(0);
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
      process.exit(1);
    }
  });
});

// Export for testing
module.exports = { app, server }; 