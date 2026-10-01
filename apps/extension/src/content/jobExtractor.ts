import { INormalizedJob, JobExtractionSource } from '@kraxyy/types';

export class JobExtractor {
  /**
   * Extracts structured job details from Schema.org JSON-LD data
   */
  extractFromJsonLd(data: any, pageUrl: string): INormalizedJob {
    const title = data.title || data.name || '';
    const company =
      typeof data.hiringOrganization === 'string'
        ? data.hiringOrganization
        : data.hiringOrganization?.name || '';

    // Location
    let location = 'Remote';
    if (data.jobLocation) {
      const loc = Array.isArray(data.jobLocation) ? data.jobLocation[0] : data.jobLocation;
      const addr = loc.address;
      if (typeof addr === 'string') {
        location = addr;
      } else if (addr) {
        const parts = [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean);
        if (parts.length > 0) location = parts.join(', ');
      }
    }

    // Description text
    const rawDesc = data.description || '';
    const cleanDesc = this.stripHtml(rawDesc);

    // Responsibilities & Requirements
    const responsibilities = this.extractListItemsAfterHeading(rawDesc, ['responsibilities', 'what you will do', "what you'll do"]);
    const requirements = this.extractListItemsAfterHeading(rawDesc, ['requirements', 'qualifications', 'what we are looking for', "what we're looking for"]);
    const extractedSkills = this.extractSkills(cleanDesc);
    const schemaSkills = Array.isArray(data.skills)
      ? data.skills
      : (typeof data.skills === 'string' ? data.skills.split(',').map((s: string) => s.trim()) : []);
    const skills = Array.from(new Set([...schemaSkills, ...extractedSkills])).filter(Boolean);

    return {
      title: title.trim(),
      company: company.trim() || this.extractCompanyFromUrl(pageUrl),
      location,
      employmentType: data.employmentType || 'FULL_TIME',
      description: cleanDesc,
      responsibilities: responsibilities.length > 0 ? responsibilities : undefined,
      requirements: requirements.length > 0 ? requirements : undefined,
      skills,
      source: 'JSON_LD',
      sourceUrl: pageUrl,
      applyUrl: data.url || pageUrl,
      postedDate: data.datePosted
    };
  }

  /**
   * Evaluates platform-specific DOM structures as an optional optimization
   */
  extractFromPlatformAdapter(doc: Document): { job: INormalizedJob; confidence: number; source: JobExtractionSource } | null {
    const url = doc.location.href;
    const host = doc.location.hostname.toLowerCase();

    // 1. LinkedIn Adapter
    if (host.includes('linkedin.com')) {
      const isJobContext = url.includes('/jobs/') ||
        Boolean(doc.querySelector('.jobs-search__job-details--container, .job-view-layout, .jobs-details__main-content, #job-details, .jobs-description'));

      if (isJobContext) {
        const detailContainer = doc.querySelector('.jobs-search__job-details--container, .job-view-layout, .jobs-details__main-content') || doc;

        const titleSelectors = [
          '.job-details-jobs-unified-top-card__job-title',
          'h1.job-details-jobs-unified-top-card__job-title',
          'h2.job-details-jobs-unified-top-card__job-title',
          '.jobs-unified-top-card__job-title',
          '.jobs-search__job-details--container h1',
          '.job-view-layout h1',
          '.jobs-details__main-content h1',
          'h1.t-24',
          'h1.t-bold',
          '.topcard__title',
          'h1'
        ];
        let title = '';
        for (const sel of titleSelectors) {
          const el = detailContainer.querySelector(sel) || doc.querySelector(sel);
          const txt = el?.textContent?.trim() || '';
          if (txt && txt.length > 2 && txt.length < 150) {
            title = txt;
            break;
          }
        }

        const companySelectors = [
          '.job-details-jobs-unified-top-card__company-name',
          '.jobs-unified-top-card__company-name a',
          '.jobs-unified-top-card__company-name',
          '.job-details-jobs-unified-top-card__primary-description a',
          '.jobs-search__job-details--container a[href*="/company/"]',
          '.job-view-layout a[href*="/company/"]',
          '.topcard__flavor--black-link',
          'a.topcard__org-name-link'
        ];
        let company = '';
        for (const sel of companySelectors) {
          const el = detailContainer.querySelector(sel) || doc.querySelector(sel);
          const txt = el?.textContent?.trim() || '';
          if (txt && txt.length > 1 && txt.length < 80) {
            company = txt;
            break;
          }
        }

        const descSelectors = [
          '#job-details',
          '.jobs-description__content',
          '.jobs-description-content__text',
          '.jobs-box__html-content',
          'article.jobs-description__container',
          'div.jobs-description',
          '.show-more-less-html__markup',
          '.jobs-search__job-details--container div[class*="description"]'
        ];
        let description = '';
        for (const sel of descSelectors) {
          const el = detailContainer.querySelector(sel) || doc.querySelector(sel);
          const txt = (el?.textContent || '').trim();
          if (txt && txt.length > 50) {
            description = txt;
            break;
          }
        }

        // Fallback: search for "About the job" heading
        if (!description) {
          const headings = Array.from(detailContainer.querySelectorAll('h1, h2, h3, h4, h5, strong, b'));
          for (const h of headings) {
            if (h.textContent?.toLowerCase().includes('about the job')) {
              const parent = h.parentElement;
              if (parent && (parent.textContent || '').trim().length > 50) {
                description = (parent.textContent || '').trim();
                break;
              }
            }
          }
        }

        const applyBtn = detailContainer.querySelector<HTMLAnchorElement>('.jobs-apply-button[href], a[data-control-name="jobdetails_topcard_inapply"]') ||
          doc.querySelector<HTMLAnchorElement>('.jobs-apply-button[href], a[data-control-name="jobdetails_topcard_inapply"]');
        const applyUrl = applyBtn?.href || url;

        const locEl = detailContainer.querySelector('.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet, span.jobs-unified-top-card__workplace-type') ||
          doc.querySelector('.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet');
        const location = locEl?.textContent?.trim() || 'Onsite / Remote';

        // Only return if we have a valid title AND sufficient description text (to avoid unselected search page)
        if (title && description.length >= 50) {
          return {
            source: 'LINKEDIN',
            confidence: 0.96,
            job: {
              title,
              company: company || 'Company',
              location,
              description,
              skills: this.extractSkills(description),
              source: 'LinkedIn',
              sourceUrl: url,
              applyUrl
            }
          };
        }
      }
    }

    // 2. Greenhouse Adapter
    if (host.includes('greenhouse.io') || doc.querySelector('#app_body, #content.body')) {
      const titleEl = doc.querySelector('.app-title, h1.job-title, #header h1');
      const companyEl = doc.querySelector('.company-name, #header .company');
      const descEl = doc.querySelector('#content, #app_body');

      if (titleEl && descEl) {
        const title = titleEl.textContent?.trim() || '';
        const rawCompany = companyEl?.textContent?.trim() || this.extractCompanyFromUrl(url);
        const company = rawCompany.replace(/^at\s+/i, '').trim();
        const description = (descEl.textContent || '').trim();

        return {
          source: 'GREENHOUSE',
          confidence: 0.95,
          job: {
            title,
            company,
            location: doc.querySelector('.location')?.textContent?.trim() || 'Remote',
            description,
            skills: this.extractSkills(description),
            source: 'Greenhouse',
            sourceUrl: url,
            applyUrl: url
          }
        };
      }
    }

    // 3. Lever Adapter
    if (host.includes('lever.co') || doc.querySelector('.posting-headline')) {
      const titleEl = doc.querySelector('.posting-headline h2');
      const descEl = doc.querySelector('.section-wrapper, .posting-page');
      const applyBtn = doc.querySelector<HTMLAnchorElement>('a.postings-btn');

      if (titleEl && descEl) {
        const title = titleEl.textContent?.trim() || '';
        const company = doc.querySelector('.main-header-logo img')?.getAttribute('alt') || this.extractCompanyFromUrl(url);
        const description = (descEl.textContent || '').trim();

        return {
          source: 'LEVER',
          confidence: 0.95,
          job: {
            title,
            company,
            location: doc.querySelector('.posting-categories .location')?.textContent?.trim() || 'Remote',
            description,
            skills: this.extractSkills(description),
            source: 'Lever',
            sourceUrl: url,
            applyUrl: applyBtn?.href || url
          }
        };
      }
    }

    // 4. Workday Adapter
    if (host.includes('myworkdayjobs.com') || doc.querySelector('[data-automation-id="jobPostingHeader"]')) {
      const titleEl = doc.querySelector('[data-automation-id="jobPostingHeader"]');
      const descEl = doc.querySelector('[data-automation-id="jobPostingDescription"]');
      const applyBtn = doc.querySelector<HTMLAnchorElement>('[data-automation-id="applyButton"]');

      if (titleEl && descEl) {
        const title = titleEl.textContent?.trim() || '';
        const description = (descEl.textContent || '').trim();

        return {
          source: 'WORKDAY',
          confidence: 0.95,
          job: {
            title,
            company: this.extractCompanyFromUrl(url),
            location: doc.querySelector('[data-automation-id="locations"]')?.textContent?.trim() || 'Remote',
            description,
            skills: this.extractSkills(description),
            source: 'Workday',
            sourceUrl: url,
            applyUrl: applyBtn?.href || url
          }
        };
      }
    }

    return null;
  }

  /**
   * Universal generic DOM extractor for arbitrary company career pages
   */
  extractFromGenericDom(doc: Document): INormalizedJob {
    const url = doc.location.href;
    const h1 = doc.querySelector('h1');
    const title = h1?.innerText?.trim() || doc.title.split(/[-|–•]/)[0]?.trim() || 'Job Opportunity';

    // Company from page title or sub-heading
    let company = this.extractCompanyFromUrl(url);
    const titleParts = doc.title.split(/[-|–•]/);
    if (titleParts.length >= 2) {
      company = titleParts[1].trim();
    }

    // Description text
    const mainEl = doc.querySelector('main, article, [role="main"], #content, .content, .job-description, .job-details');
    const descRaw = mainEl
      ? (mainEl.textContent || (mainEl as HTMLElement).innerText || '')
      : (doc.body?.textContent || (doc.body as any)?.innerText || '');
    const description = descRaw.slice(0, 12000);

    // Apply URL
    const applyBtn = doc.querySelector<HTMLAnchorElement>(
      'a[href*="apply"], a[class*="apply"], a.btn-primary'
    );
    const applyUrl = applyBtn?.href || url;

    // Skills
    const skills = this.extractSkills(description);

    return {
      title,
      company,
      location: this.extractLocationFromText(description),
      description,
      skills,
      source: 'Generic Career Page',
      sourceUrl: url,
      applyUrl
    };
  }

  private extractSkills(text: string): string[] {
    const techTaxonomy = [
      'React', 'React.js', 'TypeScript', 'JavaScript', 'Node.js', 'Node', 'Python',
      'Go', 'Golang', 'Java', 'C++', 'C#', '.NET', 'AWS', 'Amazon Web Services',
      'GCP', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'SQL', 'PostgreSQL',
      'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API', 'Git', 'Linux',
      'CI/CD', 'Next.js', 'Tailwind', 'TailwindCSS', 'Kafka', 'Elasticsearch'
    ];

    const matched = new Set<string>();
    const lower = text.toLowerCase();

    for (const tech of techTaxonomy) {
      const rx = new RegExp(`\\b${tech.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (rx.test(lower)) {
        // Canonicalize
        if (tech === 'React.js') matched.add('React');
        else if (tech === 'Node') matched.add('Node.js');
        else if (tech === 'Golang') matched.add('Go');
        else if (tech === 'Amazon Web Services') matched.add('AWS');
        else if (tech === 'Google Cloud') matched.add('GCP');
        else if (tech === 'TailwindCSS') matched.add('Tailwind');
        else matched.add(tech);
      }
    }

    return Array.from(matched);
  }

  private extractLocationFromText(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('remote') || lower.includes('work from home') || lower.includes('anywhere')) {
      return 'Remote';
    }
    const match = text.match(/(location|based in|office):\s*([A-Za-z\s,]+)/i);
    if (match && match[2]) {
      return match[2].trim().slice(0, 40);
    }
    return 'Hybrid / Onsite';
  }

  private extractCompanyFromUrl(url: string): string {
    try {
      const host = new URL(url).hostname;
      const parts = host.replace('www.', '').split('.');
      if (parts.length >= 2) {
        const name = parts[0];
        return name.charAt(0).toUpperCase() + name.slice(1);
      }
    } catch {}
    return 'Company';
  }

  private stripHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || div.innerText || '').trim();
  }

  private extractListItemsAfterHeading(html: string, keywords: string[]): string[] {
    const div = document.createElement('div');
    div.innerHTML = html;
    const items: string[] = [];

    const headings = Array.from(div.querySelectorAll('h1, h2, h3, h4, strong, b, p'));
    for (const h of headings) {
      const text = (h.textContent || '').toLowerCase();
      if (keywords.some((kw) => text.includes(kw))) {
        let sibling = h.nextElementSibling;
        while (sibling) {
          if (sibling.tagName === 'UL' || sibling.tagName === 'OL') {
            const lis = Array.from(sibling.querySelectorAll('li')).map((li) => li.textContent?.trim() || '').filter(Boolean);
            items.push(...lis);
            break;
          }
          sibling = sibling.nextElementSibling;
        }
      }
    }

    return items;
  }
}

export const jobExtractor = new JobExtractor();
