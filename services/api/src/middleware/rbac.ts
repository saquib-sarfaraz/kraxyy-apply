import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { ApiError } from '../utils/apiError';
import { UserRole } from '@kraxyy/types';

export const PRIMARY_ADMIN_EMAIL = 'saquibsarfaraz47@gmail.com';

export function isAuthorizedAdmin(user?: { email?: string; role?: UserRole }): boolean {
  if (!user || !user.email) return false;
  const emailLower = user.email.toLowerCase().trim();
  return emailLower === PRIMARY_ADMIN_EMAIL.toLowerCase() && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to access this resource'));
    }

    next();
  };
}

export function requireAdmin() {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!isAuthorizedAdmin(req.user)) {
      return next(ApiError.forbidden('Access denied. Administrator privileges restricted to authorized account.'));
    }

    next();
  };
}
