import { Router } from 'express';
import { extensionController } from '../controllers/extensionController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { extensionPairSchema, extensionTelemetrySchema } from '@kraxyy/validation';

const router = Router();

// Web App: Generate 5-minute pair code (AB7X-92KP)
router.post('/pair-code', authenticate, (req, res, next) =>
  extensionController.generatePairCode(req, res, next)
);
router.post('/pair', authenticate, (req, res, next) =>
  extensionController.generatePairCode(req, res, next)
);

// Extension: Exchange pair code for scoped session token
router.post('/verify-pair', validateBody(extensionPairSchema), (req, res, next) =>
  extensionController.verifyPairCode(req, res, next)
);
router.post('/connect', validateBody(extensionPairSchema), (req, res, next) =>
  extensionController.verifyPairCode(req, res, next)
);

// Extension: Fetch autofill dictionary
router.get('/profile', authenticate, (req, res, next) =>
  extensionController.getProfile(req, res, next)
);

// Extension: Match extracted job with user's profile and resume
router.post('/match-job', authenticate, (req, res, next) =>
  extensionController.matchJob(req, res, next)
);

// Extension: Send telemetry on autofill event
router.post('/telemetry', validateBody(extensionTelemetrySchema), (req, res, next) =>
  extensionController.recordTelemetry(req, res, next)
);

// Extension: RAG grounded answer generation for custom application questions
router.post('/answer-question', authenticate, (req, res, next) =>
  extensionController.answerApplicationQuestion(req, res, next)
);

// User Settings: List active sessions & revoke
router.get('/sessions', authenticate, (req, res, next) =>
  extensionController.listSessions(req, res, next)
);
router.get('/session', authenticate, (req, res, next) =>
  extensionController.listSessions(req, res, next)
);

router.delete('/sessions/:id', authenticate, (req, res, next) =>
  extensionController.revokeSession(req, res, next)
);
router.delete('/revoke/:id', authenticate, (req, res, next) =>
  extensionController.revokeSession(req, res, next)
);

export default router;
