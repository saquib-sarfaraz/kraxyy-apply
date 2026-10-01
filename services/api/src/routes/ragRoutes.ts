import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, authenticate } from '../middleware/auth';
import { ragService } from '../services/ragService';
import { profileService } from '../services/profileService';
import { aiService } from '../services/aiService';
import { ApiError } from '../utils/apiError';

const router = Router();

/**
 * Answer an open-ended application question grounded strictly in candidate facts
 */
router.post('/answer', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { question, jobContext } = req.body;
    if (!question || typeof question !== 'string') {
      throw ApiError.badRequest('Question string is required');
    }

    const result = await ragService.answerQuestion({
      userId: req.user!.id,
      question,
      jobContext
    });

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Retrieve candidate's verified evidence facts
 */
router.get('/facts', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const facts = await ragService.getCandidateFacts(req.user!.id);
    res.json({
      success: true,
      data: facts
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Interactive Job Match: Evaluate any pasted Job Description against candidate profile with Grok
 */
router.post('/evaluate-match', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, company, description, requirements, skills } = req.body;
    if (!description && !title) {
      throw ApiError.badRequest('Job description or title is required for match analysis');
    }

    const [profile, facts] = await Promise.all([
      profileService.getProfileByUserId(req.user!.id),
      ragService.getCandidateFacts(req.user!.id)
    ]);

    const matchResult = await aiService.evaluateJobMatchWithGrok(profile, facts, {
      title: title || 'Target Position',
      company: company || 'Prospective Employer',
      description: description || '',
      requirements: requirements || [],
      skills: skills || []
    });

    res.json({
      success: true,
      data: matchResult
    });
  } catch (err) {
    next(err);
  }
});

export default router;
