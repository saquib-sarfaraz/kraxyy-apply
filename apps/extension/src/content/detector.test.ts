import { describe, it, expect } from 'vitest';
import { FIELD_PATTERNS } from '@kraxyy/shared';

describe('Chrome Extension Field Detector', () => {
  it('covers all canonical job application field patterns', () => {
    const types = FIELD_PATTERNS.map((p) => p.type);
    expect(types).toContain('FIRST_NAME');
    expect(types).toContain('LAST_NAME');
    expect(types).toContain('FULL_NAME');
    expect(types).toContain('EMAIL');
    expect(types).toContain('PHONE');
    expect(types).toContain('LINKEDIN');
    expect(types).toContain('GITHUB');
    expect(types).toContain('PORTFOLIO');
    expect(types).toContain('SKILLS');
    expect(types).toContain('YEARS_EXPERIENCE');
    expect(types).toContain('WORK_AUTHORIZATION');
    expect(types).toContain('DESIRED_SALARY');
  });

  it('maps multi-attribute candidate naming variants correctly', () => {
    const fnPattern = FIELD_PATTERNS.find((p) => p.type === 'FIRST_NAME');
    expect(fnPattern?.exactAttributes).toContain('fname');
    expect(fnPattern?.exactAttributes).toContain('first_name');
    expect(fnPattern?.exactAttributes).toContain('given-name');
    expect(fnPattern?.exactAttributes).toContain('candidatefirstname');
  });

  it('supports sensitive field flags for work authorization and sponsorship', () => {
    const workAuth = FIELD_PATTERNS.find((p) => p.type === 'WORK_AUTHORIZATION');
    const sponsorship = FIELD_PATTERNS.find((p) => p.type === 'SPONSORSHIP_REQUIRED');

    expect(workAuth).toBeDefined();
    expect(sponsorship).toBeDefined();
  });
});
