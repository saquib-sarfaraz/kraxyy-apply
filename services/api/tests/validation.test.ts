import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema, createApplicationSchema } from '@kraxyy/validation';

describe('Zod Validation Schemas', () => {
  it('should accept valid registration input', () => {
    const valid = {
      firstName: 'Alex',
      lastName: 'Morgan',
      email: 'alex@example.com',
      password: 'StrongPassword123!'
    };
    const result = registerSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should reject weak passwords missing symbols or numbers', () => {
    const weak = {
      firstName: 'Alex',
      lastName: 'Morgan',
      email: 'alex@example.com',
      password: 'weak'
    };
    const result = registerSchema.safeParse(weak);
    expect(result.success).toBe(false);
  });

  it('should validate application creation payload', () => {
    const app = {
      jobTitle: 'Senior Software Engineer',
      company: 'Kraxyy Apply',
      appliedDate: new Date().toISOString(),
      status: 'APPLIED'
    };
    const result = createApplicationSchema.safeParse(app);
    expect(result.success).toBe(true);
  });
});
