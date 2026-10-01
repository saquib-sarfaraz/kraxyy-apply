// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { applicationPageDetector } from './applicationDetector';
import { FieldDetector } from './detector';

describe('Universal Application Detector Real-World Fixture Test Suite', () => {
  let detector: FieldDetector;

  beforeEach(() => {
    document.body.innerHTML = '';
    detector = new FieldDetector();
  });

  describe('1. Zero <form> Tag & Jotform Heuristics', () => {
    it('accurately detects and classifies Jotform layout with numbered IDs, sub-labels, and NO <form> tag', () => {
      // Intentionally wrapped in a plain div with NO <form> tag
      document.body.innerHTML = `
        <div class="jotform-form-wrapper" id="jotform-embed-container">
          <div class="header-container">
            <h1 class="header-text">Job Application: Staff Software Engineer</h1>
            <p class="sub-header-text">Please complete your details to apply for this role.</p>
          </div>

          <div class="form-line" data-type="control_fullname" id="id_3">
            <label class="form-label form-label-top" id="label_3">Full Name</label>
            <div class="form-input-wide">
              <div class="extended">
                <span class="form-sub-label-container">
                  <input type="text" id="first_3" name="q3_fullName[first]" class="form-textbox" />
                  <label class="form-sub-label" for="first_3" id="sublabel_3_first">First Name</label>
                </span>
                <span class="form-sub-label-container">
                  <input type="text" id="last_3" name="q3_fullName[last]" class="form-textbox" />
                  <label class="form-sub-label" for="last_3" id="sublabel_3_last">Last Name</label>
                </span>
              </div>
            </div>
          </div>

          <div class="form-line" data-type="control_email" id="id_4">
            <label class="form-label form-label-top" id="label_4">Email Address</label>
            <div class="form-input-wide">
              <input type="email" id="input_4" name="q4_email" class="form-textbox validate[Email]" />
            </div>
          </div>

          <div class="form-line" data-type="control_phone" id="id_5">
            <label class="form-label form-label-top" id="label_5">Phone Number</label>
            <div class="form-input-wide">
              <input type="tel" id="input_5" name="q5_phoneNumber[full]" class="form-textbox" />
            </div>
          </div>

          <div class="form-line" data-type="control_fileupload" id="id_6">
            <label class="form-label form-label-top" id="label_6">Resume / CV</label>
            <div class="form-input-wide">
              <input type="file" id="input_6" name="q6_resume" class="form-upload" accept=".pdf,.doc,.docx" />
            </div>
          </div>

          <div class="form-line" id="id_7">
            <label class="form-label" id="label_7">LinkedIn Profile</label>
            <input type="text" id="input_7" name="q7_linkedin" placeholder="https://linkedin.com/in/..." />
          </div>
        </div>
      `;

      const result = applicationPageDetector.detectApplication();

      expect(result.isApplicationPage).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.autofillReady).toBe(true);
      expect(result.detectedFields.length).toBe(6);
      expect(result.fillableFieldCount).toBe(5); // first_3, last_3, input_4, input_5, input_7
      expect(result.manualRequiredCount).toBe(1); // input_6 (resume file upload)

      // Verify specific taxonomy mappings
      const fieldTypes = result.detectedFields.map((f) => f.taxonomyType);
      expect(fieldTypes).toContain('FIRST_NAME');
      expect(fieldTypes).toContain('LAST_NAME');
      expect(fieldTypes).toContain('EMAIL');
      expect(fieldTypes).toContain('PHONE');
      expect(fieldTypes).toContain('RESUME');
      expect(fieldTypes).toContain('LINKEDIN');

      // Verify resume is flagged as MANUAL_REQUIRED
      const resumeField = result.detectedFields.find((f) => f.taxonomyType === 'RESUME');
      expect(resumeField?.status).toBe('MANUAL_REQUIRED');

      // Verify backwards compatible FieldDetector
      const legacySummary = detector.detectForm();
      expect(legacySummary.isApplicationForm).toBe(true);
      expect(legacySummary.autofillReady).toBe(true);
    });
  });

  describe('2. Greenhouse & Lever ATS Fixtures', () => {
    it('extracts candidate fields from Greenhouse ATS container', () => {
      document.body.innerHTML = `
        <div id="application-wrapper">
          <div class="app-title">Apply for Lead Architect at Stripe</div>
          <div class="field">
            <label for="first_name">First Name <span class="asterisk">*</span></label>
            <input type="text" id="first_name" name="job_application[first_name]" autocomplete="given-name" required />
          </div>
          <div class="field">
            <label for="last_name">Last Name <span class="asterisk">*</span></label>
            <input type="text" id="last_name" name="job_application[last_name]" autocomplete="family-name" required />
          </div>
          <div class="field">
            <label for="email">Email <span class="asterisk">*</span></label>
            <input type="email" id="email" name="job_application[email]" autocomplete="email" required />
          </div>
          <div class="field">
            <label for="phone">Phone <span class="asterisk">*</span></label>
            <input type="tel" id="phone" name="job_application[phone]" autocomplete="tel" required />
          </div>
          <div class="field">
            <label for="urls[GitHub]">GitHub URL</label>
            <input type="text" id="urls[GitHub]" name="job_application[answers_attributes][0][text_value]" />
          </div>
          <div class="field">
            <label for="sponsorship">Will you now or in the future require visa sponsorship?</label>
            <select id="sponsorship" name="job_application[answers_attributes][1][boolean_value]">
              <option value="">-- Please select --</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
      `;

      const result = applicationPageDetector.detectApplication();
      expect(result.isApplicationPage).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.80);
      expect(result.autofillReady).toBe(true);

      const taxonomies = result.detectedFields.map((f) => f.taxonomyType);
      expect(taxonomies).toContain('FIRST_NAME');
      expect(taxonomies).toContain('LAST_NAME');
      expect(taxonomies).toContain('EMAIL');
      expect(taxonomies).toContain('PHONE');
      expect(taxonomies).toContain('GITHUB');
      expect(taxonomies).toContain('VISA_SPONSORSHIP');
    });

    it('extracts candidate fields from Lever ATS custom section', () => {
      document.body.innerHTML = `
        <div class="lever-application-page">
          <h2>Submit your application</h2>
          <div class="application-form">
            <div class="form-group">
              <label>Full name</label>
              <input type="text" name="name" placeholder="Full name" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" name="email" placeholder="Email" />
            </div>
            <div class="form-group">
              <label>Current company</label>
              <input type="text" name="org" placeholder="Current company" />
            </div>
            <div class="form-group">
              <label>LinkedIn URL</label>
              <input type="text" name="urls[LinkedIn]" placeholder="LinkedIn" />
            </div>
          </div>
        </div>
      `;

      const result = applicationPageDetector.detectApplication();
      expect(result.isApplicationPage).toBe(true);
      expect(result.autofillReady).toBe(true);

      const types = result.detectedFields.map((f) => f.taxonomyType);
      expect(types).toContain('FULL_NAME');
      expect(types).toContain('EMAIL');
      expect(types).toContain('COMPANY');
      expect(types).toContain('LINKEDIN');
    });
  });

  describe('3. Multi-Step Applications & Workday Heuristics', () => {
    it('detects step info and candidate fields on multi-step workflows', () => {
      document.body.innerHTML = `
        <div class="workday-application-root">
          <div class="step-indicator" aria-label="Step 2 of 5: Candidate Information">
            <span class="step-badge">Step 2 of 5</span>
            <h3>Personal Information</h3>
          </div>
          <div>
            <label for="wd-fname">Legal First Name</label>
            <input id="wd-fname" type="text" data-automation-id="legalNameSection_firstName" />
          </div>
          <div>
            <label for="wd-lname">Legal Last Name</label>
            <input id="wd-lname" type="text" data-automation-id="legalNameSection_lastName" />
          </div>
          <div>
            <label for="wd-email">Primary Email</label>
            <input id="wd-email" type="email" data-automation-id="email" />
          </div>
          <div>
            <label for="wd-phone">Phone Device Number</label>
            <input id="wd-phone" type="tel" data-automation-id="phoneNumber" />
          </div>
        </div>
      `;

      const result = applicationPageDetector.detectApplication();
      expect(result.isApplicationPage).toBe(true);
      expect(result.stepInfo).toBeDefined();
      expect(result.stepInfo?.currentStep).toBe(2);
      expect(result.stepInfo?.totalSteps).toBe(5);
    });
  });

  describe('4. Custom Comboboxes, Contenteditable, and Open Shadow DOM', () => {
    it('scans and classifies custom role="combobox" and contenteditable fields', () => {
      document.body.innerHTML = `
        <div class="custom-app-form">
          <h2>Apply for Designer</h2>
          <label id="lbl-name">Your Full Name</label>
          <input aria-labelledby="lbl-name" id="c-name" type="text" />

          <label id="lbl-email">Your Contact Email</label>
          <input aria-labelledby="lbl-email" id="c-email" type="email" />

          <label id="lbl-phone">Phone Number</label>
          <input aria-labelledby="lbl-phone" id="c-phone" type="tel" />

          <label id="lbl-country">Country of Residence</label>
          <div role="combobox" aria-labelledby="lbl-country" id="custom-country-select" tabindex="0">
            United States
          </div>

          <label id="lbl-summary">Cover Note / Summary</label>
          <div contenteditable="true" aria-labelledby="lbl-summary" id="custom-rich-summary">
            Experienced product designer...
          </div>
        </div>
      `;

      const result = applicationPageDetector.detectApplication();
      expect(result.isApplicationPage).toBe(true);
      expect(result.metrics.comboboxCount).toBeGreaterThanOrEqual(1);
      expect(result.metrics.contenteditableCount).toBeGreaterThanOrEqual(1);

      const combobox = result.detectedFields.find((f) => f.id === 'custom-country-select');
      expect(combobox).toBeDefined();
      expect(combobox?.elementType).toBe('combobox');
      expect(combobox?.taxonomyType).toBe('COUNTRY');

      const richText = result.detectedFields.find((f) => f.id === 'custom-rich-summary');
      expect(richText).toBeDefined();
      expect(richText?.elementType).toBe('contenteditable');
      expect(['COVER_LETTER', 'SUMMARY']).toContain(richText?.taxonomyType);
    });

    it('scans candidate fields nested inside open Shadow DOM root', () => {
      const host = document.createElement('div');
      host.id = 'web-component-host';
      document.body.appendChild(host);

      const shadow = host.attachShadow({ mode: 'open' });
      shadow.innerHTML = `
        <div class="shadow-inner-form">
          <h3>Apply for Embedded Systems Engineer</h3>
          <label for="sh-name">Full Name</label>
          <input id="sh-name" type="text" />

          <label for="sh-email">Email Address</label>
          <input id="sh-email" type="email" />

          <label for="sh-phone">Mobile Phone</label>
          <input id="sh-phone" type="tel" />
        </div>
      `;

      const result = applicationPageDetector.detectApplication();
      expect(result.isApplicationPage).toBe(true);
      expect(result.shadowRootCount).toBeGreaterThanOrEqual(1);

      const shadowFields = result.detectedFields.filter((f) => f.isShadowDom);
      expect(shadowFields.length).toBe(3);
    });
  });

  describe('5. Negative Controls & Anti-Pattern Gating', () => {
    it('disqualifies a solitary newsletter subscription form', () => {
      document.body.innerHTML = `
        <div class="footer-newsletter">
          <h3>Subscribe to our newsletter</h3>
          <p>Stay updated with our latest news and engineering blog posts.</p>
          <input type="email" name="subscriber_email" placeholder="Enter your email" />
          <button type="button">Subscribe</button>
        </div>
      `;

      const result = applicationPageDetector.detectApplication();
      expect(result.isApplicationPage).toBe(false);
      expect(result.autofillReady).toBe(false);
      expect(result.confidence).toBeLessThan(0.35);
      expect(result.detectionSignals.negativeSignals).toContain('solitary_newsletter_signup');
    });

    it('disqualifies a login portal with password input', () => {
      document.body.innerHTML = `
        <div class="login-card">
          <h2>Sign in to your account</h2>
          <label for="login-username">Email or Username</label>
          <input id="login-username" type="text" autocomplete="username" />

          <label for="login-password">Password</label>
          <input id="login-password" type="password" autocomplete="current-password" />

          <a href="/forgot-password">Forgot password?</a>
          <button type="submit">Sign In</button>
        </div>
      `;

      const result = applicationPageDetector.detectApplication();
      expect(result.isApplicationPage).toBe(false);
      expect(result.autofillReady).toBe(false);
      expect(result.detectionSignals.negativeSignals).toContain('password_field_present');
    });

    it('disqualifies an e-commerce checkout page', () => {
      document.body.innerHTML = `
        <div class="checkout-page">
          <h2>Order Summary & Payment Method</h2>
          <label for="c-name">Cardholder Name</label>
          <input id="c-name" type="text" />

          <label for="c-email">Email Address</label>
          <input id="c-email" type="email" />

          <label for="c-card">Credit Card Number</label>
          <input id="c-card" type="text" />

          <label for="c-cvv">CVV</label>
          <input id="c-cvv" type="text" />

          <label for="c-ship">Shipping Address</label>
          <input id="c-ship" type="text" />
        </div>
      `;

      const result = applicationPageDetector.detectApplication();
      expect(result.isApplicationPage).toBe(false);
      expect(result.autofillReady).toBe(false);
      expect(result.detectionSignals.negativeSignals).toContain('ecommerce_checkout_context');
    });
  });

  describe('6. Separation of Detection and Autofill Readiness', () => {
    it('marks isApplicationPage true but autofillReady false when zero safe fillable fields exist', () => {
      // Form has a valid heading and only a resume file upload
      document.body.innerHTML = `
        <div class="quick-apply-form">
          <h2>Candidate Application: Express Drop</h2>
          <p>Please upload your CV to apply for this role.</p>
          <label for="cv-drop">Resume / CV Document</label>
          <input type="file" id="cv-drop" accept=".pdf" />
        </div>
      `;

      const result = applicationPageDetector.detectApplication();
      // Application intent is confirmed by resume upload cluster + application heading
      expect(result.isApplicationPage).toBe(true);
      // But autofill cannot automatically fill anything safe (resume requires manual candidate upload)
      expect(result.fillableFieldCount).toBe(0);
      expect(result.manualRequiredCount).toBe(1);
      expect(result.autofillReady).toBe(false);
    });
  });
});
