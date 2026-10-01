import { Router } from 'express';
import { profileController } from '../controllers/profileController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { fullProfileUpdateSchema } from '@kraxyy/validation';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => profileController.getProfile(req, res, next));
router.get('/completion', (req, res, next) => profileController.getCompletion(req, res, next));
router.get('/autofill-payload', (req, res, next) => profileController.getAutofillPayload(req, res, next));

router.put('/', validateBody(fullProfileUpdateSchema), (req, res, next) =>
  profileController.updateProfile(req, res, next)
);

export default router;
