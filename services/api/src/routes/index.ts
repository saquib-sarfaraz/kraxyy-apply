import { Router } from 'express';
import authRoutes from './authRoutes';
import profileRoutes from './profileRoutes';
import resumeRoutes from './resumeRoutes';
import applicationRoutes from './applicationRoutes';
import jobRoutes from './jobRoutes';
import extensionRoutes from './extensionRoutes';
import adminRoutes from './adminRoutes';
import contactRoutes from './contactRoutes';
import { jobController } from '../controllers/jobController';
import { authenticate } from '../middleware/auth';

import ragRoutes from './ragRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/resumes', resumeRoutes);
router.use('/resume', resumeRoutes);
router.use('/applications', applicationRoutes);
router.use('/jobs', jobRoutes);
router.use('/rag', ragRoutes);
router.use('/extension', extensionRoutes);
router.use('/admin', adminRoutes);
router.use('/contact', contactRoutes);

// Dedicated matching route: /api/matching/job/:jobId
router.get('/matching/job/:jobId', authenticate, (req, res, next) =>
  jobController.getJobMatch(req, res, next)
);

export default router;
