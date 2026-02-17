import express from 'express';
import VerifyController from '../controllers/VerifyController.js';

const router = express.Router();

// Public route - no authentication required
router.get('/:token', VerifyController.verifyQR);

export default router;
