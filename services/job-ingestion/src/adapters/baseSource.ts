import crypto from 'crypto';
import { ID1Job } from '@kraxyy/types';
import { IRawJob, IJobSourceAdapter } from '../types';

export abstract class BaseJobSourceAdapter implements IJobSourceAdapter {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly adapterType: 'CAREER_PAGE' | 'ATS_GREENHOUSE' | 'ATS_LEVER' | 'API' | 'SEARCH';

  abstract fetchJobs(): Promise<IRawJob[]>;

  public normalize(raw: IRawJob): ID1Job {
    const title = (raw.title || 'Untitled Role').trim();
    const company = (raw.company || 'Unknown Company').trim();
    const location = (raw.location || 'Remote / Flexible').trim();
    const applyUrl = (raw.applyUrl || '').trim();

    // Deterministic hash based on company + title + location + sanitized applyUrl
    const hash = this.generateHash(company, title, location, applyUrl);

    // Remote detection
    const isRemote =
      raw.isRemote ||
      /remote|anywhere|work from home|wfh/i.test(location) ||
      /remote|anywhere/i.test(title);

    let remoteType: 'REMOTE' | 'HYBRID' | 'ONSITE' = 'HYBRID';
    if (isRemote) {
      remoteType = 'REMOTE';
    } else if (/onsite|on-site|in-office/i.test(location)) {
      remoteType = 'ONSITE';
    }

    // Employment type normalization
    let employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' = 'FULL_TIME';
    const typeStr = (raw.employmentType || '').toLowerCase();
    if (/intern|co-op/i.test(typeStr) || /intern/i.test(title)) {
      employmentType = 'INTERNSHIP';
    } else if (/contract|temporary|freelance/i.test(typeStr)) {
      employmentType = 'CONTRACT';
    } else if (/part[- ]time/i.test(typeStr)) {
      employmentType = 'PART_TIME';
    }

    // Experience level normalization
    let experienceLevel: 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE' = 'MID';
    const combined = `${title} ${raw.experienceLevel || ''}`.toLowerCase();
    if (/entry|junior|jr|graduate|associate/i.test(combined)) {
      experienceLevel = 'ENTRY';
    } else if (/lead|principal|staff|architect/i.test(combined)) {
      experienceLevel = 'LEAD';
    } else if (/director|vp|head of|chief|executive/i.test(combined)) {
      experienceLevel = 'EXECUTIVE';
    } else if (/senior|sr/i.test(combined)) {
      experienceLevel = 'SENIOR';
    }

    // Skills extraction: combine explicit skills and detected keywords in description
    const extractedSkills = this.extractSkills(raw.skills || [], raw.description || '');

    return {
      id: crypto.randomUUID(),
      title,
      company,
      location,
      remote: isRemote,
      remoteType,
      employmentType,
      experienceLevel,
      description: raw.description || 'No description provided.',
      responsibilities: raw.responsibilities,
      requirements: raw.requirements,
      skills: extractedSkills,
      salaryMin: raw.salary?.min,
      salaryMax: raw.salary?.max,
      salaryCurrency: raw.salary?.currency || 'USD',
      salaryPeriod: raw.salary?.period || 'YEARLY',
      applyUrl,
      source: this.name,
      sourceUrl: raw.sourceUrl || applyUrl,
      postedAt: raw.postedDate ? new Date(raw.postedDate).toISOString() : new Date().toISOString(),
      scrapedAt: new Date().toISOString(),
      hash,
      status: 'ACTIVE'
    };
  }

  protected generateHash(company: string, title: string, location: string, applyUrl: string): string {
    const cleanUrl = applyUrl.split('?')[0].toLowerCase();
    const payload = `${company.toLowerCase()}::${title.toLowerCase()}::${location.toLowerCase()}::${cleanUrl}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  protected extractSkills(givenSkills: string[], text: string): string[] {
    const commonTechSkills = [
      'React', 'React.js', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Go', 'Golang',
      'Java', 'C++', 'Ruby', 'Rust', 'Swift', 'Kotlin', 'SQL', 'PostgreSQL', 'MySQL',
      'MongoDB', 'Redis', 'GraphQL', 'REST API', 'Docker', 'Kubernetes', 'AWS', 'GCP',
      'Azure', 'Tailwind CSS', 'Next.js', 'HTML5', 'CSS3', 'Git', 'CI/CD', 'Linux'
    ];

    const found = new Set<string>(givenSkills.map((s) => s.trim()));
    const lowerText = text.toLowerCase();

    for (const skill of commonTechSkills) {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lowerText)) {
        found.add(skill);
      }
    }

    return Array.from(found);
  }
}
