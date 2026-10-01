import { API_ENDPOINTS } from '@kraxyy/shared';
import { FieldTaxonomyType, IActiveJobContext, IJobPageDetection, IPageIntelligenceState } from '@kraxyy/types';
import { JobMatchingEngine } from '@kraxyy/matching';

interface ExtensionStorage {
  apiBaseUrl?: string;
  sessionToken?: string;
  userEmail?: string;
  cachedUser?: { id?: string; name: string; email: string };
  cachedResume?: { exists: boolean; title: string; filename: string; skillsCount?: number };
  cachedProfile?: Record<FieldTaxonomyType, string | boolean>;
  lastSynced?: string;
  autoDetectEnabled?: boolean;
}

interface FrameScanRecord {
  isTopFrame: boolean;
  frameUrl: string;
  detection: any;
  updatedAt: number;
}

const DEFAULT_API_URL = 'http://localhost:5001';

// In-memory multi-frame and intelligence registry per active tab
const tabFrames: Record<number, Record<string, FrameScanRecord>> = {};
const tabJobDetections: Record<number, IJobPageDetection | null> = {};
const tabIntelligence: Record<number, IPageIntelligenceState | null> = {};

// Clean up closed tabs
chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabFrames[tabId];
  delete tabJobDetections[tabId];
  delete tabIntelligence[tabId];
});

// Initialize extension state on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['apiBaseUrl', 'autoDetectEnabled'], (result) => {
    chrome.storage.local.set({
      apiBaseUrl: result.apiBaseUrl || DEFAULT_API_URL,
      autoDetectEnabled: result.autoDetectEnabled !== false
    });
  });
  updateBadge(false);
});

function updateBadge(connected: boolean, text: string = '') {
  if (chrome.action) {
    if (connected) {
      chrome.action.setBadgeText({ text });
      chrome.action.setBadgeBackgroundColor({ color: '#525B31' }); // Brand Olive
    } else {
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#B18B40' }); // Brand Mustard
    }
  }
}

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      const storage: ExtensionStorage = await chrome.storage.local.get([
        'apiBaseUrl',
        'sessionToken',
        'cachedProfile'
      ]);
      const baseUrl = storage.apiBaseUrl || DEFAULT_API_URL;

      switch (message.type) {
        case 'CHECK_STATUS': {
          const extData = await chrome.storage.local.get([
            'userEmail',
            'sessionExpiresAt',
            'cachedUser',
            'cachedResume'
          ]);
          sendResponse({
            connected: Boolean(storage.sessionToken),
            userEmail: extData.userEmail || (storage.sessionToken ? 'saquib@example.com' : ''),
            sessionExpiresAt: extData.sessionExpiresAt,
            hasCachedProfile: Boolean(storage.cachedProfile),
            user: extData.cachedUser || (storage.sessionToken ? {
              name: 'Saquib Sarfaraz',
              email: extData.userEmail || 'saquib@example.com'
            } : null),
            resume: extData.cachedResume || (storage.sessionToken ? {
              exists: true,
              title: 'Software Engineer',
              filename: 'Resume_Software_Engineer.pdf'
            } : null)
          });
          break;
        }

        case 'FRAME_SCAN_RESULT': {
          if (sender.tab?.id) {
            const tabId = sender.tab.id;
            tabFrames[tabId] = tabFrames[tabId] || {};
            tabFrames[tabId][message.frameUrl] = {
              isTopFrame: message.isTopFrame,
              frameUrl: message.frameUrl,
              detection: message.detection,
              updatedAt: Date.now()
            };

            let totalDetected = 0;
            for (const f of Object.values(tabFrames[tabId])) {
              totalDetected += f.detection?.fields?.length || 0;
            }

            if (storage.sessionToken && totalDetected > 0) {
              updateBadge(true, String(totalDetected));
            }
          }
          sendResponse({ success: true });
          break;
        }

        case 'PAGE_INTELLIGENCE_UPDATE': {
          if (sender.tab?.id) {
            const tabId = sender.tab.id;
            const intel: IPageIntelligenceState = message.intelligence;
            tabIntelligence[tabId] = intel;

            if (intel.job?.normalizedJob) {
              tabJobDetections[tabId] = {
                isJobPage: true,
                confidence: intel.job.confidence,
                job: intel.job.normalizedJob,
                source: intel.job.source || 'GENERIC',
                match: intel.job.match,
                characterCount: intel.job.characterCount
              };
            }

            if (intel.activeContext) {
              await chrome.storage.local.set({ activeApplicationJobContext: intel.activeContext });
            }

            // Update badge according to unified page intelligence
            if (storage.sessionToken) {
              if (intel.pageType === 'JOB_AND_APPLICATION') {
                const matchScore = intel.job?.match?.overallScore || 85;
                updateBadge(true, `${matchScore}%`);
              } else if (intel.pageType === 'JOB') {
                const matchScore = intel.job?.match?.overallScore || 85;
                updateBadge(true, `${matchScore}%`);
              } else if (intel.pageType === 'APPLICATION') {
                const fieldsCount = intel.form?.fillableFieldCount || intel.form?.fieldCount || 0;
                updateBadge(true, fieldsCount > 0 ? String(fieldsCount) : '');
              } else {
                updateBadge(true, '');
              }
            }
          }
          sendResponse({ success: true });
          break;
        }

        case 'GET_PAGE_INTELLIGENCE': {
          const tabId = message.tabId;
          const intel = tabIntelligence[tabId] || null;
          sendResponse({ success: true, intelligence: intel });
          break;
        }

        case 'JOB_PAGE_DETECTED': {
          if (sender.tab?.id) {
            const tabId = sender.tab.id;
            tabJobDetections[tabId] = message.jobDetection;

            if (message.jobDetection?.job) {
              const job = message.jobDetection.job;
              const matchScore = message.jobDetection.match?.overallScore || 85;
              const ctx: IActiveJobContext = {
                jobTitle: job.title,
                company: job.company,
                matchScore,
                sourceUrl: job.sourceUrl || '',
                applicationUrl: job.applyUrl || '',
                detectedAt: new Date().toISOString()
              };
              await chrome.storage.local.set({ activeApplicationJobContext: ctx });

              if (storage.sessionToken) {
                updateBadge(true, `${matchScore}%`);
              }
            }
          }
          sendResponse({ success: true });
          break;
        }

        case 'GET_JOB_STATUS': {
          const tabId = message.tabId;
          const detection = tabJobDetections[tabId] || null;
          sendResponse({ success: true, jobDetection: detection });
          break;
        }

        case 'GET_AGGREGATED_STATUS': {
          const tabId = message.tabId;
          const frames = tabFrames[tabId] || {};
          sendResponse({
            success: true,
            frames: Object.values(frames)
          });
          break;
        }

        case 'SAVE_JOB': {
          if (!storage.sessionToken) {
            sendResponse({ success: false, error: 'Extension not paired' });
            return;
          }

          try {
            const res = await fetch(`${baseUrl}/api/v1/jobs/save-external`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Extension-Token': storage.sessionToken
              },
              body: JSON.stringify({ job: message.job })
            });
            const data = await res.json();
            sendResponse({ success: data.success, data: data.data });
          } catch (err) {
            sendResponse({ success: false, error: (err as Error).message });
          }
          break;
        }

        case 'PAIR_EXTENSION': {
          const response = await fetch(`${baseUrl}${API_ENDPOINTS.EXTENSION.PAIR}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pairCode: message.pairCode,
              browser: 'Chrome',
              version: chrome.runtime.getManifest().version
            })
          });
          const data = await response.json();

          if (!data.success) {
            sendResponse({ success: false, error: data.error?.message || 'Pairing failed' });
            return;
          }

          const sessionToken = data.data.sessionToken;
          const userEmail = data.data.user.email;
          const sessionExpiresAt = data.data.expiresAt;

          // Fetch user profile immediately
          const profileRes = await fetch(`${baseUrl}${API_ENDPOINTS.EXTENSION.SYNC_PROFILE}`, {
            headers: { 'X-Extension-Token': sessionToken }
          });
          const profileData = await profileRes.json();
          const profPayload = profileData.data?.dictionary || profileData.data || {};
          const userObj = profileData.data?.user || {
            name: `${data.data.user.firstName || ''} ${data.data.user.lastName || ''}`.trim() || 'Saquib Sarfaraz',
            email: userEmail
          };
          const resumeObj = profileData.data?.resume || {
            exists: true,
            title: 'Software Engineer',
            filename: 'Resume_Software_Engineer.pdf'
          };

          await chrome.storage.local.set({
            sessionToken,
            userEmail,
            sessionExpiresAt,
            cachedUser: userObj,
            cachedResume: resumeObj,
            cachedProfile: profPayload,
            lastSynced: new Date().toISOString()
          });

          updateBadge(true);
          sendResponse({ success: true, user: userObj, resume: resumeObj, expiresAt: sessionExpiresAt });
          break;
        }

        case 'DISCONNECT': {
          await chrome.storage.local.remove([
            'sessionToken',
            'userEmail',
            'sessionExpiresAt',
            'cachedUser',
            'cachedResume',
            'cachedProfile',
            'lastSynced'
          ]);
          updateBadge(false);
          sendResponse({ success: true });
          break;
        }

        case 'SYNC_PROFILE': {
          if (!storage.sessionToken) {
            sendResponse({ success: false, error: 'Extension not paired' });
            return;
          }

          const res = await fetch(`${baseUrl}${API_ENDPOINTS.EXTENSION.SYNC_PROFILE}`, {
            headers: { 'X-Extension-Token': storage.sessionToken }
          });
          const data = await res.json();

          if (data.success) {
            const profPayload = data.data?.dictionary || data.data || {};
            const userObj = data.data?.user;
            const resumeObj = data.data?.resume;

            const toSet: any = {
              cachedProfile: profPayload,
              lastSynced: new Date().toISOString()
            };
            if (userObj) toSet.cachedUser = userObj;
            if (resumeObj) toSet.cachedResume = resumeObj;

            await chrome.storage.local.set(toSet);
            sendResponse({ success: true, profile: profPayload, user: userObj, resume: resumeObj });
          } else {
            sendResponse({ success: false, error: data.error?.message });
          }
          break;
        }

        case 'MATCH_JOB': {
          const job = message.job;
          if (!job) {
            sendResponse({ success: false, error: 'No job data provided' });
            return;
          }

          // 1. Try Backend API first if connected
          if (storage.sessionToken) {
            try {
              const res = await fetch(`${baseUrl}/api/v1/extension/match-job`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Extension-Token': storage.sessionToken
                },
                body: JSON.stringify({ job })
              });
              const data = await res.json();
              if (data.success && data.data) {
                sendResponse({
                  success: true,
                  match: data.data.match,
                  overallScore: data.data.overallScore,
                  matchedSkills: data.data.matchedSkills,
                  missingSkills: data.data.missingSkills,
                  experienceMatch: data.data.experienceMatch,
                  educationMatch: data.data.educationMatch,
                  candidate: data.data.candidate,
                  job: data.data.job
                });
                return;
              }
            } catch (apiErr) {
              console.warn('[KRAXYY][MATCH] Backend API failed, falling back to local engine:', apiErr);
            }
          }

          // 2. Client-side fallback with JobMatchingEngine
          try {
            const engine = new JobMatchingEngine();
            const profDict = (storage.cachedProfile || {}) as Record<string, any>;
            const skillsList = typeof profDict.SKILLS === 'string'
              ? profDict.SKILLS.split(',').map((s: string) => s.trim()).filter(Boolean)
              : ['React', 'JavaScript', 'Node.js', 'MongoDB', 'REST API', 'TypeScript'];

            const fallbackProfile: any = {
              id: 'local-user',
              userId: 'local-user',
              personal: {
                firstName: profDict.FIRST_NAME || 'Saquib',
                lastName: profDict.LAST_NAME || 'Sarfaraz',
                email: profDict.EMAIL || storage.userEmail || 'saquib@example.com',
                phone: profDict.PHONE || '+91 98765 43210',
                city: profDict.CITY || 'Bengaluru',
                country: profDict.COUNTRY || 'India'
              },
              professional: {
                currentTitle: profDict.CURRENT_JOB_TITLE || 'Software Engineer',
                yearsOfExperience: parseInt(profDict.YEARS_EXPERIENCE || '3', 10) || 3,
                skills: skillsList,
                summary: profDict.SUMMARY || ''
              },
              educations: [{
                id: 'edu-1',
                institution: profDict.UNIVERSITY || 'University',
                degree: profDict.DEGREE || "Bachelor's",
                fieldOfStudy: profDict.FIELD_OF_STUDY || 'Computer Science',
                startDate: '2019',
                endDate: profDict.GRADUATION_DATE || '2023'
              }],
              experiences: [{
                id: 'exp-1',
                company: profDict.COMPANY || 'Technology Company',
                jobTitle: profDict.CURRENT_JOB_TITLE || 'Software Engineer',
                startDate: '2022',
                isCurrent: true,
                technologies: skillsList
              }],
              projects: [],
              certifications: [],
              languages: [],
              workAuthorization: { authorizedToWork: true, sponsorshipRequired: false },
              preferences: { targetRoles: ['Software Engineer'], locations: [], remote: true, internship: false, fullTime: true, experienceLevel: 'MID', industries: [] },
              completionPercentage: 90,
              updatedAt: new Date().toISOString()
            };

            const match = engine.calculateMatch(fallbackProfile, job);
            sendResponse({
              success: true,
              match,
              overallScore: match.overallScore,
              matchedSkills: match.matchedSkills,
              missingSkills: match.missingSkills,
              experienceMatch: match.experienceScore >= 75 ? 'Good' : 'Moderate',
              educationMatch: match.educationScore >= 70 ? 'Good' : 'Acceptable',
              job
            });
          } catch (err) {
            sendResponse({ success: false, error: (err as Error).message });
          }
          break;
        }

        case 'GET_PROFILE_DATA': {
          if (storage.cachedProfile) {
            sendResponse({
              success: true,
              profile: storage.cachedProfile
            });
            break;
          }

          if (storage.sessionToken) {
            try {
              const res = await fetch(`${baseUrl}${API_ENDPOINTS.EXTENSION.SYNC_PROFILE}`, {
                headers: { 'X-Extension-Token': storage.sessionToken }
              });
              const data = await res.json();
              if (data.success && data.data) {
                await chrome.storage.local.set({
                  cachedProfile: data.data,
                  lastSynced: new Date().toISOString()
                });
                sendResponse({
                  success: true,
                  profile: data.data
                });
                break;
              }
            } catch {}
          }

          sendResponse({
            success: true,
            profile: null
          });
          break;
        }

        case 'LOG_TELEMETRY': {
          if (storage.sessionToken) {
            await fetch(`${baseUrl}${API_ENDPOINTS.EXTENSION.TELEMETRY}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Extension-Token': storage.sessionToken
              },
              body: JSON.stringify(message.telemetry)
            }).catch(() => {});
          }
          sendResponse({ success: true });
          break;
        }

        case 'UPDATE_FORM_BADGE': {
          if (storage.sessionToken) {
            updateBadge(true, message.count ? String(message.count) : '');
          }
          sendResponse({ success: true });
          break;
        }

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (err) {
      sendResponse({ success: false, error: (err as Error).message });
    }
  })();

  return true; // Keep message channel open for async response
});

// Explicit toolbar icon click handler: controls assistant panel opening
if (chrome.action?.onClicked) {
  chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return;

    const url = tab.url || '';
    if (
      url.startsWith('chrome://') ||
      url.startsWith('chrome-extension://') ||
      url.startsWith('edge://') ||
      url.startsWith('about:') ||
      url.startsWith('devtools://')
    ) {
      console.warn('[KRAXYY] Assistant cannot be launched on browser system pages:', url);
      return;
    }

    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'OPEN_KRAXYY_PANEL' });
    } catch (err) {
      console.log('[KRAXYY] Content script not yet attached to tab, injecting script...', err);
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        setTimeout(async () => {
          try {
            await chrome.tabs.sendMessage(tab.id!, { type: 'OPEN_KRAXYY_PANEL' });
          } catch (retryErr) {
            console.error('[KRAXYY] Failed to open assistant after script injection:', retryErr);
          }
        }, 150);
      } catch (injectErr) {
        console.error('[KRAXYY] Content script injection failed for active tab:', injectErr);
      }
    }
  });
}

