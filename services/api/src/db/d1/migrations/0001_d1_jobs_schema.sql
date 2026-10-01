-- Migration 0001: Cloudflare D1 Jobs, Sources, and Ingestion Runs Schema

-- Jobs index table
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo TEXT,
  location TEXT NOT NULL,
  remote INTEGER NOT NULL DEFAULT 0,
  remote_type TEXT NOT NULL DEFAULT 'HYBRID',
  employment_type TEXT NOT NULL DEFAULT 'FULL_TIME',
  experience_level TEXT NOT NULL DEFAULT 'MID',
  description TEXT NOT NULL,
  responsibilities TEXT,
  requirements TEXT,
  skills TEXT NOT NULL DEFAULT '[]', -- JSON array of string tags
  salary_min REAL,
  salary_max REAL,
  salary_currency TEXT DEFAULT 'USD',
  salary_period TEXT DEFAULT 'YEARLY',
  apply_url TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  posted_at TEXT NOT NULL,
  scraped_at TEXT NOT NULL,
  hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
);

-- Indexes for lightning fast query and search performance
CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_remote ON jobs(remote);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_hash ON jobs(hash);

-- Job sources table for ingestion monitoring
CREATE TABLE IF NOT EXISTS job_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  adapter_type TEXT NOT NULL,
  base_url TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_run_at TEXT,
  total_jobs_found INTEGER NOT NULL DEFAULT 0
);

-- Ingestion audit & telemetry runs
CREATE TABLE IF NOT EXISTS job_ingestion_runs (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL,
  jobs_fetched INTEGER NOT NULL DEFAULT 0,
  jobs_normalized INTEGER NOT NULL DEFAULT 0,
  jobs_stored INTEGER NOT NULL DEFAULT 0,
  jobs_deduplicated INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  FOREIGN KEY (source_id) REFERENCES job_sources(id)
);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_source ON job_ingestion_runs(source_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_started ON job_ingestion_runs(started_at DESC);
