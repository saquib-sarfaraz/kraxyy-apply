import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { profileService } from '../services/profileService';

export class ProfileController {
  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const profile = await profileService.getProfileByUserId(req.user!.id);
      res.json({
        success: true,
        data: profile
      });
    } catch (err) {
      next(err);
    }
  }

  async getCompletion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const profile = await profileService.getProfileByUserId(req.user!.id);
      res.json({
        success: true,
        data: {
          completionPercentage: profile.completionPercentage,
          breakdown: profile.completionBreakdown
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = await profileService.updateProfile(req.user!.id, req.body);
      res.json({
        success: true,
        data: updated,
        message: 'Profile updated successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async getAutofillPayload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const payload = await profileService.getAutofillPayload(req.user!.id);
      res.json({
        success: true,
        data: payload
      });
    } catch (err) {
      next(err);
    }
  }
}

export const profileController = new ProfileController();
