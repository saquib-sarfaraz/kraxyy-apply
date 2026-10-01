import {
  IUserProfile,
  ID1Job,
  INormalizedJob,
  IMatchBreakdown,
  RoleFamilyType,
  MatchQualityLevel,
  IMissingSkillDetail
} from '@kraxyy/types';

export interface MatchingWeights {
  roleRelevanceWeight: number; // 0.30
  requiredSkillsWeight: number; // 0.25
  experienceWeight: number;     // 0.15
  educationWeight: number;      // 0.10
  technicalDomainWeight: number;// 0.10
  locationWeight: number;       // 0.05
  atsKeywordWeight: number;     // 0.05
}

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  roleRelevanceWeight: 0.30,
  requiredSkillsWeight: 0.25,
  experienceWeight: 0.15,
  educationWeight: 0.10,
  technicalDomainWeight: 0.10,
  locationWeight: 0.05,
  atsKeywordWeight: 0.05
};

const GENERIC_SKILLS = new Set([
  'communication',
  'written communication',
  'verbal communication',
  'teamwork',
  'collaboration',
  'problem solving',
  'analytical skills',
  'analysis',
  'time management',
  'organization',
  'organizational skills',
  'presentation',
  'leadership',
  'critical thinking',
  'adaptability',
  'multitasking',
  'reporting',
  'attention to detail',
  'project management',
  'management',
  'interpersonal skills'
]);

export class JobMatchingEngine {
  public static readonly VERSION = '1.0.0';

  constructor(private weights: MatchingWeights = DEFAULT_MATCHING_WEIGHTS) {}

  public calculateMatch(profile: IUserProfile, job: ID1Job | INormalizedJob): IMatchBreakdown {
    const jobTitle = job.title || 'Untitled Position';
    const company = job.company || 'Company';
    const jobDescription = job.description || '';
    const reqText = Array.isArray(job.requirements)
      ? job.requirements.join(' ')
      : job.requirements || jobDescription;

    // -------------------------------------------------------------------------
    // STEP 1: ROLE-FAMILY COMPATIBILITY GATE
    // -------------------------------------------------------------------------
    const candidateRole = this.getCandidatePrimaryRole(profile);
    const candidateFamily = this.classifyRoleFamily(candidateRole, profile.professional?.summary || '');
    const jobFamily = this.classifyRoleFamily(jobTitle, jobDescription);

    const { roleScore, roleRelevance, isRoleRelevant, roleMismatchReason } =
      this.evaluateRoleRelevance(candidateFamily, jobFamily, candidateRole, jobTitle);

    // -------------------------------------------------------------------------
    // STEP 2: SKILLS EXTRACTION & CORE VS GENERIC PARTITIONING
    // -------------------------------------------------------------------------
    const candidateSkillsSet = this.collectCandidateSkills(profile);
    const rawJobSkills = job.skills && job.skills.length > 0 ? job.skills : this.extractKeywords(jobDescription);

    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];
    const coreMatchedSkills: string[] = [];
    const genericMatchedSkills: string[] = [];
    const missingSkillsDetailed: IMissingSkillDetail[] = [];

    for (const skill of rawJobSkills) {
      const isMatched = this.hasSkillMatch(candidateSkillsSet, skill);
      const isGeneric = this.isGenericSkill(skill);

      if (isMatched) {
        matchedSkills.push(skill);
        if (isGeneric) {
          genericMatchedSkills.push(skill);
        } else {
          coreMatchedSkills.push(skill);
        }
      } else {
        missingSkills.push(skill);
        const priority = this.isSkillRequiredInText(skill, reqText) ? 'REQUIRED' : 'PREFERRED';
        missingSkillsDetailed.push({ skill, priority });
      }
    }

    // Compute Skill Scores
    const totalSkillsCount = rawJobSkills.length;
    let coreSkillsScore = 50;
    if (totalSkillsCount > 0) {
      // Core technical skills dominate skill scoring
      const coreSkillsTotal = rawJobSkills.filter((s) => !this.isGenericSkill(s)).length;
      if (coreSkillsTotal > 0) {
        coreSkillsScore = Math.round((coreMatchedSkills.length / coreSkillsTotal) * 100);
      } else {
        coreSkillsScore = Math.round((matchedSkills.length / totalSkillsCount) * 100);
      }
    }

    // Required vs Preferred skills score
    const requiredList = missingSkillsDetailed.filter((s) => s.priority === 'REQUIRED');
    const totalRequiredCount = rawJobSkills.filter((s) => this.isSkillRequiredInText(s, reqText)).length;
    const requiredMatchedCount = Math.max(0, totalRequiredCount - requiredList.length);
    const requiredSkillsScore =
      totalRequiredCount > 0 ? Math.round((requiredMatchedCount / totalRequiredCount) * 100) : coreSkillsScore;

    // -------------------------------------------------------------------------
    // STEP 3: EXPERIENCE VERDICT & SCORE
    // -------------------------------------------------------------------------
    const candidateYears = this.calculateCandidateYears(profile);
    const normalizedLevel = (job.experienceLevel ? job.experienceLevel.toUpperCase() : 'MID') as
      | 'ENTRY'
      | 'MID'
      | 'SENIOR'
      | 'LEAD'
      | 'EXECUTIVE';

    const expResult = this.scoreExperience(candidateYears, normalizedLevel);
    let experienceScore = expResult.score;

    let experienceVerdict: 'MATCH' | 'PARTIAL' | 'MISMATCH' = 'MATCH';
    let experienceVerdictText = `✓ Relevant (${candidateYears}+ yrs)`;

    if (roleRelevance === 'MISMATCH') {
      experienceVerdict = 'MISMATCH';
      experienceVerdictText = '✕ Domain experience does not match';
      experienceScore = 20;
    } else if (experienceScore < 70) {
      experienceVerdict = 'PARTIAL';
      experienceVerdictText = `⚠ Developing (${candidateYears} yrs vs ${normalizedLevel.toLowerCase()})`;
    }

    // -------------------------------------------------------------------------
    // STEP 4: EDUCATION VERDICT & SCORE
    // -------------------------------------------------------------------------
    const { score: educationScore, verdict: educationVerdict, text: educationVerdictText } =
      this.scoreEducationVerdict(profile, reqText, candidateFamily, jobFamily);

    // -------------------------------------------------------------------------
    // STEP 5: ATS KEYWORD COVERAGE
    // -------------------------------------------------------------------------
    const atsMatchedCount = matchedSkills.length;
    const atsMissingCount = missingSkills.length;
    const atsCoverageScore =
      totalSkillsCount > 0 ? Math.round((atsMatchedCount / totalSkillsCount) * 100) : 50;

    // -------------------------------------------------------------------------
    // STEP 6: LOCATION SCORE
    // -------------------------------------------------------------------------
    const locationScore = this.scoreLocation(profile, job);

    // -------------------------------------------------------------------------
    // STEP 7: HIERARCHICAL WEIGHTED OVERALL SCORE
    // -------------------------------------------------------------------------
    let rawScore = Math.round(
      roleScore * this.weights.roleRelevanceWeight +
      requiredSkillsScore * this.weights.requiredSkillsWeight +
      experienceScore * this.weights.experienceWeight +
      educationScore * this.weights.educationWeight +
      coreSkillsScore * this.weights.technicalDomainWeight +
      locationScore * this.weights.locationWeight +
      atsCoverageScore * this.weights.atsKeywordWeight
    );

    // CRITICAL RELEVANCE GATE:
    // If role-family is a cross-domain MISMATCH, cap score heavily (Max 18% - 25%).
    // No amount of generic keyword overlap can override a role mismatch.
    if (roleRelevance === 'MISMATCH') {
      rawScore = Math.min(22, Math.max(12, Math.round(rawScore * 0.28)));
    } else if (roleRelevance === 'LOW') {
      rawScore = Math.min(48, Math.max(25, rawScore));
    }

    const overallScore = Math.min(99, Math.max(12, rawScore));

    // -------------------------------------------------------------------------
    // STEP 8: MATCH QUALITY LEVEL & ACCURATE LABELS
    // -------------------------------------------------------------------------
    const { qualityLabel, matchQuality } = this.resolveMatchQuality(overallScore, roleRelevance);

    // -------------------------------------------------------------------------
    // STEP 9: "WHY THIS SCORE?" & RESUME PROBLEM EXPLORER
    // -------------------------------------------------------------------------
    const { whyThisScore, resumeIssues } = this.buildDiagnosticInsights({
      overallScore,
      qualityLabel,
      roleRelevance,
      candidateFamily,
      jobFamily,
      candidateRole,
      jobTitle,
      company,
      roleMismatchReason,
      coreMatchedSkills,
      missingSkillsDetailed,
      experienceVerdict,
      candidateYears
    });

    // -------------------------------------------------------------------------
    // STEP 10: STRENGTHS & CONCERNS
    // -------------------------------------------------------------------------
    const strengths: string[] = [];
    const concerns: string[] = [];

    if (coreMatchedSkills.length > 0) {
      strengths.push(
        `Possesses core skills: ${coreMatchedSkills.slice(0, 4).join(', ')}`
      );
    }
    if (roleRelevance === 'STRONG') {
      strengths.push(`Direct alignment with your active ${candidateRole} role profile`);
    } else if (roleRelevance === 'MISMATCH') {
      concerns.push(roleMismatchReason || 'Cross-domain role mismatch');
    }

    if (experienceVerdict === 'MATCH') {
      strengths.push(expResult.notes);
    } else if (experienceVerdict === 'MISMATCH') {
      concerns.push('Domain experience does not match target job domain');
    } else {
      concerns.push(expResult.notes);
    }

    if (missingSkillsDetailed.length > 0) {
      const topMissing = missingSkillsDetailed.slice(0, 3).map((m) => m.skill);
      concerns.push(`Missing key requirements: ${topMissing.join(', ')}`);
    }

    const explanation = this.buildExplanation({
      overallScore,
      qualityLabel,
      skillsScore: coreSkillsScore,
      roleScore,
      experienceScore,
      matchedCount: matchedSkills.length,
      totalSkills: totalSkillsCount,
      jobTitle,
      company,
      roleMismatchReason
    });

    // Compute transparent evidence summary
    const roleAlignment =
      roleRelevance === 'STRONG' ? 'Strong' :
      roleRelevance === 'MODERATE' ? 'Good' :
      roleRelevance === 'LOW' ? 'Partial' : 'Mismatch';

    const requiredSkillsMet = `${requiredMatchedCount}/${Math.max(1, totalRequiredCount || totalSkillsCount)}`;
    const missingKeywords = missingSkills.slice(0, 5);

    const experienceRequirement =
      experienceScore >= 80 ? 'Requirement met' :
      experienceScore >= 50 ? 'Partially met' : 'Requirement not met';

    const evidenceFromResume: string[] = [];
    if (coreMatchedSkills.length > 0) {
      evidenceFromResume.push(`Verified skills: ${coreMatchedSkills.slice(0, 4).join(', ')}`);
    }
    if (profile.experiences && profile.experiences.length > 0) {
      const latestExp = profile.experiences[0];
      evidenceFromResume.push(`${latestExp.jobTitle} at ${latestExp.company} (${latestExp.technologies?.slice(0, 3).join(', ') || 'software experience'})`);
    } else if (profile.educations && profile.educations.length > 0) {
      evidenceFromResume.push(`${profile.educations[0].degree} from ${profile.educations[0].institution}`);
    }

    const recommendations: string[] = [];
    if (missingKeywords.length > 0) {
      recommendations.push(`Add ${missingKeywords.slice(0, 2).join(' or ')} only if you genuinely have that experience.`);
    }
    recommendations.push('Tailor your application cover notes to highlight direct project evidence.');

    return {
      overallScore,
      skillsScore: coreSkillsScore,
      experienceScore,
      educationScore,
      roleScore,
      locationScore,
      matchedSkills,
      missingSkills,
      strengths,
      concerns,
      explanation,
      engineVersion: JobMatchingEngine.VERSION,

      // Transparent evidence metrics
      roleAlignment,
      requiredSkillsMet,
      missingKeywords,
      experienceRequirement,
      evidenceFromResume,
      recommendations,

      // Enriched intelligence
      qualityLabel,
      matchQuality,
      roleFamilyJob: jobFamily,
      roleFamilyCandidate: candidateFamily,
      roleRelevance,
      isRoleRelevant,
      roleMismatchReason,
      whyThisScore,
      coreMatchedSkills,
      genericMatchedSkills,
      missingSkillsDetailed,
      experienceVerdict,
      experienceVerdictText,
      educationVerdict,
      educationVerdictText,
      atsCoverageScore,
      atsMatchedCount,
      atsMissingCount,
      resumeIssues
    };
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  public classifyRoleFamily(title: string, description: string = ''): RoleFamilyType {
    const text = `${title} ${description}`.toLowerCase();

    // 1. Finance
    if (
      /\b(financial analyst|finance|accounting|accountant|auditor|audit|valuation|investment banking|banker|equity research|fp&a|treasury|chartered accountant|bookkeeper)\b/i.test(
        title
      ) ||
      (/\b(financial modeling|dcf|gaap|financial statements|valuation)\b/i.test(text) &&
        !/\b(software|developer|frontend|backend)\b/i.test(title))
    ) {
      return 'FINANCE';
    }

    // 2. Data & AI
    if (
      /\b(data analyst|data scientist|machine learning|ml engineer|ai engineer|data engineer|bi developer|business intelligence|analytics engineer|big data|nlp|computer vision)\b/i.test(
        title
      )
    ) {
      return 'DATA';
    }

    // 3. Software Engineering
    if (
      /\b(software|developer|engineer|full stack|fullstack|frontend|front-end|backend|back-end|web developer|programmer|devops|sre|cloud engineer|systems engineer|firmware|mobile developer|ios|android|react|node|python developer|java developer)\b/i.test(
        title
      )
    ) {
      return 'SOFTWARE_ENGINEERING';
    }

    // 4. Marketing
    if (
      /\b(marketing|growth|social media|seo|sem|copywriter|content marketing|brand manager|public relations|digital marketing)\b/i.test(
        title
      )
    ) {
      return 'MARKETING';
    }

    // 5. Design
    if (
      /\b(ui\/ux|ux designer|ui designer|product designer|visual designer|graphic designer|interaction designer|animator)\b/i.test(
        title
      )
    ) {
      return 'DESIGN';
    }

    // 6. Sales
    if (
      /\b(sales|business development|bdr|sdr|account executive|account manager|client relationship|sales representative)\b/i.test(
        title
      )
    ) {
      return 'SALES';
    }

    // 7. Product Management
    if (
      /\b(product manager|technical product manager|apm|product owner|scrum master|agile coach|program manager)\b/i.test(
        title
      )
    ) {
      return 'PRODUCT_MANAGEMENT';
    }

    // 8. HR & Operations
    if (
      /\b(human resources|hr generalist|recruiter|talent acquisition|people ops|operations manager|office manager)\b/i.test(
        title
      )
    ) {
      return 'OPERATIONS_HR';
    }

    return 'OTHER';
  }

  private evaluateRoleRelevance(
    candidateFamily: RoleFamilyType,
    jobFamily: RoleFamilyType,
    candidateTitle: string,
    jobTitle: string
  ): {
    roleScore: number;
    roleRelevance: 'STRONG' | 'MODERATE' | 'LOW' | 'MISMATCH';
    isRoleRelevant: boolean;
    roleMismatchReason?: string;
  } {
    // Exact same role family
    if (candidateFamily === jobFamily && candidateFamily !== 'OTHER') {
      const specificAlignment = this.calculateTitleOverlap(candidateTitle, jobTitle);
      const isStrong = specificAlignment >= 75;
      return {
        roleScore: specificAlignment,
        roleRelevance: isStrong ? 'STRONG' : 'MODERATE',
        isRoleRelevant: true
      };
    }

    // Adjacent / Complementary families
    const isAdjacent =
      (candidateFamily === 'DATA' && jobFamily === 'FINANCE') ||
      (candidateFamily === 'FINANCE' && jobFamily === 'DATA') ||
      (candidateFamily === 'SOFTWARE_ENGINEERING' && jobFamily === 'DATA') ||
      (candidateFamily === 'DATA' && jobFamily === 'SOFTWARE_ENGINEERING') ||
      (candidateFamily === 'PRODUCT_MANAGEMENT' && jobFamily === 'SOFTWARE_ENGINEERING');

    if (isAdjacent) {
      return {
        roleScore: 50,
        roleRelevance: 'MODERATE',
        isRoleRelevant: true
      };
    }

    // Cross-Domain Mismatch
    const candFamilyText = this.formatRoleFamily(candidateFamily);
    const jobFamilyText = this.formatRoleFamily(jobFamily);

    return {
      roleScore: 15,
      roleRelevance: 'MISMATCH',
      isRoleRelevant: false,
      roleMismatchReason: `The job belongs primarily to ${jobFamilyText}, while your active resume is focused on ${candFamilyText}.`
    };
  }

  public formatRoleFamily(family: RoleFamilyType): string {
    switch (family) {
      case 'SOFTWARE_ENGINEERING':
        return 'Software Development';
      case 'DATA':
        return 'Data & Analytics';
      case 'FINANCE':
        return 'Finance';
      case 'MARKETING':
        return 'Marketing';
      case 'DESIGN':
        return 'UI/UX Design';
      case 'SALES':
        return 'Sales & BD';
      case 'PRODUCT_MANAGEMENT':
        return 'Product Management';
      case 'OPERATIONS_HR':
        return 'Operations & HR';
      default:
        return 'General Professional';
    }
  }

  private calculateTitleOverlap(titleA: string, titleB: string): number {
    const a = titleA.toLowerCase();
    const b = titleB.toLowerCase();
    if (a === b) return 100;

    // Direct core phrase containment
    const corePhrases = [
      'full stack',
      'fullstack',
      'frontend',
      'front end',
      'backend',
      'back end',
      'software engineer',
      'software developer',
      'data analyst',
      'data scientist',
      'data engineer',
      'financial analyst',
      'product manager',
      'ui/ux',
      'devops'
    ];

    for (const phrase of corePhrases) {
      if (a.includes(phrase) && b.includes(phrase)) {
        return 95;
      }
    }

    const ignoredModifiers = new Set([
      'developer',
      'engineer',
      'associate',
      'senior',
      'junior',
      'lead',
      'staff',
      'principal',
      'intern',
      'internship',
      'mid',
      'i',
      'ii',
      'iii',
      'iv'
    ]);

    const wordsA = a.split(/\W+/).filter((w) => w.length > 2 && !ignoredModifiers.has(w));
    const wordsB = b.split(/\W+/).filter((w) => w.length > 2 && !ignoredModifiers.has(w));

    if (wordsA.length === 0 || wordsB.length === 0) return 80;

    let matchCount = 0;
    for (const w of wordsA) {
      if (wordsB.includes(w)) matchCount++;
    }

    return Math.min(100, Math.max(50, Math.round((matchCount / Math.min(wordsA.length, wordsB.length)) * 100)));
  }

  private resolveMatchQuality(
    score: number,
    roleRelevance: 'STRONG' | 'MODERATE' | 'LOW' | 'MISMATCH'
  ): {
    qualityLabel: 'Strong Match' | 'Good Match' | 'Partial Match' | 'Low Match' | 'Not a Match';
    matchQuality: MatchQualityLevel;
  } {
    if (roleRelevance === 'MISMATCH' || score < 30) {
      return { qualityLabel: 'Not a Match', matchQuality: 'NONE' };
    }
    if (score >= 85) return { qualityLabel: 'Strong Match', matchQuality: 'STRONG' };
    if (score >= 70) return { qualityLabel: 'Good Match', matchQuality: 'GOOD' };
    if (score >= 50) return { qualityLabel: 'Partial Match', matchQuality: 'PARTIAL' };
    return { qualityLabel: 'Low Match', matchQuality: 'LOW' };
  }

  private buildDiagnosticInsights(ctx: {
    overallScore: number;
    qualityLabel: string;
    roleRelevance: string;
    candidateFamily: RoleFamilyType;
    jobFamily: RoleFamilyType;
    candidateRole: string;
    jobTitle: string;
    company: string;
    roleMismatchReason?: string;
    coreMatchedSkills: string[];
    missingSkillsDetailed: IMissingSkillDetail[];
    experienceVerdict: string;
    candidateYears: number;
  }): { whyThisScore: string; resumeIssues: string[] } {
    const issues: string[] = [];

    // Role mismatch reason
    if (ctx.roleRelevance === 'MISMATCH') {
      issues.push(
        `Domain mismatch: ${ctx.jobTitle} is in ${this.formatRoleFamily(ctx.jobFamily)}, whereas your resume is focused on ${this.formatRoleFamily(ctx.candidateFamily)}.`
      );
    }

    // Missing required skills
    const missingReq = ctx.missingSkillsDetailed.filter((m) => m.priority === 'REQUIRED');
    for (const m of missingReq.slice(0, 3)) {
      issues.push(`Missing required skill: ${m.skill} is not found in your resume skills or experience.`);
    }

    // Missing preferred skills
    const missingPref = ctx.missingSkillsDetailed.filter((m) => m.priority === 'PREFERRED');
    for (const m of missingPref.slice(0, 2)) {
      issues.push(`Missing preferred keyword: ${m.skill} is requested by the job description.`);
    }

    // Experience mismatch
    if (ctx.experienceVerdict === 'MISMATCH') {
      issues.push(
        `Experience mismatch: The role seeks specialized domain experience that is absent from your active background.`
      );
    }

    // Why this score summary
    let whyThisScore = '';
    if (ctx.roleRelevance === 'MISMATCH') {
      whyThisScore = `This role is primarily ${this.formatRoleFamily(ctx.jobFamily).toLowerCase()}-focused, while your active resume is focused on ${this.formatRoleFamily(ctx.candidateFamily).toLowerCase()}.`;
    } else if (ctx.overallScore >= 80) {
      whyThisScore = `Your resume demonstrates strong technical alignment with ${ctx.company}'s requirements, matching core stack components (${ctx.coreMatchedSkills.slice(0, 3).join(', ')}).`;
    } else if (ctx.overallScore >= 50) {
      const topMissing = ctx.missingSkillsDetailed.slice(0, 2).map((m) => m.skill).join(' and ');
      whyThisScore = `Good foundational overlap, but the position expects key proficiencies in ${topMissing || 'additional stack tools'} not highlighted on your resume.`;
    } else {
      whyThisScore = `Your background partially touches the domain, but significant core requirements are missing from your current resume.`;
    }

    return { whyThisScore, resumeIssues: issues };
  }

  private isGenericSkill(skill: string): boolean {
    return GENERIC_SKILLS.has(skill.toLowerCase().trim());
  }

  private isSkillRequiredInText(skill: string, text: string): boolean {
    const lower = text.toLowerCase();
    const skillLower = skill.toLowerCase();
    const reqIndex = lower.search(/\b(requirements|qualifications|must have|minimum qualifications|essential)\b/);
    const skillIndex = lower.indexOf(skillLower);

    if (reqIndex !== -1 && skillIndex > reqIndex) {
      const prefIndex = lower.search(/\b(preferred|nice to have|bonus|plus)\b/);
      if (prefIndex === -1 || skillIndex < prefIndex) {
        return true;
      }
    }
    return false;
  }

  private getCandidatePrimaryRole(profile: IUserProfile): string {
    return (
      profile.professional?.currentTitle ||
      profile.professional?.preferredJobTitle ||
      profile.experiences?.[0]?.jobTitle ||
      'Software Engineer'
    );
  }

  private collectCandidateSkills(profile: IUserProfile): Set<string> {
    const set = new Set<string>();

    if (profile.professional?.skills) {
      for (const s of profile.professional.skills) {
        set.add(s.trim().toLowerCase());
      }
    }

    if (profile.experiences) {
      for (const exp of profile.experiences) {
        if (exp.technologies) {
          for (const t of exp.technologies) set.add(t.trim().toLowerCase());
        }
      }
    }

    if (profile.projects) {
      for (const p of profile.projects) {
        if (p.technologies) {
          for (const t of p.technologies) set.add(t.trim().toLowerCase());
        }
      }
    }

    return set;
  }

  private hasSkillMatch(userSkills: Set<string>, jobSkill: string): boolean {
    const lower = jobSkill.trim().toLowerCase();
    if (userSkills.has(lower)) return true;

    const aliases: Record<string, string[]> = {
      react: ['react.js', 'reactjs'],
      'react.js': ['react'],
      node: ['node.js', 'nodejs'],
      'node.js': ['node'],
      typescript: ['ts'],
      javascript: ['js'],
      python: ['py'],
      golang: ['go'],
      postgres: ['postgresql', 'psql'],
      mongo: ['mongodb'],
      k8s: ['kubernetes'],
      rest: ['rest api', 'restful api', 'apis'],
      'rest api': ['rest', 'restful', 'apis'],
      aws: ['amazon web services'],
      'amazon web services': ['aws'],
      docker: ['containers', 'containerization']
    };

    const altList = aliases[lower] || [];
    for (const alt of altList) {
      if (userSkills.has(alt)) return true;
    }

    for (const u of userSkills) {
      if (u.length >= 3 && (u.includes(lower) || lower.includes(u))) {
        return true;
      }
    }

    return false;
  }

  private calculateCandidateYears(profile: IUserProfile): number {
    if (profile.professional?.yearsOfExperience) {
      return profile.professional.yearsOfExperience;
    }

    if (!profile.experiences || profile.experiences.length === 0) {
      return 1;
    }

    let totalMonths = 0;
    for (const exp of profile.experiences) {
      if (exp.startDate) {
        const start = new Date(exp.startDate).getTime();
        const end = exp.endDate && !exp.isCurrent ? new Date(exp.endDate).getTime() : Date.now();
        const diffMonths = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24 * 30)));
        totalMonths += diffMonths;
      }
    }

    return Math.max(1, Math.round(totalMonths / 12));
  }

  private scoreExperience(
    years: number,
    targetLevel: 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE'
  ): { score: number; notes: string } {
    switch (targetLevel) {
      case 'ENTRY':
        return years <= 2
          ? { score: 95, notes: `Your experience (${years} yrs) aligns with Entry-level role` }
          : { score: 85, notes: `You exceed the entry-level baseline with ${years} years experience` };
      case 'MID':
        return years >= 2 && years <= 5
          ? { score: 95, notes: `Your experience (${years} yrs) perfectly fits Mid-level requirements` }
          : years > 5
          ? { score: 90, notes: `Seasoned background (${years} yrs) for Mid-level position` }
          : { score: 70, notes: `Developing experience (${years} yrs) for Mid-level expectations` };
      case 'SENIOR':
        return years >= 5
          ? { score: 95, notes: `Strong tenure (${years} yrs) meeting Senior role criteria` }
          : years >= 3
          ? { score: 78, notes: `Close to Senior criteria with ${years} years of professional experience` }
          : { score: 55, notes: `Senior role typically expects 5+ years experience (you have ${years})` };
      case 'LEAD':
      case 'EXECUTIVE':
        return years >= 8
          ? { score: 95, notes: `Proven track record (${years} yrs) matching Lead leadership criteria` }
          : years >= 5
          ? { score: 80, notes: `Solid seniority (${years} yrs) for Lead responsibility` }
          : { score: 50, notes: `Leadership role usually requires 8+ years experience` };
    }
  }

  private scoreEducationVerdict(
    profile: IUserProfile,
    text: string,
    candidateFamily: RoleFamilyType,
    jobFamily: RoleFamilyType
  ): {
    score: number;
    verdict: 'MATCH' | 'PARTIAL' | 'MISMATCH' | 'NOT_SPECIFIED';
    text: string;
  } {
    const lower = text.toLowerCase();
    const hasDegreeRequirement = /bachelor|master|phd|degree|b\.s\.|m\.s\./i.test(lower);
    if (!hasDegreeRequirement) {
      return { score: 90, verdict: 'NOT_SPECIFIED', text: '— Not specified' };
    }

    const userDegrees = (profile.educations || []).map((e) => (e.degree || '').toLowerCase());
    if (userDegrees.length === 0) {
      return { score: 65, verdict: 'PARTIAL', text: '⚠ Degree not listed' };
    }

    if (candidateFamily !== jobFamily && jobFamily === 'FINANCE') {
      return { score: 60, verdict: 'PARTIAL', text: '⚠ Engineering degree for Finance role' };
    }

    if (userDegrees.some((d) => d.includes('master') || d.includes('phd'))) {
      return { score: 100, verdict: 'MATCH', text: '✓ Advanced degree meets requirement' };
    }
    if (userDegrees.some((d) => d.includes('bachelor') || d.includes('b.s') || d.includes('b.a') || d.includes('btech'))) {
      return { score: 90, verdict: 'MATCH', text: '✓ Degree meets requirement' };
    }

    return { score: 80, verdict: 'MATCH', text: '✓ Relevant' };
  }

  private scoreLocation(profile: IUserProfile, job: ID1Job | INormalizedJob): number {
    const isRemote = Boolean(job.remote || (job.location && job.location.toLowerCase().includes('remote')));
    if (isRemote) return 100;
    const pLoc = `${profile.personal?.city || ''} ${profile.personal?.country || ''}`.toLowerCase();
    const jLoc = (job.location || '').toLowerCase();

    if (!pLoc.trim()) return 80;
    if (jLoc && jLoc.includes(profile.personal?.city?.toLowerCase() || '---')) return 100;
    if (profile.preferences?.locations?.some((loc) => jLoc.includes(loc.toLowerCase()))) return 95;

    return 65;
  }

  private extractKeywords(text: string): string[] {
    const words = text.match(/\b[A-Za-z0-9+#.]{2,20}\b/g) || [];
    const tech = [
      'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Go', 'SQL',
      'PostgreSQL', 'MongoDB', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'REST API',
      'Financial Modeling', 'Excel', 'Valuation', 'Accounting', 'Financial Statements'
    ];
    return tech.filter((t) => words.some((w) => w.toLowerCase() === t.toLowerCase()));
  }

  private buildExplanation(info: {
    overallScore: number;
    qualityLabel: string;
    skillsScore: number;
    roleScore: number;
    experienceScore: number;
    matchedCount: number;
    totalSkills: number;
    jobTitle: string;
    company: string;
    roleMismatchReason?: string;
  }): string {
    if (info.roleMismatchReason) {
      return `${info.roleMismatchReason} Overall score is ${info.overallScore}% (${info.qualityLabel}).`;
    }
    return (
      `This position matches your profile at ${info.overallScore}% (${info.qualityLabel}). ` +
      `You match ${info.matchedCount} of ${info.totalSkills} identified skill requirements (${info.skillsScore}% skill fit). ` +
      `Your role background demonstrates ${info.roleScore}% alignment with ${info.company}'s ${info.jobTitle} position.`
    );
  }
}

export const matchingEngine = new JobMatchingEngine();
