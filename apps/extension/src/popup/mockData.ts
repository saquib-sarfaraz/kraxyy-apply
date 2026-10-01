export const MOCK_USER = {
  name: 'Saquib Sarfaraz',
  email: 'saquib@kraxyy.ai',
  phone: '+91 98765 43210',
  currentRole: 'Software Engineer',
  resumeTitle: 'Software Engineer',
  skills: ['React', 'JavaScript', 'TypeScript', 'Node.js', 'MongoDB', 'REST API', 'Tailwind CSS']
};

export const MOCK_RESUME = {
  exists: true,
  title: 'Software Engineer',
  filename: 'Saquib_Sarfaraz_Resume.pdf',
  skillsCount: 12
};

export const MOCK_JOB = {
  title: 'Full Stack Software Engineer',
  company: 'TechCorp International',
  location: 'Remote',
  description: 'We are seeking a Software Engineer experienced with React, JavaScript, Node.js, MongoDB, REST API, AWS, and Docker.',
  skills: ['React', 'JavaScript', 'Node.js', 'MongoDB', 'REST API', 'AWS', 'Docker'],
  requirements: ["Bachelor's degree in Computer Science or related field", '3+ years of full stack experience'],
  experienceLevel: 'MID'
};

export const MOCK_MAPPED_FIELDS = [
  { label: 'Name', value: 'Saquib Sarfaraz', taxonomyType: 'FULL_NAME', status: 'READY' },
  { label: 'Email', value: 'saquib@kraxyy.ai', taxonomyType: 'EMAIL', status: 'READY' },
  { label: 'Phone', value: '+91 98765 43210', taxonomyType: 'PHONE', status: 'READY' },
  { label: 'Education', value: 'B.Tech in Computer Science', taxonomyType: 'EDUCATION_DEGREE', status: 'READY' },
  { label: 'Skills', value: 'React, Node.js, JavaScript, MongoDB', taxonomyType: 'SKILLS', status: 'READY' },
  { label: 'Experience', value: 'Software Engineer (3 Years)', taxonomyType: 'EXPERIENCE', status: 'READY' },
  { label: 'LinkedIn', value: 'linkedin.com/in/saquibsarfaraz', taxonomyType: 'LINKEDIN', status: 'READY' },
  { label: 'GitHub', value: 'github.com/saquibsarfaraz', taxonomyType: 'GITHUB', status: 'READY' },
  { label: 'Portfolio', value: 'saquib.dev', taxonomyType: 'PORTFOLIO', status: 'READY' },
  { label: 'Location / City', value: 'Bengaluru, India', taxonomyType: 'CITY', status: 'READY' },
  { label: 'Work Authorization', value: 'Authorized to Work', taxonomyType: 'WORK_AUTHORIZATION', status: 'READY' },
  { label: 'Sponsorship', value: 'No Sponsorship Needed', taxonomyType: 'VISA_SPONSORSHIP', status: 'READY' }
];

export const MOCK_MATCH_RESULT = {
  overallScore: 84,
  matchedSkills: ['React', 'JavaScript', 'Node.js', 'MongoDB', 'REST API'],
  missingSkills: ['AWS', 'Docker'],
  experienceMatch: 'Good',
  educationMatch: 'Good',
  roleScore: 90,
  skillsScore: 82,
  experienceScore: 85,
  educationScore: 90,
  locationScore: 100,
  strengths: [
    'Strong proficiency in core JavaScript, React, and Node.js stack',
    'Experience aligns well with mid-level engineering requirements',
    'Degree in Computer Science satisfies educational prerequisite'
  ],
  concerns: [
    'Missing cloud infrastructure keywords: AWS, Docker'
  ]
};

export const MOCK_AUTOFILL_REPORT = {
  totalDetected: 18,
  totalVerified: 15,
  totalNeedsAttention: 1,
  totalSkippedExisting: 2,
  totalFailed: 0,
  fields: [
    { label: 'Full Name', status: 'VERIFIED', verifiedValue: 'Saquib Sarfaraz', taxonomyType: 'NAME' },
    { label: 'Email Address', status: 'VERIFIED', verifiedValue: 'saquib@kraxyy.ai', taxonomyType: 'EMAIL' },
    { label: 'Phone Number', status: 'VERIFIED', verifiedValue: '+91 98765 43210', taxonomyType: 'PHONE' },
    { label: 'LinkedIn Profile', status: 'VERIFIED', verifiedValue: 'linkedin.com/in/saquibsarfaraz', taxonomyType: 'LINKEDIN' },
    { label: 'GitHub Profile', status: 'VERIFIED', verifiedValue: 'github.com/saquibsarfaraz', taxonomyType: 'GITHUB' },
    { label: 'Resume File', status: 'MANUAL_REQUIRED', manualReason: 'Please attach resume PDF manually', taxonomyType: 'RESUME' }
  ]
};
