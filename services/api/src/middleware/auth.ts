import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, verifyExtensionToken, JwtPayload } from '../utils/tokens';
import { ApiError } from '../utils/apiError';
import { UserModel } from '../models/User';
import { UserRole } from '@kraxyy/types';
import { extensionService } from '../services/extensionService';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
  isExtension?: boolean;
}

export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const extensionToken = req.headers['x-extension-token'] as string | undefined;

  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (extensionToken) {
    try {
      const decodedExt = verifyExtensionToken(extensionToken);
      const isSessionActive = await extensionService.validateActiveSession(extensionToken);
      if (!isSessionActive) {
        return next(ApiError.unauthorized('Extension session has been revoked or expired'));
      }

      const user = await UserModel.findById(decodedExt.userId);
      if (!user || user.status !== 'ACTIVE') {
        throw ApiError.unauthorized('Invalid or inactive user account');
      }
      req.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role
      };
      req.isExtension = true;
      return next();
    } catch {
      return next(ApiError.unauthorized('Invalid or revoked extension token'));
    }
  }

  if (!token) {
    return next(ApiError.unauthorized('Authentication token is required'));
  }

  try {
    const payload = verifyAccessToken(token) as JwtPayload;
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role
    };
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}
