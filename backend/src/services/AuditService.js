import { AuditLog } from '../models/index.js';

/**
 * AuditService
 * 
 * Service untuk logging semua aktivitas penting di sistem
 */

class AuditService {
    /**
     * Create audit log entry
     */
    async log({ userId, action, objectType, objectId, detail, ip }) {
        const auditLog = await AuditLog.create({
            user_id: userId,
            action,
            object_type: objectType,
            object_id: objectId,
            detail_json: detail,
            ip
        });

        return auditLog;
    }

    /**
     * Log user login
     */
    async logLogin(userId, ip) {
        return await this.log({
            userId,
            action: 'USER_LOGIN',
            objectType: 'User',
            objectId: userId,
            ip
        });
    }

    /**
     * Log request creation
     */
    async logRequestCreated(userId, requestId, requestData, ip) {
        return await this.log({
            userId,
            action: 'REQUEST_CREATED',
            objectType: 'Request',
            objectId: requestId,
            detail: requestData,
            ip
        });
    }

    /**
     * Log request approval
     */
    async logRequestApproved(userId, requestId, issuedCount, ip) {
        return await this.log({
            userId,
            action: 'REQUEST_APPROVED',
            objectType: 'Request',
            objectId: requestId,
            detail: { issued_count: issuedCount },
            ip
        });
    }

    /**
     * Log request rejection
     */
    async logRequestRejected(userId, requestId, reason, ip) {
        return await this.log({
            userId,
            action: 'REQUEST_REJECTED',
            objectType: 'Request',
            objectId: requestId,
            detail: { reason },
            ip
        });
    }

    /**
     * Log internal number issuance
     */
    async logInternalNumberIssued(userId, issuedNumberIds, ip) {
        return await this.log({
            userId,
            action: 'INTERNAL_NUMBER_ISSUED',
            objectType: 'IssuedNumber',
            objectId: issuedNumberIds[0],
            detail: { issued_ids: issuedNumberIds },
            ip
        });
    }

    /**
     * Get audit logs with filters
     */
    async getAuditLogs({ userId, action, objectType, startDate, endDate, limit = 100, offset = 0 }) {
        const where = {};

        if (userId) where.user_id = userId;
        if (action) where.action = action;
        if (objectType) where.object_type = objectType;

        if (startDate || endDate) {
            where.created_at = {};
            if (startDate) where.created_at[Op.gte] = startDate;
            if (endDate) where.created_at[Op.lte] = endDate;
        }

        const logs = await AuditLog.findAndCountAll({
            where,
            limit,
            offset,
            order: [['created_at', 'DESC']],
            include: [
                {
                    association: 'user',
                    attributes: ['id', 'name', 'username']
                }
            ]
        });

        return logs;
    }
}

export default new AuditService();
