import { IJobPageDetection, JobExtractionSource } from '@kraxyy/types';
import { jobExtractor } from './jobExtractor';

export class JobPageDetector {
  /**
   * Detects whether the current page represents a legitimate job posting.
   * Uses multi-signal heuristics: JSON-LD JobPosting schema, OpenGraph tags,
   * career page headings, description keywords, and apply triggers.
   */
  detectJob(doc: Document = document): IJobPageDetection {
    console.log('[KRAXYY][JOB] Detector started');

    let result: IJobPageDetection = {
      isJobPage: false,
      confidence: 0,
      source: 'GENERIC'
    };

    // 1. Signal A: Schema.org JSON-LD JobPosting (Highest confidence)
    const jsonLdScript = this.findJsonLdJobPosting(doc);
    if (jsonLdScript) {
      const extracted = jobExtractor.extractFromJsonLd(jsonLdScript, doc.location.href);
      if (extracted && extracted.title && extracted.title.length > 2) {
        result = {
          isJobPage: true,
          confidence: 0.96,
          source: 'JSON_LD',
          job: extracted,
          characterCount: extracted.description.length
        };
        console.log('[KRAXYY][JOB] Detection result: YES (JSON_LD)', result.job?.title);
        return result;
      }
    }

    // 2. Signal B: Platform Specific DOM Adapters (LinkedIn, Greenhouse, Lever, Workday)
    const adapterMatch = jobExtractor.extractFromPlatformAdapter(doc);
    if (adapterMatch) {
      result = {
        isJobPage: true,
        confidence: adapterMatch.confidence,
        source: adapterMatch.source,
        job: adapterMatch.job,
        characterCount: adapterMatch.job.description.length
      };
      console.log(`[KRAXYY][JOB] Detection result: YES (${adapterMatch.source})`, result.job?.title);
      return result;
    }

    // 3. Signal C: Generic DOM & Semantic HTML Heuristics
    const genericResult = this.evaluateGenericJobPage(doc);
    if (genericResult.isJobPage) {
      result = {
        isJobPage: true,
        confidence: genericResult.confidence,
        source: 'GENERIC',
        job: genericResult.job,
        characterCount: genericResult.job?.description?.length || 0
      };
      console.log('[KRAXYY][JOB] Detection result: YES (GENERIC)', result.job?.title);
      return result;
    }

    console.log('[KRAXYY][JOB] Detection result: NO (confidence: 0)');
    return result;
  }

  private findJsonLdJobPosting(doc: Document): any | null {
    try {
      const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
      for (const script of Array.from(scripts)) {
        try {
          const data = JSON.parse(script.textContent || '{}');
          if (data['@type'] === 'JobPosting') return data;
          if (Array.isArray(data)) {
            const found = data.find((item) => item['@type'] === 'JobPosting');
            if (found) return found;
          }
          if (data['@graph'] && Array.isArray(data['@graph'])) {
            const found = data['@graph'].find((item: any) => item['@type'] === 'JobPosting');
            if (found) return found;
          }
        } catch {}
      }
    } catch {}
    return null;
  }

  private evaluateGenericJobPage(doc: Document): { isJobPage: boolean; confidence: number; job: any } {
    const pageText = (doc.body?.textContent || (doc.body as any)?.innerText || '').toLowerCase();
    let score = 0;

    // A. Check for Job Description Section Headings
    const sectionKeywords = [
      'about the job',
      'about this job',
      'about this role',
      'about the role',
      'job description',
      'responsibilities',
      'key responsibilities',
      'what you will do',
      "what you'll do",
      'requirements',
      'qualifications',
      'basic qualifications',
      'preferred qualifications',
      "what we're looking for",
      'what we are looking for',
      'who you are',
      'what you will bring',
      'skills & requirements',
      'experience required'
    ];

    let matchedSections = 0;
    for (const kw of sectionKeywords) {
      if (pageText.includes(kw)) matchedSections++;
    }

    if (matchedSections >= 3) score += 0.45;
    else if (matchedSections >= 2) score += 0.35;
    else if (matchedSections >= 1) score += 0.25;

    // B. Check for Primary Heading containing Job Role Titles
    const h1El = doc.querySelector('h1, h2');
    const h1Text = (h1El?.textContent || (h1El as any)?.innerText || '').trim();
    const titleRoleKeywords = [
      'engineer', 'developer', 'manager', 'designer', 'analyst', 'specialist',
      'intern', 'associate', 'architect', 'lead', 'director', 'consultant', 'scientist',
      'officer', 'trainee', 'representative', 'coordinator', 'head', 'administrator'
    ];

    const hasTitleSignal = titleRoleKeywords.some((kw) => h1Text.toLowerCase().includes(kw));
    if (hasTitleSignal) score += 0.30;

    // C. Check for Apply Buttons or Links
    const applyButtons = doc.querySelectorAll(
      'a[href*="apply"], button[id*="apply"], button[class*="apply"], [aria-label*="apply" i], a[class*="apply"], .jobs-apply-button'
    );
    if (applyButtons.length > 0) score += 0.25;

    // D. OpenGraph Job/Article metadata
    const ogType = doc.querySelector('meta[property="og:type"]')?.getAttribute('content');
    if (ogType === 'article' || ogType === 'job') score += 0.10;

    // E. URL Signals
    const url = (doc.location?.href || '').toLowerCase();
    if (url.includes('/jobs/') || url.includes('/job/') || url.includes('/careers/') || url.includes('/positions/') || url.includes('/openings/')) {
      score += 0.20;
    }

    const confidence = Math.min(0.95, score);
    const isJobPage = confidence >= 0.45;

    let job: any = null;
    if (isJobPage) {
      job = jobExtractor.extractFromGenericDom(doc);
    }

    return { isJobPage, confidence, job };
  }
}

export const jobPageDetector = new JobPageDetector();
