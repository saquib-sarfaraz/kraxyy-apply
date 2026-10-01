import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { setRefreshTokenCookie, clearRefreshTokenCookie } from '../utils/tokens';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserModel } from '../models/User';
import { ApiError } from '../utils/apiError';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const result = await authService.register(req.body, ip);
      setRefreshTokenCookie(res, result.refreshToken);

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken
        },
        message: 'Registration successful'
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const result = await authService.login(req.body, ip);
      setRefreshTokenCookie(res, result.refreshToken);

      res.json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken
        },
        message: 'Login successful'
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      clearRefreshTokenCookie(res);
      res.json({
        success: true,
        data: null,
        message: 'Logged out successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.kraxyy_refresh_token || req.body?.refreshToken;
      if (!token) {
        throw ApiError.unauthorized('Refresh token is required');
      }

      const result = await authService.refresh(token);
      setRefreshTokenCookie(res, result.refreshToken);

      res.json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserModel.findById(req.user!.id);
      if (!user) throw ApiError.notFound('User not found');

      res.json({
        success: true,
        data: authService.formatUser(user)
      });
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.forgotPassword(req.body.email);
      res.json({
        success: true,
        data: null,
        message: "If an account exists with this email, we've sent you a password reset link."
      });
    } catch (err) {
      next(err);
    }
  }

  async verifyResetToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = (req.query.token as string) || req.body?.token;
      await authService.verifyResetToken(token);
      res.json({
        success: true,
        data: { valid: true },
        message: 'Password reset token is valid'
      });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const password = req.body.password || req.body.newPassword;
      await authService.resetPassword(req.body.token, password, ip);
      res.json({
        success: true,
        data: null,
        message: 'Password reset successfully'
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
