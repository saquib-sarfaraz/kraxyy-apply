import { z } from 'zod';

// ==================== AUTH SCHEMAS ====================
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50)
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema.optional(),
    newPassword: passwordSchema.optional()
  })
  .refine((data) => Boolean(data.password || data.newPassword), {
    message: 'Password is required',
    path: ['password']
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain number')
});

// ==================== PROFILE SCHEMAS ====================
export const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  preferredName: z.string().optional(),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(5, 'Valid phone number is required'),
  country: z.string().min(2, 'Country is required'),
  city: z.string().min(2, 'City is required'),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  stateOrProvince: z.string().optional(),
  linkedin: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  github: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  portfolio: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  website: z.string().url('Must be a valid URL').or(z.literal('')).optional()
});

export const professionalInfoSchema = z.object({
  currentTitle: z.string().optional(),
  summary: z.string().max(2000, 'Summary cannot exceed 2000 characters').optional(),
  skills: z.array(z.string()).default([]),
  yearsOfExperience: z.number().min(0).max(60).optional(),
  preferredJobTitle: z.string().optional(),
  preferredLocation: z.string().optional(),
  remotePreference: z.enum(['REMOTE_ONLY', 'HYBRID', 'ONSITE', 'FLEXIBLE']).optional(),
  salaryExpectations: z
    .object({
      currency: z.string().default('USD'),
      minimum: z.number().optional(),
      expected: z.number().optional(),
      period: z.enum(['YEARLY', 'HOURLY', 'MONTHLY']).default('YEARLY')
    })
    .optional()
});

export const educationSchema = z.object({
  id: z.string().optional(),
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().min(1, 'Degree is required'),
  fieldOfStudy: z.string().min(1, 'Field of study is required'),
  startDate: z.string().min(4, 'Start date is required'),
  endDate: z.string().optional(),
  isCurrent: z.boolean().default(false),
  gpa: z.string().optional(),
  description: z.string().optional()
});

export const experienceSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1, 'Company is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  location: z.string().optional(),
  startDate: z.string().min(4, 'Start date is required'),
  endDate: z.string().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
  technologies: z.array(z.string()).default([])
});

export const projectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Project name is required'),
  description: z.string().min(5, 'Description is required'),
  technologies: z.array(z.string()).default([]),
  url: z.string().url().or(z.literal('')).optional(),
  githubUrl: z.string().url().or(z.literal('')).optional()
});

export const certificationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Certification name is required'),
  issuer: z.string().min(1, 'Issuer is required'),
  issueDate: z.string().min(4, 'Issue date is required'),
  expirationDate: z.string().optional(),
  credentialUrl: z.string().url().or(z.literal('')).optional()
});

export const languageSchema = z.object({
  id: z.string().optional(),
  language: z.string().min(1, 'Language is required'),
  proficiency: z.enum(['BASIC', 'CONVERSATIONAL', 'PROFICIENT', 'FLUENT', 'NATIVE'])
});

export const workAuthorizationSchema = z.object({
  authorizedToWork: z.boolean().default(true),
  sponsorshipRequired: z.boolean().default(false),
  visaStatus: z.string().optional(),
  notes: z.string().optional()
});

export const preferencesSchema = z.object({
  targetRoles: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
  remote: z.boolean().default(true),
  internship: z.boolean().default(false),
  fullTime: z.boolean().default(true),
  experienceLevel: z.enum(['ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE']).default('MID'),
  industries: z.array(z.string()).default([])
});

export const fullProfileUpdateSchema = z.object({
  personal: personalInfoSchema.partial().optional(),
  professional: professionalInfoSchema.partial().optional(),
  educations: z.array(educationSchema).optional(),
  experiences: z.array(experienceSchema).optional(),
  projects: z.array(projectSchema).optional(),
  certifications: z.array(certificationSchema).optional(),
  languages: z.array(languageSchema).optional(),
  workAuthorization: workAuthorizationSchema.partial().optional(),
  preferences: preferencesSchema.partial().optional()
});

// ==================== APPLICATION SCHEMAS ====================
export const createApplicationSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  jobUrl: z.string().url().or(z.literal('')).optional(),
  source: z.string().default('MANUAL'),
  location: z.string().optional(),
  salary: z.string().optional(),
  appliedDate: z.string().min(1, 'Applied date is required'),
  status: z
    .enum(['SAVED', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'])
    .default('APPLIED'),
  notes: z.string().optional(),
  resumeUsedId: z.string().optional(),
  coverLetter: z.string().optional()
});

export const updateApplicationSchema = createApplicationSchema.partial().extend({
  status: z
    .enum(['SAVED', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'])
    .optional()
});

// ==================== RESUME SUGGESTION SCHEMAS ====================
export const reviewResumeSuggestionSchema = z.object({
  action: z.enum(['ACCEPT', 'EDIT', 'IGNORE']),
  field: z.string(),
  editedValue: z.any().optional()
});

// ==================== JOB SCHEMAS ====================
export const jobSearchQuerySchema = z.object({
  q: z.string().optional(),
  location: z.string().optional(),
  remoteType: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).optional(),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(15)
});

// ==================== EXTENSION SCHEMAS ====================
export const extensionPairSchema = z.object({
  pairCode: z
    .string()
    .transform((val) => val.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''))
    .pipe(z.string().min(6).max(10)),
  browser: z.string().optional(),
  version: z.string().optional()
});

export const extensionTelemetrySchema = z.object({
  domain: z.string(),
  adapterName: z.string(),
  fieldsDetectedCount: z.number().min(0),
  fieldsFilledCount: z.number().min(0),
  fieldsReviewedCount: z.number().min(0),
  formDetectedConfidence: z.number().min(0).max(1),
  durationMs: z.number().min(0)
});

