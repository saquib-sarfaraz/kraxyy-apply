-- ==============================================================================
-- Cloudflare D1 Initial Schema Migration: jobs, job_skills, scrape_sources, scrape_runs
-- Database: kraxyy-apply (ID: 73cc8f32-0142-4910-8361-316178e54a9f)
-- ==============================================================================

-- 1. JOBS TABLE
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  hash TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL,
  external_id TEXT,
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  skills TEXT,
  employment_type TEXT,
  remote_type TEXT,
  salary TEXT,
  apply_url TEXT NOT NULL,
  posted_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  expires_at INTEGER,
  created_at INTEGER NOT NULL
);

-- Performance & Deduplication Indexes for jobs
CREATE INDEX IF NOT EXISTS idx_jobs_hash ON jobs(hash);
CREATE INDEX IF NOT EXISTS idx_jobs_source_ext ON jobs(source, external_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_remote_type ON jobs(remote_type);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at);
CREATE INDEX IF NOT EXISTS idx_jobs_last_seen ON jobs(last_seen_at);

-- 2. JOB_SKILLS TABLE
CREATE TABLE IF NOT EXISTS job_skills (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  skill TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_job_skills_job ON job_skills(job_id);
CREATE INDEX IF NOT EXISTS idx_job_skills_skill ON job_skills(skill);

-- 3. SCRAPE_SOURCES TABLE
CREATE TABLE IF NOT EXISTS scrape_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  adapter_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  last_run_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scrape_sources_status ON scrape_sources(status);
CREATE INDEX IF NOT EXISTS idx_scrape_sources_adapter ON scrape_sources(adapter_type);

-- 4. SCRAPE_RUNS TABLE
CREATE TABLE IF NOT EXISTS scrape_runs (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  status TEXT NOT NULL,
  jobs_found INTEGER NOT NULL DEFAULT 0,
  jobs_inserted INTEGER NOT NULL DEFAULT 0,
  jobs_skipped INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  FOREIGN KEY (source_id) REFERENCES scrape_sources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scrape_runs_source ON scrape_runs(source_id);
CREATE INDEX IF NOT EXISTS idx_scrape_runs_status ON scrape_runs(status);
CREATE INDEX IF NOT EXISTS idx_scrape_runs_started ON scrape_runs(started_at);
