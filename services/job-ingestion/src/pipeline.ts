import { ID1Job } from '@kraxyy/types';
import { IJobSourceAdapter, IIngestionPipelineResult } from './types';

export interface ID1JobStore {
  insertJob(job: ID1Job): Promise<{ inserted: boolean; id: string; reason?: string }>;
  generateJobHash(company: string, title: string, location: string, applyUrl: string): string;
}

export class JobIngestionPipeline {
  constructor(private store: ID1JobStore) {}

  public async run(adapter: IJobSourceAdapter): Promise<IIngestionPipelineResult> {
    const startedAt = new Date().toISOString();
    const errors: string[] = [];
    let jobsFetched = 0;
    let jobsNormalized = 0;
    let jobsStored = 0;
    let jobsDeduplicated = 0;

    try {
      // 1. FETCH
      const rawJobs = await adapter.fetchJobs();
      jobsFetched = rawJobs.length;

      for (const raw of rawJobs) {
        try {
          // 2. NORMALIZE
          const normalized = adapter.normalize(raw);
          jobsNormalized++;

          // 3. VALIDATE
          if (!normalized.title || !normalized.company || !normalized.applyUrl) {
            errors.push(`Validation failed for job externalId=${raw.externalId}: missing essential fields.`);
            continue;
          }

          // 4. DEDUPLICATE & 5. STORE IN D1
          const result = await this.store.insertJob(normalized);
          if (result.inserted) {
            jobsStored++;
          } else {
            jobsDeduplicated++;
          }
        } catch (jobErr) {
          errors.push(`Error processing job '${raw.title}': ${(jobErr as Error).message}`);
        }
      }
    } catch (adapterErr) {
      errors.push(`Adapter failure (${adapter.name}): ${(adapterErr as Error).message}`);
    }

    const completedAt = new Date().toISOString();

    return {
      sourceId: adapter.id,
      startedAt,
      completedAt,
      jobsFetched,
      jobsNormalized,
      jobsStored,
      jobsDeduplicated,
      errors
    };
  }
}
