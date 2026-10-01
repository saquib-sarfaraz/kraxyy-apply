import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { extensionService } from '../services/extensionService';
import { ragService } from '../services/ragService';

export class ExtensionController {
  async generatePairCode(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await extensionService.generatePairCode(req.user!.id);
      res.json({
        success: true,
        data: result,
        message: 'Pairing code generated'
      });
    } catch (err) {
      next(err);
    }
  }

  async verifyPairCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { pairCode, browser, version } = req.body;
      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

      const result = await extensionService.verifyPairCode(pairCode, { browser, version, ip });
      res.json({
        success: true,
        data: result,
        message: 'Extension paired successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const payload = await extensionService.getProfileForExtension(req.user!.id);
      res.json({
        success: true,
        data: payload
      });
    } catch (err) {
      next(err);
    }
  }

  async matchJob(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const jobData = req.body.job || req.body;
      const result = await extensionService.matchJobWithCandidate(req.user!.id, jobData);
      res.json({
        success: true,
        data: result,
        message: 'Job match calculated successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async recordTelemetry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const result = await extensionService.recordTelemetry(userId, req.body);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async listSessions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sessions = await extensionService.listUserSessions(req.user!.id);
      res.json({
        success: true,
        data: sessions
      });
    } catch (err) {
      next(err);
    }
  }

  async revokeSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await extensionService.revokeSession(req.params.id, req.user!.id);
      res.json({
        success: true,
        data: null,
        message: 'Extension disconnected'
      });
    } catch (err) {
      next(err);
    }
  }

  async answerApplicationQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { question, jobContext } = req.body;
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
  }
}

export const extensionController = new ExtensionController();
