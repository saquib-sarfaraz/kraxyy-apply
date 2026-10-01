// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { FieldDetector } from './detector';
import { FormEngine } from './formEngine';
import { setNativeInputValue, setNativeSelectValue } from './frameworkSetter';
import { inpageUi } from './inpageUi';
import { FieldTaxonomyType } from '@kraxyy/types';

describe('Universal Form Autofill Engine', () => {
  let detector: FieldDetector;
  let engine: FormEngine;

  const mockProfile: Record<FieldTaxonomyType, string | boolean> = {
    FIRST_NAME: 'Saquib',
    LAST_NAME: 'Sarfaraz',
    FULL_NAME: 'Saquib Sarfaraz',
    EMAIL: 'saquib@example.com',
    PHONE: '+1 (555) 234-5678',
    ADDRESS: '123 Tech Lane',
    ADDRESS_LINE1: '123 Tech Lane',
    ADDRESS_LINE_1: '123 Tech Lane',
    ADDRESS_LINE_2: 'Suite 400',
    CITY: 'San Francisco',
    STATE: 'California',
    POSTAL_CODE: '94105',
    COUNTRY: 'United States',
    JOB_TITLE: 'Senior Software Engineer',
    COMPANY: 'TechCorp',
    YEARS_EXPERIENCE: '5',
    CURRENT_COMPANY: 'TechCorp',
    CURRENT_JOB_TITLE: 'Senior Software Engineer',
    CURRENT_TITLE: 'Senior Software Engineer',
    RECENT_COMPANY: 'TechCorp',
    RECENT_TITLE: 'Senior Software Engineer',
    SUMMARY: 'Experienced engineer specializing in high-scale systems.',
    LINKEDIN: 'https://linkedin.com/in/saquib',
    GITHUB: 'https://github.com/saquib',
    PORTFOLIO: 'https://saquib.dev',
    WEBSITE: 'https://saquib.dev',
    UNIVERSITY: 'State University',
    COLLEGE: 'State University',
    DEGREE: "Bachelor's",
    EDUCATION_DEGREE: "Bachelor's",
    EDUCATION_SCHOOL: 'State University',
    FIELD_OF_STUDY: 'Computer Science',
    GRADUATION_DATE: '2022',
    GPA: '3.8',
    RESUME: 'https://storage.kraxyy.com/resumes/sample.pdf',
    COVER_LETTER: '',
    SKILLS: 'React, TypeScript, Node.js',
    WORK_AUTHORIZATION: true,
    VISA_SPONSORSHIP: false,
    SPONSORSHIP_REQUIRED: false,
    SALARY_EXPECTATION: '140000',
    DESIRED_SALARY: '140000',
    NOTICE_PERIOD: 'Immediately',
    START_DATE: 'Immediately',
    DEMOGRAPHIC: '',
    CUSTOM_QUESTION: ''
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    detector = new FieldDetector();
    engine = new FormEngine();
  });

  it('detects and classifies standard HTML job application fields', () => {
    document.body.innerHTML = `
      <form id="app-form">
        <h1>Apply for Senior Engineer - Acme Corp</h1>
        <label for="first_name">First Name</label>
        <input id="first_name" name="first_name" type="text" />

        <label for="last_name">Last Name</label>
        <input id="last_name" name="last_name" type="text" />

        <label for="email">Email Address</label>
        <input id="email" name="email" type="email" autocomplete="email" />

        <label for="phone">Phone Number</label>
        <input id="phone" name="phone" type="tel" />
      </form>
    `;

    const summary = detector.detectForm();
    expect(summary.isApplicationForm).toBe(true);
    expect(summary.fields.length).toBe(4);

    const types = summary.fields.map((f) => f.taxonomyType);
    expect(types).toContain('FIRST_NAME');
    expect(types).toContain('LAST_NAME');
    expect(types).toContain('EMAIL');
    expect(types).toContain('PHONE');
  });

  it('detects Jotform style fields with sub-labels and numbered IDs', () => {
    document.body.innerHTML = `
      <form class="jotform-form">
        <div class="form-line" data-type="control_fullname">
          <label class="form-label">Candidate Name</label>
          <div class="form-input-wide">
            <span class="form-sub-label-container">
              <input type="text" id="first_3" name="q3_name[first]" class="form-textbox" />
              <label class="form-sub-label">First Name</label>
            </span>
            <span class="form-sub-label-container">
              <input type="text" id="last_3" name="q3_name[last]" class="form-textbox" />
              <label class="form-sub-label">Last Name</label>
            </span>
          </div>
        </div>

        <div class="form-line" data-type="control_email">
          <label class="form-label">E-mail</label>
          <input type="email" id="input_4" name="q4_email" class="form-textbox" />
        </div>

        <div class="form-line" data-type="control_phone">
          <label class="form-label">Phone Number</label>
          <input type="tel" id="input_5" name="q5_phone[full]" class="form-textbox" />
        </div>
      </form>
    `;

    const summary = detector.detectForm();
    expect(summary.isApplicationForm).toBe(true);
    expect(summary.fields.length).toBeGreaterThanOrEqual(3);

    const firstField = summary.fields.find((f) => f.id === 'first_3');
    const lastField = summary.fields.find((f) => f.id === 'last_3');
    const emailField = summary.fields.find((f) => f.id === 'input_4');

    expect(firstField?.taxonomyType).toBe('FIRST_NAME');
    expect(lastField?.taxonomyType).toBe('LAST_NAME');
    expect(emailField?.taxonomyType).toBe('EMAIL');
  });

  it('successfully autofills and verifies React/Vue controlled inputs', async () => {
    document.body.innerHTML = `
      <form>
        <label for="fn">Given Name</label>
        <input id="fn" name="candidateFirstName" type="text" />
        <label for="ln">Family Name</label>
        <input id="ln" name="candidateLastName" type="text" />
      </form>
    `;

    const detected = detector.detectForm();
    const result = await engine.fillForm(detected.fields, mockProfile);

    expect(result.totalVerified).toBe(2);
    expect(result.totalFailed).toBe(0);

    const fnInput = document.getElementById('fn') as HTMLInputElement;
    const lnInput = document.getElementById('ln') as HTMLInputElement;

    expect(fnInput.value).toBe('Saquib');
    expect(lnInput.value).toBe('Sarfaraz');
  });

  it('guards existing user input by preserving it as SKIPPED_EXISTING', async () => {
    document.body.innerHTML = `
      <form>
        <label for="first">First Name</label>
        <input id="first" name="first_name" type="text" value="AlreadyTyped" />
        <label for="last">Last Name</label>
        <input id="last" name="last_name" type="text" value="" />
      </form>
    `;

    const detected = detector.detectForm();
    const result = await engine.fillForm(detected.fields, mockProfile, { overwriteExisting: false });

    expect(result.totalSkippedExisting).toBe(1);
    expect(result.totalVerified).toBe(1);

    const firstInput = document.getElementById('first') as HTMLInputElement;
    const lastInput = document.getElementById('last') as HTMLInputElement;

    // First input was NOT overwritten
    expect(firstInput.value).toBe('AlreadyTyped');
    // Second input was filled
    expect(lastInput.value).toBe('Sarfaraz');

    // Now test with explicit overwrite enabled
    const overwriteResult = await engine.fillForm(detected.fields, mockProfile, { overwriteExisting: true });
    expect(overwriteResult.totalVerified).toBe(2);
    expect(firstInput.value).toBe('Saquib');
  });

  it('marks legal/consent checkboxes as NEEDS_ATTENTION rather than blindly checking', async () => {
    document.body.innerHTML = `
      <form>
        <label>
          <input type="checkbox" id="terms" name="agree_to_terms" />
          I agree to the background check and privacy policy terms
        </label>
      </form>
    `;

    const detected = detector.detectForm();
    const result = await engine.fillForm(detected.fields, mockProfile);

    const termsInput = document.getElementById('terms') as HTMLInputElement;
    expect(termsInput.checked).toBe(false); // Guarded
    expect(result.totalNeedsAttention).toBe(1);
  });

  it('flags resume file inputs as MANUAL_REQUIRED without fabricating success', async () => {
    document.body.innerHTML = `
      <form>
        <label for="resume">Upload Resume</label>
        <input type="file" id="resume" name="resume_file" />
      </form>
    `;

    const detected = detector.detectForm();
    const result = await engine.fillForm(detected.fields, mockProfile);

    const resumeReport = result.fields.find((f) => f.id === 'resume');
    expect(resumeReport?.status).toBe('MANUAL_REQUIRED');
    expect(resumeReport?.manualReason).toContain('Resume upload requires your action');
    expect(result.totalVerified).toBe(0);
  });

  it('handles native select dropdowns with semantic option matching', async () => {
    document.body.innerHTML = `
      <select id="country" name="country">
        <option value="">Select a country</option>
        <option value="CAN">Canada</option>
        <option value="USA">United States</option>
        <option value="GBR">United Kingdom</option>
      </select>
    `;

    const selectEl = document.getElementById('country') as HTMLSelectElement;
    const setterResult = await setNativeSelectValue(selectEl, 'United States');

    expect(setterResult.verified).toBe(true);
    expect(selectEl.value).toBe('USA');
  });

  it('performs end-to-end detection, mapping, autofill, DOM verification, and inpage UI reporting on a real Jotform layout', async () => {
    document.body.innerHTML = `
      <div class="jotform-form-wrapper" id="jotform-embed-container">
        <div class="form-line" data-type="control_fullname" id="id_3">
          <label class="form-label form-label-top" id="label_3">Candidate Name</label>
          <div class="form-input-wide">
            <span class="form-sub-label-container">
              <input type="text" id="first_3" name="q3_fullName[first]" class="form-textbox" />
              <label class="form-sub-label" for="first_3">First Name</label>
            </span>
            <span class="form-sub-label-container">
              <input type="text" id="last_3" name="q3_fullName[last]" class="form-textbox" />
              <label class="form-sub-label" for="last_3">Last Name</label>
            </span>
          </div>
        </div>

        <div class="form-line" data-type="control_email" id="id_4">
          <label class="form-label form-label-top" id="label_4">Email Address</label>
          <div class="form-input-wide">
            <input type="email" id="input_4" name="q4_email" class="form-textbox" />
          </div>
        </div>

        <div class="form-line" data-type="control_phone" id="id_5">
          <label class="form-label form-label-top" id="label_5">Phone Number</label>
          <div class="form-input-wide">
            <input type="tel" id="input_5" name="q5_phone" class="form-textbox" />
          </div>
        </div>

        <div class="form-line" id="id_6">
          <label class="form-label" id="label_6">LinkedIn Profile</label>
          <input type="text" id="input_6" name="q6_linkedin" />
        </div>

        <div class="form-line" id="id_7">
          <label class="form-label" id="label_7">GitHub Profile</label>
          <input type="text" id="input_7" name="q7_github" />
        </div>

        <div class="form-line" id="id_8">
          <label class="form-label" id="label_8">Legal Consent & Declarations</label>
          <input type="checkbox" id="input_8" name="q8_terms" />
        </div>

        <div class="form-line" data-type="control_fileupload" id="id_9">
          <label class="form-label" id="label_9">Resume / CV Document</label>
          <input type="file" id="input_9" name="q9_resume" />
        </div>
      </div>
    `;

    // 1. Detect
    const detection = detector.detectForm();
    expect(detection.isApplicationForm).toBe(true);
    expect(detection.autofillReady).toBe(true);
    expect(detection.fields.length).toBeGreaterThanOrEqual(6);

    // 2. Autofill & Real DOM Verification
    const report = await engine.fillForm(detection.fields, mockProfile);
    expect(report.totalVerified).toBeGreaterThanOrEqual(5); // first_3, last_3, input_4, input_5, input_6, input_7
    expect(report.totalNeedsAttention).toBe(1); // input_8 (legal terms checkbox)
    expect(report.totalManualRequired).toBe(1); // input_9 (resume file)

    // 3. PHYSICAL DOM VALUE VERIFICATION (elements must actually contain values!)
    expect((document.getElementById('first_3') as HTMLInputElement).value).toBe('Saquib');
    expect((document.getElementById('last_3') as HTMLInputElement).value).toBe('Sarfaraz');
    expect((document.getElementById('input_4') as HTMLInputElement).value).toBe('saquib@example.com');
    expect((document.getElementById('input_5') as HTMLInputElement).value).toBe('+1 (555) 234-5678');
    expect((document.getElementById('input_6') as HTMLInputElement).value).toBe('https://linkedin.com/in/saquib');
    expect((document.getElementById('input_8') as HTMLInputElement).checked).toBe(false); // Legal terms not auto-checked

    // 4. In-page UI rendering verification
    inpageUi.render({
      pageType: 'APPLICATION',
      form: {
        detected: true,
        confidence: 0.95,
        autofillReady: true,
        fieldCount: 7,
        fillableFieldCount: 5,
        manualRequiredCount: 1,
        fields: detection.fields
      },
      url: 'https://form.jotform.com/213456789',
      isTopFrame: true,
      timestamp: Date.now()
    });

    inpageUi.showAutofillReport(report);
    const assistant = document.getElementById('crazy-assistant-root') || document.getElementById('kraxyy-inpage-assistant');
    expect(assistant).not.toBeNull();
    expect(assistant?.shadowRoot?.innerHTML).toContain('Autofill Complete');
    expect(assistant?.shadowRoot?.innerHTML).toContain(String(report.totalVerified));
  });
});
