import express from 'express';
import ExternalController from '../controllers/ExternalController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateCreateExternalRequest, validatePagination } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication as PEMOHON
router.use(authenticate);
router.use(requireRole('PEMOHON', 'ADMIN'));

// Create external request (draft or pending)
router.post('/request', validateCreateExternalRequest, ExternalController.createRequest);

// Update draft
router.put('/request/:id/draft', validateCreateExternalRequest, ExternalController.updateDraft);

// Submit draft (DRAFT -> PENDING)
router.post('/request/:id/submit', ExternalController.submitDraft);

// Get my requests
router.get('/my-requests', validatePagination, ExternalController.getMyRequests);

// Get request detail
router.get('/request/:id', ExternalController.getRequestDetail);

// Delete draft
router.delete('/request/:id', ExternalController.deleteDraft);

export default router;
