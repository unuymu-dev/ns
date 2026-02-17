import express from 'express';
import InternalController from '../controllers/InternalController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateCreateInternal, validatePagination } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication as PEMOHON
router.use(authenticate);
router.use(requireRole('PEMOHON', 'ADMIN'));

// Issue internal number (self-issued)
router.post('/issue', validateCreateInternal, InternalController.issueNumber);

// Get my internal numbers
router.get('/my-numbers', validatePagination, InternalController.getMyNumbers);

// Get number detail
router.get('/numbers/:id', InternalController.getNumberDetail);

export default router;
