import mongoose, { Schema, Document } from 'mongoose';

export interface IJobDocument extends Document {
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  remoteType: 'REMOTE' | 'HYBRID' | 'ONSITE';
  jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  experienceLevel: 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';
  salary?: {
    min?: number;
    max?: number;
    currency: string;
    period: 'YEARLY' | 'HOURLY';
  };
  description: string;
  skills: string[];
  source: string;
  externalId?: string;
  applyUrl: string;
  postedDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJobDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    company: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    companyLogo: {
      type: String
    },
    location: {
      type: String,
      required: true,
      index: true
    },
    remoteType: {
      type: String,
      enum: ['REMOTE', 'HYBRID', 'ONSITE'],
      default: 'HYBRID',
      index: true
    },
    jobType: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'],
      default: 'FULL_TIME'
    },
    experienceLevel: {
      type: String,
      enum: ['ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE'],
      default: 'MID'
    },
    salary: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: 'USD' },
      period: { type: String, enum: ['YEARLY', 'HOURLY'], default: 'YEARLY' }
    },
    description: {
      type: String,
      required: true
    },
    skills: [{ type: String }],
    source: {
      type: String,
      required: true,
      index: true
    },
    externalId: {
      type: String,
      index: true
    },
    applyUrl: {
      type: String,
      required: true
    },
    postedDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for search performance
JobSchema.index({ source: 1, externalId: 1 }, { unique: true, sparse: true });
JobSchema.index({ title: 'text', company: 'text', description: 'text', skills: 'text' });

export const JobModel = mongoose.model<IJobDocument>('Job', JobSchema);
