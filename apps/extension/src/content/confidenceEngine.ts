import { IDetectedField } from '@kraxyy/types';

export interface ConfidenceEvaluation {
  isApplicationPage: boolean;
  confidence: number;
  clusterScore: number;
  positiveSignals: string[];
  negativeSignals: string[];
  clusterMatches: string[];
}

export class ApplicationConfidenceEngine {
  /**
   * Evaluates application page confidence based on semantic field clusters
   * and negative pattern gating. Does NOT rely on <form> tags.
   */
  public evaluate(
    fields: IDetectedField[],
    doc: Document = typeof document !== 'undefined' ? document : ({} as any)
  ): ConfidenceEvaluation {
    const positiveSignals: string[] = [];
    const negativeSignals: string[] = [];
    const clusterMatches: string[] = [];

    // Filter valid, non-UNKNOWN fields
    const classified = fields.filter((f) => f.taxonomyType && f.taxonomyType !== 'UNKNOWN');
    const taxonomies = new Set(classified.map((f) => f.taxonomyType));

    // 1. Check Negative Signals & Anti-Patterns
    const hasPasswordInput = Boolean(doc?.querySelector && doc.querySelector('input[type="password"]')) ||
      fields.some((f) => f.inputType === 'password');
    if (hasPasswordInput) {
      negativeSignals.push('password_field_present');
    }

    const pageText = (doc.body?.textContent || (doc.body as any)?.innerText || '').toLowerCase().slice(0, 15000);

    const isLoginContext = pageText.includes('sign in to your account') ||
      pageText.includes('log in to your account') ||
      (pageText.includes('forgot password') && hasPasswordInput);
    if (isLoginContext) {
      negativeSignals.push('login_portal_context');
    }

    const isCheckoutContext = pageText.includes('order summary') ||
      pageText.includes('payment method') ||
      pageText.includes('shipping address') && (pageText.includes('credit card') || pageText.includes('cvv'));
    if (isCheckoutContext) {
      negativeSignals.push('ecommerce_checkout_context');
    }

    const isSolitaryNewsletter = classified.length <= 2 &&
      taxonomies.has('EMAIL') &&
      !taxonomies.has('RESUME') &&
      !taxonomies.has('FIRST_NAME') &&
      !taxonomies.has('LAST_NAME') &&
      !taxonomies.has('FULL_NAME') &&
      (pageText.includes('subscribe to our newsletter') || pageText.includes('join our mailing list') || pageText.includes('stay updated'));
    if (isSolitaryNewsletter) {
      negativeSignals.push('solitary_newsletter_signup');
    }

    // 2. Identify Semantic Clusters
    const hasName = taxonomies.has('FIRST_NAME') || taxonomies.has('LAST_NAME') || taxonomies.has('FULL_NAME');
    const hasEmail = taxonomies.has('EMAIL');
    const hasPhone = taxonomies.has('PHONE');
    const hasResume = taxonomies.has('RESUME') || taxonomies.has('COVER_LETTER');
    const hasSocial = taxonomies.has('LINKEDIN') || taxonomies.has('GITHUB') || taxonomies.has('PORTFOLIO') || taxonomies.has('WEBSITE');
    const hasWorkAuth = taxonomies.has('WORK_AUTHORIZATION') || taxonomies.has('VISA_SPONSORSHIP');
    const hasProfessional = taxonomies.has('JOB_TITLE') || taxonomies.has('COMPANY') || taxonomies.has('YEARS_EXPERIENCE') || taxonomies.has('SKILLS');
    const hasEducation = taxonomies.has('UNIVERSITY') || taxonomies.has('COLLEGE') || taxonomies.has('DEGREE') || taxonomies.has('FIELD_OF_STUDY') || taxonomies.has('GPA') || taxonomies.has('GRADUATION_DATE');

    // Page Heading & Application Markers
    const applicationHeadingKeywords = [
      'apply for',
      'apply to',
      'apply now',
      'job application',
      'candidate application',
      'employment application',
      'submit your application',
      'submit application',
      'personal information',
      'candidate profile',
      'careers'
    ];
    const hasApplicationHeading = applicationHeadingKeywords.some((kw) => pageText.includes(kw));
    if (hasApplicationHeading) {
      positiveSignals.push('application_heading_detected');
    }

    let clusterScore = 0;

    // Cluster 1: Identity + Contact (Name + Email + Phone)
    if (hasName && hasEmail && hasPhone) {
      clusterScore += 65;
      clusterMatches.push('cluster_identity_contact (Name + Email + Phone)');
      positiveSignals.push('identity_contact_cluster');
    } else if (hasName && hasEmail) {
      clusterScore += 45;
      clusterMatches.push('cluster_partial_contact (Name + Email)');
      positiveSignals.push('partial_contact_cluster');
    } else if (hasName || hasEmail) {
      clusterScore += 20;
    }

    // Cluster 2: Application + Resume Upload (Name or Email + Resume)
    if (hasResume && (hasName || hasEmail)) {
      clusterScore += 45;
      clusterMatches.push('cluster_application_resume (Name/Email + Resume Upload)');
      positiveSignals.push('resume_upload_cluster');
    } else if (hasResume) {
      clusterScore += 40;
      clusterMatches.push('cluster_standalone_resume (Resume Upload)');
      positiveSignals.push('standalone_resume_upload');
    }

    // Cluster 3: Professional & Career Profile (Email/Name + LinkedIn/Portfolio)
    if (hasSocial && (hasName || hasEmail)) {
      clusterScore += 25;
      clusterMatches.push('cluster_professional_links (Contact + LinkedIn/Portfolio)');
      positiveSignals.push('professional_links_cluster');
    }

    // Cluster 4: Education & Work History
    if (hasEducation && hasProfessional) {
      clusterScore += 35;
      clusterMatches.push('cluster_education_and_work (Education and Work History)');
      positiveSignals.push('education_and_work_cluster');
    } else if (hasEducation || hasProfessional) {
      clusterScore += 25;
      clusterMatches.push('cluster_background (Education or Work History)');
      positiveSignals.push('background_fields_cluster');
    }

    // Cluster 5: Work Authorization & Legal Consent
    if (hasWorkAuth) {
      clusterScore += 20;
      clusterMatches.push('cluster_work_authorization (Sponsorship / Work Auth)');
      positiveSignals.push('work_authorization_cluster');
    }

    // Heading Bonus
    if (hasApplicationHeading) {
      clusterScore += 25;
    }

    // 3. Negative Penalties
    let penalty = 0;
    if (hasPasswordInput) penalty += 50;
    if (isLoginContext) penalty += 60;
    if (isCheckoutContext) penalty += 60;
    if (isSolitaryNewsletter) penalty += 70;

    const netScore = Math.max(0, clusterScore - penalty);

    // Normalize confidence [0..1]
    let confidence = Math.min(0.99, Math.round((netScore / 100) * 100) / 100);

    // Anti-Pattern: A single email or name field must NEVER be an application page
    if (classified.length < 2 && !hasResume) {
      confidence = Math.min(confidence, 0.25);
    }

    // Cluster validation check: Require at least one strong combination
    const hasStrongCombination =
      (hasName && hasEmail && (hasPhone || hasResume || hasSocial || hasWorkAuth || hasEducation || hasProfessional || hasApplicationHeading)) ||
      (hasResume && (hasName || hasEmail || hasApplicationHeading)) ||
      (hasEducation && (hasName || hasEmail || hasPhone)) ||
      (hasProfessional && (hasName || hasEmail || hasPhone)) ||
      (classified.length >= 3 && (hasName || hasEmail));

    const isApplicationPage = hasStrongCombination && confidence >= 0.60 && penalty < 40;

    return {
      isApplicationPage,
      confidence,
      clusterScore: netScore,
      positiveSignals,
      negativeSignals,
      clusterMatches
    };
  }
}

export const applicationConfidenceEngine = new ApplicationConfidenceEngine();
