import { describe, it, expect } from 'vitest';
import { FIELD_PATTERNS } from '@kraxyy/shared';

describe('Field Detection Taxonomy Patterns', () => {
  it('should include patterns for all essential job application fields', () => {
    const requiredTypes = [
      'FIRST_NAME',
      'LAST_NAME',
      'EMAIL',
      'PHONE',
      'LINKEDIN',
      'GITHUB',
      'CURRENT_TITLE',
      'WORK_AUTHORIZATION'
    ];

    const definedTypes = FIELD_PATTERNS.map((p) => p.type);
    for (const req of requiredTypes) {
      expect(definedTypes).toContain(req);
    }
  });

  it('should match common first name field variations', () => {
    const firstNamePattern = FIELD_PATTERNS.find((p) => p.type === 'FIRST_NAME');
    expect(firstNamePattern).toBeDefined();

    const testInputs = ['firstname', 'first_name', 'given-name', 'candidate_first_name'];
    for (const input of testInputs) {
      const isMatch = firstNamePattern!.exactAttributes.includes(input);
      expect(isMatch).toBe(true);
    }
  });

  it('should match common email and phone autocomplete tags', () => {
    const emailPattern = FIELD_PATTERNS.find((p) => p.type === 'EMAIL');
    const phonePattern = FIELD_PATTERNS.find((p) => p.type === 'PHONE');

    expect(emailPattern?.autocomplete).toContain('email');
    expect(phonePattern?.autocomplete).toContain('tel');
  });
});
