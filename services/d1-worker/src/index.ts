export interface D1Result<T = unknown> {
  results?: T[];
  success?: boolean;
  meta?: Record<string, unknown>;
  error?: string;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1Result>;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

export interface Env {
  DB: D1Database;
  D1_WORKER_API_KEY?: string;
  ENVIRONMENT?: string;
}

export interface JobInput {
  id?: string;
  source: string;
  external_id?: string;
  company: string;
  title: string;
  location: string;
  description: string;
  skills?: string[] | string;
  employment_type?: string;
  remote_type?: string;
  salary?: string;
  apply_url: string;
  posted_at?: number;
  last_seen_at?: number;
  expires_at?: number;
}

/**
 * Computes deterministic SHA-256 hash for deduplication
 */
export async function computeJobHash(
  company: string,
  title: string,
  location: string,
  applyUrl: string
): Promise<string> {
  const normCompany = (company || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const normTitle = (title || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const normLocation = (location || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  
  let cleanUrl = (applyUrl || '').trim().toLowerCase();
  try {
    const parsed = new URL(cleanUrl);
    cleanUrl = `${parsed.origin}${parsed.pathname}`.toLowerCase();
  } catch {
    // If invalid URL, use cleaned raw string
    cleanUrl = cleanUrl.split('?')[0];
  }

  const raw = `${normCompany}|${normTitle}|${normLocation}|${cleanUrl}`;
  const msgBuffer = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      ...headers,
    },
  });
}

function verifyAuth(request: Request, env: Env): boolean {
  const expectedKey = env.D1_WORKER_API_KEY || 'kraxyy_d1_worker_dev_secret_key';
  
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token === expectedKey) return true;
  }

  const apiKeyHeader = request.headers.get('X-API-Key');
  if (apiKeyHeader && apiKeyHeader.trim() === expectedKey) {
    return true;
  }

  return false;
}

export default {
  async fetch(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const pathname = url.pathname;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Health check (Public / Unauthenticated)
    if (pathname === '/health' && method === 'GET') {
      try {
        const queryResult = await env.DB.prepare('SELECT 1 as ok').first<{ ok: number }>();
        return jsonResponse({
          status: 'ok',
          d1: queryResult?.ok === 1 ? 'connected' : 'error',
          database: 'kraxyy-apply',
          databaseId: '73cc8f32-0142-4910-8361-316178e54a9f',
          timestamp: Date.now(),
        });
      } catch (err: any) {
        return jsonResponse(
          {
            status: 'error',
            d1: 'unreachable',
            error: err.message,
            timestamp: Date.now(),
          },
          500
        );
      }
    }

    // Authenticate all operational endpoints
    if (!verifyAuth(request, env)) {
      return jsonResponse(
        { error: 'Unauthorized. Invalid or missing X-API-Key or Authorization Bearer token.' },
        401
      );
    }

    try {
      // 1. GET /jobs/search
      if (pathname === '/jobs/search' && method === 'GET') {
        const q = url.searchParams.get('q') || '';
        const location = url.searchParams.get('location') || '';
        const remoteType = url.searchParams.get('remote_type') || '';
        const skill = url.searchParams.get('skill') || '';
        const company = url.searchParams.get('company') || '';
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
        const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);

        let sql = 'SELECT * FROM jobs WHERE 1=1';
        const params: any[] = [];

        if (q) {
          sql += ' AND (title LIKE ? OR description LIKE ? OR company LIKE ?)';
          const term = `%${q}%`;
          params.push(term, term, term);
        }

        if (location) {
          sql += ' AND location LIKE ?';
          params.push(`%${location}%`);
        }

        if (remoteType) {
          sql += ' AND remote_type = ?';
          params.push(remoteType);
        }

        if (company) {
          sql += ' AND company LIKE ?';
          params.push(`%${company}%`);
        }

        if (skill) {
          sql += ' AND (skills LIKE ? OR id IN (SELECT job_id FROM job_skills WHERE skill LIKE ?))';
          params.push(`%${skill}%`, `%${skill}%`);
        }

        sql += ' ORDER BY posted_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const stmt = env.DB.prepare(sql).bind(...params);
        const { results } = await stmt.all();

        return jsonResponse({
          success: true,
          count: results.length,
          limit,
          offset,
          jobs: results,
        });
      }

      // 2. GET /jobs/:id
      const jobDetailMatch = pathname.match(/^\/jobs\/([a-zA-Z0-9_-]+)$/);
      if (jobDetailMatch && method === 'GET') {
        const jobId = jobDetailMatch[1];
        const job = await env.DB.prepare('SELECT * FROM jobs WHERE id = ?').bind(jobId).first();

        if (!job) {
          return jsonResponse({ error: 'Job not found' }, 404);
        }

        const { results: skills } = await env.DB.prepare(
          'SELECT skill FROM job_skills WHERE job_id = ?'
        )
          .bind(jobId)
          .all<{ skill: string }>();

        return jsonResponse({
          success: true,
          job: {
            ...job,
            skillsList: skills.map(s => s.skill),
          },
        });
      }

      // 3. DELETE /jobs/:id
      if (jobDetailMatch && method === 'DELETE') {
        const jobId = jobDetailMatch[1];
        await env.DB.batch([
          env.DB.prepare('DELETE FROM job_skills WHERE job_id = ?').bind(jobId),
          env.DB.prepare('DELETE FROM jobs WHERE id = ?').bind(jobId),
        ]);

        return jsonResponse({
          success: true,
          message: `Job ${jobId} deleted successfully`,
        });
      }

      // 4. GET /jobs (List)
      if (pathname === '/jobs' && method === 'GET') {
        const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10), 1);
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
        const source = url.searchParams.get('source');
        const remoteType = url.searchParams.get('remote_type');
        const company = url.searchParams.get('company');
        const offset = (page - 1) * limit;

        let sql = 'SELECT * FROM jobs WHERE 1=1';
        let countSql = 'SELECT COUNT(*) as total FROM jobs WHERE 1=1';
        const params: any[] = [];
        const countParams: any[] = [];

        if (source) {
          sql += ' AND source = ?';
          countSql += ' AND source = ?';
          params.push(source);
          countParams.push(source);
        }

        if (remoteType) {
          sql += ' AND remote_type = ?';
          countSql += ' AND remote_type = ?';
          params.push(remoteType);
          countParams.push(remoteType);
        }

        if (company) {
          sql += ' AND company LIKE ?';
          countSql += ' AND company LIKE ?';
          params.push(`%${company}%`);
          countParams.push(`%${company}%`);
        }

        sql += ' ORDER BY posted_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [jobsResult, countResult] = await Promise.all([
          env.DB.prepare(sql).bind(...params).all(),
          env.DB.prepare(countSql).bind(...countParams).first<{ total: number }>(),
        ]);

        const total = countResult?.total || 0;

        return jsonResponse({
          success: true,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
          jobs: jobsResult.results,
        });
      }

      // 5. POST /jobs (Single Insert with Deduplication)
      if (pathname === '/jobs' && method === 'POST') {
        const body = (await request.json()) as JobInput;

        if (!body.company || !body.title || !body.location || !body.apply_url) {
          return jsonResponse(
            { error: 'Missing required fields: company, title, location, apply_url are mandatory.' },
            400
          );
        }

        const hash = await computeJobHash(body.company, body.title, body.location, body.apply_url);
        const existing = await env.DB.prepare('SELECT id FROM jobs WHERE hash = ?').bind(hash).first<{ id: string }>();

        if (existing) {
          // Update last_seen_at
          const now = Date.now();
          await env.DB.prepare('UPDATE jobs SET last_seen_at = ? WHERE id = ?').bind(now, existing.id).run();
          return jsonResponse(
            {
              success: true,
              duplicate: true,
              message: 'Job already exists. Updated last_seen_at timestamp.',
              jobId: existing.id,
            },
            200
          );
        }

        const id = body.id || `job_${crypto.randomUUID()}`;
        const now = Date.now();
        const skillsArray = Array.isArray(body.skills)
          ? body.skills
          : typeof body.skills === 'string'
          ? body.skills.split(',').map(s => s.trim()).filter(Boolean)
          : [];

        const skillsSerialized = JSON.stringify(skillsArray);

        const insertStmt = env.DB.prepare(`
          INSERT INTO jobs (
            id, hash, source, external_id, company, title, location,
            description, skills, employment_type, remote_type, salary,
            apply_url, posted_at, last_seen_at, expires_at, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id,
          hash,
          body.source || 'MANUAL',
          body.external_id || null,
          body.company.trim(),
          body.title.trim(),
          body.location.trim(),
          body.description || '',
          skillsSerialized,
          body.employment_type || 'FULL_TIME',
          body.remote_type || 'ONSITE',
          body.salary || null,
          body.apply_url.trim(),
          body.posted_at || now,
          now,
          body.expires_at || null,
          now
        );

        const batchStatements = [insertStmt];
        for (const sk of skillsArray) {
          const skillId = `jsk_${crypto.randomUUID()}`;
          batchStatements.push(
            env.DB.prepare('INSERT INTO job_skills (id, job_id, skill, created_at) VALUES (?, ?, ?, ?)').bind(
              skillId,
              id,
              sk.toLowerCase(),
              now
            )
          );
        }

        await env.DB.batch(batchStatements);

        return jsonResponse(
          {
            success: true,
            jobId: id,
            hash,
            message: 'Job indexed successfully in D1.',
          },
          201
        );
      }

      // 6. POST /jobs/bulk (Bulk Ingestion with Deduplication)
      if (pathname === '/jobs/bulk' && method === 'POST') {
        const body = (await request.json()) as { jobs: JobInput[]; source?: string };
        const jobs = body.jobs || [];

        if (!Array.isArray(jobs) || jobs.length === 0) {
          return jsonResponse({ error: 'Payload must contain a non-empty array of jobs.' }, 400);
        }

        const now = Date.now();
        let inserted = 0;
        let skippedDuplicates = 0;
        const insertedIds: string[] = [];

        // Process sequentially or in chunks to prevent D1 statement limits
        for (const item of jobs) {
          if (!item.company || !item.title || !item.location || !item.apply_url) {
            continue;
          }

          const hash = await computeJobHash(item.company, item.title, item.location, item.apply_url);
          const existing = await env.DB.prepare('SELECT id FROM jobs WHERE hash = ?').bind(hash).first<{ id: string }>();

          if (existing) {
            skippedDuplicates++;
            await env.DB.prepare('UPDATE jobs SET last_seen_at = ? WHERE id = ?').bind(now, existing.id).run();
            continue;
          }

          const id = item.id || `job_${crypto.randomUUID()}`;
          const skillsArray = Array.isArray(item.skills)
            ? item.skills
            : typeof item.skills === 'string'
            ? item.skills.split(',').map(s => s.trim()).filter(Boolean)
            : [];

          const skillsSerialized = JSON.stringify(skillsArray);

          const insertJobStmt = env.DB.prepare(`
            INSERT INTO jobs (
              id, hash, source, external_id, company, title, location,
              description, skills, employment_type, remote_type, salary,
              apply_url, posted_at, last_seen_at, expires_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            id,
            hash,
            item.source || body.source || 'BULK_INGEST',
            item.external_id || null,
            item.company.trim(),
            item.title.trim(),
            item.location.trim(),
            item.description || '',
            skillsSerialized,
            item.employment_type || 'FULL_TIME',
            item.remote_type || 'ONSITE',
            item.salary || null,
            item.apply_url.trim(),
            item.posted_at || now,
            now,
            item.expires_at || null,
            now
          );

          const statements = [insertJobStmt];
          for (const sk of skillsArray) {
            const skillId = `jsk_${crypto.randomUUID()}`;
            statements.push(
              env.DB.prepare('INSERT INTO job_skills (id, job_id, skill, created_at) VALUES (?, ?, ?, ?)').bind(
                skillId,
                id,
                sk.toLowerCase(),
                now
              )
            );
          }

          await env.DB.batch(statements);
          inserted++;
          insertedIds.push(id);
        }

        return jsonResponse({
          success: true,
          totalReceived: jobs.length,
          inserted,
          skippedDuplicates,
          insertedIds,
        });
      }

      return jsonResponse({ error: `Not found: ${method} ${pathname}` }, 404);
    } catch (err: any) {
      return jsonResponse({ error: 'Internal Server Error', details: err.message }, 500);
    }
  },
};
