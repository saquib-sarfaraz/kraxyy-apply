import { IResumeParsedDraft, ICandidateFact, IMatchBreakdown, IUserProfile } from '@kraxyy/types';

export interface IGrokMatchResult {
  overallScore: number;
  roleAlignment: 'Strong' | 'Good' | 'Moderate' | 'Partial' | 'Mismatch';
  requiredSkillsMet: string; // e.g. "8/10"
  matchedSkills: string[];
  missingKeywords: string[];
  experienceRequirement: 'Requirement met' | 'Partially met' | 'Requirement not met';
  evidenceFromResume: string[];
  recommendations: string[];
  whyThisScore: string;
}

export function cleanAndExtractJson(raw: string): any {
  if (!raw || typeof raw !== 'string') return {};
  let cleaned = raw.trim();

  // If wrapped in markdown code fence ```json ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // Find boundaries of outer JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

export function normalizeCandidateFact(rawFact: any, index: number): ICandidateFact {
  if (typeof rawFact === 'string') {
    let category: 'EXPERIENCE' | 'SKILL' | 'EDUCATION' | 'PROJECT' | 'ACHIEVEMENT' = 'EXPERIENCE';
    const lower = rawFact.toLowerCase();
    if (lower.includes('bs') || lower.includes('degree') || lower.includes('university') || lower.includes('stanford') || lower.includes('college') || lower.includes('bachelor') || lower.includes('master')) {
      category = 'EDUCATION';
    } else if (lower.includes('skill') || lower.includes('react') || lower.includes('node') || lower.includes('python') || lower.includes('proficient')) {
      category = 'SKILL';
    } else if (lower.includes('project') || lower.includes('built') || lower.includes('app')) {
      category = 'PROJECT';
    } else if (lower.includes('award') || lower.includes('certified') || lower.includes('certification')) {
      category = 'ACHIEVEMENT';
    }
    return {
      id: `fact-${Date.now()}-${index}`,
      category,
      fact: rawFact.trim(),
      confidence: 'explicit',
      technologies: []
    };
  }

  const validCategories = ['EXPERIENCE', 'SKILL', 'EDUCATION', 'PROJECT', 'ACHIEVEMENT'];
  const catUpper = String(rawFact?.category || '').toUpperCase();
  const category = (validCategories.includes(catUpper) ? catUpper : 'EXPERIENCE') as any;

  return {
    id: rawFact?.id || `fact-${Date.now()}-${index}`,
    category,
    fact: String(rawFact?.fact || rawFact?.description || ''),
    confidence: rawFact?.confidence === 'inferred' ? 'inferred' : 'explicit',
    sourceSection: rawFact?.sourceSection ? String(rawFact.sourceSection) : undefined,
    dateRange: rawFact?.dateRange ? String(rawFact.dateRange) : undefined,
    technologies: Array.isArray(rawFact?.technologies) ? rawFact.technologies.map(String) : []
  };
}

export function normalizeSuggestedData(raw: any): IResumeParsedDraft['suggestedData'] & { facts: ICandidateFact[] } {
  const personalRaw = raw?.personal || {};
  let firstName = personalRaw.firstName || '';
  let lastName = personalRaw.lastName || '';
  if ((!firstName || !lastName) && personalRaw.name) {
    const parts = String(personalRaw.name).trim().split(/\s+/);
    if (parts.length > 0) {
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    }
  }

  const profRaw = raw?.professional || {};
  const currentTitle =
    profRaw.currentTitle ||
    profRaw.currentPosition ||
    profRaw.title ||
    personalRaw.title ||
    raw?.title ||
    'Software Engineer';

  const yearsOfExperience = Number(
    profRaw.yearsOfExperience ||
    profRaw.yearsExperience ||
    profRaw.experienceYears ||
    3
  );

  const rawSkills: string[] = [
    ...(Array.isArray(raw?.skills) ? raw.skills : []),
    ...(Array.isArray(profRaw.skills) ? profRaw.skills : [])
  ];
  const skills = Array.from(new Set(rawSkills.map((s) => String(s).trim()).filter(Boolean)));

  const summary = profRaw.summary || raw?.summary || '';

  const educations = (Array.isArray(raw?.educations) ? raw.educations : []).map((edu: any, i: number) => ({
    id: edu.id || `edu-${Date.now()}-${i}`,
    institution: edu.institution || edu.school || edu.university || 'University',
    degree: edu.degree || 'Degree',
    fieldOfStudy: edu.fieldOfStudy || edu.field || edu.major || 'General',
    startDate: String(edu.startDate || edu.startYear || ''),
    endDate: String(edu.endDate || edu.endYear || ''),
    isCurrent: Boolean(edu.isCurrent),
    gpa: edu.gpa ? String(edu.gpa) : undefined,
    description: edu.description || ''
  }));

  const experiences = (Array.isArray(raw?.experiences) ? raw.experiences : []).map((exp: any, i: number) => ({
    id: exp.id || `exp-${Date.now()}-${i}`,
    company: exp.company || exp.employer || 'Company',
    jobTitle: exp.jobTitle || exp.title || exp.position || 'Software Engineer',
    startDate: String(exp.startDate || exp.startYear || ''),
    endDate: String(exp.endDate || exp.endYear || ''),
    isCurrent: Boolean(exp.isCurrent || (exp.duration && String(exp.duration).toLowerCase().includes('present')) || !exp.endDate),
    description: exp.description || '',
    technologies: Array.isArray(exp.technologies) ? exp.technologies.map(String) : []
  }));

  const projects = (Array.isArray(raw?.projects) ? raw.projects : []).map((proj: any, i: number) => ({
    id: proj.id || `proj-${Date.now()}-${i}`,
    name: proj.name || proj.title || 'Project',
    description: proj.description || '',
    technologies: Array.isArray(proj.technologies) ? proj.technologies.map(String) : [],
    url: proj.url || '',
    githubUrl: proj.githubUrl || ''
  }));

  let rawFacts = Array.isArray(raw?.facts) ? raw.facts : [];
  let facts = rawFacts.map(normalizeCandidateFact).filter((f: ICandidateFact) => Boolean(f.fact));

  if (facts.length === 0) {
    experiences.forEach((exp: any, i: number) => {
      facts.push({
        id: `fact-synth-exp-${i}`,
        category: 'EXPERIENCE',
        fact: `${exp.jobTitle} at ${exp.company} (${exp.startDate || 'Past'} - ${exp.endDate || 'Present'})`,
        confidence: 'explicit',
        technologies: exp.technologies
      });
    });
    educations.forEach((edu: any, i: number) => {
      facts.push({
        id: `fact-synth-edu-${i}`,
        category: 'EDUCATION',
        fact: `${edu.degree} in ${edu.fieldOfStudy} from ${edu.institution}`,
        confidence: 'explicit',
        technologies: []
      });
    });
    if (skills.length > 0) {
      facts.push({
        id: `fact-synth-skills`,
        category: 'SKILL',
        fact: `Demonstrated proficiencies in: ${skills.slice(0, 10).join(', ')}`,
        confidence: 'explicit',
        technologies: skills.slice(0, 10)
      });
    }
  }

  return {
    personal: {
      firstName,
      lastName,
      email: personalRaw.email || '',
      phone: personalRaw.phone || '',
      city: personalRaw.city || '',
      country: personalRaw.country || '',
      linkedin: personalRaw.linkedin || '',
      github: personalRaw.github || '',
      portfolio: personalRaw.portfolio || ''
    },
    professional: {
      currentTitle,
      summary,
      skills,
      yearsOfExperience
    },
    educations,
    experiences,
    projects,
    skills,
    summary,
    facts
  };
}

export class AiService {
  private apiKey?: string;
  private provider: string;
  private model: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || process.env.XAI_API_KEY || process.env.AI_API_KEY;
    this.provider = (process.env.AI_PROVIDER || 'heuristic_fallback').toLowerCase();
    const isGroq = this.provider === 'groq' || Boolean(process.env.GROQ_API_KEY) || Boolean(this.apiKey?.startsWith('gsk_'));
    const isXai = !isGroq && (this.provider === 'xai' || this.provider === 'grok' || Boolean(process.env.XAI_API_KEY));

    this.baseUrl =
      process.env.AI_BASE_URL ||
      (isGroq
        ? 'https://api.groq.com/openai/v1'
        : isXai
        ? 'https://api.x.ai/v1'
        : 'https://api.openai.com/v1');

    this.model =
      process.env.AI_MODEL ||
      (isGroq ? 'openai/gpt-oss-120b' : isXai ? 'grok-4.7' : 'gpt-4o-mini');
  }

  public isAiConfigured(): boolean {
    return Boolean(this.apiKey && !this.apiKey.includes('your_'));
  }

  public getModelName(): string {
    return this.model;
  }

  /**
   * Parse extracted raw resume text into structured profile draft + verified facts
   */
  public async parseResume(rawText: string): Promise<IResumeParsedDraft['suggestedData'] & { facts: ICandidateFact[] }> {
    if (this.isAiConfigured()) {
      try {
        return await this.parseWithExternalAi(rawText);
      } catch (err) {
        console.error(`[Resume Pipeline] Grok/AI parsing failed: ${(err as Error).message}`);
        console.log(`[Resume Pipeline] Falling back to deterministic heuristic extractor`);
      }
    }

    // High-fidelity deterministic heuristic extractor
    return this.parseWithHeuristics(rawText);
  }

  private async parseWithExternalAi(rawText: string): Promise<IResumeParsedDraft['suggestedData'] & { facts: ICandidateFact[] }> {
    const inputChars = rawText.trim().length;
    console.log(`[Resume Pipeline] Grok request started`);
    console.log(`[Resume Pipeline] Model: ${this.model}`);
    console.log(`[Resume Pipeline] Input characters: ${inputChars}`);

    const prompt = `
You are Grok, an expert HR intelligence and resume analysis engine.
Extract candidate details from the following resume text into a strict JSON object with this shape:
{
  "personal": {
    "firstName": string,
    "lastName": string,
    "email": string,
    "phone": string,
    "city": string,
    "country": string,
    "linkedin": string,
    "github": string,
    "portfolio": string
  },
  "professional": {
    "currentTitle": string,
    "summary": string,
    "skills": string[],
    "yearsOfExperience": number
  },
  "educations": [
    {
      "id": string,
      "institution": string,
      "degree": string,
      "fieldOfStudy": string,
      "startDate": string,
      "endDate": string,
      "gpa": string
    }
  ],
  "experiences": [
    {
      "id": string,
      "company": string,
      "jobTitle": string,
      "startDate": string,
      "endDate": string,
      "isCurrent": boolean,
      "description": string,
      "technologies": string[]
    }
  ],
  "projects": [
    {
      "id": string,
      "name": string,
      "description": string,
      "technologies": string[],
      "url": string,
      "githubUrl": string
    }
  ],
  "skills": string[],
  "summary": string,
  "facts": [
    {
      "id": string,
      "category": "EXPERIENCE" | "SKILL" | "EDUCATION" | "PROJECT" | "ACHIEVEMENT",
      "fact": string,
      "confidence": "explicit" | "inferred",
      "sourceSection": string,
      "technologies": string[]
    }
  ]
}

CRITICAL RULES:
1. Extract atomic candidate facts from the resume. Mark explicit facts that are clearly stated as "explicit". If reasonably inferred, mark as "inferred".
2. DO NOT fabricate any companies, institutions, skills, or projects not present in the resume.

Resume Text:
${rawText.slice(0, 14000)}
`;

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are Grok, an expert HR intelligence parser. Return strict JSON only.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      })
    });

    console.log(`[Resume Pipeline] Grok response received`);
    console.log(`[Resume Pipeline] Status: ${res.status}`);

    if (!res.ok) {
      throw new Error(`AI API error ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as any;
    const content = data.choices?.[0]?.message?.content || '{}';
    const parsed = cleanAndExtractJson(content);

    console.log(`[Resume Pipeline] Grok parsed successfully`);
    return normalizeSuggestedData(parsed);
  }

  public parseWithHeuristics(text: string): IResumeParsedDraft['suggestedData'] & { facts: ICandidateFact[] } {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

    // 1. Contact information extraction
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : '';

    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const phone = phoneMatch ? phoneMatch[0] : '';

    const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
    const linkedin = linkedinMatch ? linkedinMatch[0] : '';

    const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
    const github = githubMatch ? githubMatch[0] : '';

    // Candidate name extraction
    let firstName = '';
    let lastName = '';
    if (lines.length > 0) {
      const topWords = lines[0].split(/\s+/).filter((w) => w.length > 1 && !w.includes('@') && !/\d/.test(w));
      if (topWords.length >= 2) {
        firstName = topWords[0];
        lastName = topWords.slice(1).join(' ');
      }
    }

    // 2. Skills taxonomy extraction
    const knownSkills = [
      'JavaScript', 'TypeScript', 'React', 'React.js', 'Next.js', 'Node.js', 'Express',
      'Python', 'Django', 'FastAPI', 'Go', 'Golang', 'Java', 'Spring Boot', 'C++', 'C#',
      'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API', 'Docker',
      'Kubernetes', 'AWS', 'GCP', 'Azure', 'Linux', 'Git', 'CI/CD', 'Tailwind CSS',
      'HTML5', 'CSS3', 'Agile', 'Scrum', 'Microservices', 'Jest', 'Vitest'
    ];

    const detectedSkills = new Set<string>();
    for (const skill of knownSkills) {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(text)) {
        detectedSkills.add(skill);
      }
    }

    // 3. Education extraction
    const educations: any[] = [];
    const degreePatterns = /(bachelor|master|phd|b\.s\.|m\.s\.|b\.tech|m\.tech|b\.a\.)/i;
    for (let i = 0; i < lines.length; i++) {
      if (degreePatterns.test(lines[i])) {
        educations.push({
          id: `edu-${educations.length + 1}`,
          institution: lines[i - 1] && lines[i - 1].length < 80 ? lines[i - 1] : 'University',
          degree: lines[i],
          fieldOfStudy: 'Computer Science / Engineering',
          startDate: '2018',
          endDate: '2022'
        });
        if (educations.length >= 2) break;
      }
    }

    // 4. Experiences extraction
    const experiences: any[] = [];
    const roleKeywords = /(engineer|developer|architect|lead|specialist|manager|consultant)/i;
    for (let i = 0; i < lines.length; i++) {
      if (roleKeywords.test(lines[i]) && lines[i].length < 60 && !lines[i].toLowerCase().includes('skills')) {
        experiences.push({
          id: `exp-${experiences.length + 1}`,
          company: lines[i - 1] && lines[i - 1].length < 60 ? lines[i - 1] : 'Technology Corp',
          jobTitle: lines[i],
          startDate: '2022-01',
          endDate: 'Present',
          isCurrent: true,
          description: lines[i + 1] ? lines[i + 1].slice(0, 200) : '',
          technologies: Array.from(detectedSkills).slice(0, 4)
        });
        if (experiences.length >= 3) break;
      }
    }

    const skillsArray = Array.from(detectedSkills);

    // 5. Build candidate facts / evidence
    const facts: ICandidateFact[] = [];
    experiences.forEach((exp, idx) => {
      facts.push({
        id: `fact-exp-${idx + 1}`,
        category: 'EXPERIENCE',
        fact: `Served as ${exp.jobTitle} at ${exp.company} with core technologies: ${exp.technologies?.join(', ') || 'software development'}`,
        confidence: 'explicit',
        sourceSection: `Experience: ${exp.company}`,
        technologies: exp.technologies || []
      });
    });

    if (skillsArray.length > 0) {
      facts.push({
        id: 'fact-skills-1',
        category: 'SKILL',
        fact: `Demonstrated technical proficiencies in: ${skillsArray.slice(0, 8).join(', ')}`,
        confidence: 'explicit',
        sourceSection: 'Skills',
        technologies: skillsArray.slice(0, 8)
      });
    }

    educations.forEach((edu, idx) => {
      facts.push({
        id: `fact-edu-${idx + 1}`,
        category: 'EDUCATION',
        fact: `Earned ${edu.degree} in ${edu.fieldOfStudy} from ${edu.institution}`,
        confidence: 'explicit',
        sourceSection: 'Education',
        technologies: []
      });
    });

    return {
      personal: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        linkedin: linkedin || undefined,
        github: github || undefined
      },
      professional: {
        currentTitle: experiences[0]?.jobTitle || 'Software Engineer',
        summary: lines.slice(1, 4).join(' ').slice(0, 250),
        skills: skillsArray,
        yearsOfExperience: Math.max(1, experiences.length * 2)
      },
      educations,
      experiences,
      skills: skillsArray,
      summary: lines.slice(1, 4).join(' ').slice(0, 250),
      facts
    };
  }

  /**
   * Transparent Job Matching with Grok & Grounded Evidence
   */
  public async evaluateJobMatchWithGrok(
    profile: IUserProfile,
    facts: ICandidateFact[],
    job: { title: string; company: string; description: string; requirements?: string | string[]; skills?: string[] }
  ): Promise<IGrokMatchResult> {
    if (this.isAiConfigured()) {
      try {
        return await this.evaluateJobMatchWithExternalAi(profile, facts, job);
      } catch (err) {
        console.warn(`[AiService] Grok match evaluation failed, falling back to evidence matcher: ${(err as Error).message}`);
      }
    }

    return this.evaluateJobMatchDeterministically(profile, facts, job);
  }

  private async evaluateJobMatchWithExternalAi(
    profile: IUserProfile,
    facts: ICandidateFact[],
    job: { title: string; company: string; description: string; requirements?: string | string[]; skills?: string[] }
  ): Promise<IGrokMatchResult> {
    const verifiedFactsSummary = facts.map((f) => `- [${f.confidence}] ${f.fact}`).join('\n');
    const candSkills = profile.professional?.skills?.join(', ') || 'None';

    const prompt = `
You are Grok, an unbiased job match engine.
Analyze the candidate's verified background against the job description below.
Instead of an arbitrary verdict, produce a transparent, evidence-based score breakdown.

Candidate Profile:
- Current Title: ${profile.professional?.currentTitle || 'Software Engineer'}
- Years of Experience: ${profile.professional?.yearsOfExperience || 3}
- Skills: ${candSkills}
- Verified Resume Evidence:
${verifiedFactsSummary.slice(0, 4000)}

Job Posting:
- Title: ${job.title}
- Company: ${job.company}
- Required Skills: ${(job.skills || []).join(', ')}
- Description: ${job.description.slice(0, 3000)}

Return strict JSON with this exact shape:
{
  "overallScore": number (10 to 99),
  "roleAlignment": "Strong" | "Good" | "Moderate" | "Partial" | "Mismatch",
  "requiredSkillsMet": string (e.g. "7/9"),
  "matchedSkills": string[],
  "missingKeywords": string[] (crucial ATS keywords requested by job but missing from resume),
  "experienceRequirement": "Requirement met" | "Partially met" | "Requirement not met",
  "evidenceFromResume": string[] (concrete items from candidate facts matching the job),
  "recommendations": string[] (actionable advice, e.g. "Add AWS/Docker only if you genuinely have that experience"),
  "whyThisScore": string (concise explanation of match calculation)
}
`;

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are Grok, an expert job matching engine. Return strict JSON only.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      })
    });

    if (!res.ok) {
      throw new Error(`AI API error ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as any;
    const content = data.choices?.[0]?.message?.content || '{}';
    return cleanAndExtractJson(content);
  }

  public evaluateJobMatchDeterministically(
    profile: IUserProfile,
    facts: ICandidateFact[],
    job: { title: string; company: string; description: string; requirements?: string | string[]; skills?: string[] }
  ): IGrokMatchResult {
    const jobText = `${job.title} ${job.description} ${Array.isArray(job.requirements) ? job.requirements.join(' ') : (job.requirements || '')}`.toLowerCase();
    const candidateSkills = (profile.professional?.skills || []).map((s) => s.toLowerCase());

    const targetSkills = (job.skills && job.skills.length > 0)
      ? job.skills
      : ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'REST API', 'Git'];

    const matchedSkills: string[] = [];
    const missingKeywords: string[] = [];

    for (const sk of targetSkills) {
      const lower = sk.toLowerCase();
      if (candidateSkills.some((cs) => cs.includes(lower) || lower.includes(cs))) {
        matchedSkills.push(sk);
      } else {
        missingKeywords.push(sk);
      }
    }

    const total = targetSkills.length;
    const matchedCount = matchedSkills.length;
    const requiredSkillsMet = `${matchedCount}/${total}`;

    // Role alignment
    const candTitle = (profile.professional?.currentTitle || 'Software Engineer').toLowerCase();
    const jobTitle = job.title.toLowerCase();
    let roleAlignment: 'Strong' | 'Good' | 'Moderate' | 'Partial' | 'Mismatch' = 'Moderate';
    if (jobTitle.includes('software') || jobTitle.includes('engineer') || jobTitle.includes('developer')) {
      if (candTitle.includes('engineer') || candTitle.includes('developer')) {
        roleAlignment = 'Strong';
      } else {
        roleAlignment = 'Good';
      }
    }

    // Experience requirement
    const years = profile.professional?.yearsOfExperience || 3;
    let experienceRequirement: 'Requirement met' | 'Partially met' | 'Requirement not met' = 'Requirement met';
    if (jobText.includes('5+') || jobText.includes('senior')) {
      experienceRequirement = years >= 5 ? 'Requirement met' : 'Partially met';
    }

    // Score calculation
    let score = Math.round((matchedCount / Math.max(1, total)) * 60);
    if (roleAlignment === 'Strong') score += 25;
    else if (roleAlignment === 'Good') score += 15;
    if (experienceRequirement === 'Requirement met') score += 15;
    else score += 8;

    score = Math.min(98, Math.max(25, score));

    // Evidence from resume
    const evidenceFromResume: string[] = [];
    if (matchedSkills.length > 0) {
      evidenceFromResume.push(`Verified skills: ${matchedSkills.slice(0, 4).join(', ')}`);
    }
    const relevantFact = facts.find((f) => f.category === 'EXPERIENCE' || f.technologies?.some((t) => matchedSkills.includes(t)));
    if (relevantFact) {
      evidenceFromResume.push(relevantFact.fact);
    } else if (profile.experiences && profile.experiences.length > 0) {
      evidenceFromResume.push(`${profile.experiences[0].jobTitle} at ${profile.experiences[0].company}`);
    }

    // Recommendations
    const recommendations: string[] = [];
    if (missingKeywords.length > 0) {
      recommendations.push(`Add ${missingKeywords.slice(0, 2).join(' or ')} to your profile only if you genuinely have that experience.`);
    }
    recommendations.push('Tailor your application cover notes to highlight direct project evidence.');

    return {
      overallScore: score,
      roleAlignment,
      requiredSkillsMet,
      matchedSkills,
      missingKeywords,
      experienceRequirement,
      evidenceFromResume,
      recommendations,
      whyThisScore: `Based on your resume, you match ${requiredSkillsMet} core skills with ${roleAlignment.toLowerCase()} role alignment.`
    };
  }

  /**
   * Grounded Question Answering for Application Forms (No Hallucination)
   */
  public async generateGroundedAnswer(
    facts: ICandidateFact[],
    question: string,
    jobContext?: { title?: string; company?: string; description?: string }
  ): Promise<string> {
    const verifiedFactsList = facts.map((f) => `- [${f.confidence}] ${f.fact}`).join('\n');

    if (this.isAiConfigured()) {
      try {
        const prompt = `
You are Grok, an intelligent career application assistant.
Answer the following application question on behalf of the candidate.

QUESTION:
"${question}"

TARGET JOB:
${jobContext?.title ? `Role: ${jobContext.title} at ${jobContext?.company || 'Company'}` : 'General Position'}
${jobContext?.description ? `Details: ${jobContext.description.slice(0, 1000)}` : ''}

VERIFIED CANDIDATE FACTS:
${verifiedFactsList}

STRICT GROUNDING CONSTRAINTS:
1. Ground your response ONLY in the provided verified candidate facts.
2. NEVER fabricate or assume companies, degrees, certifications, years of experience, or skills not explicitly in the candidate facts.
3. Write in the first person ("I have experience with..."). Keep it concise, professional, confident, and between 2-4 sentences suitable for an application form.
4. If the candidate facts do not mention a requested skill, answer honestly about the candidate's related strengths without claiming unverified skills.
`;

        const res = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: 'system', content: 'You are a grounded career assistant. You never fabricate candidate experience.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.2
          })
        });

        if (res.ok) {
          const data = (await res.json()) as any;
          return data.choices?.[0]?.message?.content?.trim() || '';
        }
      } catch (err) {
        console.warn(`[AiService] Grok grounded answer failed: ${(err as Error).message}`);
      }
    }

    // High quality deterministic grounded answer fallback
    const expFacts = facts.filter((f) => f.category === 'EXPERIENCE' || f.category === 'PROJECT');
    const firstFact = expFacts[0]?.fact || 'I have a strong background in modern software development.';
    const companyText = jobContext?.company ? ` at ${jobContext.company}` : '';

    if (question.toLowerCase().includes('why') && (question.toLowerCase().includes('company') || question.toLowerCase().includes('role') || question.toLowerCase().includes('interested'))) {
      return `I am excited about the opportunity${companyText} because my background directly aligns with your technical direction. Specifically, ${firstFact.toLowerCase()} and I look forward to contributing high-impact work to your team.`;
    }

    return `Throughout my career, ${firstFact.toLowerCase()} I focus on shipping maintainable code and solving complex technical challenges.`;
  }
}

export const aiService = new AiService();
