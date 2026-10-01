import { BaseJobSourceAdapter } from './baseSource';
import { IRawJob } from '../types';

export class GreenhouseSourceAdapter extends BaseJobSourceAdapter {
  readonly id = 'ats-greenhouse';
  readonly name = 'Greenhouse ATS Feed';
  readonly adapterType = 'ATS_GREENHOUSE' as const;

  constructor(private companySlug: string = 'stripe') {
    super();
  }

  async fetchJobs(): Promise<IRawJob[]> {
    try {
      const url = `https://boards-api.greenhouse.io/v1/boards/${this.companySlug}/jobs?content=true`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Kraxyy-Ingestion-Bot/1.0' } });
      if (!res.ok) {
        return [];
      }
      const data = await res.json() as { jobs: any[] };
      if (!data?.jobs || !Array.isArray(data.jobs)) return [];

      return data.jobs.map((j) => ({
        externalId: String(j.id),
        title: j.title,
        company: this.companySlug.charAt(0).toUpperCase() + this.companySlug.slice(1),
        location: j.location?.name || 'Remote',
        description: j.content || j.title,
        applyUrl: j.absolute_url,
        postedDate: j.updated_at || new Date().toISOString()
      }));
    } catch {
      return [];
    }
  }
}

export class LeverSourceAdapter extends BaseJobSourceAdapter {
  readonly id = 'ats-lever';
  readonly name = 'Lever ATS Feed';
  readonly adapterType = 'ATS_LEVER' as const;

  constructor(private companySlug: string = 'netflix') {
    super();
  }

  async fetchJobs(): Promise<IRawJob[]> {
    try {
      const url = `https://api.lever.co/v0/postings/${this.companySlug}?mode=json`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Kraxyy-Ingestion-Bot/1.0' } });
      if (!res.ok) {
        return [];
      }
      const data = await res.json() as any[];
      if (!Array.isArray(data)) return [];

      return data.map((j) => ({
        externalId: String(j.id),
        title: j.text,
        company: this.companySlug.charAt(0).toUpperCase() + this.companySlug.slice(1),
        location: j.categories?.location || 'Remote',
        description: j.descriptionPlain || j.text,
        applyUrl: j.hostedUrl || j.applyUrl,
        postedDate: j.createdAt ? new Date(j.createdAt).toISOString() : new Date().toISOString()
      }));
    } catch {
      return [];
    }
  }
}
