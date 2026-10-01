import { Router } from 'express';
import { jobController } from '../controllers/jobController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public / Search endpoints
router.get('/', (req, res, next) => jobController.search(req, res, next));
router.get('/search', (req, res, next) => jobController.search(req, res, next));
router.get('/recommended', authenticate, (req, res, next) => jobController.getRecommended(req, res, next));
router.get('/saved', authenticate, (req, res, next) => jobController.listSaved(req, res, next));
router.post('/save-external', authenticate, (req, res, next) => jobController.saveExternalJob(req, res, next));
router.get('/:id', (req, res, next) => jobController.getById(req, res, next));
router.get('/:id/match', authenticate, (req, res, next) => jobController.getJobMatch(req, res, next));
router.post('/:id/save', authenticate, (req, res, next) => jobController.saveJob(req, res, next));
router.delete('/:id/save', authenticate, (req, res, next) => jobController.unsaveJob(req, res, next));

export default router;
