import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { UserModel, IUserDocument } from '../models/User';
import { ProfileModel } from '../models/Profile';
import { AuditLogModel } from '../models/AuditLog';
import { PasswordResetTokenModel } from '../models/PasswordResetToken';
import { ApiError } from '../utils/apiError';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokens';
import { emailService } from './email';
import { logger } from '../utils/logger';

export class AuthService {
  async register(data: { email: string; password: string; firstName: string; lastName: string }, ip: string) {
    const existing = await UserModel.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw ApiError.conflict('An account with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);
    const verificationToken = uuidv4();

    const user = await UserModel.create({
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      verificationToken,
      isVerified: true // auto-verify in initial release, can require link in prod
    });

    // Initialize user profile
    await ProfileModel.create({
      userId: user._id,
      personal: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: '',
        country: '',
        city: ''
      },
      professional: {
        skills: []
      },
      completionPercentage: 15
    });

    await AuditLogModel.create({
      userId: user._id,
      userEmail: user.email,
      action: 'USER_REGISTER',
      category: 'AUTH',
      ipAddress: ip
    });

    const tokenPayload = { userId: user._id.toString(), email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: this.formatUser(user),
      accessToken,
      refreshToken
    };
  }

  async login(data: { email: string; password: string }, ip: string) {
    const user = await UserModel.findOne({ email: data.email.toLowerCase() });
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw ApiError.forbidden('Your account is currently suspended or inactive');
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    user.lastLoginAt = new Date();
    await user.save();

    await AuditLogModel.create({
      userId: user._id,
      userEmail: user.email,
      action: 'USER_LOGIN',
      category: 'AUTH',
      ipAddress: ip
    });

    const tokenPayload = { userId: user._id.toString(), email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: this.formatUser(user),
      accessToken,
      refreshToken
    };
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await UserModel.findById(decoded.userId);
      if (!user || user.status !== 'ACTIVE') {
        throw ApiError.unauthorized('User not found or inactive');
      }

      const tokenPayload = { userId: user._id.toString(), email: user.email, role: user.role };
      const newAccessToken = generateAccessToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: this.formatUser(user)
      };
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }
  }

  async forgotPassword(email: string): Promise<boolean> {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const user = await UserModel.findOne({ email: normalizedEmail });

    // Always return generic success to prevent account enumeration
    if (!user || user.status !== 'ACTIVE') {
      logger.info(`[AUTH] Password reset requested for non-existing or inactive email: ${normalizedEmail}`);
      return true;
    }

    try {
      // Invalidate any existing unused reset tokens for this user
      await PasswordResetTokenModel.deleteMany({ userId: user._id });

      // Generate cryptographically secure 32-byte (64 hex chars) token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

      await PasswordResetTokenModel.create({
        userId: user._id,
        tokenHash,
        expiresAt,
        used: false
      });

      // Dispatch reset email with raw token
      await emailService.sendPasswordResetEmail(user.email, rawToken);

      await AuditLogModel.create({
        userId: user._id,
        userEmail: user.email,
        action: 'PASSWORD_RESET_REQUESTED',
        category: 'SECURITY',
        ipAddress: 'auth-service'
      });
    } catch (err) {
      // Log safely without leaking credentials or tokens
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`[AUTH] Failed to process password reset request: ${msg}`);
    }

    return true;
  }

  async verifyResetToken(rawToken: string): Promise<boolean> {
    if (!rawToken || typeof rawToken !== 'string') {
      throw ApiError.badRequest('Password reset token is invalid or has expired');
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
    const tokenDoc = await PasswordResetTokenModel.findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!tokenDoc) {
      throw ApiError.badRequest('Password reset token is invalid or has expired');
    }

    return true;
  }

  async resetPassword(rawToken: string, newPass: string, ip: string): Promise<boolean> {
    if (!rawToken || typeof rawToken !== 'string') {
      throw ApiError.badRequest('Password reset token is invalid or has expired');
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');

    const tokenDoc = await PasswordResetTokenModel.findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!tokenDoc) {
      throw ApiError.badRequest('Password reset token is invalid or has expired');
    }

    const user = await UserModel.findById(tokenDoc.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw ApiError.badRequest('Password reset token is invalid or has expired');
    }

    // Hash the new password using the application's existing password hashing strategy (bcrypt)
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPass, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Invalidate/mark current token as used
    tokenDoc.used = true;
    tokenDoc.usedAt = new Date();
    await tokenDoc.save();

    // Invalidate any other active reset tokens for that user
    await PasswordResetTokenModel.deleteMany({
      userId: user._id,
      _id: { $ne: tokenDoc._id }
    });

    await AuditLogModel.create({
      userId: user._id,
      userEmail: user.email,
      action: 'PASSWORD_RESET',
      category: 'SECURITY',
      ipAddress: ip
    });

    return true;
  }

  formatUser(user: IUserDocument) {
    const isAuthorized = user.email.toLowerCase() === 'saquibsarfaraz47@gmail.com';
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isAdminAuthorized: isAuthorized,
      isVerified: user.isVerified,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }
}

export const authService = new AuthService();
