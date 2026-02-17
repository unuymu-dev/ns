import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import database
import sequelize, { testConnection } from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import internalRoutes from './routes/internal.js';
import externalRoutes from './routes/external.js';
import turtRoutes from './routes/turt.js';
import verifyRoutes from './routes/verify.js';
import notificationRoutes from './routes/notifications.js';
import reportRoutes from './routes/reports.js';

// Import socket
import initializeSocket from './socket/index.js';

// Initialize Express
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Sistem Penomoran Surat RSCM API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        database: sequelize.authenticate() ? 'connected' : 'disconnected'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/internal', internalRoutes);
app.use('/api/external', externalRoutes);
app.use('/api/turt', turtRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Initialize Socket.IO
initializeSocket(io);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();

        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Exiting...');
            process.exit(1);
        }

        // Start HTTP server
        httpServer.listen(PORT, () => {
            console.log('');
            console.log('========================================');
            console.log('🚀 Sistem Penomoran Surat RSCM');
            console.log('========================================');
            console.log(`📡 Server running on port ${PORT}`);
            console.log(`🌐 API URL: http://localhost:${PORT}`);
            console.log(`🔌 Socket.IO ready`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('========================================');
            console.log('');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    httpServer.close(() => {
        console.log('HTTP server closed');
        sequelize.close();
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    httpServer.close(() => {
        console.log('HTTP server closed');
        sequelize.close();
    });
});

// Start the server
startServer();

export default app;
