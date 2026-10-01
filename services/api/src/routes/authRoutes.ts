import { Router } from 'express';
import { authController } from '../controllers/authController';
import { validateBody } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { authRateLimiter, forgotPasswordRateLimiter } from '../config/security';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '@kraxyy/validation';

const router = Router();

router.post('/register', authRateLimiter, validateBody(registerSchema), (req, res, next) =>
  authController.register(req, res, next)
);

router.post('/login', authRateLimiter, validateBody(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

router.post('/logout', (req, res, next) => authController.logout(req, res, next));

router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));

router.get('/me', authenticate, (req, res, next) => authController.me(req, res, next));

router.post(
  '/forgot-password',
  forgotPasswordRateLimiter,
  validateBody(forgotPasswordSchema),
  (req, res, next) => authController.forgotPassword(req, res, next)
);

router.get('/verify-reset-token', (req, res, next) =>
  authController.verifyResetToken(req, res, next)
);

router.post(
  '/reset-password',
  authRateLimiter,
  validateBody(resetPasswordSchema),
  (req, res, next) => authController.resetPassword(req, res, next)
);

export default router;
