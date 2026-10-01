import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { contactController } from '../controllers/contactController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const router = Router();

router.use(authenticate);
router.use(requireAdmin());

router.get('/metrics', (req, res, next) => adminController.getMetrics(req, res, next));
router.get('/users', (req, res, next) => adminController.listUsers(req, res, next));
router.patch('/users/:id/status', (req, res, next) =>
  adminController.updateUserStatus(req, res, next)
);
router.get('/health', (req, res) => adminController.systemHealth(req, res));

// Contact submissions
router.get('/contact-requests', (req, res, next) =>
  contactController.listContactRequests(req, res, next)
);
router.patch('/contact-requests/:id/status', (req, res, next) =>
  contactController.updateContactStatus(req, res, next)
);

export default router;
