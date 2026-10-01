# Chrome Extension Architecture (Manifest V3)

## Components

1. **`manifest.json`**:
   - Manifest V3 compliant.
   - Minimal permissions: `["storage", "activeTab", "scripting"]`.
   - Host permissions: `["http://*/*", "https://*/*"]`.
   - Background service worker, Content script, and Popup action.

2. **Background Service Worker (`serviceWorker.ts`)**:
   - Manages extension lifecycle.
   - Securely stores extension session tokens and cached profile in `chrome.storage.local`.
   - Dispatches telemetry to `/api/v1/extension/telemetry`.
   - Updates the browser action badge dynamically (indicates form detection).

3. **Field Detection Engine (`detector.ts`)**:
   - Scans DOM elements (`input`, `select`, `textarea`).
   - Evaluates multi-signal candidates: exact name/id, autocomplete, surrounding `<label>`, placeholder, aria-label, and neighboring text.
   - Normalizes elements into the Kraxyy Field Taxonomy.
   - Assigns a confidence score to distinguish job applications from search engines and comment forms.

4. **Form Engine (`formEngine.ts`)**:
   - Solves React-controlled input bypass using native prototype property setters (`HTMLInputElement.prototype`).
   - Dispatches synthetic `input`, `change`, and `blur` events.
   - Highlights populated elements in Olive (`#525B31`) and fields requiring candidate review in Mustard (`#B18B40`).
   - **Safety Assertion:** FormEngine strictly populates values. It contains no `form.submit()` or click automation on submit buttons.

5. **In-Page Companion Dock (`inpageUi.ts`)**:
   - Injects a discrete floating pill into the bottom corner when an application form is detected.
   - Expands on click to display detected fields, a 1-click Auto-Fill button, audit checklist, and Clear button.
