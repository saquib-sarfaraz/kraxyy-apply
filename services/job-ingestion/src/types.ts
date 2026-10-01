import { ID1Job } from '@kraxyy/types';

export interface IRawJob {
  externalId?: string;
  title: string;
  company: string;
  location?: string;
  isRemote?: boolean;
  employmentType?: string;
  experienceLevel?: string;
  description: string;
  responsibilities?: string;
  requirements?: string;
  skills?: string[];
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    period?: 'YEARLY' | 'HOURLY';
  };
  applyUrl: string;
  sourceUrl?: string;
  postedDate?: string | Date;
}

export interface IJobSourceAdapter {
  readonly id: string;
  readonly name: string;
  readonly adapterType: 'CAREER_PAGE' | 'ATS_GREENHOUSE' | 'ATS_LEVER' | 'API' | 'SEARCH';
  fetchJobs(): Promise<IRawJob[]>;
  normalize(raw: IRawJob): ID1Job;
}

export interface IIngestionPipelineResult {
  sourceId: string;
  startedAt: string;
  completedAt: string;
  jobsFetched: number;
  jobsNormalized: number;
  jobsStored: number;
  jobsDeduplicated: number;
  errors: string[];
}
