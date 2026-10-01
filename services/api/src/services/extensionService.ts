import mongoose from 'mongoose';
import crypto from 'crypto';
import { ExtensionSessionModel } from '../models/ExtensionSession';
import { AuditLogModel } from '../models/AuditLog';
import { UserModel } from '../models/User';
import { ResumeModel } from '../models/Resume';
import { ProfileModel } from '../models/Profile';
import { ApiError } from '../utils/apiError';
import { generateExtensionToken } from '../utils/tokens';
import { profileService } from './profileService';
import { IAutofillTelemetry, IPairCodeResponse, INormalizedJob } from '@kraxyy/types';
import { JobMatchingEngine } from '@kraxyy/matching';

export class ExtensionService {
  /**
   * Generates an 8-character pairing code (e.g. AB7X-92KP) expiring in 5 minutes
   */
  async generatePairCode(userId: string): Promise<IPairCodeResponse> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit easily confused chars (I, O, 1, 0)
    let raw = '';
    const bytes = crypto.randomBytes(8);
    for (let i = 0; i < 8; i++) {
      raw += chars[bytes[i] % chars.length];
    }
    const pairCode = `${raw.slice(0, 4)}-${raw.slice(4)}`; // AB7X-92KP
    const expiresInSeconds = 300; // 5 minutes strictly
    const expires = new Date(Date.now() + expiresInSeconds * 1000);

    // Clean up any stale unredeemed pairing codes for this user
    await ExtensionSessionModel.deleteMany({
      userId: new mongoose.Types.ObjectId(userId),
      isActive: false
    });

    await ExtensionSessionModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      sessionToken: `pending-${pairCode}`,
      pairCode: pairCode.replace('-', ''), // store normalized
      pairCodeExpires: expires,
      isActive: false
    });

    return {
      pairCode,
      expiresAt: expires.toISOString(),
      expiresInSeconds
    };
  }

  /**
   * Extension submits the pairing code to authenticate
   */
  async verifyPairCode(
    rawCode: string,
    deviceInfo: { browser?: string; version?: string; ip: string }
  ) {
    const normalizedCode = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    const session = await ExtensionSessionModel.findOne({
      pairCode: normalizedCode,
      pairCodeExpires: { $gt: new Date() },
      isActive: false
    });

    if (!session) {
      throw ApiError.badRequest('Invalid or expired 5-minute pairing code');
    }

    const user = await UserModel.findById(session.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw ApiError.unauthorized('User account not found or inactive');
    }

    const sessionToken = generateExtensionToken(user._id.toString(), user.email);
    const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000; // Exact 7-day session lifetime
    const expiresAt = new Date(Date.now() + sessionLifetimeMs);

    // Immediately invalidate pairing code to prevent reuse
    session.sessionToken = sessionToken;
    session.pairCode = undefined;
    session.pairCodeExpires = undefined;
    session.expiresAt = expiresAt;
    session.browser = deviceInfo.browser || 'Chrome';
    session.extensionVersion = deviceInfo.version || '1.0.0';
    session.ipAddress = deviceInfo.ip;
    session.isActive = true;
    session.lastActive = new Date();
    await session.save();

    await AuditLogModel.create({
      userId: user._id,
      userEmail: user.email,
      action: 'EXTENSION_PAIRED',
      category: 'EXTENSION',
      ipAddress: deviceInfo.ip,
      metadata: { browser: session.browser, version: session.extensionVersion, expiresAt: expiresAt.toISOString() }
    });

    return {
      sessionToken,
      expiresAt: expiresAt.toISOString(),
      expiresInDays: 7,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    };
  }

  /**
   * Validate that an extension session is actively registered in MongoDB
   * and within its 7-day lifetime. Automatically renews session if active.
   */
  async validateActiveSession(token: string): Promise<boolean> {
    const session = await ExtensionSessionModel.findOne({
      sessionToken: token,
      isActive: true
    });

    if (!session) return false;

    const now = Date.now();

    // Check if session has expired beyond its 7-day lifetime
    if (session.expiresAt && session.expiresAt.getTime() <= now) {
      session.isActive = false;
      await session.save();
      return false;
    }

    // Heartbeat & Automatic Renewal:
    // If active and within 3 days of expiry, extend session by another 7 days!
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    session.lastActive = new Date();

    if (session.expiresAt && session.expiresAt.getTime() - now < threeDaysMs) {
      session.expiresAt = new Date(now + sevenDaysMs);
    } else if (!session.expiresAt) {
      session.expiresAt = new Date(now + sevenDaysMs);
    }

    await session.save();
    return true;
  }

  async getProfileForExtension(userId: string) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const [user, resume, profile, autofillDict] = await Promise.all([
      UserModel.findById(userObjectId),
      ResumeModel.findOne({ userId: userObjectId }).sort({ isDefault: -1, createdAt: -1 }),
      ProfileModel.findOne({ userId: userObjectId }),
      profileService.getAutofillPayload(userId)
    ]);

    const fullName = user
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Saquib Sarfaraz'
      : 'Saquib Sarfaraz';

    const resumeTitle = resume?.parsedData?.suggestedTitle
      || profile?.professional?.currentTitle
      || resume?.originalName?.replace(/\.[^/.]+$/, '')
      || 'Software Engineer';

    return {
      user: {
        id: userId,
        name: fullName,
        email: user?.email || '',
        firstName: user?.firstName || 'Saquib',
        lastName: user?.lastName || 'Sarfaraz'
      },
      resume: {
        exists: Boolean(resume),
        title: resumeTitle,
        filename: resume?.originalName || 'Software_Engineer_Resume.pdf',
        skillsCount: resume?.parsedData?.skills?.length || (profile?.professional?.skills?.length || 0)
      },
      profileStatus: {
        hasProfile: Boolean(profile),
        hasResume: Boolean(resume),
        completionPercentage: profile?.completionPercentage || 85
      },
      dictionary: autofillDict,
      // Spread autofill dictionary keys directly for full backwards compatibility
      ...autofillDict
    };
  }

  /**
   * Match an extracted job description directly with the authenticated user's profile and resume
   */
  async matchJobWithCandidate(userId: string, jobData: Partial<INormalizedJob> & { [key: string]: any }) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const [profile, resume] = await Promise.all([
      profileService.getProfileByUserId(userId),
      ResumeModel.findOne({ userId: userObjectId }).sort({ isDefault: -1, createdAt: -1 })
    ]);

    // Enrich candidate skills with parsed resume skills if available
    if (resume?.parsedData?.skills && resume.parsedData.skills.length > 0) {
      const existing = new Set((profile.professional?.skills || []).map((s) => s.toLowerCase()));
      for (const sk of resume.parsedData.skills) {
        if (!existing.has(sk.toLowerCase())) {
          profile.professional = profile.professional || {
            currentTitle: '',
            summary: '',
            skills: [],
            yearsOfExperience: 3,
            remotePreference: 'FLEXIBLE',
            salaryExpectations: { currency: 'USD', period: 'YEARLY' }
          };
          profile.professional.skills.push(sk);
          existing.add(sk.toLowerCase());
        }
      }
    }

    const normalizedJob: INormalizedJob = {
      id: jobData.id || `ext-${Date.now()}`,
      title: jobData.title || 'Software Engineer',
      company: jobData.company || 'Technology Company',
      description: jobData.description || '',
      location: jobData.location || 'Remote',
      remote: Boolean(jobData.remote ?? true),
      skills: Array.isArray(jobData.skills) ? jobData.skills : [],
      requirements: Array.isArray(jobData.requirements)
        ? jobData.requirements
        : (jobData.requirements ? [String(jobData.requirements)] : []),
      experienceLevel: jobData.experienceLevel || 'MID',
      sourceUrl: jobData.sourceUrl || '',
      applyUrl: jobData.applyUrl || ''
    };

    const engine = new JobMatchingEngine();
    const match = engine.calculateMatch(profile, normalizedJob);

    // Qualitative ratings for display
    const experienceRating = match.experienceScore >= 75 ? 'Good' : match.experienceScore >= 50 ? 'Moderate' : 'Needs More';
    const educationRating = match.educationScore >= 70 ? 'Good' : 'Acceptable';

    return {
      match,
      overallScore: match.overallScore,
      matchedSkills: match.matchedSkills,
      missingSkills: match.missingSkills,
      experienceMatch: experienceRating,
      educationMatch: educationRating,
      job: normalizedJob,
      candidate: {
        name: `${profile.personal.firstName} ${profile.personal.lastName}`.trim() || 'Candidate',
        resumeTitle: resume?.parsedData?.suggestedTitle || profile.professional?.currentTitle || 'Software Engineer'
      }
    };
  }

  async recordTelemetry(userId: string | undefined, telemetry: IAutofillTelemetry) {
    await AuditLogModel.create({
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      action: 'AUTOFILL_TELEMETRY',
      category: 'EXTENSION',
      ipAddress: 'extension-client',
      metadata: {
        domain: telemetry.domain,
        adapterName: telemetry.adapterName,
        fieldsDetected: telemetry.fieldsDetectedCount,
        fieldsFilled: telemetry.fieldsFilledCount,
        fieldsReviewed: telemetry.fieldsReviewedCount,
        confidence: telemetry.formDetectedConfidence,
        durationMs: telemetry.durationMs
      }
    });

    return { recorded: true };
  }

  async listUserSessions(userId: string) {
    const sessions = await ExtensionSessionModel.find({
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true
    }).sort({ lastActive: -1 });

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    return sessions.map((s) => ({
      id: s._id.toString(),
      browser: s.browser || 'Chrome Browser',
      extensionVersion: s.extensionVersion || '1.0.0',
      ipAddress: s.ipAddress || '127.0.0.1',
      lastActive: s.lastActive ? s.lastActive.toISOString() : s.createdAt.toISOString(),
      expiresAt: s.expiresAt ? s.expiresAt.toISOString() : new Date(s.createdAt.getTime() + sevenDaysMs).toISOString(),
      createdAt: s.createdAt.toISOString()
    }));
  }

  async revokeSession(id: string, userId: string): Promise<boolean> {
    const result = await ExtensionSessionModel.deleteOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId)
    });

    await AuditLogModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      action: 'EXTENSION_SESSION_REVOKED',
      category: 'EXTENSION',
      ipAddress: 'web-client',
      metadata: { sessionId: id }
    });

    return result.deletedCount > 0;
  }
}

export const extensionService = new ExtensionService();
