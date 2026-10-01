import { ApplicationStatus } from '@kraxyy/types';

export const APPLICATION_STATUS_LIST: Array<{ key: ApplicationStatus; label: string }> = [
  { key: 'SAVED', label: 'Saved' },
  { key: 'APPLIED', label: 'Applied' },
  { key: 'SCREENING', label: 'Screening' },
  { key: 'INTERVIEW', label: 'Interview' },
  { key: 'OFFER', label: 'Offer Received' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'WITHDRAWN', label: 'Withdrawn' }
];

export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  RESUMES: '/resumes',
  APPLICATIONS: '/applications',
  JOBS: '/jobs',
  SAVED_JOBS: '/saved-jobs',
  EXTENSION: '/extension',
  SETTINGS: '/settings',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_APPLICATIONS: '/admin/applications',
  ADMIN_EXTENSION: '/admin/extension',
  ADMIN_SETTINGS: '/admin/settings'
};

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/v1/auth/register',
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
    ME: '/api/v1/auth/me',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
    CHANGE_PASSWORD: '/api/v1/auth/change-password'
  },
  PROFILE: {
    GET: '/api/v1/profile',
    UPDATE: '/api/v1/profile',
    AUTOFILL_PAYLOAD: '/api/v1/profile/autofill-payload'
  },
  RESUMES: {
    LIST: '/api/v1/resumes',
    UPLOAD: '/api/v1/resumes/upload',
    SET_DEFAULT: (id: string) => `/api/v1/resumes/${id}/default`,
    DELETE: (id: string) => `/api/v1/resumes/${id}`,
    RENAME: (id: string) => `/api/v1/resumes/${id}/rename`
  },
  APPLICATIONS: {
    LIST: '/api/v1/applications',
    CREATE: '/api/v1/applications',
    GET: (id: string) => `/api/v1/applications/${id}`,
    UPDATE: (id: string) => `/api/v1/applications/${id}`,
    DELETE: (id: string) => `/api/v1/applications/${id}`,
    TIMELINE: (id: string) => `/api/v1/applications/${id}/timeline`
  },
  JOBS: {
    SEARCH: '/api/v1/jobs',
    GET: (id: string) => `/api/v1/jobs/${id}`,
    SAVE: (id: string) => `/api/v1/jobs/${id}/save`,
    UNSAVE: (id: string) => `/api/v1/jobs/${id}/unsave`,
    SAVED_LIST: '/api/v1/saved-jobs',
    RECOMMENDED: '/api/v1/jobs/recommended',
    MATCH: (id: string) => `/api/v1/matching/job/${id}`
  },
  EXTENSION: {
    PAIR: '/api/v1/extension/verify-pair',
    CONNECT: '/api/v1/extension/connect',
    PAIR_CODE: '/api/v1/extension/pair-code',
    STATUS: '/api/v1/extension/status',
    SYNC_PROFILE: '/api/v1/extension/profile',
    TELEMETRY: '/api/v1/extension/telemetry',
    SESSIONS: '/api/v1/extension/sessions',
    REVOKE: (id: string) => `/api/v1/extension/sessions/${id}`
  },
  ADMIN: {
    METRICS: '/api/v1/admin/metrics',
    USERS: '/api/v1/admin/users',
    APPLICATIONS: '/api/v1/admin/applications',
    EXTENSION_SESSIONS: '/api/v1/admin/extension-sessions',
    AUDIT_LOGS: '/api/v1/admin/audit-logs',
    FEATURE_FLAGS: '/api/v1/admin/feature-flags'
  }
};
