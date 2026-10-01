# Database Architecture & Storage Split

Kraxyy Apply implements a high-performance **Hybrid Database Architecture** dividing transactional candidate state from high-volume global job indexing.

```text
┌───────────────────────────────────────┐      ┌───────────────────────────────────────┐
│          MongoDB Database             │      │       Cloudflare D1 Database          │
│   (Transactional Candidate Domain)    │      │         (Job Index Domain)            │
├───────────────────────────────────────┤      ├───────────────────────────────────────┤
│ • Users & Authentication              │      │ • Ingested Global Job Listings        │
│ • Candidate Profiles & Preferences    │      │ • Full Job Metadata & Tags            │
│ • Resumes & Parsed Suggestions        │      │ • Deterministic Deduplication Hashes  │
│ • Application Tracking State          │      │ • High-Speed Keyword & Remote Search  │
│ • Secure Extension Sessions           │      │ • SQLite Engine for Local Dev         │
│ • Audit Logs (TTL 90 Days)            │      │ • Edge-Distributed Read Performance  │
└───────────────────────────────────────┘      └───────────────────────────────────────┘
```

---

## 1. MongoDB Collections & Indexes

MongoDB (via Mongoose ODM) manages structured, relational, and transactional user data.

### `users`
- `email`: `{ unique: true, index: true }`
- `role`: `{ index: true }` (`USER`, `ADMIN`, `SUPER_ADMIN`)
- `status`: `{ index: true }` (`ACTIVE`, `SUSPENDED`, `DEACTIVATED`)

### `profiles`
- `userId`: `{ unique: true, index: true }`
- Subdocuments: `personal`, `professional`, `educations`, `experiences`, `projects`, `certifications`, `languages`, `workAuthorization`, `preferences`.

### `resumes`
- `userId`: `{ index: true }`
- `isDefault`: `{ index: true }`
- `fileUrl`: Cloudinary signed asset URL or local storage path.
- `parsedDraft`: Structured JSON output from AI resume extraction awaiting candidate review.

### `applications`
- `userId`: `{ index: true }`
- `status`: `{ index: true }` (`APPLIED`, `INTERVIEWING`, `OFFERED`, `REJECTED`, etc.)
- `appliedDate`: `{ index: -1 }`
- Compound Index: `{ userId: 1, status: 1 }`
- Compound Index: `{ userId: 1, appliedDate: -1 }`

### `extensionSessions`
- `userId`: `{ index: true }`
- `sessionToken`: `{ unique: true, index: true }`
- `pairCode`: `{ index: true }` (short-lived 5-minute code, `AB7X-92KP`)
- `status`: `{ index: true }` (`ACTIVE`, `REVOKED`, `EXPIRED`)
- `expiresAt`: `{ index: true }`

### `auditLogs`
- `userId`: `{ index: true }`
- `action`: `{ index: true }`
- `category`: `{ index: true }`
- TTL Index: `{ createdAt: 1 }` with `expireAfterSeconds: 7776000` (90-day automatic retention purge).

---

## 2. Cloudflare D1 SQL Job Index

The job index is hosted on **Cloudflare D1** (SQLite at the edge) and queries using SQL:

```sql
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  hash TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  remote INTEGER NOT NULL DEFAULT 0,
  employment_type TEXT,
  experience_level TEXT,
  salary_currency TEXT,
  salary_min REAL,
  salary_max REAL,
  salary_interval TEXT,
  apply_url TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  skills TEXT,
  posted_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_jobs_hash ON jobs(hash);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_remote ON jobs(remote);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
```

### Ingestion Deduplication Rule
The SHA-256 hash is computed over normalized `company`, `title`, `location`, and stripped `applyUrl`. Insertions execute with:
```sql
INSERT OR IGNORE INTO jobs (...) VALUES (...);
```
Guaranteeing zero duplicate entries even across repeated crawl runs.

### Local Development Engine
When Cloudflare environment credentials (`CF_ACCOUNT_ID`, `CF_D1_DATABASE_ID`, `CF_API_TOKEN`) are not provided, the API uses native Node.js `node:sqlite` directly with `./data/d1_jobs.sqlite`, automatically bootstrapping all schemas.
