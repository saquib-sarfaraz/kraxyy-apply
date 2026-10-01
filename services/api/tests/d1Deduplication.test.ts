import { describe, it, expect, beforeEach } from 'vitest';
import { D1Client } from '../src/db/d1/d1Client';

describe('Cloudflare D1 Job Index & Deduplication Engine', () => {
  let client: D1Client;

  beforeEach(async () => {
    client = new D1Client();
    await client.init();
    await client.execute('DELETE FROM jobs');
  });

  it('generates deterministic hashes ignoring query params and casing', () => {
    const hash1 = client.generateJobHash('Stripe', 'Senior Engineer', 'San Francisco', 'https://stripe.com/jobs/1?utm_source=linkedin');
    const hash2 = client.generateJobHash('stripe ', 'SENIOR ENGINEER', 'san francisco', 'https://stripe.com/jobs/1');

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex
  });

  it('inserts normalized job and prevents duplicate job hashes', async () => {
    const jobData = {
      title: 'Senior Distributed Systems Architect',
      company: 'Datadog',
      location: 'New York, NY',
      applyUrl: 'https://datadog.com/careers/arch-1',
      description: 'Design distributed streaming systems with Go and Kafka.'
    };

    const first = await client.insertJob(jobData);
    expect(first.inserted).toBe(true);
    expect(first.id).toBeDefined();

    // Attempt duplicate insertion
    const second = await client.insertJob(jobData);
    expect(second.inserted).toBe(false);
    expect(second.reason).toContain('Duplicate job hash');
  });

  it('searches and filters jobs by keyword and remote flag', async () => {
    await client.insertJob({
      title: 'Lead Frontend React Developer',
      company: 'Figma',
      location: 'San Francisco, CA',
      remote: true,
      remoteType: 'REMOTE',
      applyUrl: 'https://figma.com/careers/frontend-lead',
      description: 'Collaborate on the Figma canvas platform using React and TypeScript.',
      skills: ['React', 'TypeScript', 'WebGL']
    });

    const searchResult = await client.searchJobs({ q: 'React', remote: true });
    expect(searchResult.total).toBeGreaterThanOrEqual(1);
    expect(searchResult.jobs.some((j) => j.company === 'Figma')).toBe(true);
  });
});
