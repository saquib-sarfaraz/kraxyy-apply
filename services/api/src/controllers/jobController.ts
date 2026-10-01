import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { SavedJobModel } from '../models/SavedJob';
import { d1Client } from '../db/d1/d1Client';
import { matchingEngine } from '@kraxyy/matching';
import { profileService } from '../services/profileService';
import { ApiError } from '../utils/apiError';
import { ID1Job } from '@kraxyy/types';

export class JobController {
  /**
   * Search jobs from the Cloudflare D1 job-index database
   */
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, location, remote, remoteType, employmentType, experienceLevel, page = '1', limit = '15' } = req.query;

      // Seed initial jobs into D1 if empty
      await this.ensureSeedJobs();

      const result = await d1Client.searchJobs({
        q: q ? String(q) : undefined,
        location: location ? String(location) : undefined,
        remote: remote !== undefined ? remote === 'true' : undefined,
        remoteType: remoteType ? String(remoteType) : undefined,
        employmentType: employmentType ? String(employmentType) : undefined,
        experienceLevel: experienceLevel ? String(experienceLevel) : undefined,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10)
      });

      res.json({
        success: true,
        data: result.jobs,
        pagination: {
          page: result.page,
          limit: parseInt(limit as string, 10),
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single job by ID from D1
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      await this.ensureSeedJobs();
      const job = await d1Client.getJobById(req.params.id);
      if (!job) {
        throw ApiError.notFound('Job posting not found');
      }

      res.json({
        success: true,
        data: job
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Calculate match score between authenticated user profile and a specific job
   */
  async getJobMatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const jobId = req.params.jobId || req.params.id;
      const job = await d1Client.getJobById(jobId);
      if (!job) {
        throw ApiError.notFound('Job posting not found for matching');
      }

      const profile = await profileService.getProfileByUserId(req.user!.id);
      const matchBreakdown = matchingEngine.calculateMatch(profile, job);

      res.json({
        success: true,
        data: {
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          match: matchBreakdown
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieve personalized recommended jobs ranked by match score
   */
  async getRecommended(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await this.ensureSeedJobs();
      const profile = await profileService.getProfileByUserId(req.user!.id);
      const allJobs = await d1Client.getAllActiveJobs(50);

      // Score each job with the versioned matching engine
      const scoredJobs = allJobs.map((job) => {
        const match = matchingEngine.calculateMatch(profile, job);
        return {
          ...job,
          matchScore: match.overallScore,
          match
        };
      });

      // Rank by match score descending
      scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

      res.json({
        success: true,
        data: scoredJobs.slice(0, 20)
      });
    } catch (err) {
      next(err);
    }
  }

  async saveJob(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = new mongoose.Types.ObjectId(req.user!.id);
      const jobId = req.params.id;

      await SavedJobModel.findOneAndUpdate(
        { userId, jobId },
        { userId, jobId },
        { upsert: true, new: true }
      );

      res.json({
        success: true,
        data: { saved: true },
        message: 'Job saved successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Save an external job detected by the Chrome extension
   */
  async saveExternalJob(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { job } = req.body;
      if (!job || !job.title || !job.company) {
        throw ApiError.badRequest('Job details (title, company) are required');
      }

      const userId = new mongoose.Types.ObjectId(req.user!.id);

      // Ingest/upsert the job into D1 if not already present
      const d1Result = await d1Client.insertJob({
        title: job.title,
        company: job.company,
        location: job.location || 'Remote',
        applyUrl: job.applyUrl || job.url || (req.headers.referer as string) || '',
        description: job.description || `${job.title} at ${job.company}`,
        requirements: Array.isArray(job.requirements) ? job.requirements.join(' ') : (job.requirements || ''),
        skills: Array.isArray(job.skills) ? job.skills : [],
        remote: job.remote ?? false,
        source: job.source ? `Extension (${job.source})` : 'Extension Scraped',
        sourceUrl: job.url || ''
      });

      const jobId = d1Result.id;

      // Save to user's saved jobs
      await SavedJobModel.findOneAndUpdate(
        { userId, jobId },
        { userId, jobId },
        { upsert: true, new: true }
      );

      res.json({
        success: true,
        data: {
          saved: true,
          jobId,
          title: job.title,
          company: job.company
        },
        message: 'Job successfully saved to your Kraxyy profile'
      });
    } catch (err) {
      next(err);
    }
  }

  async unsaveJob(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = new mongoose.Types.ObjectId(req.user!.id);
      const jobId = req.params.id;

      await SavedJobModel.deleteOne({ userId, jobId });

      res.json({
        success: true,
        data: { saved: false },
        message: 'Job removed from saved list'
      });
    } catch (err) {
      next(err);
    }
  }

  async listSaved(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = new mongoose.Types.ObjectId(req.user!.id);
      const saved = await SavedJobModel.find({ userId }).sort({ createdAt: -1 });

      const enriched = await Promise.all(
        saved.map(async (s) => {
          const job = await d1Client.getJobById(s.jobId.toString());
          return {
            id: s._id.toString(),
            jobId: s.jobId.toString(),
            savedAt: s.createdAt.toISOString(),
            job: job || null
          };
        })
      );

      res.json({
        success: true,
        data: enriched
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Populate D1 with initial realistic job postings if empty
   */
  private async ensureSeedJobs() {
    try {
      const existing = await d1Client.getAllActiveJobs(1);
      if (existing.length > 0) return;

      const seedJobs: Array<Partial<ID1Job> & { title: string; company: string; location: string; applyUrl: string; description: string }> = [
        {
          title: 'Senior Full-Stack Engineer',
          company: 'Stripe',
          location: 'San Francisco, CA (Remote)',
          remote: true,
          remoteType: 'REMOTE',
          employmentType: 'FULL_TIME',
          experienceLevel: 'SENIOR',
          description: 'Build mission-critical billing infrastructure and delightful developer interfaces using React, TypeScript, and Node.js microservices. You will scale reliable payment integrations across global networks.',
          responsibilities: 'Architect high-throughput payment systems, design clean TypeScript frontend interfaces, optimize SQL queries.',
          requirements: '5+ years experience in full-stack engineering with modern React, TypeScript, and distributed backend systems.',
          skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'REST API', 'AWS'],
          salaryMin: 175000,
          salaryMax: 225000,
          salaryCurrency: 'USD',
          salaryPeriod: 'YEARLY',
          applyUrl: 'https://boards.greenhouse.io/stripe/jobs/4829102',
          source: 'Greenhouse ATS'
        },
        {
          title: 'Frontend Platform Engineer',
          company: 'Figma',
          location: 'San Francisco, CA',
          remote: false,
          remoteType: 'HYBRID',
          employmentType: 'FULL_TIME',
          experienceLevel: 'MID',
          description: 'Join the Figma design systems and web platform team to build performant, accessible UI primitives and collaborative canvas features using React, TypeScript, and WebGL.',
          responsibilities: 'Develop reusable component systems, optimize render lifecycles, craft pixel-perfect user experiences.',
          requirements: '3+ years experience with modern JavaScript/TypeScript, React state management, and responsive CSS architectures.',
          skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'HTML5', 'CSS3', 'Jest'],
          salaryMin: 145000,
          salaryMax: 185000,
          salaryCurrency: 'USD',
          salaryPeriod: 'YEARLY',
          applyUrl: 'https://jobs.lever.co/figma/87219024',
          source: 'Lever ATS'
        },
        {
          title: 'Backend Systems Engineer',
          company: 'Datadog',
          location: 'New York, NY (Remote)',
          remote: true,
          remoteType: 'REMOTE',
          employmentType: 'FULL_TIME',
          experienceLevel: 'SENIOR',
          description: 'Engineer high-performance telemetry intake pipelines that ingest trillions of events per day. Work with Go, Python, distributed Kafka clusters, and cloud infrastructure.',
          responsibilities: 'Design and deploy resilient streaming pipelines, build low-latency APIs, manage cloud infrastructure.',
          requirements: '4+ years building distributed backend services in Go or Python with distributed systems experience.',
          skills: ['Go', 'Python', 'Kubernetes', 'Docker', 'Redis', 'PostgreSQL', 'CI/CD'],
          salaryMin: 165000,
          salaryMax: 210000,
          salaryCurrency: 'USD',
          salaryPeriod: 'YEARLY',
          applyUrl: 'https://boards.greenhouse.io/datadog/jobs/3910294',
          source: 'Greenhouse ATS'
        },
        {
          title: 'Full-Stack Software Engineer',
          company: 'Vercel',
          location: 'Remote (Global)',
          remote: true,
          remoteType: 'REMOTE',
          employmentType: 'FULL_TIME',
          experienceLevel: 'MID',
          description: 'Build Next.js developer tools, edge functions, and preview deployments. Help millions of developers ship fast web applications worldwide.',
          responsibilities: 'Ship features across frontend and edge runtimes, write automated tests, collaborate on open-source repositories.',
          requirements: '2+ years experience building React/Next.js web applications and serverless APIs.',
          skills: ['Next.js', 'React', 'TypeScript', 'Node.js', 'Tailwind CSS', 'GraphQL'],
          salaryMin: 135000,
          salaryMax: 175000,
          salaryCurrency: 'USD',
          salaryPeriod: 'YEARLY',
          applyUrl: 'https://boards.greenhouse.io/vercel/jobs/5910283',
          source: 'Greenhouse ATS'
        },
        {
          title: 'AI Application Engineer',
          company: 'Anthropic',
          location: 'San Francisco, CA (Hybrid)',
          remote: false,
          remoteType: 'HYBRID',
          employmentType: 'FULL_TIME',
          experienceLevel: 'SENIOR',
          description: 'Build interfaces, SDKs, and workflow integrations powering Claude. You will bridge complex model capabilities with responsive, intuitive user experiences.',
          responsibilities: 'Integrate LLM streaming APIs, build intuitive chat and workflow interfaces, design prompt evaluation pipelines.',
          requirements: '4+ years full-stack experience with deep understanding of AI integrations and web standards.',
          skills: ['Python', 'TypeScript', 'React', 'FastAPI', 'PostgreSQL', 'Docker'],
          salaryMin: 190000,
          salaryMax: 260000,
          salaryCurrency: 'USD',
          salaryPeriod: 'YEARLY',
          applyUrl: 'https://jobs.lever.co/anthropic/91823019',
          source: 'Lever ATS'
        }
      ];

      for (const j of seedJobs) {
        await d1Client.insertJob(j);
      }
    } catch {
      // Ignore seed errors if already running
    }
  }
}

export const jobController = new JobController();
