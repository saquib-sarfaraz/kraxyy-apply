import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ID1Job, IJobSource, IIngestionRun } from '@kraxyy/types';

export interface D1QueryResult<T = unknown> {
  results: T[];
  success: boolean;
  meta?: Record<string, unknown>;
}

export class D1Client {
  private accountId?: string;
  private databaseId?: string;
  private apiToken?: string;
  private isCloudflareMode: boolean = false;
  private localSqliteDb: any = null;
  private initialized: boolean = false;

  constructor() {
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    this.databaseId = process.env.CLOUDFLARE_DATABASE_ID;
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN;

    // Check if valid Cloudflare D1 production credentials exist
    if (
      this.accountId &&
      this.databaseId &&
      this.apiToken &&
      !this.accountId.includes('your_') &&
      !this.databaseId.includes('your_') &&
      !this.apiToken.includes('your_')
    ) {
      this.isCloudflareMode = true;
    }
  }

  public async init(): Promise<void> {
    if (this.initialized) return;

    if (!this.isCloudflareMode) {
      // Local fallback using Node.js native SQLite
      try {
        const { createRequire } = await import('module');
        const nodeRequire = createRequire(path.join(process.cwd(), 'package.json'));
        const { DatabaseSync } = nodeRequire('node:sqlite');
        const dbPath = process.env.D1_SQLITE_PATH || path.join(process.cwd(), 'data', 'd1_jobs.sqlite');
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }

        this.localSqliteDb = new DatabaseSync(dbPath);
      } catch {
        // In-memory fallback
        const { createRequire } = await import('module');
        const nodeRequire = createRequire(path.join(process.cwd(), 'package.json'));
        const { DatabaseSync } = nodeRequire('node:sqlite');
        this.localSqliteDb = new DatabaseSync(':memory:');
      }

      await this.applyMigrations();
    }

    this.initialized = true;
  }

  private async applyMigrations(): Promise<void> {
    const migrationPath = path.join(__dirname, 'migrations', '0001_d1_jobs_schema.sql');
    if (fs.existsSync(migrationPath)) {
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      if (this.localSqliteDb) {
        this.localSqliteDb.exec(sql);
      }
    }
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    await this.init();

    if (this.isCloudflareMode) {
      const endpoint = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql, params })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Cloudflare D1 Query Failed [${res.status}]: ${errText}`);
      }

      const json = await res.json() as { result: Array<{ results: T[] }> };
      return json.result?.[0]?.results || [];
    } else {
      const stmt = this.localSqliteDb.prepare(sql);
      return stmt.all(...params) as T[];
    }
  }

  public async execute(sql: string, params: any[] = []): Promise<{ changes: number }> {
    await this.init();

    if (this.isCloudflareMode) {
      const endpoint = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql, params })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Cloudflare D1 Execute Failed [${res.status}]: ${errText}`);
      }

      const json = await res.json() as { result: Array<{ meta?: { changes?: number } }> };
      return { changes: json.result?.[0]?.meta?.changes || 1 };
    } else {
      const stmt = this.localSqliteDb.prepare(sql);
      const result = stmt.run(...params);
      return { changes: result.changes || 0 };
    }
  }

  /**
   * Deterministic Job Hash: SHA-256(company + title + location + applyUrl)
   */
  public generateJobHash(company: string, title: string, location: string, applyUrl: string): string {
    const norm = [
      company.trim().toLowerCase(),
      title.trim().toLowerCase(),
      location.trim().toLowerCase(),
      applyUrl.trim().toLowerCase().split('?')[0] // strip transient tracking params
    ].join('::');
    return crypto.createHash('sha256').update(norm).digest('hex');
  }

  /**
   * Inserts a normalized job with deduplication
   */
  public async insertJob(job: Partial<ID1Job> & { title: string; company: string; location: string; applyUrl: string; description: string }): Promise<{ inserted: boolean; id: string; reason?: string }> {
    await this.init();

    const hash = job.hash || this.generateJobHash(job.company, job.title, job.location, job.applyUrl);
    const existing = await this.query<{ id: string }>('SELECT id FROM jobs WHERE hash = ? LIMIT 1', [hash]);
    if (existing.length > 0) {
      return { inserted: false, id: existing[0].id, reason: 'Duplicate job hash exists' };
    }

    const id = job.id || crypto.randomUUID();
    const skillsJson = JSON.stringify(job.skills || []);

    const sql = `
      INSERT INTO jobs (
        id, title, company, company_logo, location, remote, remote_type,
        employment_type, experience_level, description, responsibilities,
        requirements, skills, salary_min, salary_max, salary_currency,
        salary_period, apply_url, source, source_url, posted_at, scraped_at,
        hash, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      job.title,
      job.company,
      job.companyLogo || null,
      job.location,
      job.remote ? 1 : 0,
      job.remoteType || 'HYBRID',
      job.employmentType || 'FULL_TIME',
      job.experienceLevel || 'MID',
      job.description,
      job.responsibilities || null,
      job.requirements || null,
      skillsJson,
      job.salaryMin ?? null,
      job.salaryMax ?? null,
      job.salaryCurrency || 'USD',
      job.salaryPeriod || 'YEARLY',
      job.applyUrl,
      job.source || 'MANUAL',
      job.sourceUrl || null,
      job.postedAt || new Date().toISOString(),
      job.scrapedAt || new Date().toISOString(),
      hash,
      job.status || 'ACTIVE'
    ];

    await this.execute(sql, params);
    return { inserted: true, id };
  }

  /**
   * Search jobs with filters and pagination
   */
  public async searchJobs(params: {
    q?: string;
    location?: string;
    remote?: boolean;
    remoteType?: string;
    employmentType?: string;
    experienceLevel?: string;
    page?: number;
    limit?: number;
  }): Promise<{ jobs: ID1Job[]; total: number; page: number; totalPages: number }> {
    await this.init();

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 15));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ["status = 'ACTIVE'"];
    const sqlParams: any[] = [];

    if (params.q) {
      whereClauses.push(`(title LIKE ? OR company LIKE ? OR skills LIKE ? OR description LIKE ?)`);
      const term = `%${params.q}%`;
      sqlParams.push(term, term, term, term);
    }

    if (params.location) {
      whereClauses.push(`location LIKE ?`);
      sqlParams.push(`%${params.location}%`);
    }

    if (params.remote !== undefined) {
      whereClauses.push(`remote = ?`);
      sqlParams.push(params.remote ? 1 : 0);
    }

    if (params.remoteType && params.remoteType !== 'ALL') {
      whereClauses.push(`remote_type = ?`);
      sqlParams.push(params.remoteType);
    }

    if (params.employmentType && params.employmentType !== 'ALL') {
      whereClauses.push(`employment_type = ?`);
      sqlParams.push(params.employmentType);
    }

    if (params.experienceLevel && params.experienceLevel !== 'ALL') {
      whereClauses.push(`experience_level = ?`);
      sqlParams.push(params.experienceLevel);
    }

    const whereSql = whereClauses.join(' AND ');

    const countRows = await this.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM jobs WHERE ${whereSql}`,
      sqlParams
    );
    const total = countRows[0]?.count || 0;

    const rows = await this.query<any>(
      `SELECT * FROM jobs WHERE ${whereSql} ORDER BY posted_at DESC LIMIT ? OFFSET ?`,
      [...sqlParams, limit, offset]
    );

    const jobs: ID1Job[] = rows.map((r) => this.formatJobRow(r));

    return {
      jobs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  public async getJobById(id: string): Promise<ID1Job | null> {
    await this.init();
    const rows = await this.query<any>('SELECT * FROM jobs WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) return null;
    return this.formatJobRow(rows[0]);
  }

  public async getAllActiveJobs(limit = 100): Promise<ID1Job[]> {
    await this.init();
    const rows = await this.query<any>(
      "SELECT * FROM jobs WHERE status = 'ACTIVE' ORDER BY posted_at DESC LIMIT ?",
      [limit]
    );
    return rows.map((r) => this.formatJobRow(r));
  }

  private formatJobRow(row: any): ID1Job {
    let skills: string[] = [];
    try {
      skills = JSON.parse(row.skills || '[]');
    } catch {
      skills = [];
    }

    return {
      id: row.id,
      title: row.title,
      company: row.company,
      companyLogo: row.company_logo || undefined,
      location: row.location,
      remote: Boolean(row.remote),
      remoteType: row.remote_type,
      employmentType: row.employment_type,
      experienceLevel: row.experience_level,
      description: row.description,
      responsibilities: row.responsibilities || undefined,
      requirements: row.requirements || undefined,
      skills,
      salaryMin: row.salary_min !== null ? row.salary_min : undefined,
      salaryMax: row.salary_max !== null ? row.salary_max : undefined,
      salaryCurrency: row.salary_currency,
      salaryPeriod: row.salary_period,
      applyUrl: row.apply_url,
      source: row.source,
      sourceUrl: row.source_url || undefined,
      postedAt: row.posted_at,
      scrapedAt: row.scraped_at,
      hash: row.hash,
      status: row.status
    };
  }
}

export const d1Client = new D1Client();
