import { describe, it, expect } from 'vitest';
import { FIELD_PATTERNS } from '@kraxyy/shared';

/**
 * Field Classifier simulation mirroring the Chrome extension detector
 */
function classifyAttribute(attributeVal: string): string {
  const norm = attributeVal.trim().toLowerCase().replace(/[-_ ]/g, '');
  for (const pattern of FIELD_PATTERNS) {
    if (pattern.exactAttributes.some((a) => a.replace(/[-_ ]/g, '') === norm)) {
      return pattern.type;
    }
    if (pattern.keywords.some((k) => k.replace(/[-_ ]/g, '') === norm)) {
      return pattern.type;
    }
  }
  return 'UNKNOWN';
}

describe('Universal Application Form Field Classification Fixtures', () => {
  it('Form A fixture: first_name maps to FIRST_NAME', () => {
    expect(classifyAttribute('first_name')).toBe('FIRST_NAME');
  });

  it('Form B fixture: fname maps to FIRST_NAME', () => {
    expect(classifyAttribute('fname')).toBe('FIRST_NAME');
  });

  it('Form C fixture: Given Name maps to FIRST_NAME', () => {
    expect(classifyAttribute('Given Name')).toBe('FIRST_NAME');
  });

  it('Form D fixture: candidateFirstName maps to FIRST_NAME', () => {
    expect(classifyAttribute('candidateFirstName')).toBe('FIRST_NAME');
  });

  it('All First Name fixtures map identically to canonical FIRST_NAME', () => {
    const fixtures = ['first_name', 'fname', 'Given Name', 'candidateFirstName', 'firstname'];
    for (const f of fixtures) {
      expect(classifyAttribute(f)).toBe('FIRST_NAME');
    }
  });

  it('All Last Name fixtures map identically to canonical LAST_NAME', () => {
    const fixtures = ['last_name', 'lname', 'Family Name', 'candidateLastName', 'surname'];
    for (const f of fixtures) {
      expect(classifyAttribute(f)).toBe('LAST_NAME');
    }
  });

  it('All Email fixtures map to canonical EMAIL', () => {
    const fixtures = ['email', 'email_address', 'Professional Email', 'candidate_email', 'e-mail'];
    for (const f of fixtures) {
      expect(classifyAttribute(f)).toBe('EMAIL');
    }
  });

  it('All Education and Experience fixtures map to canonical types', () => {
    expect(['EDUCATION_SCHOOL', 'UNIVERSITY']).toContain(classifyAttribute('university'));
    expect(['EDUCATION_DEGREE', 'DEGREE']).toContain(classifyAttribute('degree'));
    expect(classifyAttribute('years_experience')).toBe('YEARS_EXPERIENCE');
    expect(classifyAttribute('skills')).toBe('SKILLS');
  });
});
