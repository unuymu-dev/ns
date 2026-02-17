import { Notification } from '../models/index.js';

/**
 * NotificationService
 * 
 * Service untuk membuat dan mengelola notifikasi
 * Terintegrasi dengan Socket.IO untuk real-time delivery
 */

class NotificationService {
    constructor() {
        this.io = null; // Will be set by socket initialization
    }

    /**
     * Set Socket.IO instance
     */
    setSocketIO(io) {
        this.io = io;
    }

    /**
     * Create notification dan emit via Socket.IO
     */
    async createNotification({ userId, type, title, message, link }) {
        // Save to database
        const notification = await Notification.create({
            user_id: userId,
            type,
            title,
            message,
            link
        });

        // Emit real-time via Socket.IO
        if (this.io) {
            this.io.to(`user_${userId}`).emit('notification:new', {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                link: notification.link,
                created_at: notification.created_at
            });
        }

        return notification;
    }

    /**
     * Notify TURT about new external request
     */
    async notifyTurtNewRequest(requestId, applicantUnitName, subject) {
        // Get all TURT users
        const { User } = await import('../models/index.js');
        const turtUsers = await User.findAll({
            where: { role: 'TURT', is_active: true }
        });

        const notifications = [];
        for (const user of turtUsers) {
            const notif = await this.createNotification({
                userId: user.id,
                type: 'REQUEST_CREATED',
                title: 'Permohonan Nomor Surat Baru',
                message: `Permohonan dari ${applicantUnitName}: ${subject}`,
                link: `/dashboard/turt/inbox/${requestId}`
            });
            notifications.push(notif);
        }

        return notifications;
    }

    /**
     * Notify applicant about request approval
     */
    async notifyRequestApproved(userId, requestId, qty) {
        return await this.createNotification({
            userId,
            type: 'REQUEST_APPROVED',
            title: 'Permohonan Disetujui',
            message: `Permohonan Anda telah disetujui. ${qty} nomor surat telah diterbitkan.`,
            link: `/dashboard/external/requests/${requestId}`
        });
    }

    /**
     * Notify applicant about request rejection
     */
    async notifyRequestRejected(userId, requestId, reason) {
        return await this.createNotification({
            userId,
            type: 'REQUEST_REJECTED',
            title: 'Permohonan Ditolak',
            message: `Permohonan Anda ditolak. Alasan: ${reason}`,
            link: `/dashboard/external/requests/${requestId}`
        });
    }

    /**
     * Get user notifications
     */
    async getUserNotifications(userId, { limit = 20, offset = 0, unreadOnly = false } = {}) {
        const where = { user_id: userId };
        if (unreadOnly) {
            where.is_read = false;
        }

        const notifications = await Notification.findAndCountAll({
            where,
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });

        return notifications;
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId, userId) {
        const notification = await Notification.findOne({
            where: { id: notificationId, user_id: userId }
        });

        if (!notification) {
            throw new Error('Notification not found');
        }

        await notification.update({
            is_read: true,
            read_at: new Date()
        });

        return notification;
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId) {
        await Notification.update(
            {
                is_read: true,
                read_at: new Date()
            },
            {
                where: {
                    user_id: userId,
                    is_read: false
                }
            }
        );

        return true;
    }

    /**
     * Get unread count
     */
    async getUnreadCount(userId) {
        const count = await Notification.count({
            where: {
                user_id: userId,
                is_read: false
            }
        });

        return count;
    }
}

export default new NotificationService();
