import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { adminService } from '../services/adminService';
import mongoose from 'mongoose';

export class AdminController {
  async getMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const metrics = await adminService.getMetrics();
      res.json({
        success: true,
        data: metrics
      });
    } catch (err) {
      next(err);
    }
  }

  async listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { search, status, role, page, limit } = req.query;
      const result = await adminService.listUsers({
        search: search as string,
        status: status as string,
        role: role as string,
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

  async updateUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      await adminService.updateUserStatus(req.params.id, status, req.user!.email);
      res.json({
        success: true,
        data: null,
        message: `User status updated to ${status}`
      });
    } catch (err) {
      next(err);
    }
  }

  async listAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { category, page, limit } = req.query;
      const result = await adminService.listAuditLogs({
        category: category as string,
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

  async systemHealth(req: AuthenticatedRequest, res: Response) {
    const dbState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    res.json({
      success: true,
      data: {
        status: 'healthy',
        database: states[dbState] || 'unknown',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        version: '1.0.0'
      }
    });
  }
}

export const adminController = new AdminController();
