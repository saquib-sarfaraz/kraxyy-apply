import mongoose, { Schema, Document } from 'mongoose';
import { IResumeParsedDraft, ICandidateFact } from '@kraxyy/types';

export interface IResumeDocument extends Document {
  userId: mongoose.Types.ObjectId;
  filename: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  isDefault: boolean;
  extractedText?: string;
  candidateFacts?: ICandidateFact[];
  parsedData?: {
    skills?: string[];
    suggestedTitle?: string;
    summarySnippet?: string;
  };
  parsedDraft?: IResumeParsedDraft;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateFactSchema = new Schema(
  {
    id: { type: String, default: () => `fact-${Date.now()}-${Math.random().toString(36).substr(2, 6)}` },
    category: {
      type: String,
      default: 'EXPERIENCE'
    },
    fact: { type: String, required: true },
    confidence: { type: String, default: 'explicit' },
    sourceSection: { type: String },
    dateRange: { type: String },
    technologies: [{ type: String }]
  },
  { _id: false }
);

const ResumeSchema = new Schema<IResumeDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true
    },
    extractedText: {
      type: String
    },
    candidateFacts: [CandidateFactSchema],
    parsedData: {
      skills: [{ type: String }],
      suggestedTitle: { type: String },
      summarySnippet: { type: String }
    },
    parsedDraft: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

export const ResumeModel = mongoose.model<IResumeDocument>('Resume', ResumeSchema);
