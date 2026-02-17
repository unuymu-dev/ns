import jwt from 'jsonwebtoken';
import NotificationService from '../services/NotificationService.js';

/**
 * Initialize Socket.IO with authentication
 */
export const initializeSocket = (io) => {
    // Set Socket.IO instance to NotificationService
    NotificationService.setSocketIO(io);

    // Middleware untuk authentication
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error'));
            }

            // Verify JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            socket.username = decoded.username;
            socket.role = decoded.role;

            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    // Connection handler
    io.on('connection', (socket) => {
        console.log(`✅ User connected: ${socket.username} (ID: ${socket.userId})`);

        // Join user-specific room
        socket.join(`user_${socket.userId}`);

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`❌ User disconnected: ${socket.username}`);
        });

        // Optional: ping-pong untuk keep-alive
        socket.on('ping', () => {
            socket.emit('pong');
        });
    });

    console.log('✅ Socket.IO initialized');
};

export default initializeSocket;
