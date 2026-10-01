import mongoose, { Schema, Document } from 'mongoose';
import {
  IPersonalInfo,
  IProfessionalInfo,
  IEducation,
  IExperience,
  IProject,
  ICertification,
  ILanguage,
  IWorkAuthorization,
  ICandidateFact
} from '@kraxyy/types';

export interface IProfileDocument extends Document {
  userId: mongoose.Types.ObjectId;
  personal: IPersonalInfo;
  professional: IProfessionalInfo;
  educations: IEducation[];
  experiences: IExperience[];
  projects: IProject[];
  certifications: ICertification[];
  languages: ILanguage[];
  workAuthorization: IWorkAuthorization;
  candidateFacts?: ICandidateFact[];
  resumeEvidence?: string[];
  completionPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

const EducationSchema = new Schema({
  id: { type: String, default: () => `edu-${Date.now()}-${Math.random().toString(36).substr(2, 6)}` },
  institution: { type: String, default: 'University' },
  degree: { type: String, default: 'Degree' },
  fieldOfStudy: { type: String, default: 'General' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  isCurrent: { type: Boolean, default: false },
  gpa: { type: String },
  description: { type: String, default: '' }
}, { _id: false });

const ExperienceSchema = new Schema({
  id: { type: String, default: () => `exp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}` },
  company: { type: String, default: 'Company' },
  jobTitle: { type: String, default: 'Software Engineer' },
  location: { type: String },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  isCurrent: { type: Boolean, default: false },
  description: { type: String, default: '' },
  technologies: [{ type: String }]
}, { _id: false });

const ProjectSchema = new Schema({
  id: { type: String, default: () => `proj-${Date.now()}-${Math.random().toString(36).substr(2, 6)}` },
  name: { type: String, default: 'Project' },
  description: { type: String, default: '' },
  technologies: [{ type: String }],
  url: { type: String },
  githubUrl: { type: String }
}, { _id: false });

const CertificationSchema = new Schema({
  id: { type: String, default: () => `cert-${Date.now()}-${Math.random().toString(36).substr(2, 6)}` },
  name: { type: String, default: 'Certification' },
  issuer: { type: String, default: '' },
  issueDate: { type: String, default: '' },
  expirationDate: { type: String },
  credentialUrl: { type: String }
}, { _id: false });

const LanguageSchema = new Schema({
  id: { type: String, default: () => `lang-${Date.now()}-${Math.random().toString(36).substr(2, 6)}` },
  language: { type: String, default: 'English' },
  proficiency: { type: String, enum: ['BASIC', 'CONVERSATIONAL', 'PROFICIENT', 'FLUENT', 'NATIVE'], default: 'PROFICIENT' }
}, { _id: false });

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

const ProfileSchema = new Schema<IProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    personal: {
      firstName: { type: String, default: '' },
      lastName: { type: String, default: '' },
      preferredName: { type: String },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      country: { type: String, default: '' },
      city: { type: String, default: '' },
      address: { type: String },
      postalCode: { type: String },
      stateOrProvince: { type: String },
      linkedin: { type: String },
      github: { type: String },
      portfolio: { type: String },
      website: { type: String }
    },
    professional: {
      currentTitle: { type: String },
      summary: { type: String },
      skills: [{ type: String }],
      yearsOfExperience: { type: Number, default: 0 },
      preferredJobTitle: { type: String },
      preferredLocation: { type: String },
      remotePreference: { type: String, enum: ['REMOTE_ONLY', 'HYBRID', 'ONSITE', 'FLEXIBLE'], default: 'FLEXIBLE' },
      salaryExpectations: {
        currency: { type: String, default: 'USD' },
        minimum: { type: Number },
        expected: { type: Number },
        period: { type: String, enum: ['YEARLY', 'HOURLY', 'MONTHLY'], default: 'YEARLY' }
      }
    },
    educations: [EducationSchema],
    experiences: [ExperienceSchema],
    projects: [ProjectSchema],
    certifications: [CertificationSchema],
    languages: [LanguageSchema],
    workAuthorization: {
      authorizedToWork: { type: Boolean, default: true },
      sponsorshipRequired: { type: Boolean, default: false },
      visaStatus: { type: String },
      notes: { type: String }
    },
    candidateFacts: [CandidateFactSchema],
    resumeEvidence: [{ type: String }],
    completionPercentage: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export const ProfileModel = mongoose.model<IProfileDocument>('Profile', ProfileSchema);
