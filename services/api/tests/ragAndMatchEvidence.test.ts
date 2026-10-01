import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { profileService } from '../src/services/profileService';
import { ragService } from '../src/services/ragService';
import { aiService } from '../src/services/aiService';
import { ProfileModel } from '../src/models/Profile';
import { ResumeModel } from '../src/models/Resume';
import { ICandidateFact } from '@kraxyy/types';

describe('Resume-First Architecture, Grounded RAG & Transparent Job Match', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }, 60000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  const testUserId = new mongoose.Types.ObjectId().toString();

  it('1. Automatically populates candidate profile upon resume parsing (no manual entry required)', async () => {
    const mockParsedData = {
      personal: {
        firstName: 'Saquib',
        lastName: 'Sarfaraz',
        email: 'saquib@example.com',
        phone: '+1 555-0199',
        city: 'San Francisco',
        country: 'United States',
        linkedin: 'https://linkedin.com/in/saquib'
      },
      professional: {
        currentTitle: 'Senior Full Stack Engineer',
        summary: 'Experienced builder scaling web and cloud applications with TypeScript & Node.js',
        skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'MongoDB'],
        yearsOfExperience: 5
      },
      educations: [
        {
          id: 'edu-1',
          institution: 'University of Engineering',
          degree: 'Bachelor of Science',
          fieldOfStudy: 'Computer Science',
          startDate: '2017',
          endDate: '2021'
        }
      ],
      experiences: [
        {
          id: 'exp-1',
          company: 'Tech Innovations Inc',
          jobTitle: 'Senior Full Stack Engineer',
          startDate: '2021-06',
          endDate: 'Present',
          isCurrent: true,
          description: 'Architected distributed event systems with Node.js and React.',
          technologies: ['React', 'Node.js', 'TypeScript', 'Docker']
        }
      ],
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'MongoDB'],
      summary: 'Experienced builder scaling web and cloud applications with TypeScript & Node.js'
    };

    const mockFacts: ICandidateFact[] = [
      {
        id: 'fact-1',
        category: 'EXPERIENCE',
        fact: 'Built high-throughput payment systems with React and Node.js at Tech Innovations Inc',
        confidence: 'explicit',
        sourceSection: 'Experience: Tech Innovations Inc',
        technologies: ['React', 'Node.js']
      },
      {
        id: 'fact-2',
        category: 'SKILL',
        fact: 'Demonstrated proficiency in Docker, PostgreSQL, and TypeScript microservices',
        confidence: 'explicit',
        sourceSection: 'Skills',
        technologies: ['Docker', 'PostgreSQL', 'TypeScript']
      }
    ];

    // Automatically update profile from resume
    const updatedProfile = await profileService.updateProfileFromResume(testUserId, mockParsedData, mockFacts);

    expect(updatedProfile.personal.firstName).toBe('Saquib');
    expect(updatedProfile.personal.lastName).toBe('Sarfaraz');
    expect(updatedProfile.professional.currentTitle).toBe('Senior Full Stack Engineer');
    expect(updatedProfile.professional.skills).toContain('React');
    expect(updatedProfile.professional.skills).toContain('Node.js');
    expect(updatedProfile.candidateFacts).toHaveLength(2);
    expect(updatedProfile.completionPercentage).toBeGreaterThanOrEqual(80);

    // Verify persistence in MongoDB
    const persisted = await ProfileModel.findOne({ userId: new mongoose.Types.ObjectId(testUserId) });
    expect(persisted).not.toBeNull();
    expect(persisted?.candidateFacts).toHaveLength(2);
    expect(persisted?.resumeEvidence).toContain('Built high-throughput payment systems with React and Node.js at Tech Innovations Inc');
  });

  it('2. Evaluates transparent match evidence (not raw verdict) against job description', async () => {
    const profile = await profileService.getProfileByUserId(testUserId);
    const facts = profile.candidateFacts || [];

    const job = {
      title: 'Senior Frontend Engineer',
      company: 'Stripe',
      description: 'We are looking for a Senior Frontend Engineer to build payment interfaces with React, TypeScript, and AWS. 5+ years experience required.',
      skills: ['React', 'TypeScript', 'AWS', 'Docker']
    };

    const match = aiService.evaluateJobMatchDeterministically(profile, facts, job);

    expect(match.overallScore).toBeGreaterThanOrEqual(70);
    expect(match.roleAlignment).toBe('Strong');
    expect(match.requiredSkillsMet).toBeDefined();
    expect(match.missingKeywords).toContain('AWS');
    expect(match.matchedSkills).toContain('React');
    expect(match.matchedSkills).toContain('TypeScript');
    expect(match.experienceRequirement).toBe('Requirement met');
    expect(match.evidenceFromResume.length).toBeGreaterThan(0);
    expect(match.recommendations.length).toBeGreaterThan(0);
    expect(match.whyThisScore).toContain('Based on your resume');
  });

  it('3. RAG Service retrieves relevant candidate facts and generates grounded answer', async () => {
    const question = 'Describe your experience building frontend applications with React';
    const jobContext = {
      title: 'Senior Frontend Engineer',
      company: 'Stripe',
      description: 'Building high quality React components and UI architecture.'
    };

    const result = await ragService.answerQuestion({
      userId: testUserId,
      question,
      jobContext
    });

    expect(result.answer).toBeDefined();
    expect(result.answer.length).toBeGreaterThan(20);
    expect(result.groundedFacts.length).toBeGreaterThan(0);
    // Verified grounding in explicit resume fact
    expect(result.groundedFacts.some((f) => f.technologies?.includes('React'))).toBe(true);
  });
});
