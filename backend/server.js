import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cron from 'node-cron';
import passport from 'passport'; 
import { configurePassport } from './src/config/passport.js'; 
import socketService from './src/services/socketService.js';
// Import configurations and utilities
import { connectDB } from './src/config/database.js';
import { errorHandler, notFound } from './src/middleware/errorMiddleware.js';

// Import routes
import authRoutes from './src/routes/auth.js';
import userRoutes from './src/routes/users.js';
import donationRoutes from './src/routes/donations.js';
import requestRoutes from './src/routes/requests.js';
import adminRoutes from './src/routes/admin.js';
import analyticsRoutes from './src/routes/analytics.js';
import notificationRoutes from './src/routes/notifications.js';
import aiRoutes from './src/routes/ai.js';
import publicRoutes from './src/routes/public.js';
import recommendationRoutes from './src/routes/recommendations.js';
import matchingRoutes from './src/routes/matching.js';
import clusteringRoutes from './src/routes/clustering.js';
import uploadRoutes from './src/routes/upload.js';



// Import scheduled tasks
import { cleanupExpiredTokens, updateDonationStatuses } from './src/utils/scheduledTasks.js';

// Load environment variables
dotenv.config();

const startServer = async () => {
  try {
    await connectDB(process.env.MONGODB_URI || 'mongodb://localhost:27017/rewearify');
    
// Create Express app
const app = express();
const server = createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Make io accessible in routes
app.set('io', io);

    app.use(passport.initialize()); // 3. Initialize Passport
    configurePassport(); // 4. Configure our Google strategy  

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (process.env.NODE_ENV === 'production' ? 100 : 5000), 
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001',
    'https://your-frontend-domain.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression and logging
app.use(compression());
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ReWearify Backend is running!',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/clustering', clusteringRoutes);
app.use('/api/upload', uploadRoutes);


socketService.initialize(io);
app.set('socketService', socketService);

console.log('✅ Socket.IO service initialized with enhanced features');

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Scheduled tasks
// Clean up expired tokens every hour
cron.schedule('0 * * * *', () => {
  console.log('Running scheduled task: cleanup expired tokens');
  cleanupExpiredTokens();
});

// Update donation statuses every day at midnight
cron.schedule('0 0 * * *', () => {
  console.log('Running scheduled task: update donation statuses');
  updateDonationStatuses();
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🤖 AI Service URL: ${process.env.AI_SERVICE_URL || 'http://localhost:8000'}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

} catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
