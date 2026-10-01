import { fieldDetector, FormDetectionSummary } from './detector';
import { formEngine, AutofillSummary, AutofillOptions } from './formEngine';
import { jobPageDetector } from './jobDetector';
import { jobMatchService } from './jobMatchService';
import { InpageUi, inpageUi } from './inpageUi';
import {
  FieldTaxonomyType,
  IJobPageDetection,
  IMatchBreakdown,
  IPageIntelligenceState,
  PageIntelligenceType,
  IActiveJobContext
} from '@kraxyy/types';

console.log('[KRAXYY][BOOT] Content script loaded');

let currentDetection: FormDetectionSummary | null = null;
let currentJobDetection: IJobPageDetection | null = null;
let currentPageIntelligence: IPageIntelligenceState | null = null;
let lastAutofillSummary: AutofillSummary | null = null;
let mutationTimeout: NodeJS.Timeout | null = null;
let lastKnownFieldSignature: string = '';

const isTopFrame = window === window.top;

function safeSendMessage(message: any, callback?: (response: any) => void) {
  try {
    chrome.runtime.sendMessage(message, (res) => {
      if (chrome.runtime.lastError) {
        return;
      }
      callback?.(res);
    });
  } catch {
    // Background worker inactive or reloading
  }
}

/**
 * Pure evaluator for Page Intelligence State.
 * Exported for automated unit testing.
 */
export function evaluatePageIntelligence(
  formDet: FormDetectionSummary | null,
  jobDet: IJobPageDetection | null,
  match: IMatchBreakdown | null = null,
  pageUrl: string = typeof window !== 'undefined' ? window.location.href : '',
  isTop: boolean = isTopFrame
): IPageIntelligenceState {
  const isJob = Boolean(jobDet?.isJobPage && jobDet.job);
  const isForm = Boolean(formDet?.isApplicationForm && formDet.fields && formDet.fields.length > 0);

  let pageType: PageIntelligenceType = 'OTHER';
  if (isJob && isForm) {
    pageType = 'JOB_AND_APPLICATION';
  } else if (isJob) {
    pageType = 'JOB';
  } else if (isForm) {
    pageType = 'APPLICATION';
  }

  const fillableCount = formDet?.fillableFieldCount ?? (formDet?.fields
    ? formDet.fields.filter(
        (f) => f.taxonomyType && f.taxonomyType !== 'UNKNOWN' && f.status !== 'MANUAL_REQUIRED'
      ).length
    : 0);

  const manualCount = formDet?.manualRequiredCount ?? (formDet?.fields
    ? formDet.fields.filter((f) => f.status === 'MANUAL_REQUIRED').length
    : 0);

  const isAutofillReady = formDet?.autofillReady !== undefined
    ? formDet.autofillReady
    : (isForm && fillableCount > 0);

  const resolvedMatch = match || jobDet?.match;
  const activeContext: IActiveJobContext | undefined = jobDet?.job
    ? {
        jobTitle: jobDet.job.title,
        company: jobDet.job.company,
        matchScore: resolvedMatch?.overallScore || 85,
        sourceUrl: jobDet.job.sourceUrl || pageUrl,
        applicationUrl: jobDet.job.applyUrl || pageUrl,
        detectedAt: new Date().toISOString()
      }
    : undefined;

  return {
    pageType,
    job: isJob
      ? {
          detected: true,
          confidence: jobDet!.confidence,
          normalizedJob: jobDet!.job,
          match: resolvedMatch,
          source: jobDet!.source,
          characterCount: jobDet!.characterCount
        }
      : undefined,
    form: isForm
      ? {
          detected: true,
          confidence: formDet!.confidence,
          autofillReady: isAutofillReady,
          fieldCount: formDet!.fieldCount ?? formDet!.fields.length,
          fillableFieldCount: fillableCount,
          manualRequiredCount: manualCount,
          fields: formDet!.fields
        }
      : undefined,
    activeContext,
    url: pageUrl,
    isTopFrame: isTop,
    timestamp: Date.now()
  };
}

/**
 * Unified Scanner: runs both JobDetector and FormDetector simultaneously,
 * computes multi-dimensional match against candidate profile,
 * evaluates page type (JOB_AND_APPLICATION, JOB, APPLICATION, OTHER),
 * and syncs state to background service worker.
 */
export function scanPage() {
  if (InpageUi.isExcludedDomain()) {
    inpageUi.remove();
    return;
  }
  console.log('[KRAXYY][SCAN] Starting page scan');

  // 1. Scan Form
  currentDetection = fieldDetector.detectForm();

  // Create a signature of detected field selectors to track step changes in SPAs
  const signature = currentDetection.fields.map((f) => f.selector).sort().join('|');
  const isStepChanged = lastKnownFieldSignature !== '' && signature !== lastKnownFieldSignature;
  lastKnownFieldSignature = signature;

  if (isStepChanged && currentDetection.fields.length > 0) {
    lastAutofillSummary = null;
  }

  // 2. Scan Job (top frame only)
  if (isTopFrame) {
    currentJobDetection = jobPageDetector.detectJob();
  } else {
    currentJobDetection = null;
  }

  // 3. Match with profile and compute unified Page Intelligence State
  safeSendMessage({ type: 'GET_PROFILE_DATA' }, (res) => {
    console.log('[KRAXYY][PROFILE] Profile loaded:', Boolean(res?.profile));

    let match: IMatchBreakdown | null = null;
    if (res?.profile && currentJobDetection?.job) {
      try {
        match = jobMatchService.matchJobWithProfile(currentJobDetection.job, res.profile);
        currentJobDetection.match = match;
        console.log('[KRAXYY][MATCH] Match calculated:', match.overallScore + '%');
      } catch {}
    }

    currentPageIntelligence = evaluatePageIntelligence(
      currentDetection,
      currentJobDetection,
      match,
      window.location.href,
      isTopFrame
    );

    // Update page intelligence in background without altering panel visibility
    if (isTopFrame) {
      inpageUi.updateIntelligence(currentPageIntelligence, () => executeAutofill(), lastAutofillSummary);
    }

    // Notify background service worker of unified page intelligence
    safeSendMessage({
      type: 'PAGE_INTELLIGENCE_UPDATE',
      intelligence: currentPageIntelligence,
      detection: currentDetection,
      jobDetection: currentJobDetection,
      isTopFrame,
      frameUrl: window.location.href
    });

    // Backward-compatible frame scan result message
    safeSendMessage({
      type: 'FRAME_SCAN_RESULT',
      isTopFrame,
      frameUrl: window.location.href,
      detection: currentDetection
    });
  });
}

async function executeAutofill(options: AutofillOptions = {}) {
  console.log('[KRAXYY][ACTION] Autofill clicked');
  // Fresh scan before autofilling
  currentDetection = fieldDetector.detectForm();

  if (!currentDetection || currentDetection.fields.length === 0) {
    return { success: false, error: 'No form fields detected on this page' };
  }

  const startTime = Date.now();

  return new Promise((resolve) => {
    safeSendMessage({ type: 'GET_PROFILE_DATA' }, async (res) => {
      if (!res?.success || !res.profile) {
        return resolve({
          success: false,
          error: 'Please connect your Kraxyy Apply account first in the extension popup.'
        });
      }

      const profile = res.profile as Record<FieldTaxonomyType, string | boolean>;
      lastAutofillSummary = await formEngine.fillForm(currentDetection!.fields, profile, options);

      inpageUi.showAutofillReport(lastAutofillSummary);

      // Telemetry
      safeSendMessage({
        type: 'LOG_TELEMETRY',
        telemetry: {
          domain: window.location.hostname,
          adapterName: 'universal_engine_v2',
          fieldsDetectedCount: lastAutofillSummary.totalDetected,
          fieldsFilledCount: lastAutofillSummary.totalVerified,
          fieldsReviewedCount: lastAutofillSummary.totalNeedsAttention,
          formDetectedConfidence: currentDetection!.confidence,
          durationMs: Date.now() - startTime
        }
      });

      resolve({ success: true, summary: lastAutofillSummary });
    });
  });
}

function clearAutofill() {
  if (currentDetection) {
    formEngine.clearFields(currentDetection.fields);
  }
}

// ==========================================================
// SPA Navigation Interception (React Router, Next.js, Vue Router)
// ==========================================================
function hookSpaNavigation() {
  let lastNavUrl = typeof window !== 'undefined' ? window.location.href : '';

  const notifyNavigation = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (currentUrl !== lastNavUrl) {
      lastNavUrl = currentUrl;
      // Immediately reset previous job's match results on navigation so Job A's score is never shown for Job B!
      inpageUi.resetForNewJob();
    }
    setTimeout(() => {
      scanPage();
    }, 400);
  };

  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    const result = originalPushState.apply(this, args);
    notifyNavigation();
    return result;
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    const result = originalReplaceState.apply(this, args);
    notifyNavigation();
    return result;
  };

  window.addEventListener('popstate', notifyNavigation);
  window.addEventListener('hashchange', notifyNavigation);
}

// Initial scan
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      scanPage();
      hookSpaNavigation();
    });
  } else {
    scanPage();
    hookSpaNavigation();
  }

  // Observe dynamic DOM changes with debouncing
  const observer = new MutationObserver(() => {
    if (mutationTimeout) clearTimeout(mutationTimeout);
    mutationTimeout = setTimeout(() => {
      scanPage();
    }, 800);
  });

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }
}

// Listen to messages from popup or background script
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'SCAN_PAGE') {
      console.log('[KRAXYY][SCAN] Starting page scan (forced by popup)');
      currentDetection = fieldDetector.detectForm();
      if (isTopFrame) {
        currentJobDetection = jobPageDetector.detectJob();
      }

      safeSendMessage({ type: 'GET_PROFILE_DATA' }, (res) => {
        console.log('[KRAXYY][PROFILE] Profile loaded:', Boolean(res?.profile));
        let match: IMatchBreakdown | null = null;
        if (res?.profile && currentJobDetection?.job) {
          try {
            match = jobMatchService.matchJobWithProfile(currentJobDetection.job, res.profile);
            currentJobDetection.match = match;
            console.log('[KRAXYY][MATCH] Match calculated:', match.overallScore + '%');
          } catch {}
        }

        currentPageIntelligence = evaluatePageIntelligence(
          currentDetection,
          currentJobDetection,
          match,
          window.location.href,
          isTopFrame
        );

        if (isTopFrame) {
          console.log('[KRAXYY][UI] Rendering state:', currentPageIntelligence.pageType);
          inpageUi.render(currentPageIntelligence, () => executeAutofill(), lastAutofillSummary);
        }

        sendResponse({
          success: true,
          intelligence: currentPageIntelligence,
          detection: currentDetection,
          jobDetection: currentJobDetection,
          lastAutofill: lastAutofillSummary,
          isTopFrame,
          frameUrl: window.location.href
        });
      });
      return true;
    } else if (message.type === 'GET_PAGE_INTELLIGENCE') {
      // Re-scan if not yet computed
      if (!currentPageIntelligence) {
        currentDetection = fieldDetector.detectForm();
        if (isTopFrame) currentJobDetection = jobPageDetector.detectJob();
        currentPageIntelligence = evaluatePageIntelligence(
          currentDetection,
          currentJobDetection,
          currentJobDetection?.match || null,
          window.location.href,
          isTopFrame
        );
      }
      sendResponse({
        success: true,
        intelligence: currentPageIntelligence,
        detection: currentDetection,
        jobDetection: currentJobDetection,
        lastAutofill: lastAutofillSummary,
        isTopFrame,
        frameUrl: window.location.href
      });
      return true;
    } else if (message.type === 'GET_PAGE_STATUS') {
      currentDetection = fieldDetector.detectForm();
      sendResponse({
        detection: currentDetection,
        lastAutofill: lastAutofillSummary,
        isTopFrame,
        frameUrl: window.location.href
      });
      return true;
    } else if (message.type === 'EXECUTE_AUTOFILL') {
      executeAutofill(message.options || {}).then(sendResponse);
      return true;
    } else if (message.type === 'OPEN_KRAXYY_PANEL' || message.type === 'OPEN_CRAZY_PANEL' || message.type === 'OPEN_FLOATING_ASSISTANT') {
      if (isTopFrame) {
        if (!currentPageIntelligence) {
          currentDetection = fieldDetector.detectForm();
          currentJobDetection = jobPageDetector.detectJob();
          currentPageIntelligence = evaluatePageIntelligence(
            currentDetection,
            currentJobDetection,
            currentJobDetection?.match || null,
            window.location.href,
            true
          );
        }
        inpageUi.updateIntelligence(currentPageIntelligence, () => executeAutofill(), lastAutofillSummary);
        inpageUi.open(message.feature || 'HOME');
      }
      sendResponse({ success: true });
      return true;
    } else if (message.type === 'CLOSE_KRAXYY_PANEL' || message.type === 'CLOSE_CRAZY_PANEL') {
      if (isTopFrame) {
        inpageUi.close();
      }
      sendResponse({ success: true });
      return true;
    } else if (message.type === 'RESCAN_CURRENT_JOB') {
      if (isTopFrame) {
        inpageUi.rescanCurrentJob('MANUAL');
      }
      sendResponse({ success: true });
      return true;
    } else if (message.type === 'TOGGLE_KRAXYY_PANEL' || message.type === 'TOGGLE_CRAZY_PANEL') {
      if (isTopFrame) {
        if (inpageUi.getVisibility() === 'open') {
          inpageUi.close();
        } else {
          if (!currentPageIntelligence) {
            currentDetection = fieldDetector.detectForm();
            currentJobDetection = jobPageDetector.detectJob();
            currentPageIntelligence = evaluatePageIntelligence(
              currentDetection,
              currentJobDetection,
              currentJobDetection?.match || null,
              window.location.href,
              true
            );
          }
          inpageUi.updateIntelligence(currentPageIntelligence, () => executeAutofill(), lastAutofillSummary);
          inpageUi.open(message.feature || 'HOME');
        }
      }
      sendResponse({ success: true, visibility: inpageUi.getVisibility() });
      return true;
    } else if (message.type === 'GET_JOB_STATUS') {
      if (!currentJobDetection && isTopFrame) {
        currentJobDetection = jobPageDetector.detectJob();
      }
      sendResponse({ jobDetection: currentJobDetection });
      return true;
    } else if (message.type === 'EXTRACT_JOB_DESCRIPTION') {
      const detection = jobPageDetector.detectJob();
      currentJobDetection = detection;
      sendResponse({
        success: Boolean(detection.isJobPage && detection.job),
        job: detection.job || null,
        confidence: detection.confidence,
        source: detection.source
      });
      return true;
    } else if (message.type === 'DETECT_AND_MAP_FIELDS') {
      currentDetection = fieldDetector.detectForm();
      const detectedFields = currentDetection.fields || [];

      safeSendMessage({ type: 'GET_PROFILE_DATA' }, (res) => {
        const profile = (res?.profile || {}) as Record<string, any>;

        const friendlyLabels: Record<string, string> = {
          FIRST_NAME: 'First Name',
          LAST_NAME: 'Last Name',
          FULL_NAME: 'Full Name',
          NAME: 'Name',
          EMAIL: 'Email',
          PHONE: 'Phone',
          UNIVERSITY: 'Education (University)',
          DEGREE: 'Education (Degree)',
          EDUCATION_DEGREE: 'Education',
          FIELD_OF_STUDY: 'Field of Study',
          SKILLS: 'Skills',
          EXPERIENCE: 'Experience',
          YEARS_EXPERIENCE: 'Years of Experience',
          CURRENT_COMPANY: 'Experience (Company)',
          COMPANY: 'Experience (Company)',
          CURRENT_JOB_TITLE: 'Job Title',
          JOB_TITLE: 'Job Title',
          LINKEDIN: 'LinkedIn Profile',
          GITHUB: 'GitHub Profile',
          PORTFOLIO: 'Portfolio',
          WEBSITE: 'Website',
          CITY: 'City',
          COUNTRY: 'Country',
          POSTAL_CODE: 'Postal Code',
          STATE: 'State',
          ADDRESS: 'Address',
          ADDRESS_LINE1: 'Address',
          RESUME: 'Resume / CV',
          WORK_AUTHORIZATION: 'Work Authorization',
          VISA_SPONSORSHIP: 'Sponsorship Status'
        };

        const mappedList = detectedFields.map((f) => {
          const taxType = f.taxonomyType || 'UNKNOWN';
          const candidateVal = profile[taxType] !== undefined ? String(profile[taxType]) : '';
          const displayLabel = f.label || friendlyLabels[taxType] || taxType.replace(/_/g, ' ');
          const isMapped = Boolean(taxType !== 'UNKNOWN' && candidateVal && candidateVal !== '');

          return {
            id: f.id,
            selector: f.selector,
            label: displayLabel,
            taxonomyType: taxType,
            mappedValue: candidateVal,
            isMapped,
            status: f.status || (isMapped ? 'READY' : 'MANUAL_REQUIRED')
          };
        });

        // Group into distinct mapped categories
        const mappedCategories: string[] = [];
        const seenCat = new Set<string>();
        for (const item of mappedList) {
          let cat = 'Other';
          if (/name/i.test(item.label)) cat = 'Name';
          else if (/email/i.test(item.label)) cat = 'Email';
          else if (/phone/i.test(item.label)) cat = 'Phone';
          else if (/education|degree|university/i.test(item.label)) cat = 'Education';
          else if (/skill/i.test(item.label)) cat = 'Skills';
          else if (/experience|company|title/i.test(item.label)) cat = 'Experience';
          else if (/linkedin/i.test(item.label)) cat = 'LinkedIn';
          else if (/github/i.test(item.label)) cat = 'GitHub';
          else if (/portfolio|website/i.test(item.label)) cat = 'Portfolio';
          else if (/address|city|country/i.test(item.label)) cat = 'Location';

          if (!seenCat.has(cat)) {
            seenCat.add(cat);
            mappedCategories.push(cat);
          }
        }

        sendResponse({
          success: true,
          fieldsFound: detectedFields.length,
          mappedCount: mappedList.filter((m) => m.isMapped).length,
          fields: mappedList,
          categories: mappedCategories,
          confidence: currentDetection?.confidence || 0.85
        });
      });
      return true;
    } else if (message.type === 'CLEAR_AUTOFILL') {
      clearAutofill();
      sendResponse({ success: true });
      return true;
    }
  });
}
