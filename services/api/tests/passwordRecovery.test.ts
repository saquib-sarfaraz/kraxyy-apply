import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { authService } from '../src/services/authService';
import { emailService, IEmailProvider } from '../src/services/email';
import { UserModel } from '../src/models/User';
import { PasswordResetTokenModel } from '../src/models/PasswordResetToken';
import { forgotPasswordSchema, resetPasswordSchema } from '@kraxyy/validation';

describe('Password Recovery System', () => {
  let mongoServer: MongoMemoryServer;
  let sentEmails: Array<{ to: string; subject: string; html: string; text?: string }> = [];

  const mockEmailProvider: IEmailProvider = {
    async sendEmail(options) {
      sentEmails.push(options);
      return true;
    }
  };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    emailService.setProvider(mockEmailProvider);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    sentEmails = [];
    await UserModel.deleteMany({});
    await PasswordResetTokenModel.deleteMany({});
  });

  describe('Validation Schemas', () => {
    it('validates forgotPasswordSchema with valid and invalid emails', () => {
      expect(forgotPasswordSchema.safeParse({ email: 'valid@example.com' }).success).toBe(true);
      expect(forgotPasswordSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
      expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false);
    });

    it('validates resetPasswordSchema with both password and newPassword fields', () => {
      const validWithPassword = {
        token: 'sample-token-123',
        password: 'NewStrongPassword123!'
      };
      expect(resetPasswordSchema.safeParse(validWithPassword).success).toBe(true);

      const validWithNewPassword = {
        token: 'sample-token-123',
        newPassword: 'NewStrongPassword123!'
      };
      expect(resetPasswordSchema.safeParse(validWithNewPassword).success).toBe(true);

      const invalidWeakPassword = {
        token: 'sample-token-123',
        password: 'weak'
      };
      expect(resetPasswordSchema.safeParse(invalidWeakPassword).success).toBe(false);

      const missingToken = {
        token: '',
        password: 'NewStrongPassword123!'
      };
      expect(resetPasswordSchema.safeParse(missingToken).success).toBe(false);
    });
  });

  describe('Forgot Password Flow', () => {
    it('generates secure hashed token and sends email for registered user', async () => {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('OldPassword123!', salt);
      const user = await UserModel.create({
        email: 'candidate@kraxyy.com',
        passwordHash,
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'USER',
        status: 'ACTIVE'
      });

      const result = await authService.forgotPassword('candidate@kraxyy.com');
      expect(result).toBe(true);

      // Verify email was dispatched
      expect(sentEmails.length).toBe(1);
      expect(sentEmails[0].to).toBe('candidate@kraxyy.com');
      expect(sentEmails[0].subject).toBe('Reset your password');

      // Verify token in DB is hashed and NOT raw
      const tokenDoc = await PasswordResetTokenModel.findOne({ userId: user._id });
      expect(tokenDoc).not.toBeNull();
      expect(tokenDoc?.used).toBe(false);

      // Extract raw token from reset URL in email
      const match = sentEmails[0].text?.match(/token=([a-f0-9]+)/);
      expect(match).toBeTruthy();
      const rawToken = match![1];

      // Raw token must NOT match stored tokenHash
      expect(tokenDoc?.tokenHash).not.toBe(rawToken);

      // Stored tokenHash must equal sha256(rawToken)
      const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      expect(tokenDoc?.tokenHash).toBe(expectedHash);

      // Token expiration should be approximately 15 minutes
      const diffMinutes = (tokenDoc!.expiresAt.getTime() - Date.now()) / (1000 * 60);
      expect(diffMinutes).toBeGreaterThan(13);
      expect(diffMinutes).toBeLessThanOrEqual(16);
    });

    it('returns generic response for non-existent email without sending email (anti-enumeration)', async () => {
      const result = await authService.forgotPassword('nobody@kraxyy.com');
      expect(result).toBe(true);
      expect(sentEmails.length).toBe(0);

      const tokenDocs = await PasswordResetTokenModel.find({});
      expect(tokenDocs.length).toBe(0);
    });

    it('invalidates prior reset tokens when user requests a new reset', async () => {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('OldPassword123!', salt);
      const user = await UserModel.create({
        email: 'user@kraxyy.com',
        passwordHash,
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        status: 'ACTIVE'
      });

      // First request
      await authService.forgotPassword('user@kraxyy.com');
      const firstTokens = await PasswordResetTokenModel.find({ userId: user._id });
      expect(firstTokens.length).toBe(1);

      // Second request
      await authService.forgotPassword('user@kraxyy.com');
      const secondTokens = await PasswordResetTokenModel.find({ userId: user._id });
      expect(secondTokens.length).toBe(1);
      expect(secondTokens[0]._id.toString()).not.toBe(firstTokens[0]._id.toString());
    });

    it('gracefully handles email provider failures without crashing', async () => {
      const failingProvider: IEmailProvider = {
        async sendEmail() {
          throw new Error('Resend API network timeout');
        }
      };
      emailService.setProvider(failingProvider);

      const salt = await bcrypt.genSalt(10);
      await UserModel.create({
        email: 'error-test@kraxyy.com',
        passwordHash: await bcrypt.hash('OldPassword123!', salt),
        firstName: 'Err',
        lastName: 'Test',
        role: 'USER',
        status: 'ACTIVE'
      });

      // Must not throw unhandled exception
      const result = await authService.forgotPassword('error-test@kraxyy.com');
      expect(result).toBe(true);

      // Restore working provider
      emailService.setProvider(mockEmailProvider);
    });
  });

  describe('Token Verification & Reset Flow', () => {
    it('verifies valid token successfully', async () => {
      const salt = await bcrypt.genSalt(10);
      const user = await UserModel.create({
        email: 'alex@kraxyy.com',
        passwordHash: await bcrypt.hash('CurrentPass123!', salt),
        firstName: 'Alex',
        lastName: 'Smith',
        role: 'USER',
        status: 'ACTIVE'
      });

      await authService.forgotPassword('alex@kraxyy.com');
      const match = sentEmails[0].text?.match(/token=([a-f0-9]+)/);
      const rawToken = match![1];

      const isValid = await authService.verifyResetToken(rawToken);
      expect(isValid).toBe(true);
    });

    it('rejects invalid or tampered tokens', async () => {
      await expect(authService.verifyResetToken('tampered-token-123')).rejects.toThrow(
        /invalid or has expired/i
      );
    });

    it('rejects expired tokens', async () => {
      const user = await UserModel.create({
        email: 'expired@kraxyy.com',
        passwordHash: 'dummy',
        firstName: 'Expired',
        lastName: 'User',
        role: 'USER',
        status: 'ACTIVE'
      });

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Created in the past (already expired)
      await PasswordResetTokenModel.create({
        userId: user._id,
        tokenHash,
        expiresAt: new Date(Date.now() - 60000), // 1 min ago
        used: false
      });

      await expect(authService.verifyResetToken(rawToken)).rejects.toThrow(/invalid or has expired/i);
      await expect(
        authService.resetPassword(rawToken, 'BrandNewPass123!', '127.0.0.1')
      ).rejects.toThrow(/invalid or has expired/i);
    });

    it('successfully resets password, invalidates token, and verifies new password works', async () => {
      const initialPassword = 'InitialPassword123!';
      const newPassword = 'NewlyChangedPassword123!';

      const salt = await bcrypt.genSalt(10);
      const user = await UserModel.create({
        email: 'success@kraxyy.com',
        passwordHash: await bcrypt.hash(initialPassword, salt),
        firstName: 'Success',
        lastName: 'User',
        role: 'USER',
        status: 'ACTIVE'
      });

      // Request reset
      await authService.forgotPassword('success@kraxyy.com');
      const match = sentEmails[0].text?.match(/token=([a-f0-9]+)/);
      const rawToken = match![1];

      // Reset password with raw token
      const resetResult = await authService.resetPassword(rawToken, newPassword, '127.0.0.1');
      expect(resetResult).toBe(true);

      // Verify token is now marked used
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const tokenDoc = await PasswordResetTokenModel.findOne({ tokenHash });
      expect(tokenDoc?.used).toBe(true);
      expect(tokenDoc?.usedAt).toBeInstanceOf(Date);

      // Old password should NOT work anymore
      await expect(
        authService.login({ email: 'success@kraxyy.com', password: initialPassword }, '127.0.0.1')
      ).rejects.toThrow(/invalid email or password/i);

      // New password MUST work
      const loginResult = await authService.login(
        { email: 'success@kraxyy.com', password: newPassword },
        '127.0.0.1'
      );
      expect(loginResult.user.email).toBe('success@kraxyy.com');
      expect(loginResult.accessToken).toBeDefined();

      // Attempting to reuse the same token MUST fail
      await expect(
        authService.resetPassword(rawToken, 'AnotherPassword123!', '127.0.0.1')
      ).rejects.toThrow(/invalid or has expired/i);
    });
  });
});
