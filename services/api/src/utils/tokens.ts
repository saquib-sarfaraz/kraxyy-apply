import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { UserRole } from '@kraxyy/types';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

const JWT_SECRET = process.env.JWT_SECRET || 'kraxyy_jwt_secret_dev_fallback_32_chars';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'kraxyy_refresh_secret_dev_fallback_32_chars';
const EXTENSION_SECRET = process.env.EXTENSION_SECRET || 'kraxyy_extension_secret_dev_fallback';

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']) || '15m'
  });
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn']) || '7d'
  });
}

export function generateExtensionToken(userId: string, email: string): string {
  return jwt.sign({ userId, email, isExtension: true }, EXTENSION_SECRET, {
    expiresIn: '90d'
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
}

export function verifyExtensionToken(token: string): { userId: string; email: string; isExtension: boolean } {
  return jwt.verify(token, EXTENSION_SECRET) as { userId: string; email: string; isExtension: boolean };
}

export function setRefreshTokenCookie(res: Response, token: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('kraxyy_refresh_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/v1/auth'
  });
}

export function clearRefreshTokenCookie(res: Response) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('kraxyy_refresh_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/api/v1/auth'
  });
}
