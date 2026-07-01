// Load environment variables
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');

// Route files
const authRoutes = require('./routes/auth.routes');
const videoRoutes = require('./routes/videos.routes');
const favoriteRoutes = require('./routes/favorites.routes');

// Connect to database
connectDB();

const app = express();

// Security Middlewares
app.use(helmet());

// CORS configuration - restricted to CLIENT_URL
const clientUrl = process.env.CLIENT_URL || 'http://localhost:4200';
logger.info(`CORS configured to allow origin: ${clientUrl}`);
app.use(cors({
  origin: clientUrl,
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request logging with Morgan directed to Winston
const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  }
};
app.use(morgan('combined', { stream: morganStream }));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/favorites', favoriteRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});

// Root route redirect/message
app.get('/', (req, res) => {
  res.send('InnovaTube API is running...');
});

// Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
