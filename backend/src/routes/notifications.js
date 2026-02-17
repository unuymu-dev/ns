import express from 'express';
import { authenticate } from '../middleware/auth.js';
import NotificationService from '../services/NotificationService.js';

const router = express.Router();

/**
 * @route   POST /api/notifications/subscribe
 * @desc    Subscribe to push notifications
 * @access  Private
 */
router.post('/subscribe', authenticate, async (req, res) => {
    try {
        const { endpoint, keys } = req.body;
        const userId = req.user.id;

        // Validate request
        if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subscription data'
            });
        }

        // Store subscription in database (optional implementation)
        console.log(`✅ User ${userId} subscribed to push notifications`);

        res.json({
            success: true,
            message: 'Successfully subscribed to push notifications'
        });
    } catch (error) {
        console.error('❌ Push subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to subscribe to push notifications',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/notifications/unsubscribe
 * @desc    Unsubscribe from push notifications
 * @access  Private
 */
router.post('/unsubscribe', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;

        console.log(`✅ User ${userId} unsubscribed from push notifications`);

        res.json({
            success: true,
            message: 'Successfully unsubscribed from push notifications'
        });
    } catch (error) {
        console.error('❌ Push unsubscribe error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unsubscribe from push notifications',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = req.query.limit || 20;
        const offset = req.query.offset || 0;

        const notifications = await NotificationService.getUserNotifications(userId, {
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: {
                notifications: notifications.rows,
                total: notifications.count
            }
        });
    } catch (error) {
        console.error('❌ Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', authenticate, async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.id;

        await NotificationService.markAsRead(notificationId, userId);

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('❌ Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/mark-all-read', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;

        await NotificationService.markAllAsRead(userId);

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('❌ Mark all as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await NotificationService.getUnreadCount(userId);

        res.json({
            success: true,
            data: {
                unreadCount: count
            }
        });
    } catch (error) {
        console.error('❌ Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count',
            error: error.message
        });
    }
});

export default router;