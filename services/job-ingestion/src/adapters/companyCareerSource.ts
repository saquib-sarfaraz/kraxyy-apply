import { BaseJobSourceAdapter } from './baseSource';
import { IRawJob } from '../types';

export class CompanyCareerSourceAdapter extends BaseJobSourceAdapter {
  readonly id: string;
  readonly name: string;
  readonly adapterType = 'CAREER_PAGE' as const;

  constructor(
    private companyName: string,
    private feedUrl: string,
    idPrefix: string = 'career-page'
  ) {
    super();
    this.id = `${idPrefix}-${companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    this.name = `${companyName} Careers`;
  }

  async fetchJobs(): Promise<IRawJob[]> {
    try {
      const res = await fetch(this.feedUrl, { headers: { 'User-Agent': 'Kraxyy-Ingestion-Bot/1.0' } });
      if (!res.ok) return [];
      const json = await res.json() as any[];
      if (!Array.isArray(json)) return [];

      return json.map((item) => ({
        externalId: String(item.id || item.slug || Math.random()),
        title: item.title || item.position,
        company: this.companyName,
        location: item.location || 'Remote',
        isRemote: Boolean(item.isRemote || item.remote),
        description: item.description || item.summary || item.title,
        responsibilities: item.responsibilities,
        requirements: item.requirements,
        skills: item.skills || [],
        salary: item.salary,
        applyUrl: item.applyUrl || item.url || this.feedUrl,
        postedDate: item.postedDate || item.createdAt || new Date().toISOString()
      }));
    } catch {
      return [];
    }
  }
}

export class ApiJobSourceAdapter extends BaseJobSourceAdapter {
  readonly id: string;
  readonly name: string;
  readonly adapterType = 'API' as const;

  constructor(
    id: string,
    name: string,
    private apiUrl: string,
    private apiKey?: string
  ) {
    super();
    this.id = id;
    this.name = name;
  }

  async fetchJobs(): Promise<IRawJob[]> {
    try {
      const headers: Record<string, string> = { 'User-Agent': 'Kraxyy-Ingestion-Bot/1.0' };
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const res = await fetch(this.apiUrl, { headers });
      if (!res.ok) return [];
      const data = await res.json() as { jobs?: any[] } | any[];
      const items = Array.isArray(data) ? data : data.jobs || [];

      return items.map((j: any) => ({
        externalId: String(j.id || j.externalId),
        title: j.title || j.role,
        company: j.company || j.employer,
        location: j.location,
        isRemote: Boolean(j.remote),
        description: j.description,
        skills: j.skills || j.tags || [],
        applyUrl: j.applyUrl || j.url,
        postedDate: j.postedDate || j.date
      }));
    } catch {
      return [];
    }
  }
}
