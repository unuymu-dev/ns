import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { Request, IssuedNumber, Classification, Unit, User } from '../models/index.js';
import SequenceService from '../services/SequenceService.js';
import NotificationService from '../services/NotificationService.js';
import AuditService from '../services/AuditService.js';

class TurtController {
    /**
     * Get inbox (all external requests)
     */
    async getInbox(req, res) {
        try {
            const { page = 1, limit = 20, status = 'PENDING', search, unit_id, classification_id } = req.query;
            const offset = (page - 1) * limit;

            const where = {
                type: 'EXTERNAL'
            };

            if (status) {
                where.status = status;
            }

            if (unit_id) {
                where.applicant_unit_id = unit_id;
            }

            if (classification_id) {
                where.classification_id = classification_id;
            }

            if (search) {
                where[Op.or] = [
                    { subject: { [Op.iLike]: `%${search}%` } },
                    { recipient: { [Op.iLike]: `%${search}%` } }
                ];
            }

            const { rows, count } = await Request.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset,
                order: [
                    ['status', 'ASC'], // PENDING first
                    ['created_at', 'ASC'] // Oldest first
                ],
                include: [
                    {
                        association: 'classification',
                        attributes: ['id', 'code', 'name']
                    },
                    {
                        association: 'applicant_unit',
                        attributes: ['id', 'name', 'code']
                    },
                    {
                        association: 'creator',
                        attributes: ['id', 'name']
                    }
                ]
            });

            // Get pending count for badge
            const pendingCount = await Request.count({
                where: {
                    type: 'EXTERNAL',
                    status: 'PENDING'
                }
            });

            res.json({
                success: true,
                data: {
                    requests: rows,
                    pending_count: pendingCount,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total_pages: Math.ceil(count / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Get inbox error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengambil data inbox',
                error: error.message
            });
        }
    }

    /**
     * Get request detail (for TURT)
     */
    async getRequestDetail(req, res) {
        try {
            const { id } = req.params;

            const request = await Request.findOne({
                where: {
                    id,
                    type: 'EXTERNAL'
                },
                include: [
                    {
                        association: 'classification',
                        attributes: ['id', 'code', 'name']
                    },
                    {
                        association: 'applicant_unit',
                        attributes: ['id', 'name', 'code']
                    },
                    {
                        association: 'creator',
                        attributes: ['id', 'name', 'username']
                    },
                    {
                        association: 'processor',
                        attributes: ['id', 'name'],
                        required: false
                    },
                    {
                        association: 'issued_numbers',
                        required: false
                    }
                ]
            });

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: 'Permohonan tidak ditemukan'
                });
            }

            res.json({
                success: true,
                data: request
            });
        } catch (error) {
            console.error('Get request detail error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengambil detail permohonan',
                error: error.message
            });
        }
    }

    /**
     * Approve request dan terbitkan nomor (ATOMIC TRANSACTION)
     */
    async approveRequest(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;

            // Find request
            const request = await Request.findOne({
                where: {
                    id,
                    type: 'EXTERNAL',
                    status: 'PENDING'
                },
                transaction
            });

            if (!request) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Permohonan tidak ditemukan atau sudah diproses'
                });
            }

            // Generate nomor surat dengan ATOMIC TRANSACTION + ROW LOCKING
            const issuedNumbers = await SequenceService.generateNumbers({
                type: 'EXTERNAL',
                classificationId: request.classification_id,
                applicantUnitId: request.applicant_unit_id,
                qty: request.qty,
                requestId: request.id,
                metadata: {
                    subject: request.subject,
                    recipient: request.recipient,
                    signer: request.signer
                }
            }, transaction);

            // Update request status
            await request.update({
                status: 'APPROVED',
                processed_by: req.userId,
                processed_at: new Date()
            }, { transaction });

            // Commit transaction
            await transaction.commit();

            // Send notification to applicant
            await NotificationService.notifyRequestApproved(
                request.created_by,
                request.id,
                request.qty
            );

            // Audit log
            await AuditService.logRequestApproved(
                req.userId,
                request.id,
                issuedNumbers.length,
                req.ip
            );

            res.json({
                success: true,
                message: `Permohonan disetujui. ${issuedNumbers.length} nomor surat berhasil diterbitkan.`,
                data: {
                    request_id: request.id,
                    issued_numbers: issuedNumbers.map(n => ({
                        id: n.id,
                        full_code: n.full_code,
                        number_int: n.number_int,
                        year: n.year
                    }))
                }
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Approve request error:', error);

            res.status(500).json({
                success: false,
                message: 'Gagal menyetujui permohonan',
                error: error.message
            });
        }
    }

    /**
     * Reject request
     */
    async rejectRequest(req, res) {
        try {
            const { id } = req.params;
            const { reject_reason } = req.body;

            // Find request
            const request = await Request.findOne({
                where: {
                    id,
                    type: 'EXTERNAL',
                    status: 'PENDING'
                }
            });

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: 'Permohonan tidak ditemukan atau sudah diproses'
                });
            }

            // Update status
            await request.update({
                status: 'REJECTED',
                reject_reason,
                processed_by: req.userId,
                processed_at: new Date()
            });

            // Send notification to applicant
            await NotificationService.notifyRequestRejected(
                request.created_by,
                request.id,
                reject_reason
            );

            // Audit log
            await AuditService.logRequestRejected(
                req.userId,
                request.id,
                reject_reason,
                req.ip
            );

            res.json({
                success: true,
                message: 'Permohonan ditolak',
                data: request
            });
        } catch (error) {
            console.error('Reject request error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal menolak permohonan',
                error: error.message
            });
        }
    }

    /**
     * Get statistics for TURT dashboard
     */
    async getStatistics(req, res) {
        try {
            const stats = await Promise.all([
                // Pending count
                Request.count({
                    where: { type: 'EXTERNAL', status: 'PENDING' }
                }),
                // Approved today
                Request.count({
                    where: {
                        type: 'EXTERNAL',
                        status: 'APPROVED',
                        processed_at: {
                            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
                        }
                    }
                }),
                // Total approved this month
                Request.count({
                    where: {
                        type: 'EXTERNAL',
                        status: 'APPROVED',
                        processed_at: {
                            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                        }
                    }
                }),
                // Total issued numbers this month
                IssuedNumber.count({
                    where: {
                        type: 'EXTERNAL',
                        issued_at: {
                            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                        }
                    }
                })
            ]);

            res.json({
                success: true,
                data: {
                    pending_requests: stats[0],
                    approved_today: stats[1],
                    approved_this_month: stats[2],
                    numbers_issued_this_month: stats[3]
                }
            });
        } catch (error) {
            console.error('Get statistics error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengambil statistik',
                error: error.message
            });
        }
    }
}

export default new TurtController();
