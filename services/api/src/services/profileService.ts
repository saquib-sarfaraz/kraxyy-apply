import mongoose from 'mongoose';
import { ProfileModel, IProfileDocument } from '../models/Profile';
import { ResumeModel } from '../models/Resume';
import { IUserProfile, FieldTaxonomyType, ICompletionBreakdown, ICandidateFact, IResumeParsedDraft } from '@kraxyy/types';

export interface ProfileCompletionWeights {
  personal: number;     // 15%
  education: number;    // 15%
  skills: number;       // 20%
  experience: number;   // 20%
  projects: number;     // 15%
  resume: number;       // 10%
  preferences: number;  // 5%
}

export const DEFAULT_COMPLETION_WEIGHTS: ProfileCompletionWeights = {
  personal: 15,
  education: 15,
  skills: 20,
  experience: 20,
  projects: 15,
  resume: 10,
  preferences: 5
};

export class ProfileService {
  constructor(private weights: ProfileCompletionWeights = DEFAULT_COMPLETION_WEIGHTS) {}

  async getProfileByUserId(userId: string): Promise<IUserProfile> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    let profile = await ProfileModel.findOne({ userId: userObjectId });
    if (!profile) {
      profile = await ProfileModel.create({
        userId: userObjectId,
        personal: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          country: '',
          city: ''
        },
        professional: {
          currentTitle: '',
          summary: '',
          skills: [],
          yearsOfExperience: 0,
          remotePreference: 'FLEXIBLE',
          salaryExpectations: {
            currency: 'USD',
            period: 'YEARLY'
          }
        },
        educations: [],
        experiences: [],
        projects: [],
        certifications: [],
        languages: [],
        workAuthorization: {
          authorizedToWork: true,
          sponsorshipRequired: false
        },
        preferences: {
          targetRoles: [],
          locations: [],
          remote: true,
          internship: false,
          fullTime: true,
          experienceLevel: 'MID',
          industries: []
        },
        completionPercentage: 0
      });
    }

    const hasResume = (await ResumeModel.countDocuments({ userId: userObjectId })) > 0;
    const breakdown = this.calculateCompletionBreakdown(profile, hasResume);
    profile.completionPercentage = breakdown.total;

    return this.formatProfile(profile, breakdown);
  }

  async updateProfile(userId: string, data: Partial<IUserProfile>): Promise<IUserProfile> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    let profile = await ProfileModel.findOne({ userId: userObjectId });
    if (!profile) {
      profile = new ProfileModel({ userId: userObjectId });
    }

    const plainProfile: any = profile.toObject ? profile.toObject() : profile;

    if (data.personal) {
      const p = plainProfile.personal || {};
      profile.set('personal', { ...p, ...data.personal });
    }

    if (data.professional) {
      const prof = plainProfile.professional || {};
      const { salaryExpectations, ...restProf } = data.professional;
      const updatedProf = { ...prof, ...restProf };
      if (salaryExpectations) {
        updatedProf.salaryExpectations = {
          ...(prof.salaryExpectations || {}),
          ...salaryExpectations
        };
      }
      profile.set('professional', updatedProf);
    }

    if (data.educations !== undefined) profile.set('educations', data.educations);
    if (data.experiences !== undefined) profile.set('experiences', data.experiences);
    if (data.projects !== undefined) profile.set('projects', data.projects);
    if (data.certifications !== undefined) profile.set('certifications', data.certifications);
    if (data.languages !== undefined) profile.set('languages', data.languages);

    if (data.workAuthorization) {
      const wa = plainProfile.workAuthorization || {};
      profile.set('workAuthorization', { ...wa, ...data.workAuthorization });
    }

    if (data.preferences) {
      const pref = plainProfile.preferences || {};
      profile.set('preferences', { ...pref, ...data.preferences });
    }

    const hasResume = (await ResumeModel.countDocuments({ userId: userObjectId })) > 0;
    const breakdown = this.calculateCompletionBreakdown(profile, hasResume);
    profile.completionPercentage = breakdown.total;
    await profile.save();

    return this.formatProfile(profile, breakdown);
  }

  async updateProfileFromResume(
    userId: string,
    parsedData: IResumeParsedDraft['suggestedData'],
    candidateFacts?: ICandidateFact[]
  ): Promise<IUserProfile> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    let profile = await ProfileModel.findOne({ userId: userObjectId });
    if (!profile) {
      profile = new ProfileModel({ userId: userObjectId });
    }

    const plainProfile: any = profile.toObject ? profile.toObject() : profile;

    // 1. Merge personal info
    if (parsedData.personal) {
      const p = plainProfile.personal || {};
      const updatedPersonal: any = { ...p };
      for (const [key, val] of Object.entries(parsedData.personal)) {
        if (val) updatedPersonal[key] = val;
      }
      if ((!updatedPersonal.firstName || !updatedPersonal.lastName) && (parsedData.personal as any).name) {
        const parts = String((parsedData.personal as any).name).trim().split(/\s+/);
        if (parts.length > 0) {
          updatedPersonal.firstName = updatedPersonal.firstName || parts[0];
          updatedPersonal.lastName = updatedPersonal.lastName || parts.slice(1).join(' ');
        }
      }
      profile.set('personal', updatedPersonal);
    }

    // 2. Merge professional info
    if (parsedData.professional || parsedData.skills || parsedData.summary) {
      const prof = plainProfile.professional || {};
      const combinedSkills = Array.from(
        new Set([
          ...(prof.skills || []),
          ...(parsedData.skills || []),
          ...(parsedData.professional?.skills || [])
        ])
      );

      profile.set('professional', {
        ...prof,
        currentTitle: parsedData.professional?.currentTitle || prof.currentTitle || 'Software Engineer',
        summary: parsedData.professional?.summary || parsedData.summary || prof.summary,
        skills: combinedSkills,
        yearsOfExperience: parsedData.professional?.yearsOfExperience || prof.yearsOfExperience || 3
      });
    }

    // 3. Educations
    if (parsedData.educations && parsedData.educations.length > 0) {
      profile.set('educations', parsedData.educations);
    }

    // 4. Experiences
    if (parsedData.experiences && parsedData.experiences.length > 0) {
      profile.set('experiences', parsedData.experiences);
    }

    // 5. Projects
    if ((parsedData as any).projects && (parsedData as any).projects.length > 0) {
      profile.set('projects', (parsedData as any).projects);
    }

    // 6. Certifications
    if ((parsedData as any).certifications && (parsedData as any).certifications.length > 0) {
      profile.set('certifications', (parsedData as any).certifications);
    }

    // 7. Candidate facts & evidence
    if (candidateFacts && candidateFacts.length > 0) {
      profile.set('candidateFacts', candidateFacts);
      profile.set('resumeEvidence', candidateFacts.map((f) => f.fact));
    }

    const breakdown = this.calculateCompletionBreakdown(profile, true);
    profile.completionPercentage = breakdown.total;
    await profile.save();

    return this.formatProfile(profile, breakdown);
  }

  calculateCompletionBreakdown(profile: IProfileDocument, hasResume: boolean): ICompletionBreakdown {
    const missing: string[] = [];

    // 1. Personal Info (15%)
    let personalScore = 0;
    const p = profile.personal;
    if (p.firstName && p.lastName) personalScore += 5;
    else missing.push('Full Name');

    if (p.email && p.phone) personalScore += 5;
    else missing.push('Phone Number');

    if (p.city || p.country) personalScore += 3;
    else missing.push('Location');

    if (p.linkedin || p.github || p.portfolio) personalScore += 2;
    else missing.push('LinkedIn or Portfolio Link');

    const personalFinal = Math.min(this.weights.personal, personalScore);

    // 2. Education (15%)
    let eduScore = 0;
    if (profile.educations && profile.educations.length > 0) {
      eduScore = this.weights.education;
    } else {
      missing.push('Add at least one Education entry (+15%)');
    }

    // 3. Skills (20%)
    let skillsScore = 0;
    const count = profile.professional?.skills?.length || 0;
    if (count >= 5) {
      skillsScore = this.weights.skills;
    } else if (count >= 2) {
      skillsScore = Math.round(this.weights.skills * 0.6);
      missing.push('Add at least 5 key skills for full matching accuracy');
    } else {
      missing.push('Add your technical and core skills (+20%)');
    }

    // 4. Experience (20%)
    let expScore = 0;
    if (profile.experiences && profile.experiences.length > 0) {
      expScore = this.weights.experience;
    } else {
      missing.push('Add Work Experience entry (+20%)');
    }

    // 5. Projects (15%)
    let projScore = 0;
    if (profile.projects && profile.projects.length > 0) {
      projScore = this.weights.projects;
    } else {
      missing.push('Add at least one Project (+15%)');
    }

    // 6. Resume (10%)
    let resumeScore = 0;
    if (hasResume) {
      resumeScore = this.weights.resume;
    } else {
      missing.push('Upload your Resume PDF (+10%)');
    }

    // 7. Preferences (5%)
    let prefScore = 0;
    const prefs = (profile as any).preferences;
    if (prefs?.targetRoles && prefs.targetRoles.length > 0) {
      prefScore = this.weights.preferences;
    } else {
      missing.push('Set Target Job Roles in Preferences (+5%)');
    }

    const total = Math.min(
      100,
      personalFinal + eduScore + skillsScore + expScore + projScore + resumeScore + prefScore
    );

    return {
      total,
      categories: {
        personal: { score: personalFinal, weight: this.weights.personal, max: this.weights.personal },
        education: { score: eduScore, weight: this.weights.education, max: this.weights.education },
        skills: { score: skillsScore, weight: this.weights.skills, max: this.weights.skills },
        experience: { score: expScore, weight: this.weights.experience, max: this.weights.experience },
        projects: { score: projScore, weight: this.weights.projects, max: this.weights.projects },
        resume: { score: resumeScore, weight: this.weights.resume, max: this.weights.resume },
        preferences: { score: prefScore, weight: this.weights.preferences, max: this.weights.preferences }
      },
      missingSuggestions: missing
    };
  }

  async getAutofillPayload(userId: string): Promise<Record<FieldTaxonomyType, string | boolean>> {
    const profile = await this.getProfileByUserId(userId);
    const p = profile.personal;
    const prof = profile.professional;
    const latestExp = profile.experiences[0];
    const latestEdu = profile.educations[0];

    const payload: Partial<Record<FieldTaxonomyType, string | boolean>> = {
      // PERSONAL
      FIRST_NAME: p.firstName,
      LAST_NAME: p.lastName,
      FULL_NAME: `${p.firstName} ${p.lastName}`.trim(),
      EMAIL: p.email,
      PHONE: p.phone,

      // ADDRESS
      ADDRESS: p.address || '',
      ADDRESS_LINE1: p.address || '',
      ADDRESS_LINE_1: p.address || '',
      ADDRESS_LINE_2: '',
      CITY: p.city,
      STATE: p.stateOrProvince || '',
      POSTAL_CODE: p.postalCode || '',
      COUNTRY: p.country,

      // PROFESSIONAL
      JOB_TITLE: prof.currentTitle || latestExp?.jobTitle || '',
      COMPANY: latestExp?.company || '',
      CURRENT_COMPANY: latestExp?.company || '',
      CURRENT_JOB_TITLE: prof.currentTitle || latestExp?.jobTitle || '',
      CURRENT_TITLE: prof.currentTitle || latestExp?.jobTitle || '',
      RECENT_COMPANY: latestExp?.company || '',
      RECENT_TITLE: latestExp?.jobTitle || '',
      SUMMARY: prof.summary || '',
      SKILLS: (prof.skills || []).join(', '),
      YEARS_EXPERIENCE: prof.yearsOfExperience ? String(prof.yearsOfExperience) : '3',

      // LINKS
      LINKEDIN: p.linkedin || '',
      GITHUB: p.github || '',
      PORTFOLIO: p.portfolio || p.website || '',
      WEBSITE: p.website || p.portfolio || '',

      // EDUCATION
      UNIVERSITY: latestEdu?.institution || '',
      COLLEGE: latestEdu?.institution || '',
      EDUCATION_SCHOOL: latestEdu?.institution || '',
      DEGREE: latestEdu?.degree || '',
      EDUCATION_DEGREE: latestEdu?.degree || '',
      FIELD_OF_STUDY: latestEdu?.fieldOfStudy || '',
      GRADUATION_DATE: latestEdu?.endDate || '',
      GPA: latestEdu?.gpa || '',

      // APPLICATION
      RESUME: (profile as any).resumeUrl || '',
      COVER_LETTER: '',

      // USER-SENSITIVE / MANUAL
      WORK_AUTHORIZATION: profile.workAuthorization?.authorizedToWork ?? true,
      VISA_SPONSORSHIP: profile.workAuthorization?.sponsorshipRequired ?? false,
      SPONSORSHIP_REQUIRED: profile.workAuthorization?.sponsorshipRequired ?? false,
      SALARY_EXPECTATION: prof.salaryExpectations?.expected ? String(prof.salaryExpectations.expected) : '',
      DESIRED_SALARY: prof.salaryExpectations?.expected ? String(prof.salaryExpectations.expected) : '',
      NOTICE_PERIOD: 'Immediately',
      START_DATE: 'Immediately'
    };

    return payload as Record<FieldTaxonomyType, string | boolean>;
  }

  formatProfile(profile: IProfileDocument, breakdown?: ICompletionBreakdown): IUserProfile {
    return {
      id: profile._id.toString(),
      userId: profile.userId.toString(),
      personal: profile.personal,
      professional: profile.professional,
      educations: profile.educations as any,
      experiences: profile.experiences as any,
      projects: profile.projects as any,
      certifications: profile.certifications as any,
      languages: profile.languages as any,
      workAuthorization: profile.workAuthorization,
      preferences: (profile as any).preferences,
      candidateFacts: (profile.candidateFacts || []) as any,
      completionPercentage: breakdown ? breakdown.total : profile.completionPercentage,
      completionBreakdown: breakdown,
      updatedAt: profile.updatedAt.toISOString()
    };
  }
}

export const profileService = new ProfileService();
