import NotificationService from '../services/NotificationService.js';

class NotificationController {
    /**
     * Get user notifications
     */
    async getNotifications(req, res) {
        try {
            const { page = 1, limit = 20, unread_only = false } = req.query;
            const offset = (page - 1) * limit;

            const result = await NotificationService.getUserNotifications(req.userId, {
                limit: parseInt(limit),
                offset,
                unreadOnly: unread_only === 'true'
            });

            res.json({
                success: true,
                data: {
                    notifications: result.rows,
                    pagination: {
                        total: result.count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total_pages: Math.ceil(result.count / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Get notifications error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengambil notifikasi',
                error: error.message
            });
        }
    }

    /**
     * Get unread count
     */
    async getUnreadCount(req, res) {
        try {
            const count = await NotificationService.getUnreadCount(req.userId);

            res.json({
                success: true,
                data: { unread_count: count }
            });
        } catch (error) {
            console.error('Get unread count error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengambil jumlah notifikasi',
                error: error.message
            });
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(req, res) {
        try {
            const { id } = req.params;

            await NotificationService.markAsRead(id, req.userId);

            res.json({
                success: true,
                message: 'Notifikasi ditandai sudah dibaca'
            });
        } catch (error) {
            console.error('Mark as read error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal menandai notifikasi',
                error: error.message
            });
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(req, res) {
        try {
            await NotificationService.markAllAsRead(req.userId);

            res.json({
                success: true,
                message: 'Semua notifikasi ditandai sudah dibaca'
            });
        } catch (error) {
            console.error('Mark all as read error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal menandai semua notifikasi',
                error: error.message
            });
        }
    }
}

export default new NotificationController();
