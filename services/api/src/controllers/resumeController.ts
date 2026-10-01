import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { AuthenticatedRequest } from '../middleware/auth';
import { ResumeModel } from '../models/Resume';
import { storageProvider } from '../services/storage';
import { aiService } from '../services/aiService';
import { profileService } from '../services/profileService';
import { ApiError } from '../utils/apiError';
import { IResumeParsedDraft } from '@kraxyy/types';

export class ResumeController {
  constructor() {
    this.listResumes = this.listResumes.bind(this);
    this.getById = this.getById.bind(this);
    this.uploadResume = this.uploadResume.bind(this);
    this.reviewSuggestion = this.reviewSuggestion.bind(this);
    this.parseResume = this.parseResume.bind(this);
    this.setDefault = this.setDefault.bind(this);
    this.renameResume = this.renameResume.bind(this);
    this.deleteResume = this.deleteResume.bind(this);
    this.getNestedValue = this.getNestedValue.bind(this);
    this.setNestedValue = this.setNestedValue.bind(this);
  }

  async listResumes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const resumes = await ResumeModel.find({
        userId: new mongoose.Types.ObjectId(req.user!.id)
      }).sort({ isDefault: -1, createdAt: -1 });

      res.json({
        success: true,
        data: resumes.map((r) => ({
          id: r._id.toString(),
          userId: r.userId.toString(),
          filename: r.filename,
          originalName: r.originalName,
          fileUrl: r.fileUrl,
          fileSize: r.fileSize,
          mimeType: r.mimeType,
          isDefault: r.isDefault,
          parsedData: r.parsedData,
          parsedDraft: r.parsedDraft,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString()
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const resume = await ResumeModel.findOne({
        _id: req.params.id,
        userId: new mongoose.Types.ObjectId(req.user!.id)
      });
      if (!resume) throw ApiError.notFound('Resume not found');

      res.json({
        success: true,
        data: {
          id: resume._id.toString(),
          filename: resume.filename,
          originalName: resume.originalName,
          fileUrl: resume.fileUrl,
          fileSize: resume.fileSize,
          mimeType: resume.mimeType,
          isDefault: resume.isDefault,
          parsedData: resume.parsedData,
          parsedDraft: resume.parsedDraft,
          createdAt: resume.createdAt.toISOString(),
          updatedAt: resume.updatedAt.toISOString()
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async uploadResume(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw ApiError.badRequest('No resume file provided');
      }

      const allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      if (!allowedMimes.includes(req.file.mimetype)) {
        throw ApiError.badRequest('Only PDF and DOC/DOCX/TXT files are supported');
      }

      // 1. Upload to Cloudinary (or Local fallback)
      const uploaded = await storageProvider.saveFile(req.file);

      // 2. Extract text from the uploaded buffer (PDF, DOCX, or TXT)
      let extractedText = '';
      try {
        if (req.file.mimetype === 'application/pdf') {
          const parsePdf = (pdfParse as any).default || (pdfParse as any);
          const pdfData = await parsePdf(req.file.buffer);
          extractedText = pdfData.text || '';
        } else if (
          req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          req.file.mimetype === 'application/msword'
        ) {
          const mammothResult = await mammoth.extractRawText({ buffer: req.file.buffer });
          extractedText = mammothResult.value || '';
        } else {
          extractedText = req.file.buffer.toString('utf-8');
        }
      } catch (extractErr) {
        console.warn(`[Resume Pipeline] Text extraction warning: ${(extractErr as Error).message}`);
        extractedText = req.file.originalname;
      }

      console.log(`[Resume Pipeline] Resume uploaded`);
      console.log(`[Resume Pipeline] File type: ${req.file.mimetype}`);
      console.log(`[Resume Pipeline] Extracted characters: ${extractedText.trim().length}`);
      if (extractedText.trim().length === 0) {
        console.warn(`[Resume Pipeline] Extracted characters: 0. PDF/DOCX parser could not extract text from buffer.`);
      }

      // 3. AI / Grok Structured Extraction & Grounding Facts
      const suggestedData = await aiService.parseResume(extractedText);
      const candidateFacts = (suggestedData as any).facts || [];

      const parsedDraft: IResumeParsedDraft = {
        resumeId: '',
        parserVersion: 'v2.0.0-grok',
        parsedAt: new Date().toISOString(),
        status: 'APPLIED',
        extractedTextLength: extractedText.length,
        suggestedData
      };

      const existingCount = await ResumeModel.countDocuments({
        userId: new mongoose.Types.ObjectId(req.user!.id)
      });

      // 4. Save Resume document with extracted text and candidate facts
      const resume = await ResumeModel.create({
        userId: new mongoose.Types.ObjectId(req.user!.id),
        filename: uploaded.filename,
        originalName: uploaded.originalName,
        fileUrl: uploaded.fileUrl,
        fileSize: uploaded.fileSize,
        mimeType: uploaded.mimeType,
        isDefault: existingCount === 0,
        extractedText,
        candidateFacts,
        parsedData: {
          skills: suggestedData.skills || [],
          suggestedTitle: suggestedData.professional?.currentTitle,
          summarySnippet: suggestedData.summary
        },
        parsedDraft
      });

      // Update resumeId in draft
      parsedDraft.resumeId = resume._id.toString();
      resume.parsedDraft = parsedDraft;
      await resume.save();

      // 5. Automatically populate Candidate Profile (Resume as primary source of truth)
      console.log(`[Resume Pipeline] Updating profile...`);
      const updatedProfile = await profileService.updateProfileFromResume(req.user!.id, suggestedData, candidateFacts);
      console.log(`[Resume Pipeline] Profile updated successfully. Completion: ${updatedProfile.completionPercentage}%`);

      res.status(201).json({
        success: true,
        profileGenerated: true,
        resumeId: resume._id.toString(),
        profileId: updatedProfile.id || (updatedProfile as any)._id?.toString(),
        data: {
          id: resume._id.toString(),
          filename: resume.filename,
          originalName: resume.originalName,
          fileUrl: resume.fileUrl,
          fileSize: resume.fileSize,
          mimeType: resume.mimeType,
          isDefault: resume.isDefault,
          parsedData: resume.parsedData,
          parsedDraft: resume.parsedDraft,
          candidateFacts: resume.candidateFacts,
          createdAt: resume.createdAt.toISOString(),
          resume: {
            id: resume._id.toString(),
            filename: resume.filename,
            originalName: resume.originalName,
            fileUrl: resume.fileUrl,
            fileSize: resume.fileSize,
            mimeType: resume.mimeType,
            isDefault: resume.isDefault,
            parsedData: resume.parsedData,
            parsedDraft: resume.parsedDraft,
            createdAt: resume.createdAt.toISOString()
          },
          profile: updatedProfile
        },
        message: 'Resume uploaded and profile generated successfully'
      });
    } catch (err) {
      console.error(`[Resume Pipeline] Error during resume upload or profile generation: ${(err as Error).message}`);
      next(err);
    }
  }

  /**
   * User reviews a parsed field suggestion (Accept, Edit, Ignore)
   */
  async reviewSuggestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { action, field, editedValue } = req.body;

      const resume = await ResumeModel.findOne({
        _id: id,
        userId: new mongoose.Types.ObjectId(req.user!.id)
      });
      if (!resume || !resume.parsedDraft) {
        throw ApiError.notFound('Resume or parsed draft not found');
      }

      if (action === 'ACCEPT' || action === 'EDIT') {
        let valueToApply = action === 'EDIT' ? editedValue : this.getNestedValue(resume.parsedDraft.suggestedData, field);
        if (valueToApply === undefined && field === 'professional.skills' && (resume.parsedDraft.suggestedData as any).skills) {
          valueToApply = (resume.parsedDraft.suggestedData as any).skills;
        }
        if (valueToApply !== undefined) {
          const profileUpdate: Record<string, any> = {};
          this.setNestedValue(profileUpdate, field, valueToApply);
          await profileService.updateProfile(req.user!.id, profileUpdate);
        }
      }

      resume.markModified('parsedDraft');
      await resume.save();

      res.json({
        success: true,
        data: { reviewed: true, field, action },
        message: `Suggestion for ${field} successfully processed (${action})`
      });
    } catch (err) {
      next(err);
    }
  }

  async parseResume(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const resume = await ResumeModel.findOne({
        _id: req.params.id,
        userId: new mongoose.Types.ObjectId(req.user!.id)
      });
      if (!resume) throw ApiError.notFound('Resume not found');

      // Re-trigger parsing
      const suggestedData = await aiService.parseResume(resume.originalName);
      resume.parsedDraft = {
        resumeId: resume._id.toString(),
        parserVersion: 'v1.0.0',
        parsedAt: new Date().toISOString(),
        status: 'PENDING_REVIEW',
        extractedTextLength: 100,
        suggestedData
      };
      await resume.save();

      res.json({
        success: true,
        data: resume.parsedDraft,
        message: 'Resume re-parsed successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async setDefault(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userObjectId = new mongoose.Types.ObjectId(req.user!.id);
      await ResumeModel.updateMany({ userId: userObjectId }, { isDefault: false });

      const updated = await ResumeModel.findOneAndUpdate(
        { _id: req.params.id, userId: userObjectId },
        { isDefault: true },
        { new: true }
      );

      if (!updated) throw ApiError.notFound('Resume not found');

      res.json({
        success: true,
        data: updated,
        message: 'Default resume updated'
      });
    } catch (err) {
      next(err);
    }
  }

  async renameResume(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      if (!name) throw ApiError.badRequest('New resume name is required');

      const resume = await ResumeModel.findOneAndUpdate(
        { _id: req.params.id, userId: new mongoose.Types.ObjectId(req.user!.id) },
        { originalName: name },
        { new: true }
      );

      if (!resume) throw ApiError.notFound('Resume not found');

      res.json({
        success: true,
        data: resume,
        message: 'Resume renamed successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteResume(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const resume = await ResumeModel.findOne({
        _id: req.params.id,
        userId: new mongoose.Types.ObjectId(req.user!.id)
      });

      if (!resume) throw ApiError.notFound('Resume not found');

      await storageProvider.deleteFile(resume.filename);
      await ResumeModel.deleteOne({ _id: resume._id });

      // Recalculate profile completion after deleting resume
      await profileService.getProfileByUserId(req.user!.id);

      res.json({
        success: true,
        data: null,
        message: 'Resume deleted successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
}

export const resumeController = new ResumeController();
