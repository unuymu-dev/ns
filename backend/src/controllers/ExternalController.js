import { Op } from 'sequelize';
import { Request, Classification, Unit, User } from '../models/index.js';
import NotificationService from '../services/NotificationService.js';
import AuditService from '../services/AuditService.js';

class ExternalController {
    /**
     * Create external letter request (DRAFT or PENDING)
     */
    async createRequest(req, res) {
        try {
            const {
                letter_date,
                classification_id,
                recipient,
                subject,
                drafter,
                signer = 'Direktur',
                qty = 1,
                is_draft = false
            } = req.body;

            // Validasi qty
            if (qty < 1 || qty > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Qty harus antara 1-100'
                });
            }

            // Create request
            const request = await Request.create({
                letter_date,
                type: 'EXTERNAL',
                classification_id,
                applicant_unit_id: req.unitId,
                recipient,
                subject,
                drafter,
                signer,
                qty,
                status: is_draft ? 'DRAFT' : 'PENDING',
                created_by: req.userId
            });

            // Audit log
            await AuditService.logRequestCreated(
                req.userId,
                request.id,
                { type: 'EXTERNAL', classification_id, qty, status: request.status },
                req.ip
            );

            // Jika langsung submit (bukan draft), kirim notifikasi ke TURT
            if (!is_draft) {
                const unit = await Unit.findByPk(req.unitId);
                await NotificationService.notifyTurtNewRequest(
                    request.id,
                    unit.name,
                    subject
                );
            }

            res.status(201).json({
                success: true,
                message: is_draft ? 'Draft berhasil disimpan' : 'Permohonan berhasil dikirim',
                data: request
            });
        } catch (error) {
            console.error('Create external request error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal membuat permohonan',
                error: error.message
            });
        }
    }

    /**
     * Update draft request
     */
    async updateDraft(req, res) {
        try {
            const { id } = req.params;
            const {
                letter_date,
                classification_id,
                recipient,
                subject,
                drafter,
                signer,
                qty
            } = req.body;

            // Find request
            const request = await Request.findOne({
                where: {
                    id,
                    created_by: req.userId,
                    status: 'DRAFT'
                }
            });

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: 'Draft tidak ditemukan atau sudah disubmit'
                });
            }

            // Update
            await request.update({
                letter_date,
                classification_id,
                recipient,
                subject,
                drafter,
                signer,
                qty
            });

            res.json({
                success: true,
                message: 'Draft berhasil diupdate',
                data: request
            });
        } catch (error) {
            console.error('Update draft error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengupdate draft',
                error: error.message
            });
        }
    }

    /**
     * Submit draft (DRAFT -> PENDING)
     */
    async submitDraft(req, res) {
        try {
            const { id } = req.params;

            // Find request
            const request = await Request.findOne({
                where: {
                    id,
                    created_by: req.userId,
                    status: 'DRAFT'
                }
            });

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: 'Draft tidak ditemukan'
                });
            }

            // Update status
            await request.update({ status: 'PENDING' });

            // Send notification to TURT
            const unit = await Unit.findByPk(req.unitId);
            await NotificationService.notifyTurtNewRequest(
                request.id,
                unit.name,
                request.subject
            );

            res.json({
                success: true,
                message: 'Permohonan berhasil dikirim',
                data: request
            });
        } catch (error) {
            console.error('Submit draft error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengirim permohonan',
                error: error.message
            });
        }
    }

    /**
     * Get my requests (all statuses)
     */
    async getMyRequests(req, res) {
        try {
            const { page = 1, limit = 20, status, search } = req.query;
            const offset = (page - 1) * limit;

            const where = {
                type: 'EXTERNAL',
                created_by: req.userId
            };

            if (status) {
                where.status = status;
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
                order: [['created_at', 'DESC']],
                include: [
                    {
                        association: 'classification',
                        attributes: ['id', 'code', 'name']
                    },
                    {
                        association: 'processor',
                        attributes: ['id', 'name'],
                        required: false
                    }
                ]
            });

            res.json({
                success: true,
                data: {
                    requests: rows,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total_pages: Math.ceil(count / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Get my requests error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengambil data permohonan',
                error: error.message
            });
        }
    }

    /**
     * Get request detail with issued numbers
     */
    async getRequestDetail(req, res) {
        try {
            const { id } = req.params;

            const request = await Request.findOne({
                where: {
                    id,
                    created_by: req.userId
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
     * Delete draft
     */
    async deleteDraft(req, res) {
        try {
            const { id } = req.params;

            const request = await Request.findOne({
                where: {
                    id,
                    created_by: req.userId,
                    status: 'DRAFT'
                }
            });

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: 'Draft tidak ditemukan'
                });
            }

            await request.destroy();

            res.json({
                success: true,
                message: 'Draft berhasil dihapus'
            });
        } catch (error) {
            console.error('Delete draft error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal menghapus draft',
                error: error.message
            });
        }
    }
}

export default new ExternalController();
