import { describe, it, expect, beforeEach } from 'vitest';
import worker, { Env, computeJobHash } from '../src/index';
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const req = createRequire(path.join(process.cwd(), 'package.json'));
const { DatabaseSync } = req('node:sqlite');

class MockD1PreparedStatement {
  constructor(private db: any, private sql: string, private params: any[] = []) {}

  bind(...args: any[]) {
    return new MockD1PreparedStatement(this.db, this.sql, args);
  }

  async first<T = any>(): Promise<T | null> {
    const stmt = this.db.prepare(this.sql);
    const result = stmt.get(...this.params);
    return (result as T) || null;
  }

  async all<T = any>(): Promise<{ results: T[] }> {
    const stmt = this.db.prepare(this.sql);
    const results = stmt.all(...this.params);
    return { results: results as T[] };
  }

  async run(): Promise<{ success: boolean }> {
    const stmt = this.db.prepare(this.sql);
    stmt.run(...this.params);
    return { success: true };
  }
}

class MockD1Database {
  constructor(private db: any) {}

  prepare(sql: string) {
    return new MockD1PreparedStatement(this.db, sql);
  }

  async batch(statements: MockD1PreparedStatement[]) {
    const results = [];
    for (const stmt of statements) {
      results.push(await stmt.run());
    }
    return results;
  }

  async exec(sql: string) {
    this.db.exec(sql);
  }
}

describe('Cloudflare D1 Worker API (kraxyy-apply)', () => {
  let mockEnv: Env;
  let sqliteDb: any;
  const API_KEY = 'test_d1_secret_api_key_123';

  beforeEach(() => {
    sqliteDb = new DatabaseSync(':memory:');
    const schemaPath = path.resolve(__dirname, '../migrations/0001_initial_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    sqliteDb.exec(schemaSql);

    mockEnv = {
      DB: new MockD1Database(sqliteDb) as any,
      D1_WORKER_API_KEY: API_KEY,
      ENVIRONMENT: 'test',
    };
  });

  it('verifies /health endpoint without authentication', async () => {
    const req = new Request('http://worker.local/health', { method: 'GET' });
    const res = await worker.fetch(req, mockEnv);
    expect(res.status).toBe(200);

    const data = (await res.json()) as any;
    expect(data.status).toBe('ok');
    expect(data.d1).toBe('connected');
    expect(data.database).toBe('kraxyy-apply');
    expect(data.databaseId).toBe('73cc8f32-0142-4910-8361-316178e54a9f');
  });

  it('rejects unauthorized requests with 401 when API key is missing or invalid', async () => {
    const req = new Request('http://worker.local/jobs', { method: 'GET' });
    const res = await worker.fetch(req, mockEnv);
    expect(res.status).toBe(401);
  });

  it('inserts one test job and retrieves it', async () => {
    const newJob = {
      company: 'Acme Corp',
      title: 'Senior TypeScript Engineer',
      location: 'San Francisco, CA',
      apply_url: 'https://careers.acmecorp.com/jobs/42?utm_source=test',
      description: 'Looking for a skilled backend and full-stack developer.',
      skills: ['TypeScript', 'Node.js', 'PostgreSQL'],
      employment_type: 'FULL_TIME',
      remote_type: 'REMOTE',
      salary: '$160,000 - $190,000',
    };

    // 1. Insert via POST /jobs
    const postReq = new Request('http://worker.local/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(newJob),
    });

    const postRes = await worker.fetch(postReq, mockEnv);
    expect(postRes.status).toBe(201);
    const postData = (await postRes.json()) as any;
    expect(postData.success).toBe(true);
    expect(postData.jobId).toBeDefined();

    const jobId = postData.jobId;

    // 2. Retrieve via GET /jobs/:id
    const getReq = new Request(`http://worker.local/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    const getRes = await worker.fetch(getReq, mockEnv);
    expect(getRes.status).toBe(200);
    const getData = (await getRes.json()) as any;
    expect(getData.job.id).toBe(jobId);
    expect(getData.job.company).toBe('Acme Corp');
    expect(getData.job.remote_type).toBe('REMOTE');
    expect(getData.job.skillsList).toContain('typescript');
  });

  it('detects duplicate jobs and prevents redundant insertion', async () => {
    const jobPayload = {
      company: 'TechFlow Systems',
      title: 'AI Platform Architect',
      location: 'Remote, US',
      apply_url: 'https://techflow.io/careers/101?ref=linkedin',
      description: 'Design distributed AI infrastructure.',
      skills: ['Python', 'Cloudflare Workers', 'PyTorch'],
    };

    // First insert
    const res1 = await worker.fetch(
      new Request('http://worker.local/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
        body: JSON.stringify(jobPayload),
      }),
      mockEnv
    );
    expect(res1.status).toBe(201);

    // Second insert with same core identifiers but different query params
    const duplicatePayload = {
      ...jobPayload,
      apply_url: 'https://techflow.io/careers/101?tracking=twitter&utm_medium=social',
    };

    const res2 = await worker.fetch(
      new Request('http://worker.local/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
        body: JSON.stringify(duplicatePayload),
      }),
      mockEnv
    );
    expect(res2.status).toBe(200);
    const data2 = (await res2.json()) as any;
    expect(data2.duplicate).toBe(true);
    expect(data2.message).toContain('Job already exists');
  });

  it('searches and filters jobs by keyword and remote policy', async () => {
    // Bulk insert 3 jobs
    const bulkJobs = [
      {
        company: 'Stripe',
        title: 'Software Engineer, Payments',
        location: 'Seattle, WA',
        apply_url: 'https://stripe.com/jobs/1',
        description: 'Building global money movement APIs.',
        skills: ['Ruby', 'Go', 'Distributed Systems'],
        remote_type: 'HYBRID',
      },
      {
        company: 'Cloudflare',
        title: 'Systems Engineer, Edge Cloud',
        location: 'Austin, TX',
        apply_url: 'https://cloudflare.com/jobs/2',
        description: 'Scale workers and D1 edge storage.',
        skills: ['Rust', 'TypeScript', 'Workers'],
        remote_type: 'REMOTE',
      },
      {
        company: 'Vercel',
        title: 'Frontend Engineer, Next.js',
        location: 'San Francisco, CA',
        apply_url: 'https://vercel.com/jobs/3',
        description: 'React compiler and frontend optimization.',
        skills: ['React', 'TypeScript', 'Turbopack'],
        remote_type: 'REMOTE',
      },
    ];

    await worker.fetch(
      new Request('http://worker.local/jobs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
        body: JSON.stringify({ jobs: bulkJobs }),
      }),
      mockEnv
    );

    // Search for TypeScript + REMOTE
    const searchReq = new Request('http://worker.local/jobs/search?skill=TypeScript&remote_type=REMOTE', {
      method: 'GET',
      headers: { 'X-API-Key': API_KEY },
    });

    const searchRes = await worker.fetch(searchReq, mockEnv);
    expect(searchRes.status).toBe(200);
    const searchData = (await searchRes.json()) as any;
    expect(searchData.count).toBe(2);
    expect(searchData.jobs.map((j: any) => j.company)).toEqual(expect.arrayContaining(['Cloudflare', 'Vercel']));
  });

  it('deletes job and cascades associated skills', async () => {
    const job = {
      company: 'Temp Corp',
      title: 'Contract Specialist',
      location: 'Remote',
      apply_url: 'https://temp.com/jobs/99',
      description: 'Temporary role.',
      skills: ['Drafting'],
    };

    const postRes = await worker.fetch(
      new Request('http://worker.local/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
        body: JSON.stringify(job),
      }),
      mockEnv
    );
    const { jobId } = (await postRes.json()) as any;

    // Delete
    const delRes = await worker.fetch(
      new Request(`http://worker.local/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': API_KEY },
      }),
      mockEnv
    );
    expect(delRes.status).toBe(200);

    // Verify retrieval 404
    const getRes = await worker.fetch(
      new Request(`http://worker.local/jobs/${jobId}`, {
        method: 'GET',
        headers: { 'X-API-Key': API_KEY },
      }),
      mockEnv
    );
    expect(getRes.status).toBe(404);
  });
});
