import { describe, it, expect } from 'vitest';
import { JobIngestionPipeline, BaseJobSourceAdapter, IRawJob } from '../src';

class TestMockSourceAdapter extends BaseJobSourceAdapter {
  readonly id = 'test-source';
  readonly name = 'Test Mock Source';
  readonly adapterType = 'CAREER_PAGE' as const;

  async fetchJobs(): Promise<IRawJob[]> {
    return [
      {
        externalId: 'job-101',
        title: 'Senior Software Engineer',
        company: 'Acme Corp',
        location: 'Remote',
        isRemote: true,
        applyUrl: 'https://acme.com/jobs/101',
        description: 'Build backend microservices with Node.js and TypeScript.',
        skills: ['Node.js', 'TypeScript']
      },
      {
        externalId: 'job-102',
        title: 'Frontend Engineer',
        company: 'Acme Corp',
        location: 'San Francisco, CA',
        isRemote: false,
        applyUrl: 'https://acme.com/jobs/102',
        description: 'Build React user interfaces.',
        skills: ['React']
      }
    ];
  }
}

describe('Job Ingestion Pipeline', () => {
  it('fetches, normalizes, validates, and deduplicates jobs', async () => {
    const storedHashes = new Set<string>();
    const mockStore = {
      generateJobHash: (company: string, title: string, location: string, applyUrl: string) => {
        return `${company}::${title}::${location}::${applyUrl}`;
      },
      insertJob: async (job: any) => {
        if (storedHashes.has(job.hash)) {
          return { inserted: false, id: job.id, reason: 'Duplicate' };
        }
        storedHashes.add(job.hash);
        return { inserted: true, id: job.id };
      }
    };

    const pipeline = new JobIngestionPipeline(mockStore);
    const adapter = new TestMockSourceAdapter();

    // First run
    const result1 = await pipeline.run(adapter);
    expect(result1.jobsFetched).toBe(2);
    expect(result1.jobsStored).toBe(2);
    expect(result1.jobsDeduplicated).toBe(0);

    // Second run with same jobs -> should deduplicate both!
    const result2 = await pipeline.run(adapter);
    expect(result2.jobsFetched).toBe(2);
    expect(result2.jobsStored).toBe(0);
    expect(result2.jobsDeduplicated).toBe(2);
  });
});
