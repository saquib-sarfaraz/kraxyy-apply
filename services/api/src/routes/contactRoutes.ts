import { Router } from 'express';
import { contactController } from '../controllers/contactController';
import { contactRateLimiter } from '../config/security';

const router = Router();

// Public submission with rate limiting
router.post('/', contactRateLimiter, (req, res, next) =>
  contactController.submitContact(req, res, next)
);

export default router;
