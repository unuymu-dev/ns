import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware untuk handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: errors.array()
        });
    }

    next();
};

/**
 * Validation rules untuk login
 */
export const validateLogin = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username wajib diisi'),
    body('password')
        .notEmpty().withMessage('Password wajib diisi'),
    handleValidationErrors
];

/**
 * Validation rules untuk create internal number
 */
export const validateCreateInternal = [
    body('letter_date')
        .isISO8601().withMessage('Format tanggal tidak valid'),
    body('classification_id')
        .isInt({ min: 1 }).withMessage('Classification ID harus berupa angka'),
    body('recipient')
        .trim()
        .notEmpty().withMessage('Penerima wajib diisi'),
    body('subject')
        .trim()
        .notEmpty().withMessage('Perihal wajib diisi'),
    body('qty')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Qty harus antara 1-100'),
    handleValidationErrors
];

/**
 * Validation rules untuk create external request
 */
export const validateCreateExternalRequest = [
    body('letter_date')
        .isISO8601().withMessage('Format tanggal tidak valid'),
    body('classification_id')
        .isInt({ min: 1 }).withMessage('Classification ID harus berupa angka'),
    body('recipient')
        .trim()
        .notEmpty().withMessage('Penerima wajib diisi'),
    body('subject')
        .trim()
        .notEmpty().withMessage('Perihal wajib diisi'),
    body('signer')
        .optional()
        .trim(),
    body('qty')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Qty harus antara 1-100'),
    body('is_draft')
        .optional()
        .isBoolean().withMessage('is_draft harus boolean'),
    handleValidationErrors
];

/**
 * Validation rules untuk approve/reject request
 */
export const validateApproveRequest = [
    param('requestId')
        .isInt({ min: 1 }).withMessage('Request ID tidak valid'),
    handleValidationErrors
];

export const validateRejectRequest = [
    param('requestId')
        .isInt({ min: 1 }).withMessage('Request ID tidak valid'),
    body('reject_reason')
        .trim()
        .notEmpty().withMessage('Alasan penolakan wajib diisi')
        .isLength({ min: 10 }).withMessage('Alasan penolakan minimal 10 karakter'),
    handleValidationErrors
];

/**
 * Validation rules untuk report filters
 */
export const validateReportFilters = [
    query('start_date')
        .optional()
        .isISO8601().withMessage('Format start_date tidak valid'),
    query('end_date')
        .optional()
        .isISO8601().withMessage('Format end_date tidak valid'),
    query('classification_id')
        .optional()
        .isInt({ min: 1 }).withMessage('Classification ID tidak valid'),
    query('unit_id')
        .optional()
        .isInt({ min: 1 }).withMessage('Unit ID tidak valid'),
    query('status')
        .optional()
        .isIn(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']).withMessage('Status tidak valid'),
    query('type')
        .optional()
        .isIn(['INTERNAL', 'EXTERNAL']).withMessage('Type tidak valid'),
    handleValidationErrors
];

/**
 * Validation rules untuk pagination
 */
export const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page harus angka >= 1'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit harus antara 1-100'),
    handleValidationErrors
];
