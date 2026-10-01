# REST API Specification (v1)

Base URL: `http://localhost:5001/api/v1`

## Standard Envelopes

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [],
    "requestId": "uuid"
  }
}
```

## Endpoints

### Authentication (`/auth`)
- `POST /auth/register`: Create a new candidate account.
- `POST /auth/login`: Authenticate with email & password; returns access token + sets HTTP-only refresh cookie.
- `POST /auth/logout`: Revokes refresh token cookie.
- `POST /auth/refresh`: Issues a refreshed access token.
- `GET /auth/me`: Returns the authenticated user record.
- `POST /auth/forgot-password`: Dispatches password reset link.
- `POST /auth/reset-password`: Resets password with token.

### Candidate Profile (`/profile`)
- `GET /profile`: Fetch unified candidate profile.
- `PUT /profile`: Update profile fields & recalculates completion percentage.
- `GET /profile/autofill-payload`: Returns key-value dictionary formatted for Chrome Extension field mapping.

### Resumes (`/resumes`)
- `GET /resumes`: List candidate resumes.
- `POST /resumes/upload`: Upload PDF/DOCX (Multer multipart/form-data, max 10MB).
- `PATCH /resumes/:id/default`: Set default resume.
- `PATCH /resumes/:id/rename`: Rename resume.
- `DELETE /resumes/:id`: Delete resume and remove file from storage.

### Applications (`/applications`)
- `GET /applications`: List applications (supports `?status=...&page=...&limit=...`).
- `GET /applications/metrics`: Returns pipeline counts (total, thisMonth, inProgress, interviews, offers).
- `POST /applications`: Record an application.
- `GET /applications/:id`: Fetch application details with full timeline.
- `PATCH /applications/:id`: Update status, notes, or compensation.
- `DELETE /applications/:id`: Remove tracked application.

### Extension Gateway (`/extension`)
- `POST /extension/pair-code`: Generates 6-digit pair code (authenticated web user).
- `POST /extension/verify-pair`: Exchanges 6-digit code for 90-day extension session token.
- `GET /extension/profile`: Fetches candidate profile for active extension session.
- `POST /extension/telemetry`: Records autofill stats (detected, filled, duration).
- `GET /extension/sessions`: Lists candidate's active extension devices.
- `DELETE /extension/sessions/:id`: Revokes extension access.

### Admin Console (`/admin`)
- `GET /admin/metrics`: Platform telemetry (users, applications, extension success rates, daily charts).
- `GET /admin/users`: Search and filter registered candidates.
- `PATCH /admin/users/:id/status`: Suspend or reactivate user accounts.
- `GET /admin/audit-logs`: Query security and compliance logs.
- `GET /admin/health`: System uptime, memory, and database status.
