import { FieldTaxonomyType } from '@kraxyy/types';

export interface FieldDetectionPattern {
  type: FieldTaxonomyType;
  keywords: string[];
  exactAttributes: string[];
  autocomplete: string[];
  regexPatterns?: RegExp[];
}

export const FIELD_PATTERNS: FieldDetectionPattern[] = [
  // ==========================================
  // PERSONAL
  // ==========================================
  {
    type: 'FIRST_NAME',
    keywords: [
      'first name', 'given name', 'forename', 'fname', 'first_name', 'firstname',
      'candidate_first_name', 'candidatefirstname', 'first', 'first-name', 'applicant first name'
    ],
    exactAttributes: [
      'firstname', 'first_name', 'fname', 'given-name', 'first-name', 'candidate_first_name',
      'candidatefirstname', 'givenname', 'candidate_fname', 'first_3', 'first_4', 'first_1', 'first'
    ],
    autocomplete: ['given-name'],
    regexPatterns: [/^first[_-]?name$/i, /^fname$/i, /^first$/i, /^first_\d+$/i]
  },
  {
    type: 'LAST_NAME',
    keywords: [
      'last name', 'family name', 'surname', 'lname', 'last_name', 'lastname',
      'candidate_last_name', 'candidatelastname', 'last', 'last-name', 'applicant last name'
    ],
    exactAttributes: [
      'lastname', 'last_name', 'lname', 'family-name', 'last-name', 'candidate_last_name',
      'candidatelastname', 'familyname', 'candidate_lname', 'last_3', 'last_4', 'last_1', 'last'
    ],
    autocomplete: ['family-name'],
    regexPatterns: [/^last[_-]?name$/i, /^lname$/i, /^surname$/i, /^last$/i, /^last_\d+$/i]
  },
  {
    type: 'FULL_NAME',
    keywords: [
      'full name', 'candidate name', 'your name', 'applicant name', 'legal name',
      'name', 'display name', 'complete name'
    ],
    exactAttributes: [
      'name', 'full_name', 'fullname', 'candidate_name', 'applicant_name', 'candidatename',
      'legal_name', 'full-name', 'q3_name', 'q4_name', 'input_3'
    ],
    autocomplete: ['name'],
    regexPatterns: [/^full[_-]?name$/i, /^name$/i, /^candidate[_-]?name$/i]
  },
  {
    type: 'EMAIL',
    keywords: [
      'email', 'e-mail', 'email address', 'e-mail address', 'contact email',
      'professional email', 'candidate email', 'applicant email', 'email id'
    ],
    exactAttributes: [
      'email', 'email_address', 'e-mail', 'candidate_email', 'applicant_email',
      'candidateemail', 'emailaddress', 'user_email', 'q5_email', 'input_5', 'input_4'
    ],
    autocomplete: ['email'],
    regexPatterns: [/^email$/i, /^e[_-]?mail$/i, /^email[_-]?address$/i]
  },
  {
    type: 'PHONE',
    keywords: [
      'phone', 'mobile', 'cell', 'telephone', 'contact number', 'phone number',
      'cell phone', 'mobile number', 'contact no', 'mobile no', 'phone no', 'whatsapp', 'tel'
    ],
    exactAttributes: [
      'phone', 'telephone', 'mobile', 'cell_phone', 'phone_number', 'candidate_phone',
      'candidatephone', 'phonenumber', 'q4_phone', 'input_4_phone', 'q6_phone', 'input_6',
      'mobile_no', 'phone_no', 'contact_no', 'whatsapp'
    ],
    autocomplete: ['tel', 'tel-national', 'tel-country-code'],
    regexPatterns: [/^phone$/i, /^mobile$/i, /^tel$/i, /^cell$/i, /^phone[_-]?number$/i, /^mobile[_-]?no$/i]
  },

  // ==========================================
  // ADDRESS
  // ==========================================
  {
    type: 'ADDRESS',
    keywords: ['street address', 'address line 1', 'address', 'residential address', 'street', 'mailing address'],
    exactAttributes: ['address', 'street_address', 'address_line1', 'street', 'candidate_address', 'address1', 'q7_address'],
    autocomplete: ['street-address', 'address-line1']
  },
  {
    type: 'ADDRESS_LINE_1',
    keywords: ['address line 1', 'street address', 'address 1', 'line 1', 'street line 1'],
    exactAttributes: ['address_line_1', 'address_line1', 'address1', 'line1', 'street_line1', 'input_7_addr_line1'],
    autocomplete: ['address-line1']
  },
  {
    type: 'ADDRESS_LINE_2',
    keywords: ['address line 2', 'apartment', 'suite', 'unit', 'building', 'address 2', 'line 2'],
    exactAttributes: ['address_line_2', 'address_line2', 'address2', 'line2', 'apt', 'suite', 'unit', 'input_7_addr_line2'],
    autocomplete: ['address-line2']
  },
  {
    type: 'CITY',
    keywords: ['city', 'town', 'municipality', 'locality'],
    exactAttributes: ['city', 'locality', 'candidate_city', 'town', 'candidatecity', 'input_7_city'],
    autocomplete: ['address-level2']
  },
  {
    type: 'STATE',
    keywords: ['state', 'province', 'region', 'state/province'],
    exactAttributes: ['state', 'province', 'region', 'candidate_state', 'candidatestate', 'input_7_state'],
    autocomplete: ['address-level1']
  },
  {
    type: 'POSTAL_CODE',
    keywords: ['postal code', 'zip code', 'zip', 'postcode', 'pin code', 'zipcode'],
    exactAttributes: ['postal_code', 'zip_code', 'zip', 'postcode', 'pincode', 'zipcode', 'postalcode', 'input_7_postal'],
    autocomplete: ['postal-code']
  },
  {
    type: 'COUNTRY',
    keywords: ['country', 'nation', 'nationality', 'country of residence'],
    exactAttributes: ['country', 'candidate_country', 'country_code', 'candidatecountry', 'input_7_country'],
    autocomplete: ['country', 'country-name']
  },

  // ==========================================
  // PROFESSIONAL
  // ==========================================
  {
    type: 'JOB_TITLE',
    keywords: ['job title', 'desired title', 'applying for position', 'position applied for', 'role', 'job role', 'position', 'applied for', 'designation', 'role applied'],
    exactAttributes: ['job_title', 'position', 'role', 'job_role', 'applying_for', 'applied_position', 'designation', 'role_applied'],
    autocomplete: ['organization-title']
  },
  {
    type: 'COMPANY',
    keywords: ['company', 'organization', 'current organization', 'employer'],
    exactAttributes: ['company', 'organization', 'employer', 'company_name'],
    autocomplete: ['organization']
  },
  {
    type: 'CURRENT_COMPANY',
    keywords: ['current company', 'current employer', 'present company', 'most recent company'],
    exactAttributes: ['current_company', 'recent_company', 'previous_company', 'employer', 'company_name'],
    autocomplete: ['organization']
  },
  {
    type: 'CURRENT_JOB_TITLE',
    keywords: ['current title', 'current job title', 'current role', 'headline', 'current position', 'recent job title'],
    exactAttributes: ['current_title', 'headline', 'title', 'current_position', 'job_title', 'currentrole', 'current_job_title'],
    autocomplete: ['organization-title']
  },
  {
    type: 'CURRENT_TITLE',
    keywords: ['current title', 'current job title', 'current role', 'headline', 'current position', 'recent job title'],
    exactAttributes: ['current_title', 'headline', 'title', 'current_position', 'job_title', 'currentrole', 'current_job_title'],
    autocomplete: ['organization-title']
  },
  {
    type: 'YEARS_EXPERIENCE',
    keywords: [
      'years of experience', 'experience in years', 'total experience', 'years of relevant experience',
      'total years of experience', 'how many years of experience', 'years of work experience'
    ],
    exactAttributes: ['years_experience', 'experience_years', 'total_experience', 'yearsofexperience', 'experience'],
    autocomplete: []
  },
  {
    type: 'SUMMARY',
    keywords: ['summary', 'about you', 'professional summary', 'cover summary', 'bio', 'brief background', 'about yourself'],
    exactAttributes: ['summary', 'bio', 'about', 'background', 'description', 'candidate_summary'],
    autocomplete: []
  },

  // ==========================================
  // LINKS
  // ==========================================
  {
    type: 'LINKEDIN',
    keywords: ['linkedin', 'linkedin profile', 'linkedin url', 'linkedin.com', 'linkedin link'],
    exactAttributes: ['linkedin', 'linkedin_url', 'linkedin_profile', 'linkedin-url', 'candidate_linkedin'],
    autocomplete: ['url']
  },
  {
    type: 'GITHUB',
    keywords: ['github', 'github profile', 'github url', 'github.com', 'git profile'],
    exactAttributes: ['github', 'github_url', 'github_profile', 'github-url', 'candidate_github'],
    autocomplete: ['url']
  },
  {
    type: 'PORTFOLIO',
    keywords: ['portfolio', 'portfolio url', 'personal website', 'website', 'online portfolio', 'personal link'],
    exactAttributes: ['portfolio', 'portfolio_url', 'website', 'personal_url', 'portfolio-url', 'candidate_website'],
    autocomplete: ['url']
  },
  {
    type: 'WEBSITE',
    keywords: ['website', 'personal site', 'blog', 'personal webpage', 'web site'],
    exactAttributes: ['website', 'site', 'blog', 'personal_site'],
    autocomplete: ['url']
  },

  // ==========================================
  // EDUCATION
  // ==========================================
  {
    type: 'UNIVERSITY',
    keywords: ['university', 'college', 'school', 'institution', 'alma mater', 'educational institution', 'college name', 'institute', 'campus', 'engineering college', 'institution name'],
    exactAttributes: ['school', 'university', 'college', 'institution', 'education_school', 'school_name', 'college_name', 'institute', 'campus'],
    autocomplete: []
  },
  {
    type: 'COLLEGE',
    keywords: ['college', 'community college', 'institute', 'college name'],
    exactAttributes: ['college', 'community_college', 'college_name'],
    autocomplete: []
  },
  {
    type: 'DEGREE',
    keywords: ['degree', 'highest degree', 'level of education', 'degree level', 'highest level of education', 'education level'],
    exactAttributes: ['degree', 'education_degree', 'degree_level', 'highest_degree'],
    autocomplete: []
  },
  {
    type: 'FIELD_OF_STUDY',
    keywords: ['field of study', 'course', 'department', 'dept', 'branch', 'stream', 'course/department', 'major', 'discipline', 'area of study', 'specialization', 'program'],
    exactAttributes: ['field_of_study', 'course', 'department', 'dept', 'branch', 'stream', 'major', 'discipline', 'specialization', 'program'],
    autocomplete: []
  },
  {
    type: 'GRADUATION_DATE',
    keywords: ['graduation date', 'graduation year', 'year', 'current year', 'year of study', 'passout year', 'passing year', 'batch', 'year graduated', 'expected graduation', 'completion date', 'class of'],
    exactAttributes: ['graduation_date', 'graduation_year', 'grad_year', 'year_of_graduation', 'year', 'current_year', 'passout_year', 'batch'],
    autocomplete: []
  },
  {
    type: 'GPA',
    keywords: ['gpa', 'grade point average', 'cgpa', 'grades', 'academic score'],
    exactAttributes: ['gpa', 'cgpa', 'grade_point_average'],
    autocomplete: []
  },

  // ==========================================
  // APPLICATION
  // ==========================================
  {
    type: 'RESUME',
    keywords: ['resume', 'cv', 'curriculum vitae', 'upload resume', 'attach resume', 'resume/cv'],
    exactAttributes: ['resume', 'cv', 'resume_file', 'attachment', 'cv_file'],
    autocomplete: []
  },
  {
    type: 'COVER_LETTER',
    keywords: ['cover letter', 'letter of interest', 'message to hiring manager', 'additional notes', 'why are you interested'],
    exactAttributes: ['cover_letter', 'coverLetter', 'letter', 'notes', 'coverletter'],
    autocomplete: []
  },
  {
    type: 'SKILLS',
    keywords: ['skills', 'technical skills', 'core competencies', 'key skills', 'technologies', 'skill set'],
    exactAttributes: ['skills', 'technical_skills', 'key_skills', 'technologies', 'candidateskills'],
    autocomplete: []
  },

  // ==========================================
  // USER-SENSITIVE / MANUAL
  // ==========================================
  {
    type: 'WORK_AUTHORIZATION',
    keywords: ['authorized to work', 'work authorization', 'legally authorized', 'eligibility to work', 'right to work'],
    exactAttributes: ['authorized_to_work', 'work_auth', 'legally_authorized', 'work_eligibility', 'workauthorization'],
    autocomplete: []
  },
  {
    type: 'VISA_SPONSORSHIP',
    keywords: [
      'require sponsorship', 'need visa sponsorship', 'require visa', 'future sponsorship',
      'sponsorship now or in the future', 'visa sponsorship', 'will you require sponsorship'
    ],
    exactAttributes: ['require_sponsorship', 'sponsorship_required', 'visa_sponsorship', 'sponsorship'],
    autocomplete: []
  },
  {
    type: 'SPONSORSHIP_REQUIRED',
    keywords: [
      'require sponsorship', 'need visa sponsorship', 'require visa', 'future sponsorship',
      'sponsorship now or in the future', 'visa sponsorship', 'will you require sponsorship'
    ],
    exactAttributes: ['require_sponsorship', 'sponsorship_required', 'visa_sponsorship', 'sponsorship'],
    autocomplete: []
  },
  {
    type: 'SALARY_EXPECTATION',
    keywords: ['desired salary', 'expected salary', 'salary expectation', 'compensation expectation', 'target salary', 'expected comp'],
    exactAttributes: ['salary', 'expected_salary', 'desired_salary', 'compensation', 'target_salary', 'salary_expectation'],
    autocomplete: []
  },
  {
    type: 'DESIRED_SALARY',
    keywords: ['desired salary', 'expected salary', 'salary expectation', 'compensation expectation', 'target salary', 'expected comp'],
    exactAttributes: ['salary', 'expected_salary', 'desired_salary', 'compensation', 'target_salary', 'salary_expectation'],
    autocomplete: []
  },
  {
    type: 'NOTICE_PERIOD',
    keywords: ['start date', 'available start date', 'earliest start', 'notice period', 'availability', 'how soon can you start'],
    exactAttributes: ['start_date', 'earliest_start', 'available_from', 'availability', 'startdate', 'notice_period'],
    autocomplete: []
  },
  {
    type: 'DEMOGRAPHIC',
    keywords: ['gender', 'race', 'ethnicity', 'veteran status', 'disability', 'pronouns'],
    exactAttributes: ['gender', 'race', 'ethnicity', 'veteran', 'disability'],
    autocomplete: []
  },
  {
    type: 'CUSTOM_QUESTION',
    keywords: ['question', 'additional question', 'screening question', 'terms', 'privacy', 'consent', 'agree', 'policy', 'background check'],
    exactAttributes: ['custom_question', 'screening_question', 'agree_to_terms', 'terms', 'consent', 'privacy_policy'],
    autocomplete: []
  }
];

/**
 * Normalizes canonical field aliases so backend or frontend can cross-reference
 */
export function canonicalizeTaxonomyType(type: string): FieldTaxonomyType {
  const map: Record<string, FieldTaxonomyType> = {
    ADDRESS_LINE1: 'ADDRESS_LINE_1',
    SPONSORSHIP_REQUIRED: 'VISA_SPONSORSHIP',
    DESIRED_SALARY: 'SALARY_EXPECTATION',
    START_DATE: 'NOTICE_PERIOD',
    EDUCATION_SCHOOL: 'UNIVERSITY',
    COLLEGE: 'UNIVERSITY',
    EDUCATION_DEGREE: 'DEGREE',
    RECENT_COMPANY: 'CURRENT_COMPANY',
    RECENT_TITLE: 'CURRENT_JOB_TITLE',
    CURRENT_TITLE: 'CURRENT_JOB_TITLE',
    ROLE: 'JOB_TITLE'
  };

  return (map[type] || type) as FieldTaxonomyType;
}
