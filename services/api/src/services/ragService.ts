import mongoose from 'mongoose';
import { ProfileModel } from '../models/Profile';
import { ResumeModel } from '../models/Resume';
import { aiService } from './aiService';
import { ICandidateFact } from '@kraxyy/types';

export interface GroundedAnswerRequest {
  userId: string;
  question: string;
  jobContext?: {
    title?: string;
    company?: string;
    description?: string;
  };
}

export interface GroundedAnswerResponse {
  answer: string;
  groundedFacts: ICandidateFact[];
  modelUsed: string;
}

export class RagService {
  /**
   * Retrieve candidate facts from MongoDB
   */
  async getCandidateFacts(userId: string): Promise<ICandidateFact[]> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const [profile, defaultResume] = await Promise.all([
      ProfileModel.findOne({ userId: userObjectId }),
      ResumeModel.findOne({ userId: userObjectId, isDefault: true })
    ]);

    let facts: ICandidateFact[] = [];

    if (profile?.candidateFacts && profile.candidateFacts.length > 0) {
      facts = profile.candidateFacts;
    } else if (defaultResume?.candidateFacts && defaultResume.candidateFacts.length > 0) {
      facts = defaultResume.candidateFacts;
    } else {
      // Synthesize basic facts from structured profile if no precomputed facts exist
      const p = profile?.personal;
      const prof = profile?.professional;
      if (prof?.skills && prof.skills.length > 0) {
        facts.push({
          id: 'synth-skills',
          category: 'SKILL',
          fact: `Proficient in technical skills: ${prof.skills.join(', ')}`,
          confidence: 'explicit',
          sourceSection: 'Profile Skills',
          technologies: prof.skills
        });
      }

      if (profile?.experiences && profile.experiences.length > 0) {
        profile.experiences.forEach((exp, i) => {
          facts.push({
            id: `synth-exp-${i}`,
            category: 'EXPERIENCE',
            fact: `Worked as ${exp.jobTitle} at ${exp.company} with technologies: ${exp.technologies?.join(', ') || 'software development'}`,
            confidence: 'explicit',
            sourceSection: `Experience: ${exp.company}`,
            technologies: exp.technologies || []
          });
        });
      }
    }

    return facts;
  }

  /**
   * Retrieve most relevant candidate facts for a specific application question & job context
   */
  async retrieveRelevantFacts(
    userId: string,
    question: string,
    jobContext?: { title?: string; company?: string; description?: string }
  ): Promise<ICandidateFact[]> {
    const allFacts = await this.getCandidateFacts(userId);
    if (allFacts.length === 0) return [];

    const queryTokens = `${question} ${jobContext?.title || ''} ${jobContext?.description || ''}`
      .toLowerCase()
      .split(/[^a-z0-9+#.]+/)
      .filter((w) => w.length > 2);

    // Score facts based on query term frequency and relevance
    const scoredFacts = allFacts.map((fact) => {
      let score = 0;
      const factLower = fact.fact.toLowerCase();
      const techLower = (fact.technologies || []).map((t) => t.toLowerCase());

      for (const token of queryTokens) {
        if (techLower.includes(token)) score += 5;
        if (factLower.includes(token)) score += 2;
      }

      if (fact.confidence === 'explicit') score += 1;
      return { fact, score };
    });

    // Sort descending and take top 6 most relevant facts
    scoredFacts.sort((a, b) => b.score - a.score);
    return scoredFacts.slice(0, 6).map((s) => s.fact);
  }

  /**
   * RAG Generation: Answering form questions with strict resume grounding
   */
  async answerQuestion(req: GroundedAnswerRequest): Promise<GroundedAnswerResponse> {
    const { userId, question, jobContext } = req;
    const relevantFacts = await this.retrieveRelevantFacts(userId, question, jobContext);

    const answer = await aiService.generateGroundedAnswer(relevantFacts, question, jobContext);

    return {
      answer,
      groundedFacts: relevantFacts,
      modelUsed: process.env.AI_MODEL || 'grok-4.7'
    };
  }
}

export const ragService = new RagService();
