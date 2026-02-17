import { Op } from 'sequelize';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Request, IssuedNumber, Classification, Unit } from '../models/index.js';

class ReportController {
    /**
     * Get requests report with filters
     */
    async getRequestsReport(req, res) {
        try {
            const {
                start_date,
                end_date,
                classification_id,
                unit_id,
                status,
                type,
                page = 1,
                limit = 100
            } = req.query;

            const offset = (page - 1) * limit;
            const where = {};

            if (start_date) {
                where.created_at = { [Op.gte]: new Date(start_date) };
            }
            if (end_date) {
                where.created_at = {
                    ...where.created_at,
                    [Op.lte]: new Date(end_date)
                };
            }
            if (classification_id) {
                where.classification_id = classification_id;
            }
            if (unit_id) {
                where.applicant_unit_id = unit_id;
            }
            if (status) {
                where.status = status;
            }
            if (type) {
                where.type = type;
            }

            const { rows, count } = await Request.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset,
                order: [['created_at', 'DESC']],
                include: [
                    {
                        association: 'classification',
                        attributes: ['code', 'name']
                    },
                    {
                        association: 'applicant_unit',
                        attributes: ['name', 'code']
                    },
                    {
                        association: 'creator',
                        attributes: ['name']
                    },
                    {
                        association: 'processor',
                        attributes: ['name'],
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
            console.error('Get requests report error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengambil laporan permohonan',
                error: error.message
            });
        }
    }

    /**
     * Get issued numbers report with filters
     */
    async getIssuedNumbersReport(req, res) {
        try {
            const {
                start_date,
                end_date,
                classification_id,
                unit_id,
                type,
                page = 1,
                limit = 100
            } = req.query;

            const offset = (page - 1) * limit;
            const where = {};

            if (start_date) {
                where.issued_at = { [Op.gte]: new Date(start_date) };
            }
            if (end_date) {
                where.issued_at = {
                    ...where.issued_at,
                    [Op.lte]: new Date(end_date)
                };
            }
            if (classification_id) {
                where.classification_id = classification_id;
            }
            if (unit_id) {
                where.applicant_unit_id = unit_id;
            }
            if (type) {
                where.type = type;
            }

            const { rows, count } = await IssuedNumber.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset,
                order: [['issued_at', 'DESC']],
                include: [
                    {
                        association: 'classification',
                        attributes: ['code', 'name']
                    },
                    {
                        association: 'applicant_unit',
                        attributes: ['name', 'code']
                    },
                    {
                        association: 'issuer_unit',
                        attributes: ['name', 'code']
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
            console.error('Get issued numbers report error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengambil laporan nomor terbit',
                error: error.message
            });
        }
    }

    /**
     * Export requests to Excel
     */
    async exportRequestsExcel(req, res) {
        try {
            const { start_date, end_date, classification_id, unit_id, status, type } = req.query;

            const where = {};
            if (start_date) where.created_at = { [Op.gte]: new Date(start_date) };
            if (end_date) where.created_at = { ...where.created_at, [Op.lte]: new Date(end_date) };
            if (classification_id) where.classification_id = classification_id;
            if (unit_id) where.applicant_unit_id = unit_id;
            if (status) where.status = status;
            if (type) where.type = type;

            const requests = await Request.findAll({
                where,
                order: [['created_at', 'DESC']],
                include: [
                    { association: 'classification', attributes: ['code', 'name'] },
                    { association: 'applicant_unit', attributes: ['name', 'code'] },
                    { association: 'creator', attributes: ['name'] },
                    { association: 'processor', attributes: ['name'], required: false }
                ]
            });

            // Create workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Laporan Permohonan');

            // Define columns
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Tanggal Dibuat', key: 'created_at', width: 15 },
                { header: 'Tanggal Surat', key: 'letter_date', width: 15 },
                { header: 'Tipe', key: 'type', width: 10 },
                { header: 'Klasifikasi', key: 'classification', width: 20 },
                { header: 'Unit Pemohon', key: 'unit', width: 25 },
                { header: 'Perihal', key: 'subject', width: 40 },
                { header: 'Penerima', key: 'recipient', width: 30 },
                { header: 'Qty', key: 'qty', width: 10 },
                { header: 'Status', key: 'status', width: 12 },
                { header: 'Pembuat', key: 'creator', width: 20 },
                { header: 'Diproses Oleh', key: 'processor', width: 20 }
            ];

            // Add rows
            requests.forEach(req => {
                worksheet.addRow({
                    id: req.id,
                    created_at: new Date(req.created_at).toLocaleDateString('id-ID'),
                    letter_date: new Date(req.letter_date).toLocaleDateString('id-ID'),
                    type: req.type,
                    classification: `${req.classification.code} - ${req.classification.name}`,
                    unit: req.applicant_unit.name,
                    subject: req.subject,
                    recipient: req.recipient,
                    qty: req.qty,
                    status: req.status,
                    creator: req.creator.name,
                    processor: req.processor ? req.processor.name : '-'
                });
            });

            // Style header
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD3D3D3' }
            };

            // Set response headers
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=laporan-permohonan-${Date.now()}.xlsx`);

            // Write to response
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.error('Export Excel error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal export Excel',
                error: error.message
            });
        }
    }

    /**
     * Export issued numbers to Excel
     */
    async exportNumbersExcel(req, res) {
        try {
            const { start_date, end_date, classification_id, unit_id, type } = req.query;

            const where = {};
            if (start_date) where.issued_at = { [Op.gte]: new Date(start_date) };
            if (end_date) where.issued_at = { ...where.issued_at, [Op.lte]: new Date(end_date) };
            if (classification_id) where.classification_id = classification_id;
            if (unit_id) where.applicant_unit_id = unit_id;
            if (type) where.type = type;

            const numbers = await IssuedNumber.findAll({
                where,
                order: [['issued_at', 'DESC']],
                include: [
                    { association: 'classification', attributes: ['code', 'name'] },
                    { association: 'applicant_unit', attributes: ['name', 'code'] },
                    { association: 'issuer_unit', attributes: ['name', 'code'] }
                ]
            });

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Laporan Nomor Terbit');

            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Nomor Lengkap', key: 'full_code', width: 30 },
                { header: 'Nomor', key: 'number_int', width: 10 },
                { header: 'Tahun', key: 'year', width: 10 },
                { header: 'Tanggal Terbit', key: 'issued_at', width: 15 },
                { header: 'Tipe', key: 'type', width: 10 },
                { header: 'Klasifikasi', key: 'classification', width: 20 },
                { header: 'Unit Pemohon', key: 'applicant', width: 25 },
                { header: 'Unit Penerbit', key: 'issuer', width: 25 },
                { header: 'Perihal', key: 'subject', width: 40 },
                { header: 'Penerima', key: 'recipient', width: 30 }
            ];

            numbers.forEach(num => {
                worksheet.addRow({
                    id: num.id,
                    full_code: num.full_code,
                    number_int: num.number_int,
                    year: num.year,
                    issued_at: new Date(num.issued_at).toLocaleDateString('id-ID'),
                    type: num.type,
                    classification: `${num.classification.code} - ${num.classification.name}`,
                    applicant: num.applicant_unit.name,
                    issuer: num.issuer_unit.name,
                    subject: num.subject || '-',
                    recipient: num.recipient || '-'
                });
            });

            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD3D3D3' }
            };

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=laporan-nomor-terbit-${Date.now()}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.error('Export numbers Excel error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal export Excel',
                error: error.message
            });
        }
    }
}

export default new ReportController();
