# Job Ingestion & Cloudflare D1 Indexing Architecture

## Overview

The Kraxyy Job Ingestion & Indexing Engine is responsible for continuously aggregating job listings from multiple ATS platforms and company career portals, normalizing them to a canonical schema, preventing duplicates via deterministic cryptographic hashing, and indexing them in Cloudflare D1 (with SQLite fallback for local development).

---

## 1. Modular Source Adapters (`services/job-ingestion`)

The ingestion pipeline is designed around an extensible adapter pattern:

```text
┌─────────────────────────────────────────────────────────┐
│                 Job Ingestion Pipeline                  │
└────────────────────────────┬────────────────────────────┘
                             │
     ┌───────────────────────┼───────────────────────┐
     ▼                       ▼                       ▼
GreenhouseAdapter       LeverAdapter           CompanyCareerAdapter
(board API parsing)   (lever API/html)       (direct careers parser)
     │                       │                       │
     └───────────────────────┼───────────────────────┘
                             ▼
                    Canonical Normalizer
                             ▼
                    Zod Schema Validation
                             ▼
              Deterministic Hash Deduplication
              (SHA-256 over normalized fields)
                             ▼
                 Cloudflare D1 SQL Database
```

### Supported Adapters
1. **Greenhouse Adapter (`GreenhouseSourceAdapter`)**:
   - Ingests public job listings from Greenhouse ATS board endpoints.
   - Normalizes board tokens, departments, employment types, and remote flags.
2. **Lever Adapter (`LeverSourceAdapter`)**:
   - Ingests postings from Lever endpoints (`/v0/postings/:company`).
   - Extracts categories, commitment, and work-location classifications.
3. **Company Career Adapter (`CompanyCareerSourceAdapter`)**:
   - Generic career portal adapter capable of ingesting structured JSON feeds or HTML listings.

---

## 2. Cloudflare D1 Storage & Local SQLite Fallback

### D1 REST API Client
In staging and production, the API communicates with Cloudflare D1 using Cloudflare's HTTP REST API:
- `CF_ACCOUNT_ID`: Cloudflare account identifier.
- `CF_D1_DATABASE_ID`: Cloudflare D1 database UUID.
- `CF_API_TOKEN`: API token with D1 Read/Write permissions.

### Local SQLite Engine
When running locally or when Cloudflare credentials are unset:
- The system automatically loads Node.js native `node:sqlite` database (`./data/d1_jobs.sqlite`).
- Executes automatic schema migrations on startup (`migrations/0001_d1_jobs_schema.sql`).
- Provides identical SQL semantics (`SELECT`, `INSERT OR IGNORE`, `WHERE`, `ORDER BY`).

---

## 3. Deterministic SHA-256 Deduplication

To prevent duplicate job listings across crawls or multiple sources:

```typescript
function generateJobHash(company: string, title: string, location: string, applyUrl: string): string {
  // Normalize company: lowercase, strip punctuation
  const normCompany = company.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  // Normalize title: lowercase, strip punctuation
  const normTitle = title.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  // Normalize location: lowercase, strip punctuation
  const normLocation = location.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  // Normalize applyUrl: strip tracking query params (utm_*, ref, etc.)
  const parsedUrl = new URL(applyUrl);
  const cleanUrl = `${parsedUrl.origin}${parsedUrl.pathname}`.toLowerCase();

  const key = `${normCompany}|${normTitle}|${normLocation}|${cleanUrl}`;
  return crypto.createHash('sha256').update(key).digest('hex');
}
```

The `hash` column is indexed with a `UNIQUE` constraint in D1. Duplicate insertions are skipped without corrupting database state or pipeline metrics.

---

## 4. Multi-Factor Matching Engine (`services/matching`)

The standalone `@kraxyy/matching` engine evaluates candidate profiles against D1 jobs:

- **Algorithm Version:** `v1.0.0`
- **Total Score:** Range `0 - 100`
- **Scoring Dimensions:**
  1. **Skills Match (35%)**: Direct matching between candidate skills (technical & soft) and required job keywords.
  2. **Role & Title Fit (25%)**: Title synonym analysis (e.g., Senior Full Stack Engineer vs. Lead Software Developer).
  3. **Experience Level (20%)**: Years of professional experience vs. target job seniority.
  4. **Location & Remote Preference (10%)**: Matching remote preference, city, state, or country.
  5. **Education Alignment (10%)**: Degree level and field of study evaluation.

### Match Output
Every match calculation returns an `IMatchBreakdown`:
```json
{
  "jobId": "d1_job_xyz",
  "score": 88,
  "version": "v1.0.0",
  "breakdown": {
    "skillsScore": 90,
    "roleScore": 95,
    "experienceScore": 85,
    "locationScore": 100,
    "educationScore": 70
  },
  "strengths": [
    "Exact skill matches: TypeScript, React, Node.js",
    "Candidate preference matches Remote policy",
    "Strong role title alignment: Senior Full Stack Engineer"
  ],
  "concerns": [
    "Job mentions GraphQL which is not listed on candidate profile"
  ],
  "explanation": "High 88% alignment. Candidate possesses all core frontend and backend technologies, meets remote work preferences, and matches the target seniority level."
}
```
