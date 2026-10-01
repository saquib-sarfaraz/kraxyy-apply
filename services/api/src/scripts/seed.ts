import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { UserModel } from '../models/User';
import { ProfileModel } from '../models/Profile';
import { ResumeModel } from '../models/Resume';
import { JobModel } from '../models/Job';
import { ApplicationModel } from '../models/Application';
import { logger } from '../utils/logger';

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kraxyy_apply';
  logger.info(`Connecting to MongoDB for seeding: ${uri}`);
  
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
  } catch (connErr) {
    logger.error(`Could not connect to MongoDB at ${uri}.`);
    logger.info('To seed the database, please start MongoDB locally (`brew services start mongodb-community`) or set your MongoDB Atlas URI in `services/api/.env`.');
    process.exit(0);
  }

  // Clear existing collections
  await Promise.all([
    UserModel.deleteMany({}),
    ProfileModel.deleteMany({}),
    ResumeModel.deleteMany({}),
    JobModel.deleteMany({}),
    ApplicationModel.deleteMany({})
  ]);

  logger.info('Purged existing collections');

  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('AdminPass123!', salt);
  const demoPasswordHash = await bcrypt.hash('DemoPass123!', salt);

  // 1. Create Admin
  const admin = await UserModel.create({
    email: 'admin@kraxyy.com',
    passwordHash: adminPasswordHash,
    firstName: 'Kraxyy',
    lastName: 'Administrator',
    role: 'ADMIN',
    isVerified: true,
    status: 'ACTIVE'
  });

  // 2. Create Demo User
  const demoUser = await UserModel.create({
    email: 'demo@kraxyy.com',
    passwordHash: demoPasswordHash,
    firstName: 'Alex',
    lastName: 'Morgan',
    role: 'USER',
    isVerified: true,
    status: 'ACTIVE'
  });

  logger.info(`Created users: Admin (${admin.email}), Demo (${demoUser.email})`);

  // 3. Create Demo Profile
  await ProfileModel.create({
    userId: demoUser._id,
    personal: {
      firstName: 'Alex',
      lastName: 'Morgan',
      preferredName: 'Alex',
      email: 'demo@kraxyy.com',
      phone: '+1 (555) 234-5678',
      country: 'United States',
      city: 'San Francisco',
      address: '742 Evergreen Terrace',
      stateOrProvince: 'California',
      postalCode: '94107',
      linkedin: 'https://linkedin.com/in/alex-morgan-kraxyy',
      github: 'https://github.com/alexmorgan-dev',
      portfolio: 'https://alexmorgan.dev',
      website: 'https://alexmorgan.dev'
    },
    professional: {
      currentTitle: 'Senior Full Stack Engineer',
      summary:
        'Passionate software engineer with 6+ years of experience designing, architecting, and scaling enterprise web applications using TypeScript, React, Node.js, and cloud ecosystems.',
      skills: [
        'TypeScript',
        'React',
        'Node.js',
        'Next.js',
        'Tailwind CSS',
        'MongoDB',
        'PostgreSQL',
        'Docker',
        'AWS',
        'GraphQL',
        'REST APIs',
        'Git'
      ],
      yearsOfExperience: 6,
      preferredJobTitle: 'Senior Full Stack Engineer / Tech Lead',
      preferredLocation: 'San Francisco, CA or Remote',
      remotePreference: 'FLEXIBLE',
      salaryExpectations: {
        currency: 'USD',
        minimum: 160000,
        expected: 185000,
        period: 'YEARLY'
      }
    },
    educations: [
      {
        id: uuidv4(),
        institution: 'University of California, Berkeley',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science',
        startDate: '2015-08-01',
        endDate: '2019-05-15',
        isCurrent: false,
        gpa: '3.8',
        description: 'Focus on distributed systems, algorithms, and human-computer interaction.'
      }
    ],
    experiences: [
      {
        id: uuidv4(),
        company: 'Veloce Labs',
        jobTitle: 'Senior Full Stack Engineer',
        location: 'San Francisco, CA',
        startDate: '2022-03-01',
        isCurrent: true,
        description:
          'Led architecture of real-time collaboration tools, reducing client rendering latency by 45% and mentoring a team of 4 engineers.',
        technologies: ['React', 'TypeScript', 'Node.js', 'Redis', 'WebSockets']
      },
      {
        id: uuidv4(),
        company: 'Starlight Interactive',
        jobTitle: 'Software Engineer',
        location: 'Mountain View, CA',
        startDate: '2019-06-01',
        endDate: '2022-02-28',
        isCurrent: false,
        description:
          'Developed micro-frontend architecture supporting 2M+ monthly active users. Designed REST and GraphQL APIs with automated CI/CD pipelines.',
        technologies: ['JavaScript', 'React', 'Express', 'MongoDB', 'Docker']
      }
    ],
    projects: [
      {
        id: uuidv4(),
        name: 'StreamPulse Observability',
        description: 'Open-source distributed tracing visualizer for Node.js microservices.',
        technologies: ['TypeScript', 'React', 'OpenTelemetry'],
        url: 'https://github.com/alexmorgan-dev/streampulse',
        githubUrl: 'https://github.com/alexmorgan-dev/streampulse'
      }
    ],
    certifications: [
      {
        id: uuidv4(),
        name: 'AWS Certified Solutions Architect – Associate',
        issuer: 'Amazon Web Services',
        issueDate: '2023-04-10',
        expirationDate: '2026-04-10',
        credentialUrl: 'https://aws.amazon.com/verification/123456'
      }
    ],
    languages: [
      { id: uuidv4(), language: 'English', proficiency: 'NATIVE' },
      { id: uuidv4(), language: 'Spanish', proficiency: 'CONVERSATIONAL' }
    ],
    workAuthorization: {
      authorizedToWork: true,
      sponsorshipRequired: false,
      visaStatus: 'US Citizen',
      notes: 'No sponsorship required now or in the future.'
    },
    completionPercentage: 100
  });

  // 4. Sample Resume
  const resume = await ResumeModel.create({
    userId: demoUser._id,
    filename: 'resume-alex-morgan-2026.pdf',
    originalName: 'Alex_Morgan_Senior_Engineer_2026.pdf',
    fileUrl: 'http://localhost:5001/uploads/sample-resume.pdf',
    fileSize: 142850,
    mimeType: 'application/pdf',
    isDefault: true,
    parsedData: {
      skills: ['TypeScript', 'React', 'Node.js', 'MongoDB', 'AWS', 'Docker'],
      suggestedTitle: 'Senior Full Stack Engineer',
      summarySnippet: 'Senior Software Engineer with 6+ years specializing in distributed web applications.'
    }
  });

  logger.info('Created demo profile and default resume');

  // 5. Seed Jobs
  const jobsData = [
    {
      title: 'Senior Frontend Architect',
      company: 'Linear Dynamics',
      location: 'San Francisco, CA',
      remoteType: 'HYBRID',
      jobType: 'FULL_TIME',
      experienceLevel: 'SENIOR',
      salary: { min: 170000, max: 210000, currency: 'USD', period: 'YEARLY' },
      description: 'Lead our next-generation design systems and frontend developer velocity platform.',
      skills: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Performance Optimization'],
      source: 'Greenhouse',
      applyUrl: 'https://boards.greenhouse.io/demo/jobs/101',
      postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'Full Stack Staff Engineer',
      company: 'Aura Cloud Services',
      location: 'New York, NY',
      remoteType: 'REMOTE',
      jobType: 'FULL_TIME',
      experienceLevel: 'LEAD',
      salary: { min: 190000, max: 240000, currency: 'USD', period: 'YEARLY' },
      description: 'Design robust distributed backend services and high-polish web dashboards.',
      skills: ['Node.js', 'Express', 'TypeScript', 'MongoDB', 'Docker', 'Kubernetes'],
      source: 'Lever',
      applyUrl: 'https://jobs.lever.co/demo/aura-staff',
      postedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'Senior TypeScript Systems Engineer',
      company: 'Beacon AI',
      location: 'Austin, TX',
      remoteType: 'REMOTE',
      jobType: 'FULL_TIME',
      experienceLevel: 'SENIOR',
      salary: { min: 165000, max: 195000, currency: 'USD', period: 'YEARLY' },
      description: 'Build automated AI workflow orchestration tools for enterprise clients.',
      skills: ['TypeScript', 'Python', 'React', 'REST APIs', 'PostgreSQL'],
      source: 'Workday',
      applyUrl: 'https://beacon.wd1.myworkdayjobs.com/careers/job/1029',
      postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'Frontend Product Engineer',
      company: 'Craftwork Studios',
      location: 'Seattle, WA',
      remoteType: 'ONSITE',
      jobType: 'FULL_TIME',
      experienceLevel: 'MID',
      salary: { min: 140000, max: 175000, currency: 'USD', period: 'YEARLY' },
      description: 'Craft intuitive, accessible user interfaces for creative professionals.',
      skills: ['React', 'CSS Architecture', 'Accessibility', 'Framer Motion'],
      source: 'Direct Career Page',
      applyUrl: 'https://craftwork.io/careers/product-engineer',
      postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'Backend Platform Engineer',
      company: 'Meridian Healthtech',
      location: 'Boston, MA',
      remoteType: 'REMOTE',
      jobType: 'FULL_TIME',
      experienceLevel: 'SENIOR',
      salary: { min: 160000, max: 190000, currency: 'USD', period: 'YEARLY' },
      description: 'Develop secure, HIPAA-compliant patient record data processing pipelines.',
      skills: ['Node.js', 'Express', 'MongoDB', 'Data Encryption', 'Security'],
      source: 'Greenhouse',
      applyUrl: 'https://boards.greenhouse.io/meridian/jobs/204',
      postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ];

  await JobModel.insertMany(jobsData);
  logger.info(`Seeded ${jobsData.length} active jobs`);

  // 6. Seed Demo Applications
  const applicationsData = [
    {
      userId: demoUser._id,
      jobTitle: 'Senior Frontend Architect',
      company: 'Linear Dynamics',
      jobUrl: 'https://boards.greenhouse.io/demo/jobs/101',
      source: 'Chrome Extension',
      location: 'San Francisco, CA',
      salary: '$185,000',
      appliedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: 'INTERVIEW',
      notes: 'Passed initial recruiter screening. Technical round scheduled for Thursday 2pm.',
      resumeUsedId: resume._id,
      timeline: [
        { id: uuidv4(), status: 'APPLIED', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), note: 'Applied via Kraxyy Chrome Extension' },
        { id: uuidv4(), status: 'SCREENING', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), note: 'Recruiter call with Sarah' },
        { id: uuidv4(), status: 'INTERVIEW', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), note: 'Invited to Technical Architecture interview' }
      ]
    },
    {
      userId: demoUser._id,
      jobTitle: 'Full Stack Staff Engineer',
      company: 'Aura Cloud Services',
      jobUrl: 'https://jobs.lever.co/demo/aura-staff',
      source: 'Chrome Extension',
      location: 'Remote',
      salary: '$200,000',
      appliedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      status: 'SCREENING',
      notes: 'Confirmation email received from hiring manager.',
      resumeUsedId: resume._id,
      timeline: [
        { id: uuidv4(), status: 'APPLIED', date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), note: 'Form autofilled by Kraxyy Apply' },
        { id: uuidv4(), status: 'SCREENING', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), note: 'Application acknowledged by talent team' }
      ]
    },
    {
      userId: demoUser._id,
      jobTitle: 'Principal Web Architect',
      company: 'Stratos Systems',
      jobUrl: 'https://careers.stratos.io/apply/412',
      source: 'MANUAL',
      location: 'Remote',
      salary: '$215,000',
      appliedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      status: 'OFFER',
      notes: 'Offer package received: $210k base + equity + full health benefits. Reviewing offer letter.',
      resumeUsedId: resume._id,
      timeline: [
        { id: uuidv4(), status: 'APPLIED', date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) },
        { id: uuidv4(), status: 'SCREENING', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
        { id: uuidv4(), status: 'INTERVIEW', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        { id: uuidv4(), status: 'OFFER', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), note: 'Official offer received' }
      ]
    },
    {
      userId: demoUser._id,
      jobTitle: 'Senior TypeScript Engineer',
      company: 'Beacon AI',
      jobUrl: 'https://beacon.wd1.myworkdayjobs.com/careers/job/1029',
      source: 'Chrome Extension',
      location: 'Austin, TX (Remote)',
      salary: '$175,000',
      appliedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'APPLIED',
      notes: 'Applied via Workday adapter form autofill.',
      resumeUsedId: resume._id,
      timeline: [
        { id: uuidv4(), status: 'APPLIED', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), note: 'Form submitted on Workday portal' }
      ]
    }
  ];

  await ApplicationModel.insertMany(applicationsData);
  logger.info(`Seeded ${applicationsData.length} tracked applications`);

  logger.info('Database seeding completed successfully!');
  logger.info('--- CREDENTIALS ---');
  logger.info('Admin: admin@kraxyy.com / AdminPass123!');
  logger.info('Demo User: demo@kraxyy.com / DemoPass123!');
  logger.info('-------------------');

  await mongoose.disconnect();
}

seed().catch((err) => {
  logger.error('Seed error:', err);
  process.exit(1);
});
