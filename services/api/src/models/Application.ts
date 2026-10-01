import mongoose, { Schema, Document } from 'mongoose';
import { ApplicationStatus } from '@kraxyy/types';

export interface IApplicationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  jobTitle: string;
  company: string;
  jobUrl?: string;
  source: string;
  location?: string;
  salary?: string;
  appliedDate: Date;
  status: ApplicationStatus;
  notes?: string;
  resumeUsedId?: mongoose.Types.ObjectId;
  coverLetter?: string;
  timeline: Array<{
    id: string;
    status: ApplicationStatus;
    date: Date;
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationTimelineSchema = new Schema(
  {
    id: { type: String, required: true },
    status: {
      type: String,
      enum: ['SAVED', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'],
      required: true
    },
    date: { type: Date, default: Date.now },
    note: { type: String }
  },
  { _id: false }
);

const ApplicationSchema = new Schema<IApplicationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true
    },
    company: {
      type: String,
      required: true,
      trim: true
    },
    jobUrl: {
      type: String
    },
    source: {
      type: String,
      default: 'MANUAL',
      index: true
    },
    location: {
      type: String
    },
    salary: {
      type: String
    },
    appliedDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    status: {
      type: String,
      enum: ['SAVED', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'],
      default: 'APPLIED',
      index: true
    },
    notes: {
      type: String
    },
    resumeUsedId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume'
    },
    coverLetter: {
      type: String
    },
    timeline: [ApplicationTimelineSchema]
  },
  {
    timestamps: true
  }
);

// Compound index for user pipeline views
ApplicationSchema.index({ userId: 1, status: 1 });
ApplicationSchema.index({ userId: 1, appliedDate: -1 });

export const ApplicationModel = mongoose.model<IApplicationDocument>('Application', ApplicationSchema);
