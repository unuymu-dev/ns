import express from 'express';
import AuthController from '../controllers/AuthController.js';
import { validateLogin } from '../middleware/validator.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', validateLogin, AuthController.login);

// Protected routes
router.get('/me', authenticate, AuthController.me);
router.post('/logout', authenticate, AuthController.logout);

export default router;
