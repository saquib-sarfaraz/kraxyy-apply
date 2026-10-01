import { Router } from 'express';
import { applicationController } from '../controllers/applicationController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { createApplicationSchema, updateApplicationSchema } from '@kraxyy/validation';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => applicationController.list(req, res, next));
router.get('/metrics', (req, res, next) => applicationController.metrics(req, res, next));
router.get('/:id', (req, res, next) => applicationController.getById(req, res, next));

router.post('/', validateBody(createApplicationSchema), (req, res, next) =>
  applicationController.create(req, res, next)
);

router.patch('/:id', validateBody(updateApplicationSchema), (req, res, next) =>
  applicationController.update(req, res, next)
);

router.delete('/:id', (req, res, next) => applicationController.delete(req, res, next));

export default router;
