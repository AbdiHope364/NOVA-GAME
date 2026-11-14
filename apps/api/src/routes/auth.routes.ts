import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/verify-registration', AuthController.verifyRegistration);
router.post('/resend-code', AuthController.resendCode);
router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.get('/me', authenticate, AuthController.getMe);
router.patch('/profile', authenticate, AuthController.updateProfile);
router.post('/password', authenticate, AuthController.changePassword);

export default router;
