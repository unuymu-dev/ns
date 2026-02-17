import express from 'express';
import ReportController from '../controllers/ReportController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateReportFilters, validatePagination } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication as TURT or ADMIN
router.use(authenticate);
router.use(requireRole('TURT', 'ADMIN'));

// Get requests report
router.get('/requests', validateReportFilters, validatePagination, ReportController.getRequestsReport);

// Get issued numbers report
router.get('/issued-numbers', validateReportFilters, validatePagination, ReportController.getIssuedNumbersReport);

// Export requests to Excel
router.get('/export/requests/excel', validateReportFilters, ReportController.exportRequestsExcel);

// Export issued numbers to Excel
router.get('/export/numbers/excel', validateReportFilters, ReportController.exportNumbersExcel);

export default router;
