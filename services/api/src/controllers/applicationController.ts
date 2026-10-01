import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { applicationService } from '../services/applicationService';

export class ApplicationController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status, page, limit } = req.query;
      const result = await applicationService.listApplications(req.user!.id, {
        status: status as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined
      });

      res.json({
        success: true,
        data: result.items,
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const app = await applicationService.getApplicationById(req.params.id, req.user!.id);
      res.json({
        success: true,
        data: app
      });
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const created = await applicationService.createApplication(req.user!.id, req.body);
      res.status(201).json({
        success: true,
        data: created,
        message: 'Application recorded'
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = await applicationService.updateApplication(req.params.id, req.user!.id, req.body);
      res.json({
        success: true,
        data: updated,
        message: 'Application updated'
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await applicationService.deleteApplication(req.params.id, req.user!.id);
      res.json({
        success: true,
        data: null,
        message: 'Application removed'
      });
    } catch (err) {
      next(err);
    }
  }

  async metrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const metrics = await applicationService.getDashboardMetrics(req.user!.id);
      res.json({
        success: true,
        data: metrics
      });
    } catch (err) {
      next(err);
    }
  }
}

export const applicationController = new ApplicationController();
