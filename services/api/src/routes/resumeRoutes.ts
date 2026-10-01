import { Router } from 'express';
import multer from 'multer';
import { resumeController } from '../controllers/resumeController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { reviewResumeSuggestionSchema } from '@kraxyy/validation';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE_BYTES || '10485760', 10) // 10MB
  }
});

router.use(authenticate);

router.get('/', (req, res, next) => resumeController.listResumes(req, res, next));
router.get('/:id', (req, res, next) => resumeController.getById(req, res, next));

router.post('/upload', upload.single('file'), (req, res, next) =>
  resumeController.uploadResume(req, res, next)
);

router.post('/:id/review', validateBody(reviewResumeSuggestionSchema), (req, res, next) =>
  resumeController.reviewSuggestion(req, res, next)
);

router.post('/:id/parse', (req, res, next) =>
  resumeController.parseResume(req, res, next)
);

router.patch('/:id/default', (req, res, next) =>
  resumeController.setDefault(req, res, next)
);

router.patch('/:id/rename', (req, res, next) =>
  resumeController.renameResume(req, res, next)
);

router.delete('/:id', (req, res, next) =>
  resumeController.deleteResume(req, res, next)
);

export default router;
