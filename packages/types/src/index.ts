export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isAdminAuthorized?: boolean;
  isVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPersonalInfo {
  firstName: string;
  lastName: string;
  preferredName?: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address?: string;
  postalCode?: string;
  stateOrProvince?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  website?: string;
}

export type RemotePreference = 'REMOTE_ONLY' | 'HYBRID' | 'ONSITE' | 'FLEXIBLE';

export interface IProfessionalInfo {
  currentTitle?: string;
  summary?: string;
  skills: string[];
  yearsOfExperience?: number;
  preferredJobTitle?: string;
  preferredLocation?: string;
  remotePreference?: RemotePreference;
  salaryExpectations?: {
    currency: string;
    minimum?: number;
    expected?: number;
    period: 'YEARLY' | 'HOURLY' | 'MONTHLY';
  };
}

export interface IEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  gpa?: string;
  description?: string;
}

export interface IExperience {
  id: string;
  company: string;
  jobTitle: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  technologies?: string[];
}

export interface IProject {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  githubUrl?: string;
}

export interface ICertification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expirationDate?: string;
  credentialUrl?: string;
}

export type LanguageProficiency = 'BASIC' | 'CONVERSATIONAL' | 'PROFICIENT' | 'FLUENT' | 'NATIVE';

export interface ILanguage {
  id: string;
  language: string;
  proficiency: LanguageProficiency;
}

export interface IWorkAuthorization {
  authorizedToWork: boolean;
  sponsorshipRequired: boolean;
  visaStatus?: string;
  notes?: string;
}

export interface IUserPreferences {
  targetRoles: string[];
  locations: string[];
  remote: boolean;
  internship: boolean;
  fullTime: boolean;
  experienceLevel: 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';
  industries: string[];
}

export interface ICompletionCategory {
  score: number;
  weight: number;
  max: number;
}

export interface ICompletionBreakdown {
  total: number;
  categories: {
    personal: ICompletionCategory;
    education: ICompletionCategory;
    skills: ICompletionCategory;
    experience: ICompletionCategory;
    projects: ICompletionCategory;
    resume: ICompletionCategory;
    preferences: ICompletionCategory;
  };
  missingSuggestions: string[];
}

export interface ICandidateFact {
  id: string;
  category: 'EXPERIENCE' | 'SKILL' | 'EDUCATION' | 'PROJECT' | 'ACHIEVEMENT';
  fact: string;
  confidence: 'explicit' | 'inferred';
  sourceSection?: string;
  dateRange?: string;
  technologies?: string[];
}

export interface IUserProfile {
  id?: string;
  userId: string;
  personal: IPersonalInfo;
  professional: IProfessionalInfo;
  educations: IEducation[];
  experiences: IExperience[];
  projects: IProject[];
  certifications: ICertification[];
  languages: ILanguage[];
  workAuthorization: IWorkAuthorization;
  preferences?: IUserPreferences;
  candidateFacts?: ICandidateFact[];
  completionPercentage: number;
  completionBreakdown?: ICompletionBreakdown;
  updatedAt: string;
}

export interface ISuggestedField<T = any> {
  field: string;
  currentValue?: T;
  suggestedValue: T;
  status: 'SUGGESTED' | 'ACCEPTED' | 'EDITED' | 'IGNORED';
  confidence: number;
}

export interface IResumeParsedDraft {
  resumeId: string;
  parserVersion: string;
  parsedAt: string;
  status: 'PENDING_REVIEW' | 'APPLIED' | 'DISCARDED';
  extractedTextLength: number;
  suggestedData: {
    personal?: Partial<IPersonalInfo>;
    professional?: Partial<IProfessionalInfo>;
    educations?: IEducation[];
    experiences?: IExperience[];
    projects?: IProject[];
    certifications?: ICertification[];
    skills?: string[];
    summary?: string;
    facts?: ICandidateFact[];
  };
}

export interface IResume {
  id: string;
  userId: string;
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
  createdAt: string;
  updatedAt: string;
}

export type RoleFamilyType =
  | 'SOFTWARE_ENGINEERING'
  | 'DATA'
  | 'FINANCE'
  | 'MARKETING'
  | 'DESIGN'
  | 'SALES'
  | 'PRODUCT_MANAGEMENT'
  | 'OPERATIONS_HR'
  | 'OTHER';

export type MatchQualityLevel = 'STRONG' | 'GOOD' | 'PARTIAL' | 'LOW' | 'NONE';

export interface IMissingSkillDetail {
  skill: string;
  priority: 'REQUIRED' | 'PREFERRED';
}

export interface IMatchBreakdown {
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  roleScore: number;
  locationScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  concerns: string[];
  explanation: string;
  engineVersion: string;

  // Transparent evidence-based fields (visible to user instead of raw verdict)
  roleAlignment?: 'Strong' | 'Good' | 'Moderate' | 'Partial' | 'Mismatch' | string;
  requiredSkillsMet?: string; // e.g. "8/10"
  missingKeywords?: string[]; // ATS missing keywords
  experienceRequirement?: 'Requirement met' | 'Partially met' | 'Requirement not met' | string;
  evidenceFromResume?: string[]; // e.g. ["Built React applications", "Node.js REST API experience"]
  recommendations?: string[]; // e.g. ["Add AWS/Docker only if you genuinely have that experience"]

  // Enriched intelligence fields
  qualityLabel?: 'Strong Match' | 'Good Match' | 'Partial Match' | 'Low Match' | 'Not a Match';
  matchQuality?: MatchQualityLevel;
  roleFamilyJob?: RoleFamilyType;
  roleFamilyCandidate?: RoleFamilyType;
  roleRelevance?: 'STRONG' | 'MODERATE' | 'LOW' | 'MISMATCH';
  isRoleRelevant?: boolean;
  roleMismatchReason?: string;
  whyThisScore?: string;
  coreMatchedSkills?: string[];
  genericMatchedSkills?: string[];
  missingSkillsDetailed?: IMissingSkillDetail[];
  experienceVerdict?: 'MATCH' | 'PARTIAL' | 'MISMATCH';
  experienceVerdictText?: string;
  educationVerdict?: 'MATCH' | 'PARTIAL' | 'MISMATCH' | 'NOT_SPECIFIED';
  educationVerdictText?: string;
  atsCoverageScore?: number;
  atsMatchedCount?: number;
  atsMissingCount?: number;
  resumeIssues?: string[];
}

export interface ID1Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  remote: boolean;
  remoteType: 'REMOTE' | 'HYBRID' | 'ONSITE';
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  experienceLevel: 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';
  description: string;
  responsibilities?: string;
  requirements?: string;
  skills: string[];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: 'YEARLY' | 'HOURLY';
  applyUrl: string;
  source: string;
  sourceUrl?: string;
  postedAt: string;
  scrapedAt: string;
  hash: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'EXPIRED';
}

export interface INormalizedJob {
  id?: string;
  title: string;
  company: string;
  companyLogo?: string;
  location?: string;
  remote?: boolean;
  employmentType?: string;
  experienceLevel?: string;
  description: string;
  responsibilities?: string[];
  requirements?: string[];
  skills?: string[];
  educationRequirements?: string[];
  experienceRequirements?: string[];
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    period?: 'YEARLY' | 'HOURLY';
  };
  source?: string;
  sourceUrl?: string;
  applyUrl?: string;
  postedDate?: string;
}

export type JobExtractionSource =
  | 'JSON_LD'
  | 'DOM'
  | 'LINKEDIN'
  | 'GREENHOUSE'
  | 'LEVER'
  | 'WORKDAY'
  | 'GENERIC';

export interface IJobPageDetection {
  isJobPage: boolean;
  confidence: number;
  job?: INormalizedJob;
  source: JobExtractionSource;
  match?: IMatchBreakdown;
  characterCount?: number;
}

export interface IActiveJobContext {
  jobTitle: string;
  company: string;
  matchScore: number;
  sourceUrl: string;
  applicationUrl?: string;
  detectedAt: string;
}

export type PageIntelligenceType = 'JOB' | 'APPLICATION' | 'JOB_AND_APPLICATION' | 'OTHER';

export interface IPageJobState {
  detected: boolean;
  confidence: number;
  normalizedJob?: INormalizedJob;
  match?: IMatchBreakdown;
  source?: JobExtractionSource;
  characterCount?: number;
}

export interface IPageFormState {
  detected: boolean;
  confidence: number;
  autofillReady: boolean;
  fieldCount: number;
  fillableFieldCount: number;
  manualRequiredCount?: number;
  fields: any[];
}

export interface IPageIntelligenceState {
  pageType: PageIntelligenceType;
  job?: IPageJobState;
  form?: IPageFormState;
  activeContext?: IActiveJobContext;
  url: string;
  isTopFrame: boolean;
  timestamp: number;
}

export interface IJobSource {
  id: string;
  name: string;
  adapterType: 'CAREER_PAGE' | 'ATS_GREENHOUSE' | 'ATS_LEVER' | 'API' | 'SEARCH';
  baseUrl: string;
  isActive: boolean;
  lastRunAt?: string;
  totalJobsFound: number;
}

export interface IIngestionRun {
  id: string;
  sourceId: string;
  startedAt: string;
  completedAt?: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  jobsFetched: number;
  jobsNormalized: number;
  jobsStored: number;
  jobsDeduplicated: number;
  error?: string;
}

export interface IPairCodeResponse {
  pairCode: string;
  expiresAt: string;
  expiresInSeconds: number;
}

export type ApplicationStatus =
  | 'SAVED'
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface IApplicationTimelineEvent {
  id: string;
  status: ApplicationStatus;
  date: string;
  note?: string;
}

export interface IApplication {
  id: string;
  userId: string;
  jobTitle: string;
  company: string;
  jobUrl?: string;
  source: string;
  location?: string;
  salary?: string;
  appliedDate: string;
  status: ApplicationStatus;
  notes?: string;
  resumeUsedId?: string;
  coverLetter?: string;
  timeline: IApplicationTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface IJob {
  id: string;
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
  postedDate: string;
  isSaved?: boolean;
}

export interface ISavedJob {
  id: string;
  userId: string;
  jobId: string;
  savedAt: string;
  job?: IJob;
}

export type FieldTaxonomyType =
  // PERSONAL
  | 'FIRST_NAME'
  | 'LAST_NAME'
  | 'FULL_NAME'
  | 'EMAIL'
  | 'PHONE'
  // ADDRESS
  | 'ADDRESS'
  | 'ADDRESS_LINE1'
  | 'ADDRESS_LINE_1'
  | 'ADDRESS_LINE_2'
  | 'CITY'
  | 'STATE'
  | 'POSTAL_CODE'
  | 'COUNTRY'
  // PROFESSIONAL
  | 'JOB_TITLE'
  | 'COMPANY'
  | 'YEARS_EXPERIENCE'
  | 'CURRENT_COMPANY'
  | 'CURRENT_JOB_TITLE'
  | 'CURRENT_TITLE'
  | 'RECENT_COMPANY'
  | 'RECENT_TITLE'
  | 'SUMMARY'
  // LINKS
  | 'LINKEDIN'
  | 'GITHUB'
  | 'PORTFOLIO'
  | 'WEBSITE'
  // EDUCATION
  | 'UNIVERSITY'
  | 'COLLEGE'
  | 'DEGREE'
  | 'FIELD_OF_STUDY'
  | 'GRADUATION_DATE'
  | 'GPA'
  | 'EDUCATION_DEGREE'
  | 'EDUCATION_SCHOOL'
  // APPLICATION
  | 'RESUME'
  | 'COVER_LETTER'
  | 'SKILLS'
  // USER-SENSITIVE / MANUAL
  | 'WORK_AUTHORIZATION'
  | 'VISA_SPONSORSHIP'
  | 'SPONSORSHIP_REQUIRED'
  | 'SALARY_EXPECTATION'
  | 'DESIRED_SALARY'
  | 'NOTICE_PERIOD'
  | 'START_DATE'
  | 'DEMOGRAPHIC'
  | 'CUSTOM_QUESTION';

export type FieldFillStatus =
  | 'VERIFIED'
  | 'FILLED'
  | 'NEEDS_ATTENTION'
  | 'NEEDS_REVIEW'
  | 'SKIPPED_EXISTING'
  | 'NOT_FOUND'
  | 'UNSUPPORTED'
  | 'MANUAL_REQUIRED'
  | 'FAILED';

export type DetectedElementType =
  | 'input'
  | 'textarea'
  | 'select'
  | 'combobox'
  | 'contenteditable'
  | 'radio'
  | 'checkbox'
  | 'file';

export interface IDetectedField {
  id: string;
  selector: string;
  name?: string;
  tagName: 'input' | 'textarea' | 'select' | 'div' | 'button' | 'span';
  elementType?: DetectedElementType;
  inputType?: string;
  taxonomyType: FieldTaxonomyType | 'UNKNOWN';
  confidence: number;
  label?: string;
  currentValue?: string;
  suggestedValue?: string | boolean;
  status?: FieldFillStatus;
  manualReason?: string;
  frameId?: number;
  isShadowDom?: boolean;
  signals?: string[];
  verifiedValue?: string;
  existingValue?: string;
}

export interface IExtensionSession {
  id: string;
  userId: string;
  sessionToken: string;
  browser: string;
  extensionVersion: string;
  lastActive: string;
  expiresAt: string;
  expiresInDays?: number;
  ipAddress?: string;
  createdAt: string;
}

export interface IAutofillTelemetry {
  id?: string;
  userId?: string;
  domain: string;
  adapterName: string;
  fieldsDetectedCount: number;
  fieldsFilledCount: number;
  fieldsReviewedCount: number;
  formDetectedConfidence: number;
  durationMs: number;
  createdAt?: string;
}

export interface IAdminMetrics {
  totalUsers: number;
  activeUsers30d: number;
  totalApplications: number;
  applicationsThisMonth: number;
  totalExtensionSessions: number;
  autofillSuccessRate: number;
  recentActivity: Array<{
    date: string;
    applications: number;
    signups: number;
    autofills: number;
  }>;
}

export interface IAuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  category: 'AUTH' | 'SECURITY' | 'PROFILE' | 'ADMIN' | 'EXTENSION';
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface INotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
    requestId?: string;
  };
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
