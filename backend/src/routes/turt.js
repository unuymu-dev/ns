import express from 'express';
import TurtController from '../controllers/TurtController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateApproveRequest, validateRejectRequest, validatePagination } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication as TURT
router.use(authenticate);
router.use(requireRole('TURT', 'ADMIN'));

// Get inbox
router.get('/inbox', validatePagination, TurtController.getInbox);

// Get request detail
router.get('/inbox/:id', TurtController.getRequestDetail);

// Approve request
router.post('/approve/:requestId', validateApproveRequest, TurtController.approveRequest);

// Reject request
router.post('/reject/:requestId', validateRejectRequest, TurtController.rejectRequest);

// Get statistics
router.get('/statistics', TurtController.getStatistics);

export default router;
