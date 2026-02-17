import sequelize from '../config/database.js';
import { Request, IssuedNumber, Classification, Unit } from '../models/index.js';
import SequenceService from '../services/SequenceService.js';
import AuditService from '../services/AuditService.js';

class InternalController {
    /**
     * Issue internal letter number (self-issued, langsung terbit)
     */
    async issueNumber(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const {
                letter_date,
                classification_id,
                recipient,
                subject,
                drafter,
                signer,
                qty = 1
            } = req.body;

            // Validasi qty
            if (qty < 1 || qty > 100) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Qty harus antara 1-100'
                });
            }

            // Create request record (langsung APPROVED untuk internal)
            const request = await Request.create({
                letter_date,
                type: 'INTERNAL',
                classification_id,
                applicant_unit_id: req.unitId,
                recipient,
                subject,
                drafter,
                signer,
                qty,
                status: 'APPROVED',
                created_by: req.userId,
                processed_by: req.userId,
                processed_at: new Date()
            }, { transaction });

            // Generate nomor surat dengan ATOMIC TRANSACTION
            const issuedNumbers = await SequenceService.generateNumbers({
                type: 'INTERNAL',
                classificationId: classification_id,
                applicantUnitId: req.unitId,
                qty,
                requestId: request.id,
                metadata: { subject, recipient, signer }
            }, transaction);

            // Commit transaction
            await transaction.commit();

            // Audit log
            await AuditService.logInternalNumberIssued(
                req.userId,
                issuedNumbers.map(n => n.id),
                req.ip
            );

            // Return response
            res.status(201).json({
                success: true,
                message: `Berhasil menerbitkan ${qty} nomor surat internal`,
                data: {
                    request_id: request.id,
                    issued_numbers: issuedNumbers.map(n => ({
                        id: n.id,
                        full_code: n.full_code,
                        number_int: n.number_int,
                        year: n.year,
                        qr_token: n.qr_token
                    }))
                }
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Issue internal number error:', error);

            res.status(500).json({
                success: false,
                message: 'Gagal menerbitkan nomor surat',
                error: error.message
            });
        }
    }

    /**
     * Get list of internal numbers issued by my unit
     */
    async getMyNumbers(req, res) {
        try {
            const { page = 1, limit = 20, search } = req.query;
            const offset = (page - 1) * limit;

            const where = {
                type: 'INTERNAL',
                applicant_unit_id: req.unitId
            };

            // Search filter
            if (search) {
                where[Op.or] = [
                    { full_code: { [Op.iLike]: `%${search}%` } },
                    { subject: { [Op.iLike]: `%${search}%` } },
                    { recipient: { [Op.iLike]: `%${search}%` } }
                ];
            }

            const { rows, count } = await IssuedNumber.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset,
                order: [['issued_at', 'DESC']],
                include: [
                    {
                        association: 'classification',
                        attributes: ['id', 'code', 'name']
                    },
                    {
                        association: 'request',
                        attributes: ['id', 'letter_date', 'created_by']
                    }
                ]
            });

            res.json({
                success: true,
                data: {
                    numbers: rows,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total_pages: Math.ceil(count / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Get my numbers error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengambil data nomor surat',
                error: error.message
            });
        }
    }

    /**
     * Get detail of a specific internal number
     */
    async getNumberDetail(req, res) {
        try {
            const { id } = req.params;

            const number = await IssuedNumber.findOne({
                where: {
                    id,
                    type: 'INTERNAL',
                    applicant_unit_id: req.unitId // Only own unit
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
                        association: 'request',
                        attributes: ['id', 'letter_date', 'drafter', 'created_at']
                    }
                ]
            });

            if (!number) {
                return res.status(404).json({
                    success: false,
                    message: 'Nomor surat tidak ditemukan'
                });
            }

            res.json({
                success: true,
                data: number
            });
        } catch (error) {
            console.error('Get number detail error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengambil detail nomor surat',
                error: error.message
            });
        }
    }
}

export default new InternalController();
