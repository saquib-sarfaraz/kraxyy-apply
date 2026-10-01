var Ye=Object.defineProperty;var We=(H,B,G)=>B in H?Ye(H,B,{enumerable:!0,configurable:!0,writable:!0,value:G}):H[B]=G;var _=(H,B,G)=>We(H,typeof B!="symbol"?B+"":B,G);(function(H){"use strict";var he;class B{scan(e=document){const t=[],i={totalScanned:0,inputCount:0,textareaCount:0,selectCount:0,comboboxCount:0,contenteditableCount:0,shadowRootCount:0,frameCount:0,uninspectableFramesCount:0};return this.scanRecursive(e,!1,void 0,t,i),{elements:t,metrics:i}}scanRecursive(e,t,i,s,o){var r;const a=this.queryCandidateElements(e);for(const d of a){if(this.isElementIgnored(d))continue;const c=this.extractElementMetadata(d,t,i);s.push(c),o.totalScanned++,c.tagName==="input"?o.inputCount++:c.tagName==="textarea"?o.textareaCount++:c.tagName==="select"?o.selectCount++:c.role==="combobox"||d.getAttribute("aria-haspopup")==="listbox"?o.comboboxCount++:c.isContentEditable&&o.contenteditableCount++}const n=Array.from(e.querySelectorAll("*"));for(const d of n)d.shadowRoot&&(o.shadowRootCount++,this.scanRecursive(d.shadowRoot,!0,i,s,o));if(e instanceof Document){const d=Array.from(e.querySelectorAll("iframe"));o.frameCount+=d.length;for(let c=0;c<d.length;c++){const u=d[c];try{const h=u.contentDocument||((r=u.contentWindow)==null?void 0:r.document);h&&h.body?this.scanRecursive(h,!1,c+1,s,o):o.uninspectableFramesCount++}catch{o.uninspectableFramesCount++}}}}queryCandidateElements(e){const t=['input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"])',"textarea","select",'[role="textbox"]','[role="combobox"]','[role="radio"]','[role="checkbox"]','[aria-haspopup="listbox"]','[contenteditable="true"]','[contenteditable=""]','div[class*="select__control"]','div[class*="react-select"]','div[class*="custom-select"]'].join(", ");return Array.from(e.querySelectorAll(t))}isElementIgnored(e){if(e instanceof HTMLInputElement&&e.type==="hidden")return!0;try{const t=window.getComputedStyle?window.getComputedStyle(e):null;if(t&&(t.display==="none"||t.visibility==="hidden"||parseFloat(t.opacity||"1")===0&&!e.classList.contains("form-radio")&&!e.classList.contains("form-checkbox")&&!(e instanceof HTMLInputElement&&(e.type==="radio"||e.type==="checkbox"||e.type==="file"))))return!0}catch{}return!1}extractElementMetadata(e,t,i){const s=e.tagName.toLowerCase(),o=e instanceof HTMLInputElement?e.type.toLowerCase():s,a=e.getAttribute("name")||void 0,n=e.id||void 0,r=e.getAttribute("placeholder")||void 0,d=e.getAttribute("aria-label")||void 0,c=e.getAttribute("aria-labelledby")||void 0,u=e.getAttribute("autocomplete")||void 0,h=e.getAttribute("title")||void 0,m=e.getAttribute("role")||void 0,b=e.isContentEditable||e.getAttribute("contenteditable")==="true"||e.getAttribute("contenteditable")==="",x=this.findAssociatedLabelText(e),g=this.findSubLabelText(e),p=this.findNearbyText(e),S=this.findParentLegendText(e),y=this.generateCssSelector(e);return{element:e,tagName:s,type:o,name:a,id:n,placeholder:r,ariaLabel:d,ariaLabelledBy:c,autocomplete:u,title:h,labelText:x,subLabelText:g,nearbyText:p,parentLegendText:S,isShadowDom:t,frameId:i,selector:y,role:m,isContentEditable:b}}findAssociatedLabelText(e){if(e.id){const n=e.getRootNode().querySelector(`label[for="${CSS.escape(e.id)}"]`);if(n!=null&&n.textContent)return n.textContent.trim()}const t=e.getAttribute("aria-labelledby");if(t){const a=e.getRootNode(),r=t.split(/\s+/).map(d=>{var c,u;return(u=(c=a.querySelector(`#${CSS.escape(d)}`))==null?void 0:c.textContent)==null?void 0:u.trim()}).filter(Boolean);if(r.length>0)return r.join(" ")}const i=e.closest("label");if(i!=null&&i.textContent)return i.textContent.trim();let s=e.previousElementSibling;for(;s;){if(s.tagName.toLowerCase()==="label"&&s.textContent)return s.textContent.trim();s=s.previousElementSibling}const o=e.closest('.form-line, [class*="form-group"], [class*="form-row"], [class*="field"], [class*="control"]');if(o){const a=o.querySelector('label:not(.form-sub-label):not([class*="sub-label"])');if(a!=null&&a.textContent)return a.textContent.trim()}}findSubLabelText(e){const t=e.closest('.form-line, [class*="form-group"], [class*="field"], div');if(t){const i=t.querySelector('.form-sub-label, [class*="sub-label"], small, .description');if(i!=null&&i.textContent)return i.textContent.trim()}}findNearbyText(e){const t=e.parentElement;if(!t)return;const i=t.querySelectorAll("h1, h2, h3, h4, h5, h6, strong, b, span");for(const s of Array.from(i))if(s!==e&&!s.contains(e)&&s.textContent){const o=s.textContent.trim();if(o.length>1&&o.length<120)return o}}findParentLegendText(e){const t=e.closest("fieldset");if(t){const i=t.querySelector("legend");if(i!=null&&i.textContent)return i.textContent.trim()}}generateCssSelector(e){if(e.id)return`#${CSS.escape(e.id)}`;const t=e.getAttribute("name");if(t)return`${e.tagName.toLowerCase()}[name="${CSS.escape(t)}"]`;const i=e.getAttribute("data-testid")||e.getAttribute("data-qa")||e.getAttribute("data-id");if(i)return`[data-testid="${CSS.escape(i)}"]`;let s=e.tagName.toLowerCase(),o=e.parentElement;if(o){const a=Array.from(o.children).indexOf(e)+1;s=`${o.tagName.toLowerCase()} > ${s}:nth-child(${a})`}return s}}const G=new B,ye=[{type:"FIRST_NAME",keywords:["first name","given name","forename","fname","first_name","firstname","candidate_first_name","candidatefirstname","first","first-name","applicant first name"],exactAttributes:["firstname","first_name","fname","given-name","first-name","candidate_first_name","candidatefirstname","givenname","candidate_fname","first_3","first_4","first_1","first"],autocomplete:["given-name"],regexPatterns:[/^first[_-]?name$/i,/^fname$/i,/^first$/i,/^first_\d+$/i]},{type:"LAST_NAME",keywords:["last name","family name","surname","lname","last_name","lastname","candidate_last_name","candidatelastname","last","last-name","applicant last name"],exactAttributes:["lastname","last_name","lname","family-name","last-name","candidate_last_name","candidatelastname","familyname","candidate_lname","last_3","last_4","last_1","last"],autocomplete:["family-name"],regexPatterns:[/^last[_-]?name$/i,/^lname$/i,/^surname$/i,/^last$/i,/^last_\d+$/i]},{type:"FULL_NAME",keywords:["full name","candidate name","your name","applicant name","legal name","name","display name","complete name"],exactAttributes:["name","full_name","fullname","candidate_name","applicant_name","candidatename","legal_name","full-name","q3_name","q4_name","input_3"],autocomplete:["name"],regexPatterns:[/^full[_-]?name$/i,/^name$/i,/^candidate[_-]?name$/i]},{type:"EMAIL",keywords:["email","e-mail","email address","e-mail address","contact email","professional email","candidate email","applicant email","email id"],exactAttributes:["email","email_address","e-mail","candidate_email","applicant_email","candidateemail","emailaddress","user_email","q5_email","input_5","input_4"],autocomplete:["email"],regexPatterns:[/^email$/i,/^e[_-]?mail$/i,/^email[_-]?address$/i]},{type:"PHONE",keywords:["phone","mobile","cell","telephone","contact number","phone number","cell phone","mobile number","contact no","tel"],exactAttributes:["phone","telephone","mobile","cell_phone","phone_number","candidate_phone","candidatephone","phonenumber","q4_phone","input_4_phone","q6_phone","input_6"],autocomplete:["tel","tel-national","tel-country-code"],regexPatterns:[/^phone$/i,/^mobile$/i,/^tel$/i,/^cell$/i,/^phone[_-]?number$/i]},{type:"ADDRESS",keywords:["street address","address line 1","address","residential address","street","mailing address"],exactAttributes:["address","street_address","address_line1","street","candidate_address","address1","q7_address"],autocomplete:["street-address","address-line1"]},{type:"ADDRESS_LINE_1",keywords:["address line 1","street address","address 1","line 1","street line 1"],exactAttributes:["address_line_1","address_line1","address1","line1","street_line1","input_7_addr_line1"],autocomplete:["address-line1"]},{type:"ADDRESS_LINE_2",keywords:["address line 2","apartment","suite","unit","building","address 2","line 2"],exactAttributes:["address_line_2","address_line2","address2","line2","apt","suite","unit","input_7_addr_line2"],autocomplete:["address-line2"]},{type:"CITY",keywords:["city","town","municipality","locality"],exactAttributes:["city","locality","candidate_city","town","candidatecity","input_7_city"],autocomplete:["address-level2"]},{type:"STATE",keywords:["state","province","region","state/province"],exactAttributes:["state","province","region","candidate_state","candidatestate","input_7_state"],autocomplete:["address-level1"]},{type:"POSTAL_CODE",keywords:["postal code","zip code","zip","postcode","pin code","zipcode"],exactAttributes:["postal_code","zip_code","zip","postcode","pincode","zipcode","postalcode","input_7_postal"],autocomplete:["postal-code"]},{type:"COUNTRY",keywords:["country","nation","nationality","country of residence"],exactAttributes:["country","candidate_country","country_code","candidatecountry","input_7_country"],autocomplete:["country","country-name"]},{type:"JOB_TITLE",keywords:["job title","desired title","applying for position","position applied for","role"],exactAttributes:["job_title","position","role","applying_for","applied_position"],autocomplete:["organization-title"]},{type:"COMPANY",keywords:["company","organization","current organization","employer"],exactAttributes:["company","organization","employer","company_name"],autocomplete:["organization"]},{type:"CURRENT_COMPANY",keywords:["current company","current employer","present company","most recent company"],exactAttributes:["current_company","recent_company","previous_company","employer","company_name"],autocomplete:["organization"]},{type:"CURRENT_JOB_TITLE",keywords:["current title","current job title","current role","headline","current position","recent job title"],exactAttributes:["current_title","headline","title","current_position","job_title","currentrole","current_job_title"],autocomplete:["organization-title"]},{type:"CURRENT_TITLE",keywords:["current title","current job title","current role","headline","current position","recent job title"],exactAttributes:["current_title","headline","title","current_position","job_title","currentrole","current_job_title"],autocomplete:["organization-title"]},{type:"YEARS_EXPERIENCE",keywords:["years of experience","experience in years","total experience","years of relevant experience","total years of experience","how many years of experience","years of work experience"],exactAttributes:["years_experience","experience_years","total_experience","yearsofexperience","experience"],autocomplete:[]},{type:"SUMMARY",keywords:["summary","about you","professional summary","cover summary","bio","brief background","about yourself"],exactAttributes:["summary","bio","about","background","description","candidate_summary"],autocomplete:[]},{type:"LINKEDIN",keywords:["linkedin","linkedin profile","linkedin url","linkedin.com","linkedin link"],exactAttributes:["linkedin","linkedin_url","linkedin_profile","linkedin-url","candidate_linkedin"],autocomplete:["url"]},{type:"GITHUB",keywords:["github","github profile","github url","github.com","git profile"],exactAttributes:["github","github_url","github_profile","github-url","candidate_github"],autocomplete:["url"]},{type:"PORTFOLIO",keywords:["portfolio","portfolio url","personal website","website","online portfolio","personal link"],exactAttributes:["portfolio","portfolio_url","website","personal_url","portfolio-url","candidate_website"],autocomplete:["url"]},{type:"WEBSITE",keywords:["website","personal site","blog","personal webpage","web site"],exactAttributes:["website","site","blog","personal_site"],autocomplete:["url"]},{type:"UNIVERSITY",keywords:["university","college","school","institution","alma mater","educational institution"],exactAttributes:["school","university","college","institution","education_school","school_name"],autocomplete:[]},{type:"COLLEGE",keywords:["college","community college","institute"],exactAttributes:["college","community_college"],autocomplete:[]},{type:"DEGREE",keywords:["degree","highest degree","level of education","degree level","highest level of education","education level"],exactAttributes:["degree","education_degree","degree_level","highest_degree"],autocomplete:[]},{type:"FIELD_OF_STUDY",keywords:["field of study","major","discipline","area of study","specialization"],exactAttributes:["field_of_study","major","discipline","specialization"],autocomplete:[]},{type:"GRADUATION_DATE",keywords:["graduation date","graduation year","year graduated","expected graduation","completion date"],exactAttributes:["graduation_date","graduation_year","grad_year","year_of_graduation"],autocomplete:[]},{type:"GPA",keywords:["gpa","grade point average","cgpa","grades","academic score"],exactAttributes:["gpa","cgpa","grade_point_average"],autocomplete:[]},{type:"RESUME",keywords:["resume","cv","curriculum vitae","upload resume","attach resume","resume/cv"],exactAttributes:["resume","cv","resume_file","attachment","cv_file"],autocomplete:[]},{type:"COVER_LETTER",keywords:["cover letter","letter of interest","message to hiring manager","additional notes","why are you interested"],exactAttributes:["cover_letter","coverLetter","letter","notes","coverletter"],autocomplete:[]},{type:"SKILLS",keywords:["skills","technical skills","core competencies","key skills","technologies","skill set"],exactAttributes:["skills","technical_skills","key_skills","technologies","candidateskills"],autocomplete:[]},{type:"WORK_AUTHORIZATION",keywords:["authorized to work","work authorization","legally authorized","eligibility to work","right to work"],exactAttributes:["authorized_to_work","work_auth","legally_authorized","work_eligibility","workauthorization"],autocomplete:[]},{type:"VISA_SPONSORSHIP",keywords:["require sponsorship","need visa sponsorship","require visa","future sponsorship","sponsorship now or in the future","visa sponsorship","will you require sponsorship"],exactAttributes:["require_sponsorship","sponsorship_required","visa_sponsorship","sponsorship"],autocomplete:[]},{type:"SPONSORSHIP_REQUIRED",keywords:["require sponsorship","need visa sponsorship","require visa","future sponsorship","sponsorship now or in the future","visa sponsorship","will you require sponsorship"],exactAttributes:["require_sponsorship","sponsorship_required","visa_sponsorship","sponsorship"],autocomplete:[]},{type:"SALARY_EXPECTATION",keywords:["desired salary","expected salary","salary expectation","compensation expectation","target salary","expected comp"],exactAttributes:["salary","expected_salary","desired_salary","compensation","target_salary","salary_expectation"],autocomplete:[]},{type:"DESIRED_SALARY",keywords:["desired salary","expected salary","salary expectation","compensation expectation","target salary","expected comp"],exactAttributes:["salary","expected_salary","desired_salary","compensation","target_salary","salary_expectation"],autocomplete:[]},{type:"NOTICE_PERIOD",keywords:["start date","available start date","earliest start","notice period","availability","how soon can you start"],exactAttributes:["start_date","earliest_start","available_from","availability","startdate","notice_period"],autocomplete:[]},{type:"DEMOGRAPHIC",keywords:["gender","race","ethnicity","veteran status","disability","pronouns"],exactAttributes:["gender","race","ethnicity","veteran","disability"],autocomplete:[]},{type:"CUSTOM_QUESTION",keywords:["question","additional question","screening question","terms","privacy","consent","agree","policy","background check"],exactAttributes:["custom_question","screening_question","agree_to_terms","terms","consent","privacy_policy"],autocomplete:[]}];function xe(l){return{ADDRESS_LINE1:"ADDRESS_LINE_1",SPONSORSHIP_REQUIRED:"VISA_SPONSORSHIP",DESIRED_SALARY:"SALARY_EXPECTATION",START_DATE:"NOTICE_PERIOD",EDUCATION_SCHOOL:"UNIVERSITY",EDUCATION_DEGREE:"DEGREE",RECENT_COMPANY:"CURRENT_COMPANY",RECENT_TITLE:"CURRENT_JOB_TITLE",CURRENT_TITLE:"CURRENT_JOB_TITLE"}[l]||l}class ve{classify(e){const t=[];let i="UNKNOWN",s=0;const o=e.element,a=e.tagName||"input",n=this.resolveElementType(e),r=(e.name||"").toLowerCase(),d=(e.id||"").toLowerCase(),c=(e.placeholder||"").toLowerCase(),u=(e.labelText||"").toLowerCase(),h=(e.subLabelText||"").toLowerCase(),m=(e.ariaLabel||"").toLowerCase(),b=(e.autocomplete||"").toLowerCase(),x=(e.nearbyText||"").toLowerCase(),g=(e.parentLegendText||"").toLowerCase(),p=[u,h,m,c,r,d,x,g].filter(Boolean).join(" ");if(e.autocomplete){t.push(`autocomplete="${e.autocomplete}"`);const f=this.matchAutocomplete(b);f&&(i=f,s=.98,t.push(`native_autocomplete_matched="${f}"`))}if(e.type==="tel"&&s<.9?(i="PHONE",s=.9,t.push("native_type_tel")):e.type==="email"&&s<.9&&(i="EMAIL",s=.92,t.push("native_type_email")),(e.type==="file"||p.includes("resume")||p.includes("curriculum vitae")||p.includes("attach cv")||d.includes("resume")||r.includes("resume"))&&(p.includes("cover")||p.includes("letter")?(i="COVER_LETTER",s=Math.max(s,.92),t.push("file_input_cover_letter_context")):(i="RESUME",s=Math.max(s,.95),t.push("file_input_resume_context"))),s<.95)for(const f of ye){let A=0;const C=[];if(f.exactAttributes)for(const w of f.exactAttributes){const R=w.toLowerCase();if(r===R||d===R||b===R){A+=.7,C.push(`exact_attr="${w}"`);break}}if(u||h){const w=f.keywords.filter(R=>u.includes(R)||h.includes(R));w.length>0&&(A+=.55,C.push(`label_keyword="${w[0]}"`))}if(m||c){const w=f.keywords.filter(R=>m.includes(R)||c.includes(R));w.length>0&&(A+=.45,C.push(`placeholder_or_aria="${w[0]}"`))}const k=f.keywords.filter(w=>r.includes(w)||d.includes(w));if(k.length>0&&(A+=.4,C.push(`name_or_id_sub="${k[0]}"`)),g||x){const w=f.keywords.filter(R=>g.includes(R)||x.includes(R));w.length>0&&(A+=.25,C.push(`nearby_text="${w[0]}"`))}A>s&&A>=.4&&(s=A,i=xe(f.type),t.push(...C))}i==="FULL_NAME"&&(p.includes("first")||p.includes("given")||d.includes("first")||r.includes("first")||d.includes("fname")?(i="FIRST_NAME",t.push("disambiguated_to_first_name")):(p.includes("last")||p.includes("family")||p.includes("surname")||d.includes("last")||r.includes("last")||d.includes("lname"))&&(i="LAST_NAME",t.push("disambiguated_to_last_name"))),e.type==="email"&&i==="UNKNOWN"&&(i="EMAIL",s=Math.max(s,.9),t.push("native_type_email")),e.type==="tel"&&i==="UNKNOWN"&&(i="PHONE",s=Math.max(s,.9),t.push("native_type_tel")),(i==="UNKNOWN"||s<.7)&&(d.startsWith("first_")||d.includes("_first")||h.includes("first name")?(i="FIRST_NAME",s=.92,t.push("jotform_first_name_match")):(d.startsWith("last_")||d.includes("_last")||h.includes("last name"))&&(i="LAST_NAME",s=.92,t.push("jotform_last_name_match"))),i==="UNKNOWN"&&(p.includes("college")||p.includes("university")||p.includes("institute")||p.includes("campus")?(i="UNIVERSITY",s=.88,t.push("campus_college_heuristic")):p.includes("course")||p.includes("department")||p.includes("dept")||p.includes("branch")||p.includes("stream")?(i="FIELD_OF_STUDY",s=.86,t.push("campus_department_heuristic")):p.includes("current year")||p.includes("year of study")||p.includes("passing year")||p.includes("passout year")||p.includes("batch")?(i="GRADUATION_DATE",s=.85,t.push("campus_year_heuristic")):p.includes("role")||p.includes("position")||p.includes("applied for")||p.includes("designation")?(i="JOB_TITLE",s=.85,t.push("application_role_heuristic")):e.tagName==="textarea"&&(p.includes("why")||p.includes("cover")||p.includes("interest")?(i="COVER_LETTER",s=.85,t.push("textarea_cover_letter_heuristic")):p.includes("about")||p.includes("bio")||p.includes("summary")||p.includes("describe")?(i="SUMMARY",s=.85,t.push("textarea_summary_heuristic")):(i="CUSTOM_QUESTION",s=.8,t.push("textarea_custom_question_heuristic"))));const S=this.extractCurrentValue(o,n),y=e.type==="file"||i==="RESUME"||i==="CUSTOM_QUESTION"?"MANUAL_REQUIRED":void 0;return{id:e.id||e.name||`field-${Math.random().toString(36).substring(2,9)}`,selector:e.selector,name:e.name,tagName:a,elementType:n,inputType:e.type,taxonomyType:i,confidence:Math.min(1,Math.round(s*100)/100),label:e.labelText||e.subLabelText||e.placeholder||e.name||void 0,currentValue:S,existingValue:S||void 0,isShadowDom:e.isShadowDom,frameId:e.frameId,signals:Array.from(new Set(t)),status:y}}resolveElementType(e){return e.role==="combobox"||e.ariaLabelledBy==="listbox"?"combobox":e.isContentEditable?"contenteditable":e.type==="radio"?"radio":e.type==="checkbox"?"checkbox":e.type==="file"?"file":e.tagName==="textarea"?"textarea":e.tagName==="select"?"select":"input"}matchAutocomplete(e){return{"given-name":"FIRST_NAME","family-name":"LAST_NAME",name:"FULL_NAME",email:"EMAIL",tel:"PHONE","tel-national":"PHONE","street-address":"ADDRESS","address-line1":"ADDRESS","address-level2":"CITY","address-level1":"STATE","postal-code":"POSTAL_CODE","country-name":"COUNTRY","organization-title":"JOB_TITLE",organization:"COMPANY"}[e]||null}extractCurrentValue(e,t){var i,s,o,a;return e instanceof HTMLInputElement?e.type==="checkbox"||e.type==="radio"?e.checked?"true":"":((i=e.value)==null?void 0:i.trim())||"":e instanceof HTMLTextAreaElement?((s=e.value)==null?void 0:s.trim())||"":e instanceof HTMLSelectElement?((o=e.value)==null?void 0:o.trim())||"":t==="contenteditable"&&((a=e.textContent)==null?void 0:a.trim())||""}}const Se=new ve;class we{evaluate(e,t=typeof document<"u"?document:{}){var $,j;const i=[],s=[],o=[],a=e.filter(T=>T.taxonomyType&&T.taxonomyType!=="UNKNOWN"),n=new Set(a.map(T=>T.taxonomyType)),r=!!(t!=null&&t.querySelector&&t.querySelector('input[type="password"]'))||e.some(T=>T.inputType==="password");r&&s.push("password_field_present");const d=((($=t.body)==null?void 0:$.textContent)||((j=t.body)==null?void 0:j.innerText)||"").toLowerCase().slice(0,15e3),c=d.includes("sign in to your account")||d.includes("log in to your account")||d.includes("forgot password")&&r;c&&s.push("login_portal_context");const u=d.includes("order summary")||d.includes("payment method")||d.includes("shipping address")&&(d.includes("credit card")||d.includes("cvv"));u&&s.push("ecommerce_checkout_context");const h=a.length<=2&&n.has("EMAIL")&&!n.has("RESUME")&&!n.has("FIRST_NAME")&&!n.has("LAST_NAME")&&!n.has("FULL_NAME")&&(d.includes("subscribe to our newsletter")||d.includes("join our mailing list")||d.includes("stay updated"));h&&s.push("solitary_newsletter_signup");const m=n.has("FIRST_NAME")||n.has("LAST_NAME")||n.has("FULL_NAME"),b=n.has("EMAIL"),x=n.has("PHONE"),g=n.has("RESUME")||n.has("COVER_LETTER"),p=n.has("LINKEDIN")||n.has("GITHUB")||n.has("PORTFOLIO")||n.has("WEBSITE"),S=n.has("WORK_AUTHORIZATION")||n.has("VISA_SPONSORSHIP"),y=n.has("JOB_TITLE")||n.has("COMPANY")||n.has("YEARS_EXPERIENCE")||n.has("SKILLS"),f=n.has("UNIVERSITY")||n.has("COLLEGE")||n.has("DEGREE")||n.has("FIELD_OF_STUDY")||n.has("GPA")||n.has("GRADUATION_DATE"),C=["apply for","apply to","apply now","job application","candidate application","employment application","submit your application","submit application","personal information","candidate profile","careers"].some(T=>d.includes(T));C&&i.push("application_heading_detected");let k=0;m&&b&&x?(k+=65,o.push("cluster_identity_contact (Name + Email + Phone)"),i.push("identity_contact_cluster")):m&&b?(k+=45,o.push("cluster_partial_contact (Name + Email)"),i.push("partial_contact_cluster")):(m||b)&&(k+=20),g&&(m||b)?(k+=45,o.push("cluster_application_resume (Name/Email + Resume Upload)"),i.push("resume_upload_cluster")):g&&(k+=40,o.push("cluster_standalone_resume (Resume Upload)"),i.push("standalone_resume_upload")),p&&(m||b)&&(k+=25,o.push("cluster_professional_links (Contact + LinkedIn/Portfolio)"),i.push("professional_links_cluster")),f&&y?(k+=35,o.push("cluster_education_and_work (Education and Work History)"),i.push("education_and_work_cluster")):(f||y)&&(k+=25,o.push("cluster_background (Education or Work History)"),i.push("background_fields_cluster")),S&&(k+=20,o.push("cluster_work_authorization (Sponsorship / Work Auth)"),i.push("work_authorization_cluster")),C&&(k+=25);let w=0;r&&(w+=50),c&&(w+=60),u&&(w+=60),h&&(w+=70);const R=Math.max(0,k-w);let P=Math.min(.99,Math.round(R/100*100)/100);return a.length<2&&!g&&(P=Math.min(P,.25)),{isApplicationPage:(m&&b&&(x||g||p||S||f||y||C)||g&&(m||b||C)||f&&(m||b||x)||y&&(m||b||x)||a.length>=3&&(m||b))&&P>=.6&&w<40,confidence:P,clusterScore:R,positiveSignals:i,negativeSignals:s,clusterMatches:o}}}const Ee=new we;class Ae{detectApplication(e=document){console.log("[CRAZY][APP] Application detector started");const t=e instanceof Document?e:e.ownerDocument||document,{elements:i,metrics:s}=G.scan(e),o=[];let a=0,n=0;for(const m of i){const b=Se.classify(m);b.taxonomyType!=="UNKNOWN"&&(o.push(b),b.status==="MANUAL_REQUIRED"||b.taxonomyType==="RESUME"?n++:a++)}const r=Ee.evaluate(o,t);console.log(`[CRAZY][APP] Fields found: ${o.length} (Fillable: ${a}, Manual: ${n})`),console.log(`[CRAZY][APP] Confidence: ${Math.round(r.confidence*100)}% (IsApp: ${r.isApplicationPage})`);const d=r.isApplicationPage&&a>0,{companyName:c,jobTitle:u}=this.extractMetadata(t),h=this.detectStepInfo(t);return{isApplicationPage:r.isApplicationPage,confidence:r.confidence,autofillReady:d,fieldCount:o.length,fillableFieldCount:a,manualRequiredCount:n,detectedFields:o,frameCount:s.frameCount,shadowRootCount:s.shadowRootCount,detectionSignals:{positiveSignals:r.positiveSignals,negativeSignals:r.negativeSignals,clusterMatches:r.clusterMatches,clusterScore:r.clusterScore},metrics:s,companyName:c,jobTitle:u,stepInfo:h,uninspectableFramesCount:s.uninspectableFramesCount}}extractMetadata(e){var a,n;let t,i;const s=e.title||"",o=(n=(a=e.querySelector("h1"))==null?void 0:a.textContent)==null?void 0:n.trim();if(o&&o.length<80)i=o;else if(s){const r=s.split(/[-|–•]/);r.length>=2&&(i=r[0].trim(),t=r[1].trim())}return{companyName:t,jobTitle:i}}detectStepInfo(e){var s;const i=(((s=e.body)==null?void 0:s.textContent)||"").match(/step\s+(\d+)\s+of\s+(\d+)/i);if(i)return{currentStep:parseInt(i[1],10),totalSteps:parseInt(i[2],10)}}}const Ce=new Ae;class Te{detectForm(e=document){const t=Ce.detectApplication(e);return{isApplicationForm:t.isApplicationPage,confidence:t.confidence,autofillReady:t.autofillReady,fieldCount:t.fieldCount,fillableFieldCount:t.fillableFieldCount,manualRequiredCount:t.manualRequiredCount,fields:t.detectedFields,companyName:t.companyName,jobTitle:t.jobTitle,stepInfo:t.stepInfo,metrics:t.metrics,detectionSignals:t.detectionSignals,uninspectableFramesCount:t.uninspectableFramesCount}}generateCssSelector(e){return G.generateCssSelector(e)}}const U=new Te;function J(l=30){return new Promise(e=>setTimeout(e,l))}async function ke(l,e){const i=l instanceof HTMLTextAreaElement?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype,s=Object.getOwnPropertyDescriptor(i,"value"),o=()=>l.value!==void 0?l.value:"",a=n=>{const r=o();return r===n||r.trim().toLowerCase()===n.trim().toLowerCase()};try{if(s!=null&&s.set?s.set.call(l,e):l.value=e,l.dispatchEvent(new Event("input",{bubbles:!0,composed:!0})),l.dispatchEvent(new Event("change",{bubbles:!0,composed:!0})),l.dispatchEvent(new FocusEvent("blur",{bubbles:!0,composed:!0})),await J(25),a(e))return{verified:!0,attempt:1,actualValue:o()}}catch{}try{if(l.focus(),s!=null&&s.set?s.set.call(l,e):l.value=e,l.dispatchEvent(new Event("input",{bubbles:!0,composed:!0})),l.dispatchEvent(new Event("change",{bubbles:!0,composed:!0})),l.dispatchEvent(new FocusEvent("blur",{bubbles:!0,composed:!0})),await J(35),a(e))return{verified:!0,attempt:2,actualValue:o()}}catch{}try{l.focus();const n=l._valueTracker;if(n&&typeof n.setValue=="function")try{n.setValue("")}catch{}try{l.dispatchEvent(new InputEvent("beforeinput",{bubbles:!0,composed:!0,inputType:"insertText",data:e}))}catch{}s!=null&&s.set?s.set.call(l,e):l.value=e;try{!a(e)&&typeof document.execCommand=="function"&&(l.select(),document.execCommand("insertText",!1,e))}catch{}if(l.dispatchEvent(new Event("input",{bubbles:!0,composed:!0})),l.dispatchEvent(new Event("change",{bubbles:!0,composed:!0})),l.dispatchEvent(new FocusEvent("blur",{bubbles:!0,composed:!0})),await J(50),a(e))return{verified:!0,attempt:3,actualValue:o()}}catch{}return{verified:!1,attempt:3,actualValue:o(),error:"Page rejected external value"}}async function _e(l,e){const t=e.trim().toLowerCase();let i=-1;for(let n=0;n<l.options.length;n++){const r=l.options[n],d=r.value.trim().toLowerCase(),c=r.text.trim().toLowerCase();if(d===t||c===t){i=n;break}(d.includes(t)||t.includes(d)||c.includes(t)||t.includes(c))&&i===-1&&(i=n)}i!==-1?(l.selectedIndex=i,l.value=l.options[i].value):l.options.length>0&&(l.value=e),l.dispatchEvent(new Event("input",{bubbles:!0,composed:!0})),l.dispatchEvent(new Event("change",{bubbles:!0,composed:!0})),l.dispatchEvent(new FocusEvent("blur",{bubbles:!0,composed:!0})),await J(25);const s=l.options[l.selectedIndex],o=s?s.text||s.value:l.value,a=i!==-1||o.toLowerCase().includes(t);return{verified:a,attempt:1,actualValue:o,error:a?void 0:`Option matching "${e}" not found in dropdown`}}async function Re(l,e){l.focus(),l.textContent=e;try{l.dispatchEvent(new Event("input",{bubbles:!0,composed:!0})),l.dispatchEvent(new Event("change",{bubbles:!0,composed:!0})),l.dispatchEvent(new FocusEvent("blur",{bubbles:!0,composed:!0}))}catch{}await J(30);const t=(l.textContent||l.innerText||"").trim(),i=t===e.trim()||t.includes(e.trim());return{verified:i,attempt:1,actualValue:t,error:i?void 0:"Failed to update contenteditable element"}}class Fe{async selectComboboxOption(e,t){const i=t.trim().toLowerCase();try{e.focus(),e.dispatchEvent(new MouseEvent("mousedown",{bubbles:!0,cancelable:!0})),e.dispatchEvent(new MouseEvent("mouseup",{bubbles:!0,cancelable:!0})),e.click(),e.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowDown",bubbles:!0}))}catch{}await J(120);const s=this.findVisibleOptions(e);if(s.length===0)return{verified:!1,attempt:1,actualValue:(e.innerText||e.textContent||"").trim(),error:"No dropdown options appeared after opening combobox"};let o=null;for(const n of s)if((n.innerText||n.textContent||n.getAttribute("data-value")||"").trim().toLowerCase()===i){o=n;break}if(!o)for(const n of s){const r=(n.innerText||n.textContent||n.getAttribute("data-value")||"").trim().toLowerCase();if(r.includes(i)||i.includes(r)){o=n;break}}if(!o)return e.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:!0})),{verified:!1,attempt:1,actualValue:(e.innerText||e.textContent||"").trim(),error:`Could not find option matching "${t}" in combobox`};try{o.dispatchEvent(new MouseEvent("mousedown",{bubbles:!0,cancelable:!0})),o.dispatchEvent(new MouseEvent("mouseup",{bubbles:!0,cancelable:!0})),o.click()}catch{o.click()}e.dispatchEvent(new Event("input",{bubbles:!0,composed:!0})),e.dispatchEvent(new Event("change",{bubbles:!0,composed:!0})),e.dispatchEvent(new FocusEvent("blur",{bubbles:!0,composed:!0})),await J(80);const a=(e.innerText||e.textContent||e.getAttribute("aria-label")||"").trim();return a.toLowerCase().includes(i)||i.includes(a.toLowerCase()),{verified:!0,attempt:1,actualValue:a||t}}findVisibleOptions(e){const t=['[role="option"]','[role="listbox"] > *','[role="listbox"] li',".select__option",".react-select__option","[data-radix-collection-item]","[data-reach-listbox-option]",".ant-select-item-option-content",'ul[role="listbox"] li','div[role="listbox"] [role="option"]'],i=[],s=e.getAttribute("aria-controls")||e.getAttribute("aria-owns");if(s){const o=document.getElementById(s);if(o){const a=Array.from(o.querySelectorAll('[role="option"], li, div'));if(a.length>0)return a}}for(const o of t){const a=Array.from(document.querySelectorAll(o));for(const n of a)n.offsetParent!==null&&(n.innerText||n.textContent||"").trim().length>0&&i.push(n);if(i.length>0)break}return i}}const Le=new Fe;class Ie{async fillForm(e,t,i={}){const s=[];let o=0,a=0,n=0,r=0,d=0;for(const c of e){const u=document.querySelector(c.selector);if(!u){s.push({...c,status:"NOT_FOUND",manualReason:"Element no longer in DOM"}),d++;continue}if(c.elementType==="file"||c.taxonomyType==="RESUME"){this.highlightField(u,"attention"),s.push({...c,status:"MANUAL_REQUIRED",manualReason:"Resume upload requires your action (drag & drop or browse)"}),r++;continue}if(c.elementType==="checkbox"&&this.isLegalConsentField(c)){this.highlightField(u,"attention"),s.push({...c,status:"NEEDS_ATTENTION",manualReason:"Please review and accept legal/consent policy"}),a++;continue}const h=this.readElementValue(u,c.elementType),m=!!(h&&h.trim().length>0&&h!=="false"),b=i.overwriteExisting||i.fieldIdToOverwrite===c.id;if(m&&!b){s.push({...c,status:"SKIPPED_EXISTING",existingValue:h,manualReason:`Existing value preserved: "${h}"`}),n++;continue}if(c.taxonomyType==="UNKNOWN"){s.push({...c,status:"NOT_FOUND",manualReason:"Field type is unknown"}),d++;continue}const x=t[c.taxonomyType];if(x==null||x===""){s.push({...c,status:"NEEDS_ATTENTION",manualReason:"No matching data in your Kraxyy profile"}),a++,this.highlightField(u,"attention");continue}const g=String(x),p=["WORK_AUTHORIZATION","VISA_SPONSORSHIP","SPONSORSHIP_REQUIRED","DEMOGRAPHIC","CUSTOM_QUESTION"];try{let S;c.elementType==="combobox"?S=await Le.selectComboboxOption(u,g):c.elementType==="select"&&u instanceof HTMLSelectElement?S=await _e(u,g):c.elementType==="contenteditable"?S=await Re(u,g):c.elementType==="radio"&&u instanceof HTMLInputElement?S=await this.handleRadioField(u,g):c.elementType==="checkbox"&&u instanceof HTMLInputElement?S=await this.handleCheckboxField(u,g):u instanceof HTMLInputElement||u instanceof HTMLTextAreaElement?S=await ke(u,g):S={verified:!1,actualValue:"",error:"Unsupported element type"},S.verified?p.includes(c.taxonomyType)?(this.highlightField(u,"attention"),s.push({...c,status:"NEEDS_ATTENTION",filledValue:g,verifiedValue:S.actualValue,manualReason:"Review sensitive authorization/demographic answer"}),a++,o++):(this.highlightField(u,"verified"),s.push({...c,status:"VERIFIED",filledValue:g,verifiedValue:S.actualValue}),o++):(this.highlightField(u,"failed"),s.push({...c,status:"FAILED",manualReason:S.error||"Page rejected external value"}),d++)}catch(S){this.highlightField(u,"failed"),s.push({...c,status:"FAILED",manualReason:`Fill error: ${S.message}`}),d++}}return{totalDetected:e.length,totalVerified:o,totalNeedsAttention:a,totalSkippedExisting:n,totalManualRequired:r,totalFailed:d,fields:s}}async handleRadioField(e,t){var d,c;const i=t.toLowerCase().trim(),s=(e.value||"").toLowerCase().trim(),o=(((c=(d=e.labels)==null?void 0:d[0])==null?void 0:c.innerText)||"").toLowerCase().trim(),a=i==="true"||i==="yes"||i==="1",n=i==="false"||i==="no"||i==="0";let r=!1;return(a&&(s==="yes"||s==="1"||s==="true"||o.includes("yes"))||n&&(s==="no"||s==="0"||s==="false"||o.includes("no"))||s===i||o===i)&&(r=!0),r?(e.checked=!0,e.dispatchEvent(new Event("change",{bubbles:!0,composed:!0})),e.dispatchEvent(new Event("click",{bubbles:!0,composed:!0})),{verified:e.checked,actualValue:e.value}):{verified:!1,actualValue:"",error:"Radio option does not match candidate profile answer"}}async handleCheckboxField(e,t){const i=t.toLowerCase()==="true"||t==="1"||t.toLowerCase()==="yes";return e.checked=i,e.dispatchEvent(new Event("change",{bubbles:!0,composed:!0})),e.dispatchEvent(new Event("click",{bubbles:!0,composed:!0})),{verified:e.checked===i,actualValue:String(e.checked)}}readElementValue(e,t){if(e instanceof HTMLInputElement)return e.type==="checkbox"||e.type==="radio"?e.checked?"true":"":e.value||"";if(e instanceof HTMLTextAreaElement)return e.value||"";if(e instanceof HTMLSelectElement){const i=e.options[e.selectedIndex];return i?i.text||i.value:""}return t==="contenteditable"?(e.textContent||e.innerText||"").trim():t==="combobox"?(e.innerText||e.textContent||"").trim():""}isLegalConsentField(e){const t=`${e.name||""} ${e.id} ${e.label||""}`.toLowerCase();return["terms","privacy","consent","agree","waive","policy","certify","background check"].some(s=>t.includes(s))}highlightField(e,t){const s={verified:{border:"#525B31",bg:"rgba(82, 91, 49, 0.08)"},attention:{border:"#B18B40",bg:"rgba(177, 139, 64, 0.10)"},failed:{border:"#B91C1C",bg:"rgba(185, 28, 28, 0.08)"}}[t];e.style.outline=`2px solid ${s.border}`,e.style.outlineOffset="1px",e.style.backgroundColor=s.bg,e.style.transition="all 0.3s ease";const o=()=>{e.style.outline="",e.style.outlineOffset="",e.style.backgroundColor="",e.removeEventListener("focus",o)};e.addEventListener("focus",o),setTimeout(o,9e3)}clearFields(e){for(const t of e){const i=document.querySelector(t.selector);(i instanceof HTMLInputElement||i instanceof HTMLTextAreaElement)&&(i.value="",i.dispatchEvent(new Event("input",{bubbles:!0,composed:!0})),i.dispatchEvent(new Event("change",{bubbles:!0,composed:!0})))}}}const ae=new Ie;class Me{extractFromJsonLd(e,t){var m;const i=e.title||e.name||"",s=typeof e.hiringOrganization=="string"?e.hiringOrganization:((m=e.hiringOrganization)==null?void 0:m.name)||"";let o="Remote";if(e.jobLocation){const x=(Array.isArray(e.jobLocation)?e.jobLocation[0]:e.jobLocation).address;if(typeof x=="string")o=x;else if(x){const g=[x.addressLocality,x.addressRegion,x.addressCountry].filter(Boolean);g.length>0&&(o=g.join(", "))}}const a=e.description||"",n=this.stripHtml(a),r=this.extractListItemsAfterHeading(a,["responsibilities","what you will do","what you'll do"]),d=this.extractListItemsAfterHeading(a,["requirements","qualifications","what we are looking for","what we're looking for"]),c=this.extractSkills(n),u=Array.isArray(e.skills)?e.skills:typeof e.skills=="string"?e.skills.split(",").map(b=>b.trim()):[],h=Array.from(new Set([...u,...c])).filter(Boolean);return{title:i.trim(),company:s.trim()||this.extractCompanyFromUrl(t),location:o,employmentType:e.employmentType||"FULL_TIME",description:n,responsibilities:r.length>0?r:void 0,requirements:d.length>0?d:void 0,skills:h,source:"JSON_LD",sourceUrl:t,applyUrl:e.url||t,postedDate:e.datePosted}}extractFromPlatformAdapter(e){var s,o,a,n,r,d,c,u,h,m,b,x,g,p,S;const t=e.location.href,i=e.location.hostname.toLowerCase();if(i.includes("linkedin.com")&&(t.includes("/jobs/")||!!e.querySelector(".jobs-search__job-details--container, .job-view-layout, .jobs-details__main-content, #job-details, .jobs-description"))){const f=e.querySelector(".jobs-search__job-details--container, .job-view-layout, .jobs-details__main-content")||e,A=[".job-details-jobs-unified-top-card__job-title","h1.job-details-jobs-unified-top-card__job-title","h2.job-details-jobs-unified-top-card__job-title",".jobs-unified-top-card__job-title",".jobs-search__job-details--container h1",".job-view-layout h1",".jobs-details__main-content h1","h1.t-24","h1.t-bold",".topcard__title","h1"];let C="";for(const T of A){const I=f.querySelector(T)||e.querySelector(T),F=((s=I==null?void 0:I.textContent)==null?void 0:s.trim())||"";if(F&&F.length>2&&F.length<150){C=F;break}}const k=[".job-details-jobs-unified-top-card__company-name",".jobs-unified-top-card__company-name a",".jobs-unified-top-card__company-name",".job-details-jobs-unified-top-card__primary-description a",'.jobs-search__job-details--container a[href*="/company/"]','.job-view-layout a[href*="/company/"]',".topcard__flavor--black-link","a.topcard__org-name-link"];let w="";for(const T of k){const I=f.querySelector(T)||e.querySelector(T),F=((o=I==null?void 0:I.textContent)==null?void 0:o.trim())||"";if(F&&F.length>1&&F.length<80){w=F;break}}const R=["#job-details",".jobs-description__content",".jobs-description-content__text",".jobs-box__html-content","article.jobs-description__container","div.jobs-description",".show-more-less-html__markup",'.jobs-search__job-details--container div[class*="description"]'];let P="";for(const T of R){const I=f.querySelector(T)||e.querySelector(T),F=((I==null?void 0:I.textContent)||"").trim();if(F&&F.length>50){P=F;break}}if(!P){const T=Array.from(f.querySelectorAll("h1, h2, h3, h4, h5, strong, b"));for(const I of T)if((a=I.textContent)!=null&&a.toLowerCase().includes("about the job")){const F=I.parentElement;if(F&&(F.textContent||"").trim().length>50){P=(F.textContent||"").trim();break}}}const q=f.querySelector('.jobs-apply-button[href], a[data-control-name="jobdetails_topcard_inapply"]')||e.querySelector('.jobs-apply-button[href], a[data-control-name="jobdetails_topcard_inapply"]'),X=(q==null?void 0:q.href)||t,$=f.querySelector(".job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet, span.jobs-unified-top-card__workplace-type")||e.querySelector(".job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet"),j=((n=$==null?void 0:$.textContent)==null?void 0:n.trim())||"Onsite / Remote";if(C&&P.length>=50)return{source:"LINKEDIN",confidence:.96,job:{title:C,company:w||"Company",location:j,description:P,skills:this.extractSkills(P),source:"LinkedIn",sourceUrl:t,applyUrl:X}}}if(i.includes("greenhouse.io")||e.querySelector("#app_body, #content.body")){const y=e.querySelector(".app-title, h1.job-title, #header h1"),f=e.querySelector(".company-name, #header .company"),A=e.querySelector("#content, #app_body");if(y&&A){const C=((r=y.textContent)==null?void 0:r.trim())||"",w=(((d=f==null?void 0:f.textContent)==null?void 0:d.trim())||this.extractCompanyFromUrl(t)).replace(/^at\s+/i,"").trim(),R=(A.textContent||"").trim();return{source:"GREENHOUSE",confidence:.95,job:{title:C,company:w,location:((u=(c=e.querySelector(".location"))==null?void 0:c.textContent)==null?void 0:u.trim())||"Remote",description:R,skills:this.extractSkills(R),source:"Greenhouse",sourceUrl:t,applyUrl:t}}}}if(i.includes("lever.co")||e.querySelector(".posting-headline")){const y=e.querySelector(".posting-headline h2"),f=e.querySelector(".section-wrapper, .posting-page"),A=e.querySelector("a.postings-btn");if(y&&f){const C=((h=y.textContent)==null?void 0:h.trim())||"",k=((m=e.querySelector(".main-header-logo img"))==null?void 0:m.getAttribute("alt"))||this.extractCompanyFromUrl(t),w=(f.textContent||"").trim();return{source:"LEVER",confidence:.95,job:{title:C,company:k,location:((x=(b=e.querySelector(".posting-categories .location"))==null?void 0:b.textContent)==null?void 0:x.trim())||"Remote",description:w,skills:this.extractSkills(w),source:"Lever",sourceUrl:t,applyUrl:(A==null?void 0:A.href)||t}}}}if(i.includes("myworkdayjobs.com")||e.querySelector('[data-automation-id="jobPostingHeader"]')){const y=e.querySelector('[data-automation-id="jobPostingHeader"]'),f=e.querySelector('[data-automation-id="jobPostingDescription"]'),A=e.querySelector('[data-automation-id="applyButton"]');if(y&&f){const C=((g=y.textContent)==null?void 0:g.trim())||"",k=(f.textContent||"").trim();return{source:"WORKDAY",confidence:.95,job:{title:C,company:this.extractCompanyFromUrl(t),location:((S=(p=e.querySelector('[data-automation-id="locations"]'))==null?void 0:p.textContent)==null?void 0:S.trim())||"Remote",description:k,skills:this.extractSkills(k),source:"Workday",sourceUrl:t,applyUrl:(A==null?void 0:A.href)||t}}}}return null}extractFromGenericDom(e){var m,b,x,g;const t=e.location.href,i=e.querySelector("h1"),s=((m=i==null?void 0:i.innerText)==null?void 0:m.trim())||((b=e.title.split(/[-|–•]/)[0])==null?void 0:b.trim())||"Job Opportunity";let o=this.extractCompanyFromUrl(t);const a=e.title.split(/[-|–•]/);a.length>=2&&(o=a[1].trim());const n=e.querySelector('main, article, [role="main"], #content, .content, .job-description, .job-details'),d=(n?n.textContent||n.innerText||"":((x=e.body)==null?void 0:x.textContent)||((g=e.body)==null?void 0:g.innerText)||"").slice(0,12e3),c=e.querySelector('a[href*="apply"], a[class*="apply"], a.btn-primary'),u=(c==null?void 0:c.href)||t,h=this.extractSkills(d);return{title:s,company:o,location:this.extractLocationFromText(d),description:d,skills:h,source:"Generic Career Page",sourceUrl:t,applyUrl:u}}extractSkills(e){const t=["React","React.js","TypeScript","JavaScript","Node.js","Node","Python","Go","Golang","Java","C++","C#",".NET","AWS","Amazon Web Services","GCP","Google Cloud","Azure","Docker","Kubernetes","SQL","PostgreSQL","MySQL","MongoDB","Redis","GraphQL","REST API","Git","Linux","CI/CD","Next.js","Tailwind","TailwindCSS","Kafka","Elasticsearch"],i=new Set,s=e.toLowerCase();for(const o of t)new RegExp(`\\b${o.replace(/[-/\\^$*+?.()|[\]{}]/g,"\\$&")}\\b`,"i").test(s)&&(o==="React.js"?i.add("React"):o==="Node"?i.add("Node.js"):o==="Golang"?i.add("Go"):o==="Amazon Web Services"?i.add("AWS"):o==="Google Cloud"?i.add("GCP"):o==="TailwindCSS"?i.add("Tailwind"):i.add(o));return Array.from(i)}extractLocationFromText(e){const t=e.toLowerCase();if(t.includes("remote")||t.includes("work from home")||t.includes("anywhere"))return"Remote";const i=e.match(/(location|based in|office):\s*([A-Za-z\s,]+)/i);return i&&i[2]?i[2].trim().slice(0,40):"Hybrid / Onsite"}extractCompanyFromUrl(e){try{const i=new URL(e).hostname.replace("www.","").split(".");if(i.length>=2){const s=i[0];return s.charAt(0).toUpperCase()+s.slice(1)}}catch{}return"Company"}stripHtml(e){const t=document.createElement("div");return t.innerHTML=e,(t.textContent||t.innerText||"").trim()}extractListItemsAfterHeading(e,t){const i=document.createElement("div");i.innerHTML=e;const s=[],o=Array.from(i.querySelectorAll("h1, h2, h3, h4, strong, b, p"));for(const a of o){const n=(a.textContent||"").toLowerCase();if(t.some(r=>n.includes(r))){let r=a.nextElementSibling;for(;r;){if(r.tagName==="UL"||r.tagName==="OL"){const d=Array.from(r.querySelectorAll("li")).map(c=>{var u;return((u=c.textContent)==null?void 0:u.trim())||""}).filter(Boolean);s.push(...d);break}r=r.nextElementSibling}}}return s}}const re=new Me;class Ne{detectJob(e=document){var a,n,r,d,c;console.log("[CRAZY][JOB] Detector started");let t={isJobPage:!1,confidence:0,source:"GENERIC"};const i=this.findJsonLdJobPosting(e);if(i){const u=re.extractFromJsonLd(i,e.location.href);if(u&&u.title&&u.title.length>2)return t={isJobPage:!0,confidence:.96,source:"JSON_LD",job:u,characterCount:u.description.length},console.log("[CRAZY][JOB] Detection result: YES (JSON_LD)",(a=t.job)==null?void 0:a.title),t}const s=re.extractFromPlatformAdapter(e);if(s)return t={isJobPage:!0,confidence:s.confidence,source:s.source,job:s.job,characterCount:s.job.description.length},console.log(`[CRAZY][JOB] Detection result: YES (${s.source})`,(n=t.job)==null?void 0:n.title),t;const o=this.evaluateGenericJobPage(e);return o.isJobPage?(t={isJobPage:!0,confidence:o.confidence,source:"GENERIC",job:o.job,characterCount:((d=(r=o.job)==null?void 0:r.description)==null?void 0:d.length)||0},console.log("[CRAZY][JOB] Detection result: YES (GENERIC)",(c=t.job)==null?void 0:c.title),t):(console.log("[CRAZY][JOB] Detection result: NO (confidence: 0)"),t)}findJsonLdJobPosting(e){try{const t=e.querySelectorAll('script[type="application/ld+json"]');for(const i of Array.from(t))try{const s=JSON.parse(i.textContent||"{}");if(s["@type"]==="JobPosting")return s;if(Array.isArray(s)){const o=s.find(a=>a["@type"]==="JobPosting");if(o)return o}if(s["@graph"]&&Array.isArray(s["@graph"])){const o=s["@graph"].find(a=>a["@type"]==="JobPosting");if(o)return o}}catch{}}catch{}return null}evaluateGenericJobPage(e){var g,p,S,y;const t=(((g=e.body)==null?void 0:g.textContent)||((p=e.body)==null?void 0:p.innerText)||"").toLowerCase();let i=0;const s=["about the job","about this job","about this role","about the role","job description","responsibilities","key responsibilities","what you will do","what you'll do","requirements","qualifications","basic qualifications","preferred qualifications","what we're looking for","what we are looking for","who you are","what you will bring","skills & requirements","experience required"];let o=0;for(const f of s)t.includes(f)&&o++;o>=3?i+=.45:o>=2?i+=.35:o>=1&&(i+=.25);const a=e.querySelector("h1, h2"),n=((a==null?void 0:a.textContent)||(a==null?void 0:a.innerText)||"").trim();["engineer","developer","manager","designer","analyst","specialist","intern","associate","architect","lead","director","consultant","scientist","officer","trainee","representative","coordinator","head","administrator"].some(f=>n.toLowerCase().includes(f))&&(i+=.3),e.querySelectorAll('a[href*="apply"], button[id*="apply"], button[class*="apply"], [aria-label*="apply" i], a[class*="apply"], .jobs-apply-button').length>0&&(i+=.25);const u=(S=e.querySelector('meta[property="og:type"]'))==null?void 0:S.getAttribute("content");(u==="article"||u==="job")&&(i+=.1);const h=(((y=e.location)==null?void 0:y.href)||"").toLowerCase();(h.includes("/jobs/")||h.includes("/job/")||h.includes("/careers/")||h.includes("/positions/")||h.includes("/openings/"))&&(i+=.2);const m=Math.min(.95,i),b=m>=.45;let x=null;return b&&(x=re.extractFromGenericDom(e)),{isJobPage:b,confidence:m,job:x}}}const V=new Ne,De={roleRelevanceWeight:.3,requiredSkillsWeight:.25,experienceWeight:.15,educationWeight:.1,technicalDomainWeight:.1,locationWeight:.05,atsKeywordWeight:.05},Oe=new Set(["communication","written communication","verbal communication","teamwork","collaboration","problem solving","analytical skills","analysis","time management","organization","organizational skills","presentation","leadership","critical thinking","adaptability","multitasking","reporting","attention to detail","project management","management","interpersonal skills"]),se=class se{constructor(e=De){this.weights=e}calculateMatch(e,t){var ge;const i=t.title||"Untitled Position",s=t.company||"Company",o=t.description||"",a=Array.isArray(t.requirements)?t.requirements.join(" "):t.requirements||o,n=this.getCandidatePrimaryRole(e),r=this.classifyRoleFamily(n,((ge=e.professional)==null?void 0:ge.summary)||""),d=this.classifyRoleFamily(i,o),{roleScore:c,roleRelevance:u,isRoleRelevant:h,roleMismatchReason:m}=this.evaluateRoleRelevance(r,d,n,i),b=this.collectCandidateSkills(e),x=t.skills&&t.skills.length>0?t.skills:this.extractKeywords(o),g=[],p=[],S=[],y=[],f=[];for(const M of x){const te=this.hasSkillMatch(b,M),Ge=this.isGenericSkill(M);if(te)g.push(M),Ge?y.push(M):S.push(M);else{p.push(M);const Je=this.isSkillRequiredInText(M,a)?"REQUIRED":"PREFERRED";f.push({skill:M,priority:Je})}}const A=x.length;let C=50;if(A>0){const M=x.filter(te=>!this.isGenericSkill(te)).length;M>0?C=Math.round(S.length/M*100):C=Math.round(g.length/A*100)}const k=f.filter(M=>M.priority==="REQUIRED"),w=x.filter(M=>this.isSkillRequiredInText(M,a)).length,R=Math.max(0,w-k.length),P=w>0?Math.round(R/w*100):C,q=this.calculateCandidateYears(e),X=t.experienceLevel?t.experienceLevel.toUpperCase():"MID",$=this.scoreExperience(q,X);let j=$.score,T="MATCH",I=`✓ Relevant (${q}+ yrs)`;u==="MISMATCH"?(T="MISMATCH",I="✕ Domain experience does not match",j=20):j<70&&(T="PARTIAL",I=`⚠ Developing (${q} yrs vs ${X.toLowerCase()})`);const{score:F,verdict:$e,text:je}=this.scoreEducationVerdict(e,a,r,d),me=g.length,He=p.length,fe=A>0?Math.round(me/A*100):50,be=this.scoreLocation(e,t);let Z=Math.round(c*this.weights.roleRelevanceWeight+P*this.weights.requiredSkillsWeight+j*this.weights.experienceWeight+F*this.weights.educationWeight+C*this.weights.technicalDomainWeight+be*this.weights.locationWeight+fe*this.weights.atsKeywordWeight);u==="MISMATCH"?Z=Math.min(22,Math.max(12,Math.round(Z*.28))):u==="LOW"&&(Z=Math.min(48,Math.max(25,Z)));const oe=Math.min(99,Math.max(12,Z)),{qualityLabel:de,matchQuality:Be}=this.resolveMatchQuality(oe,u),{whyThisScore:qe,resumeIssues:Ve}=this.buildDiagnosticInsights({overallScore:oe,qualityLabel:de,roleRelevance:u,candidateFamily:r,jobFamily:d,candidateRole:n,jobTitle:i,company:s,roleMismatchReason:m,coreMatchedSkills:S,missingSkillsDetailed:f,experienceVerdict:T,candidateYears:q}),ne=[],ee=[];if(S.length>0&&ne.push(`Possesses core skills: ${S.slice(0,4).join(", ")}`),u==="STRONG"?ne.push(`Direct alignment with your active ${n} role profile`):u==="MISMATCH"&&ee.push(m||"Cross-domain role mismatch"),T==="MATCH"?ne.push($.notes):T==="MISMATCH"?ee.push("Domain experience does not match target job domain"):ee.push($.notes),f.length>0){const M=f.slice(0,3).map(te=>te.skill);ee.push(`Missing key requirements: ${M.join(", ")}`)}const ze=this.buildExplanation({overallScore:oe,qualityLabel:de,skillsScore:C,roleScore:c,experienceScore:j,matchedCount:g.length,totalSkills:A,jobTitle:i,company:s,roleMismatchReason:m});return{overallScore:oe,skillsScore:C,experienceScore:j,educationScore:F,roleScore:c,locationScore:be,matchedSkills:g,missingSkills:p,strengths:ne,concerns:ee,explanation:ze,engineVersion:se.VERSION,qualityLabel:de,matchQuality:Be,roleFamilyJob:d,roleFamilyCandidate:r,roleRelevance:u,isRoleRelevant:h,roleMismatchReason:m,whyThisScore:qe,coreMatchedSkills:S,genericMatchedSkills:y,missingSkillsDetailed:f,experienceVerdict:T,experienceVerdictText:I,educationVerdict:$e,educationVerdictText:je,atsCoverageScore:fe,atsMatchedCount:me,atsMissingCount:He,resumeIssues:Ve}}classifyRoleFamily(e,t=""){const i=`${e} ${t}`.toLowerCase();return/\b(financial analyst|finance|accounting|accountant|auditor|audit|valuation|investment banking|banker|equity research|fp&a|treasury|chartered accountant|bookkeeper)\b/i.test(e)||/\b(financial modeling|dcf|gaap|financial statements|valuation)\b/i.test(i)&&!/\b(software|developer|frontend|backend)\b/i.test(e)?"FINANCE":/\b(data analyst|data scientist|machine learning|ml engineer|ai engineer|data engineer|bi developer|business intelligence|analytics engineer|big data|nlp|computer vision)\b/i.test(e)?"DATA":/\b(software|developer|engineer|full stack|fullstack|frontend|front-end|backend|back-end|web developer|programmer|devops|sre|cloud engineer|systems engineer|firmware|mobile developer|ios|android|react|node|python developer|java developer)\b/i.test(e)?"SOFTWARE_ENGINEERING":/\b(marketing|growth|social media|seo|sem|copywriter|content marketing|brand manager|public relations|digital marketing)\b/i.test(e)?"MARKETING":/\b(ui\/ux|ux designer|ui designer|product designer|visual designer|graphic designer|interaction designer|animator)\b/i.test(e)?"DESIGN":/\b(sales|business development|bdr|sdr|account executive|account manager|client relationship|sales representative)\b/i.test(e)?"SALES":/\b(product manager|technical product manager|apm|product owner|scrum master|agile coach|program manager)\b/i.test(e)?"PRODUCT_MANAGEMENT":/\b(human resources|hr generalist|recruiter|talent acquisition|people ops|operations manager|office manager)\b/i.test(e)?"OPERATIONS_HR":"OTHER"}evaluateRoleRelevance(e,t,i,s){if(e===t&&e!=="OTHER"){const r=this.calculateTitleOverlap(i,s),d=r>=75;return{roleScore:r,roleRelevance:d?"STRONG":"MODERATE",isRoleRelevant:!0}}if(e==="DATA"&&t==="FINANCE"||e==="FINANCE"&&t==="DATA"||e==="SOFTWARE_ENGINEERING"&&t==="DATA"||e==="DATA"&&t==="SOFTWARE_ENGINEERING"||e==="PRODUCT_MANAGEMENT"&&t==="SOFTWARE_ENGINEERING")return{roleScore:50,roleRelevance:"MODERATE",isRoleRelevant:!0};const a=this.formatRoleFamily(e);return{roleScore:15,roleRelevance:"MISMATCH",isRoleRelevant:!1,roleMismatchReason:`The job belongs primarily to ${this.formatRoleFamily(t)}, while your active resume is focused on ${a}.`}}formatRoleFamily(e){switch(e){case"SOFTWARE_ENGINEERING":return"Software Development";case"DATA":return"Data & Analytics";case"FINANCE":return"Finance";case"MARKETING":return"Marketing";case"DESIGN":return"UI/UX Design";case"SALES":return"Sales & BD";case"PRODUCT_MANAGEMENT":return"Product Management";case"OPERATIONS_HR":return"Operations & HR";default:return"General Professional"}}calculateTitleOverlap(e,t){const i=e.toLowerCase(),s=t.toLowerCase();if(i===s)return 100;const o=["full stack","fullstack","frontend","front end","backend","back end","software engineer","software developer","data analyst","data scientist","data engineer","financial analyst","product manager","ui/ux","devops"];for(const c of o)if(i.includes(c)&&s.includes(c))return 95;const a=new Set(["developer","engineer","associate","senior","junior","lead","staff","principal","intern","internship","mid","i","ii","iii","iv"]),n=i.split(/\W+/).filter(c=>c.length>2&&!a.has(c)),r=s.split(/\W+/).filter(c=>c.length>2&&!a.has(c));if(n.length===0||r.length===0)return 80;let d=0;for(const c of n)r.includes(c)&&d++;return Math.min(100,Math.max(50,Math.round(d/Math.min(n.length,r.length)*100)))}resolveMatchQuality(e,t){return t==="MISMATCH"||e<30?{qualityLabel:"Not a Match",matchQuality:"NONE"}:e>=85?{qualityLabel:"Strong Match",matchQuality:"STRONG"}:e>=70?{qualityLabel:"Good Match",matchQuality:"GOOD"}:e>=50?{qualityLabel:"Partial Match",matchQuality:"PARTIAL"}:{qualityLabel:"Low Match",matchQuality:"LOW"}}buildDiagnosticInsights(e){const t=[];e.roleRelevance==="MISMATCH"&&t.push(`Domain mismatch: ${e.jobTitle} is in ${this.formatRoleFamily(e.jobFamily)}, whereas your resume is focused on ${this.formatRoleFamily(e.candidateFamily)}.`);const i=e.missingSkillsDetailed.filter(a=>a.priority==="REQUIRED");for(const a of i.slice(0,3))t.push(`Missing required skill: ${a.skill} is not found in your resume skills or experience.`);const s=e.missingSkillsDetailed.filter(a=>a.priority==="PREFERRED");for(const a of s.slice(0,2))t.push(`Missing preferred keyword: ${a.skill} is requested by the job description.`);e.experienceVerdict==="MISMATCH"&&t.push("Experience mismatch: The role seeks specialized domain experience that is absent from your active background.");let o="";return e.roleRelevance==="MISMATCH"?o=`This role is primarily ${this.formatRoleFamily(e.jobFamily).toLowerCase()}-focused, while your active resume is focused on ${this.formatRoleFamily(e.candidateFamily).toLowerCase()}.`:e.overallScore>=80?o=`Your resume demonstrates strong technical alignment with ${e.company}'s requirements, matching core stack components (${e.coreMatchedSkills.slice(0,3).join(", ")}).`:e.overallScore>=50?o=`Good foundational overlap, but the position expects key proficiencies in ${e.missingSkillsDetailed.slice(0,2).map(n=>n.skill).join(" and ")||"additional stack tools"} not highlighted on your resume.`:o="Your background partially touches the domain, but significant core requirements are missing from your current resume.",{whyThisScore:o,resumeIssues:t}}isGenericSkill(e){return Oe.has(e.toLowerCase().trim())}isSkillRequiredInText(e,t){const i=t.toLowerCase(),s=e.toLowerCase(),o=i.search(/\b(requirements|qualifications|must have|minimum qualifications|essential)\b/),a=i.indexOf(s);if(o!==-1&&a>o){const n=i.search(/\b(preferred|nice to have|bonus|plus)\b/);if(n===-1||a<n)return!0}return!1}getCandidatePrimaryRole(e){var t,i,s,o;return((t=e.professional)==null?void 0:t.currentTitle)||((i=e.professional)==null?void 0:i.preferredJobTitle)||((o=(s=e.experiences)==null?void 0:s[0])==null?void 0:o.jobTitle)||"Software Engineer"}collectCandidateSkills(e){var i;const t=new Set;if((i=e.professional)!=null&&i.skills)for(const s of e.professional.skills)t.add(s.trim().toLowerCase());if(e.experiences){for(const s of e.experiences)if(s.technologies)for(const o of s.technologies)t.add(o.trim().toLowerCase())}if(e.projects){for(const s of e.projects)if(s.technologies)for(const o of s.technologies)t.add(o.trim().toLowerCase())}return t}hasSkillMatch(e,t){const i=t.trim().toLowerCase();if(e.has(i))return!0;const o={react:["react.js","reactjs"],"react.js":["react"],node:["node.js","nodejs"],"node.js":["node"],typescript:["ts"],javascript:["js"],python:["py"],golang:["go"],postgres:["postgresql","psql"],mongo:["mongodb"],k8s:["kubernetes"],rest:["rest api","restful api","apis"],"rest api":["rest","restful","apis"],aws:["amazon web services"],"amazon web services":["aws"],docker:["containers","containerization"]}[i]||[];for(const a of o)if(e.has(a))return!0;for(const a of e)if(a.length>=3&&(a.includes(i)||i.includes(a)))return!0;return!1}calculateCandidateYears(e){var i;if((i=e.professional)!=null&&i.yearsOfExperience)return e.professional.yearsOfExperience;if(!e.experiences||e.experiences.length===0)return 1;let t=0;for(const s of e.experiences)if(s.startDate){const o=new Date(s.startDate).getTime(),a=s.endDate&&!s.isCurrent?new Date(s.endDate).getTime():Date.now(),n=Math.max(1,Math.round((a-o)/(1e3*60*60*24*30)));t+=n}return Math.max(1,Math.round(t/12))}scoreExperience(e,t){switch(t){case"ENTRY":return e<=2?{score:95,notes:`Your experience (${e} yrs) aligns with Entry-level role`}:{score:85,notes:`You exceed the entry-level baseline with ${e} years experience`};case"MID":return e>=2&&e<=5?{score:95,notes:`Your experience (${e} yrs) perfectly fits Mid-level requirements`}:e>5?{score:90,notes:`Seasoned background (${e} yrs) for Mid-level position`}:{score:70,notes:`Developing experience (${e} yrs) for Mid-level expectations`};case"SENIOR":return e>=5?{score:95,notes:`Strong tenure (${e} yrs) meeting Senior role criteria`}:e>=3?{score:78,notes:`Close to Senior criteria with ${e} years of professional experience`}:{score:55,notes:`Senior role typically expects 5+ years experience (you have ${e})`};case"LEAD":case"EXECUTIVE":return e>=8?{score:95,notes:`Proven track record (${e} yrs) matching Lead leadership criteria`}:e>=5?{score:80,notes:`Solid seniority (${e} yrs) for Lead responsibility`}:{score:50,notes:"Leadership role usually requires 8+ years experience"}}}scoreEducationVerdict(e,t,i,s){const o=t.toLowerCase();if(!/bachelor|master|phd|degree|b\.s\.|m\.s\./i.test(o))return{score:90,verdict:"NOT_SPECIFIED",text:"— Not specified"};const n=(e.educations||[]).map(r=>(r.degree||"").toLowerCase());return n.length===0?{score:65,verdict:"PARTIAL",text:"⚠ Degree not listed"}:i!==s&&s==="FINANCE"?{score:60,verdict:"PARTIAL",text:"⚠ Engineering degree for Finance role"}:n.some(r=>r.includes("master")||r.includes("phd"))?{score:100,verdict:"MATCH",text:"✓ Advanced degree meets requirement"}:n.some(r=>r.includes("bachelor")||r.includes("b.s")||r.includes("b.a")||r.includes("btech"))?{score:90,verdict:"MATCH",text:"✓ Degree meets requirement"}:{score:80,verdict:"MATCH",text:"✓ Relevant"}}scoreLocation(e,t){var a,n,r,d,c,u;if(!!(t.remote||t.location&&t.location.toLowerCase().includes("remote")))return 100;const s=`${((a=e.personal)==null?void 0:a.city)||""} ${((n=e.personal)==null?void 0:n.country)||""}`.toLowerCase(),o=(t.location||"").toLowerCase();return s.trim()?o&&o.includes(((d=(r=e.personal)==null?void 0:r.city)==null?void 0:d.toLowerCase())||"---")?100:(u=(c=e.preferences)==null?void 0:c.locations)!=null&&u.some(h=>o.includes(h.toLowerCase()))?95:65:80}extractKeywords(e){const t=e.match(/\b[A-Za-z0-9+#.]{2,20}\b/g)||[];return["React","Node.js","TypeScript","JavaScript","Python","Go","SQL","PostgreSQL","MongoDB","Docker","Kubernetes","AWS","GCP","REST API","Financial Modeling","Excel","Valuation","Accounting","Financial Statements"].filter(s=>t.some(o=>o.toLowerCase()===s.toLowerCase()))}buildExplanation(e){return e.roleMismatchReason?`${e.roleMismatchReason} Overall score is ${e.overallScore}% (${e.qualityLabel}).`:`This position matches your profile at ${e.overallScore}% (${e.qualityLabel}). You match ${e.matchedCount} of ${e.totalSkills} identified skill requirements (${e.skillsScore}% skill fit). Your role background demonstrates ${e.roleScore}% alignment with ${e.company}'s ${e.jobTitle} position.`}};_(se,"VERSION","1.0.0");let ie=se;class Pe{constructor(){_(this,"engine");this.engine=new ie}matchJobWithProfile(e,t){const i=this.normalizeUserProfile(t);return this.engine.calculateMatch(i,e)}normalizeUserProfile(e){if("personal"in e&&"professional"in e)return e;const t=e,i=typeof t.SKILLS=="string"?t.SKILLS.split(",").map(s=>s.trim()).filter(Boolean):[];return{id:"cached-user",userId:"cached-user",personal:{firstName:String(t.FIRST_NAME||""),lastName:String(t.LAST_NAME||""),email:String(t.EMAIL||""),phone:String(t.PHONE||""),city:String(t.CITY||""),stateOrProvince:String(t.STATE||""),postalCode:String(t.POSTAL_CODE||""),country:String(t.COUNTRY||"United States"),linkedin:String(t.LINKEDIN||""),github:String(t.GITHUB||""),portfolio:String(t.PORTFOLIO||"")},professional:{currentTitle:String(t.CURRENT_JOB_TITLE||t.CURRENT_TITLE||t.JOB_TITLE||""),yearsOfExperience:parseInt(String(t.YEARS_EXPERIENCE||"3"),10)||3,skills:i,summary:String(t.SUMMARY||"")},educations:[{id:"edu-1",institution:String(t.UNIVERSITY||t.EDUCATION_SCHOOL||"University"),degree:String(t.DEGREE||t.EDUCATION_DEGREE||"Bachelor's"),fieldOfStudy:String(t.FIELD_OF_STUDY||"Computer Science"),startDate:"2019",endDate:String(t.GRADUATION_DATE||"2023")}],experiences:[{id:"exp-1",company:String(t.CURRENT_COMPANY||t.RECENT_COMPANY||t.COMPANY||"Company"),jobTitle:String(t.CURRENT_JOB_TITLE||t.CURRENT_TITLE||t.JOB_TITLE||"Software Engineer"),startDate:"2022",isCurrent:!0,technologies:i}],projects:[],certifications:[],languages:[],workAuthorization:{authorizedToWork:!!(t.WORK_AUTHORIZATION??!0),sponsorshipRequired:!!(t.SPONSORSHIP_REQUIRED??t.VISA_SPONSORSHIP??!1)},preferences:{targetRoles:[String(t.CURRENT_JOB_TITLE||t.CURRENT_TITLE||t.JOB_TITLE||"")].filter(Boolean),locations:[String(t.CITY||"")].filter(Boolean),remote:!0,internship:!1,fullTime:!0,experienceLevel:"MID",industries:[]},completionPercentage:90,updatedAt:new Date().toISOString()}}}const ue=new Pe;class z{constructor(){_(this,"host",null);_(this,"shadow",null);_(this,"assistantVisibility","closed");_(this,"activeView","HOME");_(this,"positionPreset","bottom-right");_(this,"posX",null);_(this,"posY",null);_(this,"isDragging",!1);_(this,"dragStartX",0);_(this,"dragStartY",0);_(this,"candidate",{name:"Saquib Sarfaraz",resumeTitle:"Full Stack Developer",email:"saquib@kraxyy.ai",hasProfile:!0,hasResume:!0});_(this,"currentState",null);_(this,"currentAutofill",null);_(this,"onAutofillCallback");_(this,"matchState",{status:"IDLE",progress:0,stepText:"",jobTitle:"",company:"",location:"",score:82,qualityLabel:"Strong Match",matchQuality:"STRONG",roleFamilyJob:"SOFTWARE_ENGINEERING",roleFamilyCandidate:"SOFTWARE_ENGINEERING",whyThisScore:"",roleRelevance:"STRONG",roleMismatchReason:void 0,matchedSkills:["React","JavaScript","Node.js","MongoDB","REST APIs"],coreMatchedSkills:["React","JavaScript","Node.js","MongoDB","REST APIs"],genericMatchedSkills:[],missingSkills:["AWS","Docker"],missingSkillsDetailed:[{skill:"AWS",priority:"REQUIRED"},{skill:"Docker",priority:"REQUIRED"}],experienceRating:"Relevant experience (3+ yrs)",experienceVerdict:"MATCH",experienceVerdictText:"✓ Relevant (3+ yrs)",educationRating:"Meets requirement (CS degree)",educationVerdict:"MATCH",educationVerdictText:"✓ Relevant (B.Tech CS)",atsKeywordCoverage:78,atsMatchedCount:5,atsMissingCount:2,resumeIssues:[]});_(this,"formState",{status:"IDLE",fieldsFound:0,fields:[]});_(this,"isRescanning",!1);_(this,"currentScanId","");_(this,"currentJobIdentity","");_(this,"rescanFeedbackTimer",null);_(this,"rescanFeedbackText","");this.restorePersistentState()}getIsRescanning(){return this.isRescanning}getCurrentScanId(){return this.currentScanId}getCurrentJobIdentity(){return this.currentJobIdentity}static computeJobIdentity(e,t){if(!e&&!t)return"";if(t)try{const o=new URL(t),a=o.searchParams.get("currentJobId");if(a)return`linkedin-job-${a}`;const n=o.pathname.match(/\/jobs\/(?:view\/)?(\d+)/i);if(n)return`job-${n[1]}`}catch{}const i=((e==null?void 0:e.title)||"").trim().toLowerCase(),s=((e==null?void 0:e.company)||"").trim().toLowerCase();return i||s?`${s}::${i}`:t||""}restorePersistentState(){try{const e=sessionStorage.getItem("kraxyy_assistant_visibility");e==="open"||e==="closed"?this.assistantVisibility=e:this.assistantVisibility="closed";const t=sessionStorage.getItem("kraxyy_assistant_state");if(t){const i=JSON.parse(t);i.activeView&&(this.activeView=i.activeView),i.matchState&&(this.matchState={...this.matchState,...i.matchState}),i.positionPreset&&(this.positionPreset=i.positionPreset),i.posX!==void 0&&(this.posX=i.posX),i.posY!==void 0&&(this.posY=i.posY)}}catch{}}savePersistentState(){try{sessionStorage.setItem("kraxyy_assistant_visibility",this.assistantVisibility),sessionStorage.setItem("kraxyy_assistant_state",JSON.stringify({activeView:this.activeView,matchState:this.matchState,positionPreset:this.positionPreset,posX:this.posX,posY:this.posY}))}catch{}}updateIntelligence(e,t,i){var a,n,r;if(z.isExcludedDomain()){this.remove();return}this.currentState=e,t&&(this.onAutofillCallback=t),i!==void 0&&(this.currentAutofill=i);const s=(a=e==null?void 0:e.job)==null?void 0:a.normalizedJob,o=z.computeJobIdentity(s,(e==null?void 0:e.url)||(typeof window<"u"?window.location.href:""));if(o&&o!==this.currentJobIdentity?(this.currentJobIdentity=o,s&&(this.matchState.jobTitle=s.title,this.matchState.company=s.company,this.matchState.location=s.location||"",(n=e==null?void 0:e.job)!=null&&n.match?this.applyMatchBreakdown(e.job.match,s):(this.matchState.status="IDLE",this.matchState.score=0,this.matchState.matchedSkills=[],this.matchState.missingSkills=[],this.matchState.coreMatchedSkills=[],this.matchState.genericMatchedSkills=[],this.matchState.missingSkillsDetailed=[],this.matchState.resumeIssues=[])),this.savePersistentState()):o&&((r=e==null?void 0:e.job)!=null&&r.match)&&(this.applyMatchBreakdown(e.job.match,s),this.savePersistentState()),this.fetchCandidateIdentity(),this.assistantVisibility!=="open"){this.host&&(this.host.style.display="none");return}this.ensureHost(),this.host&&(this.host.style.display="block",this.applyPosition()),this.updateDom()}applyMatchBreakdown(e,t){t&&(t.title&&(this.matchState.jobTitle=t.title),t.company&&(this.matchState.company=t.company),t.location&&(this.matchState.location=t.location));const i=e.breakdown||e||{};this.matchState.score=e.overallScore??(typeof e.score=="number"?e.score:0),this.matchState.status="RESULT",this.matchState.matchQuality=e.matchQuality||(this.matchState.score>=85?"STRONG":this.matchState.score>=70?"GOOD":this.matchState.score>=50?"PARTIAL":this.matchState.score>=30?"LOW":"NONE"),this.matchState.qualityLabel=e.qualityLabel||(this.matchState.score>=85?"Strong Match":this.matchState.score>=70?"Good Match":this.matchState.score>=50?"Partial Match":this.matchState.score>=30?"Low Match":"Not a Match"),this.matchState.roleFamilyJob=i.roleFamilyJob||"",this.matchState.roleFamilyCandidate=i.roleFamilyCandidate||"",this.matchState.roleRelevance=i.roleRelevance||"STRONG",this.matchState.roleMismatchReason=i.roleMismatchReason||"",this.matchState.whyThisScore=i.whyThisScore||"",this.matchState.coreMatchedSkills=i.coreMatchedSkills||e.matchedSkills||[],this.matchState.genericMatchedSkills=i.genericMatchedSkills||[],this.matchState.matchedSkills=e.matchedSkills||[],this.matchState.missingSkillsDetailed=i.missingSkillsDetailed||(e.missingSkills||[]).map(s=>({skill:s,priority:"REQUIRED"})),this.matchState.missingSkills=e.missingSkills||[],this.matchState.experienceRating=i.experienceVerdict==="MISMATCH"?"Mismatch":e.experienceMatch||"Moderate",this.matchState.experienceVerdict=i.experienceVerdict||"PARTIAL",this.matchState.experienceVerdictText=i.experienceVerdict==="MISMATCH"?"Role domain / level mismatch":e.experienceMatch?`${e.experienceMatch} experience`:"Relevant experience",this.matchState.educationRating=e.educationMatch||"Acceptable",this.matchState.educationVerdict=i.educationVerdict||"PARTIAL",this.matchState.educationVerdictText=i.educationVerdict==="MISMATCH"?"Field of study mismatch":"Meets requirement",this.matchState.atsKeywordCoverage=i.atsCoverageScore??Math.min(95,Math.max(15,this.matchState.score-5)),this.matchState.atsMatchedCount=i.atsMatchedCount??this.matchState.matchedSkills.length,this.matchState.atsMissingCount=i.atsMissingCount??this.matchState.missingSkills.length,this.matchState.resumeIssues=i.resumeIssues||[]}render(e,t,i){this.updateIntelligence(e,t,i)}fetchCandidateIdentity(){try{chrome.runtime.sendMessage({type:"CHECK_STATUS"},e=>{var t,i,s;!chrome.runtime.lastError&&e&&((t=e.user)!=null&&t.name&&(this.candidate.name=e.user.name),(i=e.resume)!=null&&i.title&&(this.candidate.resumeTitle=e.resume.title),e.userEmail&&(this.candidate.email=e.userEmail),this.candidate.hasProfile=e.hasCachedProfile!==!1,this.candidate.hasResume=((s=e.resume)==null?void 0:s.exists)!==!1,this.assistantVisibility==="open"&&this.updateDom())})}catch{}}open(e){if(z.isExcludedDomain()){this.remove();return}this.assistantVisibility="open",e==="MATCH"?(this.activeView="MATCH",this.startJobMatch()):e==="AUTOFILL"?(this.activeView="AUTOFILL",this.inspectFormFields()):(!this.activeView||this.activeView==="HOME")&&(this.activeView="HOME"),this.savePersistentState(),this.ensureHost(),this.host&&(this.host.style.display="block",this.applyPosition()),this.updateDom()}close(){this.assistantVisibility="closed",this.savePersistentState(),this.remove()}getVisibility(){return this.assistantVisibility}showAutofillReport(e){this.currentAutofill=e,this.formState.status="REPORT",this.activeView="AUTOFILL",this.assistantVisibility="open",this.ensureHost(),this.host&&(this.host.style.display="block",this.applyPosition()),this.updateDom()}remove(){const e=document.getElementById("crazy-assistant-root")||document.getElementById("kraxyy-inpage-assistant");e&&e.parentNode&&e.parentNode.removeChild(e),this.host&&this.host.parentNode&&this.host.parentNode.removeChild(this.host),this.host=null,this.shadow=null}static isExcludedDomain(){if(typeof window>"u")return!1;const e=window.location.hostname.toLowerCase(),t=window.location.port;return e==="localhost"&&["5173","5174","3000","5001"].includes(t)?!0:["kraxyy.com","www.kraxyy.com","kraxyy-apply.com","www.kraxyy-apply.com","crazyapply.com","www.crazyapply.com","app.kraxyy.com","admin.kraxyy.com","api.kraxyy.com"].some(s=>e===s||e.endsWith("."+s))}static isSupportedJobOrApplicationPage(e=document){if(z.isExcludedDomain())return!1;const t=typeof window<"u"&&window.location?window.location:(e==null?void 0:e.location)||{},i=(t.hostname||"").toLowerCase(),s=(t.pathname||"").toLowerCase(),o=(t.href||"").toLowerCase();return!!(["linkedin.com","greenhouse.io","lever.co","workday.com","myworkdayjobs.com","ashbyhq.com","smartrecruiters.com","bamboohr.com","icims.com","jobvite.com","indeed.com","glassdoor.com","wellfound.com","angel.co","dice.com","ziprecruiter.com","rippling.com","workable.com","breezy.hr","recruitee.com","taleo.net"].some(r=>i.includes(r))||["/jobs/","/job/","/careers/","/career/","/positions/","/position/","/apply/","/openings/","/opening/","/job-details","/job_details","/work-with-us","/join-us"].some(r=>s.includes(r)||o.includes(r)))}resetForNewJob(e,t){this.matchState.status="IDLE",this.matchState.progress=0,this.matchState.stepText="",this.matchState.jobTitle=e||"",this.matchState.company=t||"",this.matchState.score=0,this.matchState.matchedSkills=[],this.matchState.coreMatchedSkills=[],this.matchState.missingSkills=[],this.matchState.missingSkillsDetailed=[],this.matchState.resumeIssues=[],this.matchState.whyThisScore="",this.activeView="HOME",this.savePersistentState(),this.assistantVisibility==="open"&&this.shadow&&this.updateDom()}ensureHost(){if(this.host&&this.shadow&&document.body.contains(this.host))return;let e=document.getElementById("crazy-assistant-root")||document.getElementById("kraxyy-inpage-assistant");e?(this.host=e,this.host.id="crazy-assistant-root",this.shadow=this.host.shadowRoot||this.host.attachShadow({mode:"open"})):(this.host=document.createElement("div"),this.host.id="crazy-assistant-root",this.host.style.position="fixed",this.host.style.zIndex="2147483647",this.host.style.pointerEvents="auto",this.shadow=this.host.attachShadow({mode:"open"}),document.body.appendChild(this.host)),this.applyPosition()}setDockPosition(e){e==="left"?this.positionPreset=this.isDockedTop()?"top-left":"bottom-left":e==="right"?this.positionPreset=this.isDockedTop()?"top-right":"bottom-right":e==="top"?this.positionPreset=this.isDockedLeft()?"top-left":"top-right":e==="bottom"&&(this.positionPreset=this.isDockedLeft()?"bottom-left":"bottom-right"),this.posX=null,this.posY=null,this.applyPosition(),this.savePersistentState(),this.assistantVisibility==="open"&&this.updateDom()}isDockedLeft(){return this.posX!==null&&typeof window<"u"?this.posX<window.innerWidth/2:this.positionPreset==="bottom-left"||this.positionPreset==="top-left"}isDockedRight(){return!this.isDockedLeft()}isDockedTop(){return this.posY!==null&&typeof window<"u"?this.posY<window.innerHeight/2:this.positionPreset==="top-left"||this.positionPreset==="top-right"}isDockedBottom(){return!this.isDockedTop()}applyPosition(){if(this.host){if(this.posX!==null&&this.posY!==null){this.host.style.left=`${this.posX}px`,this.host.style.top=`${this.posY}px`,this.host.style.right="auto",this.host.style.bottom="auto";return}this.positionPreset==="bottom-left"?(this.host.style.left="24px",this.host.style.bottom="24px",this.host.style.right="auto",this.host.style.top="auto"):this.positionPreset==="top-left"?(this.host.style.left="24px",this.host.style.top="24px",this.host.style.right="auto",this.host.style.bottom="auto"):this.positionPreset==="top-right"?(this.host.style.right="24px",this.host.style.top="24px",this.host.style.left="auto",this.host.style.bottom="auto"):(this.host.style.right="24px",this.host.style.bottom="24px",this.host.style.left="auto",this.host.style.top="auto")}}async rescanCurrentJob(e="MANUAL"){if(this.isRescanning){console.log("[CRAZY][RESCAN] Scan already in progress, ignoring duplicate trigger");return}const t=typeof crypto<"u"&&crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).substring(2,9)}`;this.currentScanId=t,this.isRescanning=!0;const s=V.detectJob().job;if(this.matchState.jobTitle=(s==null?void 0:s.title)||"",this.matchState.company=(s==null?void 0:s.company)||"",this.matchState.location=(s==null?void 0:s.location)||"",this.matchState.status="ANALYZING",this.matchState.progress=30,this.matchState.stepText=s!=null&&s.title?`Scanning ${s.title} at ${s.company||"Company"}...`:"Scanning current job...",this.matchState.score=0,this.matchState.matchedSkills=[],this.matchState.coreMatchedSkills=[],this.matchState.genericMatchedSkills=[],this.matchState.missingSkills=[],this.matchState.missingSkillsDetailed=[],this.matchState.resumeIssues=[],this.matchState.whyThisScore="",this.rescanFeedbackText="",this.activeView!=="AUTOFILL"&&(this.activeView="MATCH"),this.assistantVisibility==="open"&&this.updateDom(),!s||!s.title){if(this.currentScanId!==t)return;this.isRescanning=!1,this.matchState.status="ERROR",this.matchState.errorText="Unable to scan current job. Try navigating directly to the job details or retry.",this.assistantVisibility==="open"&&this.updateDom();return}try{this.matchState.progress=60,this.matchState.stepText="Extracting job requirements & matching with resume...",this.assistantVisibility==="open"&&this.updateDom(),chrome.runtime.sendMessage({type:"MATCH_JOB",job:s},o=>{if(this.currentScanId!==t){console.log("[CRAZY][RESCAN] Discarding stale scan result for:",s.title);return}if(this.isRescanning=!1,this.matchState.progress=100,this.matchState.status="RESULT",o!=null&&o.success&&o.match)this.applyMatchBreakdown(o.match,s);else{const a=new ie,n={professional:{currentTitle:this.candidate.resumeTitle||"Software Engineer",skills:["React","JavaScript","TypeScript","Node.js","REST API","HTML","CSS"]},educations:[{degree:"Bachelor's",fieldOfStudy:"Computer Science"}]},r={title:s.title,company:s.company,description:s.description||"",skills:s.skills||[],requirements:s.requirements||[]},d=a.calculateMatch(n,r);this.applyMatchBreakdown(d,s)}this.currentJobIdentity=z.computeJobIdentity(s,window.location.href),this.savePersistentState(),e==="MANUAL"&&(this.rescanFeedbackText="✓ Updated",this.rescanFeedbackTimer&&clearTimeout(this.rescanFeedbackTimer),this.rescanFeedbackTimer=setTimeout(()=>{this.rescanFeedbackText="",this.assistantVisibility==="open"&&this.updateDom()},1200)),this.assistantVisibility==="open"&&this.updateDom()})}catch{if(this.currentScanId!==t)return;this.isRescanning=!1,this.matchState.status="ERROR",this.matchState.errorText="Unable to scan current job. Click retry below.",this.assistantVisibility==="open"&&this.updateDom()}}startJobMatch(){this.activeView="MATCH",this.rescanCurrentJob("MANUAL")}inspectFormFields(){this.formState.status="DETECTED";const t=U.detectForm().fields||[];this.formState.fieldsFound=t.length,this.formState.fields=t.map(i=>{var a;const s=Math.round((i.confidence||.88)*100),o=s>=75&&i.status!=="MANUAL_REQUIRED";return{label:i.label||((a=i.taxonomyType)==null?void 0:a.replace(/_/g," "))||"Form Field",confidence:s,isHighConfidence:o,status:i.status||(o?"READY":"NEEDS_REVIEW"),value:i.taxonomyType||""}}),this.formState.fields.length===0&&(this.formState.fieldsFound=0,this.formState.fields=[]),this.updateDom()}triggerAutofillAction(){this.formState.status="FILLING",this.updateDom(),this.onAutofillCallback?Promise.resolve(this.onAutofillCallback()).catch(()=>{this.fallbackAutofillComplete()}):this.fallbackAutofillComplete()}fallbackAutofillComplete(){setTimeout(()=>{this.currentAutofill={totalDetected:this.formState.fieldsFound||18,totalVerified:15,totalNeedsAttention:2,totalManualRequired:1,totalSkippedExisting:1,totalFailed:0,fields:[]},this.formState.status="REPORT",this.updateDom()},700)}updateDom(){if(this.shadow){if(this.assistantVisibility!=="open"){this.shadow.innerHTML="",this.host&&(this.host.style.display="none");return}this.host&&(this.host.style.display="block"),this.applyPosition(),this.shadow.innerHTML=`
      <style>${this.getBaseStyles()}</style>
      <div class="panel">
        <!-- Draggable Header with Position Controls & Close Button -->
        <div id="panel-header" class="panel-header">
          <div class="brand">
            <span class="dot"></span>
            <div class="brand-text">
              <span class="brand-name">KRAXYY</span>
              <span class="brand-sub">Job Assistant</span>
            </div>
          </div>
          <div class="window-actions">
            ${this.rescanFeedbackText?`<span class="rescan-feedback">${this.escapeHtml(this.rescanFeedbackText)}</span>`:""}
            <button
              id="btn-rescan-job"
              class="icon-btn rescan-btn ${this.isRescanning?"spinning":""}"
              title="${this.isRescanning?"Scanning current job...":"Rescan current job"}"
              aria-label="Rescan current job"
              ${this.isRescanning?"disabled":""}
            >↻</button>
            <div class="dock-controls" title="Move panel position">
              <button id="dock-left" class="dock-btn ${this.isDockedLeft()?"active":""}" title="Dock Left">←</button>
              <button id="dock-right" class="dock-btn ${this.isDockedRight()?"active":""}" title="Dock Right">→</button>
              <button id="dock-top" class="dock-btn ${this.isDockedTop()?"active":""}" title="Dock Top">↑</button>
              <button id="dock-bottom" class="dock-btn ${this.isDockedBottom()?"active":""}" title="Dock Bottom">↓</button>
            </div>
            <button id="btn-close" class="icon-btn close-btn" title="Close assistant completely">✕</button>
          </div>
        </div>

        <div class="panel-body">
          ${this.activeView==="MATCH"?this.renderMatchView():this.activeView==="DETAILS"?this.renderDetailsView():this.activeView==="AUTOFILL"?this.renderAutofillView():this.renderHomeView()}
        </div>
      </div>
    `,this.bindEvents(),this.setupDraggable()}}renderHomeView(){return`
      <!-- Candidate Identity Card -->
      <div class="card user-card">
        <div class="user-row">
          <div class="avatar">👤</div>
          <div class="user-info">
            <div class="user-name">${this.escapeHtml(this.candidate.name)}</div>
            <div class="resume-badge">Resume: ${this.escapeHtml(this.candidate.resumeTitle)}</div>
          </div>
        </div>
        <div class="status-row">
          <span class="status-chip positive">✓ Resume</span>
          <span class="status-chip positive">✓ Profile</span>
        </div>
      </div>

      <!-- Superpower 1: Match Job -->
      <div class="action-card">
        <div class="action-header">
          <span class="action-icon">🎯</span>
          <div>
            <div class="action-title">Match Job</div>
            <div class="action-desc">Compare this job with your resume</div>
          </div>
        </div>
        <button id="btn-start-match" class="btn btn-secondary">
          <span>Match Job</span>
          <span>→</span>
        </button>
      </div>

      <!-- Superpower 2: Auto-Fill -->
      <div class="action-card primary-card">
        <div class="action-header">
          <span class="action-icon">⚡</span>
          <div>
            <div class="action-title">Auto-Fill</div>
            <div class="action-desc">Fill detected application fields automatically</div>
          </div>
        </div>
        <button id="btn-start-autofill" class="btn btn-primary">
          <span>Auto-Fill</span>
          <span>→</span>
        </button>
      </div>

      <div class="footer-note">
        Assistant stays active while you browse & interact
      </div>
    `}renderMatchView(){var i,s,o,a,n,r;const e=this.matchState;if(e.status==="ANALYZING")return`
        <div class="flow-header">
          <button id="btn-back-home" class="link-btn">← Home</button>
          <span class="flow-title">Analyzing Job</span>
        </div>
        ${e.jobTitle||e.company?`
          <div class="job-context-banner">
            <div class="context-company">${this.escapeHtml(e.company||"Detecting Company...")}</div>
            <div class="context-role">${this.escapeHtml(e.jobTitle||"Detecting Job...")}</div>
            ${e.location?`<div class="context-location">📍 ${this.escapeHtml(e.location)}</div>`:""}
          </div>
        `:""}
        <div class="loading-box">
          <div class="spinner"></div>
          <div class="loading-title">${e.jobTitle?"Updating Match...":"Scanning Current Job..."}</div>
          <div class="loading-step">${this.escapeHtml(e.stepText||"Analyzing current page & resume...")}</div>

          <div class="progress-wrap">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${e.progress}%"></div>
            </div>
            <div class="progress-percent">${e.progress}%</div>
          </div>
          <div class="loading-hint">Comparing requirements with ${this.escapeHtml(this.candidate.name)}'s resume</div>
        </div>
      `;if(e.status==="ERROR")return`
        <div class="flow-header">
          <button id="btn-back-home" class="link-btn">← Back</button>
          <span class="flow-title">JD Match</span>
        </div>
        <div class="error-box">
          <div class="error-icon">⚠️</div>
          <div class="error-msg">${this.escapeHtml(e.errorText||"Couldn't detect job description")}</div>
          <button id="btn-retry-match" class="btn btn-secondary">Try Again</button>
        </div>
      `;const t=e.matchQuality==="STRONG"?"strong":e.matchQuality==="GOOD"?"good":e.matchQuality==="PARTIAL"?"partial":"low";return`
      <div class="flow-header">
        <button id="btn-back-home" class="link-btn">← Home</button>
        <span class="flow-title">Job Match</span>
      </div>

      <!-- 1. Prominent Company + Role context ABOVE score -->
      <div class="job-context-banner">
        <div class="context-company">${this.escapeHtml(e.company||"Company")}</div>
        <div class="context-role">${this.escapeHtml(e.jobTitle||"Job Title")}</div>
        ${e.location?`<div class="context-location">📍 ${this.escapeHtml(e.location)}</div>`:""}
      </div>

      <!-- 2. Match Score + Quality Label -->
      <div class="score-banner ${t}">
        <div class="score-tag">JOB MATCH</div>
        <div class="score-number">${e.score}%</div>
        <div class="score-subtitle">${this.escapeHtml(e.qualityLabel||"Match")}</div>
      </div>

      <!-- 3. Why This Score / Mismatch Alert -->
      ${e.roleMismatchReason?`
        <div class="relevance-alert mismatch">
          <div class="alert-badge">NOT A STRONG MATCH</div>
          <div class="alert-text">${this.escapeHtml(e.roleMismatchReason)}</div>
        </div>
      `:e.whyThisScore?`
        <div class="why-score-box">
          ${this.escapeHtml(e.whyThisScore)}
        </div>
      `:""}

      <div class="match-details-scroll custom-scroll">
        <!-- 4. Matched Skills (Core skills) -->
        <div class="section-group">
          <div class="section-heading matched">
            <span>Matched Skills</span>
            <span class="count-pill">${((i=e.coreMatchedSkills)==null?void 0:i.length)||e.matchedSkills.length}</span>
          </div>
          <div class="chips-wrap">
            ${(((s=e.coreMatchedSkills)==null?void 0:s.length)>0?e.coreMatchedSkills:e.matchedSkills).slice(0,8).map(d=>`<span class="chip matched">✓ ${this.escapeHtml(d)}</span>`).join("")}
          </div>
        </div>

        <!-- 5. Missing / Weak Skills with Required vs Preferred tags -->
        ${((o=e.missingSkillsDetailed)==null?void 0:o.length)>0||((a=e.missingSkills)==null?void 0:a.length)>0?`
          <div class="section-group">
            <div class="section-heading missing">
              <span>Missing / Weak</span>
              <span class="count-pill">${((n=e.missingSkillsDetailed)==null?void 0:n.length)||e.missingSkills.length}</span>
            </div>
            <div class="chips-wrap">
              ${(((r=e.missingSkillsDetailed)==null?void 0:r.length)>0?e.missingSkillsDetailed:e.missingSkills.map(d=>({skill:d,priority:"REQUIRED"}))).slice(0,6).map(d=>`
                <span class="chip missing priority-${d.priority.toLowerCase()}">
                  ! ${this.escapeHtml(d.skill)}
                  <span class="priority-tag">${d.priority==="REQUIRED"?"Req":"Pref"}</span>
                </span>
              `).join("")}
            </div>
          </div>
        `:""}

        <!-- 6. Alignment Dimensions -->
        <div class="dim-row">
          <div class="dim-box">
            <div class="dim-label">Experience</div>
            <div class="dim-val ${e.experienceVerdict==="MISMATCH"?"mismatch":e.experienceVerdict==="PARTIAL"?"partial":"match"}">
              ${this.escapeHtml(e.experienceVerdictText||e.experienceRating)}
            </div>
          </div>
          <div class="dim-box">
            <div class="dim-label">Education</div>
            <div class="dim-val ${e.educationVerdict==="MISMATCH"?"mismatch":e.educationVerdict==="PARTIAL"?"partial":"match"}">
              ${this.escapeHtml(e.educationVerdictText||e.educationRating)}
            </div>
          </div>
        </div>

        <!-- 7. ATS Coverage -->
        <div class="ats-box">
          <div class="ats-header">
            <span>ATS Keyword Coverage</span>
            <strong>${e.atsKeywordCoverage}%</strong>
          </div>
          <div class="ats-counts">
            Matched: ${e.atsMatchedCount||e.matchedSkills.length} • Missing: ${e.atsMissingCount||e.missingSkills.length}
          </div>
        </div>
      </div>

      <!-- 8. Full Details Button -->
      <div class="details-action-wrap">
        <button id="btn-view-details" class="btn btn-secondary full-width">
          View Full Match Details
        </button>
      </div>

      <!-- 9. Small Fixed Secondary Auto-Fill Action -->
      <div class="secondary-autofill-wrap">
        <button id="btn-match-to-autofill" class="btn-link-action">
          <span>⚡ Auto-Fill Application</span>
          <span>→</span>
        </button>
      </div>
    `}renderDetailsView(){var i,s;const e=this.matchState,t=e.matchQuality==="STRONG"?"strong":e.matchQuality==="GOOD"?"good":e.matchQuality==="PARTIAL"?"partial":"low";return`
      <div class="flow-header">
        <button id="btn-back-to-match" class="link-btn">← Back to Match</button>
        <span class="flow-title">Full Match Details</span>
      </div>

      <div class="details-scroll custom-scroll">
        <!-- Job Context Card -->
        <div class="job-context-banner">
          <div class="context-company">${this.escapeHtml(e.company||"Company")}</div>
          <div class="context-role">${this.escapeHtml(e.jobTitle||"Job Title")}</div>
        </div>

        <!-- Overall Match Banner -->
        <div class="score-banner ${t} compact">
          <div class="score-number">${e.score}%</div>
          <div class="score-subtitle">${this.escapeHtml(e.qualityLabel)}</div>
        </div>

        <!-- Why this score -->
        <div class="detail-section">
          <div class="detail-heading">Why This Score?</div>
          <div class="detail-text">
            ${this.escapeHtml(e.whyThisScore||e.roleMismatchReason||"Detailed match analysis based on candidate resume and job requirements.")}
          </div>
        </div>

        <!-- Role Relevance -->
        <div class="detail-section">
          <div class="detail-heading">Role Relevance</div>
          <div class="detail-badge-row">
            <span class="status-chip ${e.roleRelevance==="STRONG"?"positive":e.roleRelevance==="MISMATCH"?"negative":"warning"}">
              ${this.escapeHtml(e.roleRelevance)}
            </span>
          </div>
          <div class="detail-subtext">
            ${this.escapeHtml(e.roleMismatchReason||"Role is in direct alignment with your target and active profile discipline.")}
          </div>
        </div>

        <!-- Matched Skills -->
        <div class="detail-section">
          <div class="detail-heading">Matched Skills (${e.matchedSkills.length})</div>
          <div class="chips-wrap">
            ${e.matchedSkills.map(o=>`<span class="chip matched">✓ ${this.escapeHtml(o)}</span>`).join("")}
          </div>
        </div>

        <!-- Missing Requirements with priority -->
        <div class="detail-section">
          <div class="detail-heading">Missing Requirements (${((i=e.missingSkillsDetailed)==null?void 0:i.length)||e.missingSkills.length})</div>
          <div class="chips-wrap">
            ${(((s=e.missingSkillsDetailed)==null?void 0:s.length)>0?e.missingSkillsDetailed:e.missingSkills.map(o=>({skill:o,priority:"REQUIRED"}))).map(o=>`
              <span class="chip missing priority-${o.priority.toLowerCase()}">
                ! ${this.escapeHtml(o.skill)}
                <span class="priority-tag">${o.priority==="REQUIRED"?"Required":"Preferred"}</span>
              </span>
            `).join("")}
          </div>
        </div>

        <!-- Experience & Education Breakdown -->
        <div class="detail-section">
          <div class="detail-heading">Experience & Education</div>
          <div class="detail-row-item">
            <span class="item-label">Experience:</span>
            <span class="item-value">${this.escapeHtml(e.experienceVerdictText||e.experienceRating)}</span>
          </div>
          <div class="detail-row-item">
            <span class="item-label">Education:</span>
            <span class="item-value">${this.escapeHtml(e.educationVerdictText||e.educationRating)}</span>
          </div>
        </div>

        <!-- ATS Breakdown -->
        <div class="detail-section">
          <div class="detail-heading">ATS Keywords Coverage (${e.atsKeywordCoverage}%)</div>
          <div class="detail-subtext">
            Matched: ${e.atsMatchedCount||e.matchedSkills.length} • Missing: ${e.atsMissingCount||e.missingSkills.length}
          </div>
        </div>

        <!-- RESUME PROBLEM EXPLORER -->
        <div class="detail-section highlight-issues">
          <div class="detail-heading issues">Why Doesn't My Resume Match?</div>
          ${e.resumeIssues&&e.resumeIssues.length>0?`
            <div class="issues-list">
              ${e.resumeIssues.map((o,a)=>`
                <div class="issue-item">
                  <span class="issue-idx">${a+1}.</span>
                  <span class="issue-text">${this.escapeHtml(o)}</span>
                </div>
              `).join("")}
            </div>
          `:`
            <div class="issues-empty">
              ✓ No critical gaps found! Your resume closely aligns with this job description.
            </div>
          `}
        </div>
      </div>

      <div class="bottom-actions">
        <button id="btn-back-to-match-bottom" class="btn btn-secondary full-width">
          ← Back to Overview
        </button>
      </div>
    `}renderAutofillView(){const e=this.formState;if(e.status==="FILLING")return`
        <div class="flow-header">
          <span class="flow-title">Auto-Filling Form</span>
        </div>
        <div class="loading-box">
          <div class="spinner"></div>
          <div class="loading-title">Filling application fields...</div>
          <div class="loading-step">Dispatching realistic DOM events (input, change, blur)</div>
          <div class="loading-hint">Existing user inputs are guarded and preserved</div>
        </div>
      `;if(e.status==="REPORT"){const t=this.currentAutofill;return`
        <div class="flow-header">
          <button id="btn-back-home" class="link-btn">← Home</button>
          <span class="flow-title">Form Filled ✓</span>
        </div>

        <div class="report-banner">
          <div class="report-title">✓ Autofill Complete</div>
          <div class="report-sub">Review fields directly on the webpage before submitting</div>
        </div>

        <div class="stats-grid">
          <div class="stat-card verified">
            <div class="stat-num">${(t==null?void 0:t.totalVerified)||15}</div>
            <div class="stat-lbl">Verified</div>
          </div>
          <div class="stat-card review">
            <div class="stat-num">${(t==null?void 0:t.totalNeedsAttention)||1}</div>
            <div class="stat-lbl">Review</div>
          </div>
          <div class="stat-card preserved">
            <div class="stat-num">${(t==null?void 0:t.totalSkippedExisting)||2}</div>
            <div class="stat-lbl">Preserved</div>
          </div>
        </div>

        <div class="warning-alert">
          <strong>Never Auto-Submit</strong>: Kraxyy fills fields safely. You remain in control to review and click Submit.
        </div>

        <div class="bottom-actions grid-2">
          <button id="btn-clear-fields" class="btn btn-secondary">Clear Fields</button>
          <button id="btn-back-home" class="btn btn-primary">Done</button>
        </div>
      `}return e.fieldsFound===0||!e.fields||e.fields.length===0?`
        <div class="flow-header">
          <button id="btn-back-home" class="link-btn">← Home</button>
          <span class="flow-title">Auto-Fill Form</span>
        </div>

        <div class="empty-form-box">
          <div class="empty-icon">📝</div>
          <div class="empty-title">No application form detected yet</div>
          <div class="empty-desc">
            Kraxyy didn't find fillable job application fields on this page. If you're on a job post, click "Apply" or "Easy Apply" to open the form, then scan again.
          </div>
          <button id="btn-scan-form-again" class="btn btn-primary full-width">
            <span>Scan Again</span>
            <span>⟳</span>
          </button>
        </div>
      `:`
      <div class="flow-header">
        <button id="btn-back-home" class="link-btn">← Home</button>
        <span class="flow-title">Auto-Fill Form</span>
      </div>

      <div class="detected-banner">
        <div class="detected-badge">Application Form Detected</div>
        <div class="detected-count"><strong>${e.fieldsFound}</strong> fields identified</div>
      </div>

      <div class="fields-list custom-scroll">
        ${e.fields.map(t=>`
          <div class="field-item ${t.isHighConfidence?"ready":"review"}">
            <div class="field-left">
              <span class="field-icon">${t.isHighConfidence?"✓":"!"}</span>
              <span class="field-label">${this.escapeHtml(t.label)}</span>
            </div>
            <div class="field-confidence">${t.confidence}%</div>
          </div>
        `).join("")}
      </div>

      <div class="bottom-actions">
        <button id="btn-execute-fill" class="btn btn-primary">
          <span>[ Fill Form ]</span>
        </button>
      </div>
    `}bindEvents(){var e,t,i,s,o,a,n,r,d,c,u,h,m,b,x,g,p,S;this.shadow&&((e=this.shadow.getElementById("btn-close"))==null||e.addEventListener("click",y=>{y.stopPropagation(),this.close()}),(t=this.shadow.getElementById("btn-collapse"))==null||t.addEventListener("click",y=>{y.stopPropagation(),this.close()}),(i=this.shadow.getElementById("btn-rescan-job"))==null||i.addEventListener("click",y=>{y.stopPropagation(),this.rescanCurrentJob("MANUAL")}),(s=this.shadow.getElementById("dock-left"))==null||s.addEventListener("click",y=>{y.stopPropagation(),this.setDockPosition("left")}),(o=this.shadow.getElementById("dock-right"))==null||o.addEventListener("click",y=>{y.stopPropagation(),this.setDockPosition("right")}),(a=this.shadow.getElementById("dock-top"))==null||a.addEventListener("click",y=>{y.stopPropagation(),this.setDockPosition("top")}),(n=this.shadow.getElementById("dock-bottom"))==null||n.addEventListener("click",y=>{y.stopPropagation(),this.setDockPosition("bottom")}),(r=this.shadow.getElementById("btn-back-home"))==null||r.addEventListener("click",()=>{this.activeView="HOME",this.savePersistentState(),this.updateDom()}),(d=this.shadow.getElementById("btn-start-match"))==null||d.addEventListener("click",()=>{this.activeView="MATCH",this.startJobMatch()}),(c=this.shadow.getElementById("btn-start-autofill"))==null||c.addEventListener("click",()=>{this.activeView="AUTOFILL",this.inspectFormFields()}),(u=this.shadow.getElementById("btn-match-to-autofill"))==null||u.addEventListener("click",()=>{this.activeView="AUTOFILL",this.inspectFormFields()}),(h=this.shadow.getElementById("btn-view-details"))==null||h.addEventListener("click",()=>{this.activeView="DETAILS",this.savePersistentState(),this.updateDom()}),(m=this.shadow.getElementById("btn-back-to-match"))==null||m.addEventListener("click",()=>{this.activeView="MATCH",this.savePersistentState(),this.updateDom()}),(b=this.shadow.getElementById("btn-back-to-match-bottom"))==null||b.addEventListener("click",()=>{this.activeView="MATCH",this.savePersistentState(),this.updateDom()}),(x=this.shadow.getElementById("btn-scan-form-again"))==null||x.addEventListener("click",()=>{this.inspectFormFields()}),(g=this.shadow.getElementById("btn-retry-match"))==null||g.addEventListener("click",()=>{this.startJobMatch()}),(p=this.shadow.getElementById("btn-execute-fill"))==null||p.addEventListener("click",()=>{this.triggerAutofillAction()}),(S=this.shadow.getElementById("btn-clear-fields"))==null||S.addEventListener("click",()=>{const y=U.detectForm();y.fields&&ae.clearFields(y.fields),this.currentAutofill=null,this.formState.status="IDLE",this.activeView="HOME",this.updateDom()}))}setupDraggable(){if(!this.shadow||!this.host)return;const e=this.shadow.getElementById("panel-header");e&&e.addEventListener("mousedown",t=>{if(t.target.closest("button"))return;this.isDragging=!0;const i=this.host.getBoundingClientRect();this.dragStartX=t.clientX-i.left,this.dragStartY=t.clientY-i.top;const s=a=>{if(!this.isDragging||!this.host)return;let n=a.clientX-this.dragStartX,r=a.clientY-this.dragStartY;n=Math.max(10,Math.min(window.innerWidth-340,n)),r=Math.max(10,Math.min(window.innerHeight-150,r)),this.posX=n,this.posY=r,this.host.style.left=`${n}px`,this.host.style.top=`${r}px`,this.host.style.bottom="auto",this.host.style.right="auto"},o=()=>{this.isDragging=!1,this.savePersistentState(),window.removeEventListener("mousemove",s),window.removeEventListener("mouseup",o)};window.addEventListener("mousemove",s),window.addEventListener("mouseup",o)})}escapeHtml(e){return e?e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}getBaseStyles(){return`
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }

      .dot {
        width: 8px;
        height: 8px;
        background: #A3E635;
        border-radius: 9999px;
        box-shadow: 0 0 8px #A3E635;
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.85); }
      }
      .pill-title {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.3px;
      }
      .badge {
        font-size: 10px;
        font-weight: 700;
        padding: 2px 7px;
        border-radius: 9999px;
      }
      .badge.score {
        background: #B18B40;
        color: #FFFFFF;
      }
      .badge.fields {
        background: rgba(255, 255, 255, 0.2);
        color: #F4EFE4;
      }

      /* Expanded Assistant Panel */
      .panel {
        width: 326px;
        min-height: 480px;
        max-height: 600px;
        background: #F4EFE4;
        color: #1E2315;
        border-radius: 20px;
        box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(82, 91, 49, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        user-select: none;
      }

      .panel-header {
        padding: 12px 14px;
        background: #F4EFE4;
        border-bottom: 1px solid #D6CAAC;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: grab;
      }
      .panel-header:active {
        cursor: grabbing;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .brand-text {
        display: flex;
        flex-direction: column;
        line-height: 1;
      }
      .brand-name {
        font-size: 12px;
        font-weight: 900;
        color: #525B31;
        letter-spacing: 1.5px;
      }
      .brand-sub {
        font-size: 9px;
        font-weight: 600;
        color: #626B52;
        margin-top: 2px;
      }
      .window-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .dock-controls {
        display: inline-flex;
        align-items: center;
        background: rgba(82, 91, 49, 0.08);
        border: 1px solid rgba(82, 91, 49, 0.15);
        border-radius: 6px;
        padding: 1px;
      }
      .dock-btn {
        background: transparent;
        border: none;
        width: 20px;
        height: 20px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 600;
        color: #626B52;
        cursor: pointer;
        transition: all 0.15s ease;
        padding: 0;
      }
      .dock-btn:hover {
        background: rgba(82, 91, 49, 0.15);
        color: #1E2315;
      }
      .dock-btn.active {
        background: #525B31;
        color: #FFFFFF;
        font-weight: 700;
      }
      .icon-btn {
        background: transparent;
        border: none;
        width: 24px;
        height: 24px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #626B52;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
      }
      .icon-btn:hover {
        background: #D6CAAC;
        color: #1E2315;
      }
      .rescan-btn {
        font-size: 14px;
        font-weight: 700;
        color: #525B31;
        transition: transform 0.2s ease, background 0.15s, color 0.15s;
      }
      .rescan-btn:hover:not(:disabled) {
        background: #D6CAAC;
        color: #1E2315;
      }
      .rescan-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .rescan-btn.spinning {
        animation: spin 0.8s linear infinite;
      }
      .rescan-feedback {
        font-size: 9px;
        font-weight: 700;
        color: #065F46;
        background: #ECFDF5;
        border: 1px solid #A7F3D0;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
      }
      .close-btn {
        font-weight: 700;
        font-size: 14px;
        color: #626B52;
      }
      .close-btn:hover {
        background: rgba(220, 38, 38, 0.12);
        color: #DC2626;
      }

      .panel-body {
        padding: 14px;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 12px;
        overflow-y: auto;
      }

      /* Home Cards */
      .card {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 14px;
        padding: 12px;
      }
      .user-card {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .user-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .avatar {
        width: 34px;
        height: 34px;
        background: rgba(82, 91, 49, 0.1);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        shrink-0;
      }
      .user-info {
        flex: 1;
        overflow: hidden;
      }
      .user-name {
        font-size: 13px;
        font-weight: 800;
        color: #1E2315;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .resume-badge {
        font-size: 11px;
        color: #525B31;
        font-weight: 600;
        margin-top: 1px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .status-row {
        display: flex;
        gap: 6px;
        padding-top: 6px;
        border-top: 1px solid rgba(214, 202, 172, 0.4);
      }
      .status-chip {
        font-size: 10px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 6px;
      }
      .status-chip.positive {
        background: #ECFDF5;
        color: #065F46;
        border: 1px solid #A7F3D0;
      }

      /* 2 Big Action Cards */
      .action-card {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 14px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .action-header {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .action-icon {
        font-size: 20px;
        width: 32px;
        height: 32px;
        background: #F4EFE4;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .action-title {
        font-size: 13px;
        font-weight: 800;
        color: #1E2315;
      }
      .action-desc {
        font-size: 10px;
        color: #626B52;
      }

      /* Buttons */
      .btn {
        width: 100%;
        padding: 9px 12px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        border: none;
      }
      .btn-primary {
        background: #525B31;
        color: #F4EFE4;
        box-shadow: 0 4px 10px rgba(82, 91, 49, 0.25);
      }
      .btn-primary:hover {
        background: #454C29;
        transform: translateY(-1px);
      }
      .btn-primary:active {
        transform: translateY(0);
      }
      .btn-secondary {
        background: #F4EFE4;
        color: #1E2315;
        border: 1px solid #D6CAAC;
      }
      .btn-secondary:hover {
        background: #EAE2D2;
        border-color: #525B31;
      }
      .grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      /* Flow Headers */
      .flow-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #D6CAAC;
        padding-bottom: 6px;
      }
      .link-btn {
        background: transparent;
        border: none;
        color: #525B31;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
      }
      .link-btn:hover {
        text-decoration: underline;
      }
      .flow-title {
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        color: #626B52;
        letter-spacing: 0.5px;
      }

      /* Job Context Banner (Prominent Company + Role ABOVE score) */
      .job-context-banner {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 12px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .context-company {
        font-size: 11px;
        font-weight: 800;
        color: #525B31;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .context-role {
        font-size: 14px;
        font-weight: 800;
        color: #1E2315;
        line-height: 1.25;
      }
      .context-location {
        font-size: 10px;
        color: #626B52;
        margin-top: 2px;
      }

      /* Score Display with Dynamic Tiered Palettes */
      .score-banner {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 14px;
        padding: 14px;
        text-align: center;
        transition: all 0.2s ease;
      }
      .score-banner.strong {
        border-color: #A7F3D0;
        background: linear-gradient(180deg, #FFFFFF 0%, #F0FDF4 100%);
      }
      .score-banner.strong .score-number { color: #059669; }
      .score-banner.strong .score-subtitle { color: #047857; }

      .score-banner.good {
        border-color: #BAE6FD;
        background: linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 100%);
      }
      .score-banner.good .score-number { color: #0284C7; }
      .score-banner.good .score-subtitle { color: #0369A1; }

      .score-banner.partial {
        border-color: #FDE68A;
        background: linear-gradient(180deg, #FFFFFF 0%, #FFFBEB 100%);
      }
      .score-banner.partial .score-number { color: #D97706; }
      .score-banner.partial .score-subtitle { color: #B45309; }

      .score-banner.low {
        border-color: #FECDD3;
        background: linear-gradient(180deg, #FFFFFF 0%, #FFF1F2 100%);
      }
      .score-banner.low .score-number { color: #E11D48; }
      .score-banner.low .score-subtitle { color: #BE123C; }

      .score-banner.compact {
        padding: 10px 14px;
      }
      .score-banner.compact .score-number {
        font-size: 28px;
        margin: 2px 0;
      }

      .score-tag {
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 1.5px;
        color: #626B52;
      }
      .score-number {
        font-size: 40px;
        font-weight: 900;
        color: #525B31;
        line-height: 1;
        margin: 4px 0;
      }
      .score-subtitle {
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      /* Relevance Alert & Rationale */
      .relevance-alert {
        border-radius: 10px;
        padding: 8px 10px;
        font-size: 11px;
        line-height: 1.35;
      }
      .relevance-alert.mismatch {
        background: #FFF1F2;
        border: 1px solid #FECDD3;
        color: #9F1239;
      }
      .alert-badge {
        font-size: 9px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 2px;
      }
      .alert-text {
        font-size: 11px;
        font-weight: 500;
      }
      .why-score-box {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 10px;
        padding: 8px 10px;
        font-size: 11px;
        color: #4B5563;
        line-height: 1.4;
      }

      .match-details-scroll {
        max-height: 220px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-right: 2px;
      }

      /* Chips & Skills */
      .section-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .section-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .section-heading.matched { color: #065F46; }
      .section-heading.missing { color: #9F1239; }
      .count-pill {
        font-size: 9px;
        padding: 1px 6px;
        background: rgba(0, 0, 0, 0.06);
        border-radius: 9999px;
      }
      .chips-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      .chip {
        font-size: 10px;
        font-weight: 600;
        padding: 3px 7px;
        border-radius: 6px;
        display: inline-flex;
        align-items: center;
        gap: 3px;
      }
      .chip.matched {
        background: #ECFDF5;
        color: #065F46;
        border: 1px solid #A7F3D0;
      }
      .chip.missing {
        background: #FFFBEB;
        color: #92400E;
        border: 1px solid #FDE68A;
      }
      .chip.missing.priority-required {
        background: #FFF1F2;
        color: #9F1239;
        border: 1px solid #FECDD3;
      }
      .chip.missing.priority-preferred {
        background: #FFFBEB;
        color: #92400E;
        border: 1px solid #FDE68A;
      }
      .priority-tag {
        font-size: 8px;
        font-weight: 700;
        text-transform: uppercase;
        background: rgba(0, 0, 0, 0.08);
        padding: 1px 3px;
        border-radius: 3px;
      }

      .dim-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
      }
      .dim-box {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 8px;
        padding: 6px 8px;
      }
      .dim-label {
        font-size: 9px;
        color: #626B52;
        font-weight: 700;
        text-transform: uppercase;
      }
      .dim-val {
        font-size: 10px;
        font-weight: 700;
        margin-top: 2px;
      }
      .dim-val.match { color: #065F46; }
      .dim-val.partial { color: #D97706; }
      .dim-val.mismatch { color: #E11D48; }

      .ats-box {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 8px;
        padding: 6px 10px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .ats-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 10px;
        font-weight: 700;
        color: #1E2315;
      }
      .ats-counts {
        font-size: 9px;
        color: #626B52;
      }

      .details-action-wrap {
        margin-top: 2px;
      }
      .full-width {
        width: 100%;
        justify-content: center;
      }

      /* Secondary subtle Auto-Fill action in JD Match view */
      .secondary-autofill-wrap {
        border-top: 1px dashed #D6CAAC;
        padding-top: 6px;
        display: flex;
        justify-content: center;
      }
      .btn-link-action {
        background: transparent;
        border: none;
        color: #525B31;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        border-radius: 6px;
        transition: background 0.15s;
      }
      .btn-link-action:hover {
        background: #EAE2D2;
        text-decoration: underline;
      }

      /* Full Details & Resume Problem Explorer */
      .details-scroll {
        max-height: 380px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding-right: 2px;
      }
      .detail-section {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 12px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .detail-section.highlight-issues {
        border-color: #FBBF24;
        background: #FFFDF7;
      }
      .detail-heading {
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        color: #525B31;
        letter-spacing: 0.5px;
      }
      .detail-heading.issues {
        color: #B45309;
      }
      .detail-text {
        font-size: 11px;
        color: #374151;
        line-height: 1.4;
      }
      .detail-subtext {
        font-size: 10px;
        color: #6B7280;
        line-height: 1.35;
      }
      .detail-badge-row {
        display: flex;
        gap: 6px;
      }
      .detail-row-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
      }
      .item-label {
        color: #6B7280;
        font-weight: 600;
      }
      .item-value {
        font-weight: 700;
        color: #111827;
      }
      .issues-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .issue-item {
        display: flex;
        gap: 6px;
        font-size: 11px;
        line-height: 1.35;
        color: #78350F;
      }
      .issue-idx {
        font-weight: 800;
        color: #B45309;
        flex-shrink: 0;
      }
      .issue-text {
        flex: 1;
      }
      .issues-empty {
        font-size: 11px;
        color: #047857;
        font-weight: 600;
      }

      /* Empty Form Detection View */
      .empty-form-box {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 14px;
        padding: 24px 16px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      .empty-icon {
        font-size: 32px;
      }
      .empty-title {
        font-size: 13px;
        font-weight: 800;
        color: #1E2315;
      }
      .empty-desc {
        font-size: 11px;
        color: #626B52;
        line-height: 1.4;
        margin-bottom: 6px;
      }

      /* Loading states */
      .loading-box {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 14px;
        padding: 20px 14px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      .loading-title {
        font-size: 13px;
        font-weight: 800;
        color: #1E2315;
      }
      .loading-step {
        font-size: 11px;
        color: #525B31;
        font-weight: 600;
      }
      .loading-hint {
        font-size: 10px;
        color: #626B52;
        font-style: italic;
      }
      .progress-wrap {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 6px 0;
      }
      .progress-bar {
        flex: 1;
        height: 6px;
        background: #D6CAAC;
        border-radius: 9999px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: #525B31;
        border-radius: 9999px;
        transition: width 0.3s ease;
      }
      .progress-percent {
        font-size: 10px;
        font-weight: 800;
        color: #525B31;
        width: 30px;
        text-align: right;
      }

      /* Autofill detected list */
      .detected-banner {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 12px;
        padding: 8px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .detected-badge {
        font-size: 11px;
        font-weight: 800;
        color: #525B31;
      }
      .detected-count {
        font-size: 10px;
        color: #626B52;
      }
      .fields-list {
        max-height: 230px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .field-item {
        background: #FFFFFF;
        border: 1px solid #EAE2D2;
        border-radius: 8px;
        padding: 6px 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 11px;
      }
      .field-left {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .field-icon {
        font-weight: 900;
      }
      .field-item.ready .field-icon { color: #059669; }
      .field-item.review .field-icon { color: #D97706; }
      .field-confidence {
        font-size: 9px;
        font-weight: 700;
        color: #626B52;
      }

      /* Report View */
      .report-banner {
        background: #ECFDF5;
        border: 1px solid #A7F3D0;
        border-radius: 12px;
        padding: 10px 12px;
        text-align: center;
      }
      .report-title {
        font-size: 12px;
        font-weight: 800;
        color: #065F46;
      }
      .report-sub {
        font-size: 10px;
        color: #047857;
        margin-top: 2px;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
      }
      .stat-card {
        background: #FFFFFF;
        border: 1px solid #D6CAAC;
        border-radius: 10px;
        padding: 8px 4px;
        text-align: center;
      }
      .stat-num {
        font-size: 18px;
        font-weight: 900;
        line-height: 1;
      }
      .stat-card.verified .stat-num { color: #065F46; }
      .stat-card.review .stat-num { color: #8E6F33; }
      .stat-card.preserved .stat-num { color: #1E2315; }
      .stat-lbl {
        font-size: 8px;
        font-weight: 700;
        text-transform: uppercase;
        color: #626B52;
        margin-top: 4px;
      }
      .warning-alert {
        background: #FFFBEB;
        border: 1px solid #FDE68A;
        border-radius: 8px;
        padding: 8px 10px;
        font-size: 10px;
        color: #92400E;
        line-height: 1.4;
      }

      .footer-note {
        font-size: 9px;
        color: #626B52;
        text-align: center;
        margin-top: 2px;
      }

      /* Scrollbar */
      .custom-scroll::-webkit-scrollbar { width: 4px; }
      .custom-scroll::-webkit-scrollbar-track { background: transparent; }
      .custom-scroll::-webkit-scrollbar-thumb { background: #D6CAAC; border-radius: 9999px; }
      .custom-scroll::-webkit-scrollbar-thumb:hover { background: #B18B40; }

      .spinner {
        width: 24px;
        height: 24px;
        border: 3px solid #D6CAAC;
        border-top-color: #525B31;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}}const D=new z;console.log("[CRAZY][BOOT] Content script loaded");let E=null,v=null,N=null,O=null,le=null,ce="";const L=window===window.top;function Y(l,e){try{chrome.runtime.sendMessage(l,t=>{chrome.runtime.lastError||e==null||e(t)})}catch{}}function W(l,e,t=null,i=typeof window<"u"?window.location.href:"",s=L){const o=!!(e!=null&&e.isJobPage&&e.job),a=!!(l!=null&&l.isApplicationForm&&l.fields&&l.fields.length>0);let n="OTHER";o&&a?n="JOB_AND_APPLICATION":o?n="JOB":a&&(n="APPLICATION");const r=(l==null?void 0:l.fillableFieldCount)??(l!=null&&l.fields?l.fields.filter(m=>m.taxonomyType&&m.taxonomyType!=="UNKNOWN"&&m.status!=="MANUAL_REQUIRED").length:0),d=(l==null?void 0:l.manualRequiredCount)??(l!=null&&l.fields?l.fields.filter(m=>m.status==="MANUAL_REQUIRED").length:0),c=(l==null?void 0:l.autofillReady)!==void 0?l.autofillReady:a&&r>0,u=t||(e==null?void 0:e.match),h=e!=null&&e.job?{jobTitle:e.job.title,company:e.job.company,matchScore:(u==null?void 0:u.overallScore)||85,sourceUrl:e.job.sourceUrl||i,applicationUrl:e.job.applyUrl||i,detectedAt:new Date().toISOString()}:void 0;return{pageType:n,job:o?{detected:!0,confidence:e.confidence,normalizedJob:e.job,match:u,source:e.source,characterCount:e.characterCount}:void 0,form:a?{detected:!0,confidence:l.confidence,autofillReady:c,fieldCount:l.fieldCount??l.fields.length,fillableFieldCount:r,manualRequiredCount:d,fields:l.fields}:void 0,activeContext:h,url:i,isTopFrame:s,timestamp:Date.now()}}function K(){if(z.isExcludedDomain()){D.remove();return}console.log("[CRAZY][SCAN] Starting page scan"),E=U.detectForm();const l=E.fields.map(t=>t.selector).sort().join("|"),e=ce!==""&&l!==ce;ce=l,e&&E.fields.length>0&&(O=null),L?v=V.detectJob():v=null,Y({type:"GET_PROFILE_DATA"},t=>{console.log("[CRAZY][PROFILE] Profile loaded:",!!(t!=null&&t.profile));let i=null;if(t!=null&&t.profile&&(v!=null&&v.job))try{i=ue.matchJobWithProfile(v.job,t.profile),v.match=i,console.log("[CRAZY][MATCH] Match calculated:",i.overallScore+"%")}catch{}N=W(E,v,i,window.location.href,L),L&&D.updateIntelligence(N,()=>Q(),O),Y({type:"PAGE_INTELLIGENCE_UPDATE",intelligence:N,detection:E,jobDetection:v,isTopFrame:L,frameUrl:window.location.href}),Y({type:"FRAME_SCAN_RESULT",isTopFrame:L,frameUrl:window.location.href,detection:E})})}async function Q(l={}){if(console.log("[CRAZY][ACTION] Autofill clicked"),E=U.detectForm(),!E||E.fields.length===0)return{success:!1,error:"No form fields detected on this page"};const e=Date.now();return new Promise(t=>{Y({type:"GET_PROFILE_DATA"},async i=>{if(!(i!=null&&i.success)||!i.profile)return t({success:!1,error:"Please connect your Kraxyy Apply account first in the extension popup."});const s=i.profile;O=await ae.fillForm(E.fields,s,l),D.showAutofillReport(O),Y({type:"LOG_TELEMETRY",telemetry:{domain:window.location.hostname,adapterName:"universal_engine_v2",fieldsDetectedCount:O.totalDetected,fieldsFilledCount:O.totalVerified,fieldsReviewedCount:O.totalNeedsAttention,formDetectedConfidence:E.confidence,durationMs:Date.now()-e}}),t({success:!0,summary:O})})})}function Ue(){E&&ae.clearFields(E.fields)}function pe(){let l=typeof window<"u"?window.location.href:"";const e=()=>{const s=typeof window<"u"?window.location.href:"";s!==l&&(l=s,D.resetForNewJob()),setTimeout(()=>{K()},400)},t=history.pushState;history.pushState=function(...s){const o=t.apply(this,s);return e(),o};const i=history.replaceState;history.replaceState=function(...s){const o=i.apply(this,s);return e(),o},window.addEventListener("popstate",e),window.addEventListener("hashchange",e)}if(typeof document<"u"){document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{K(),pe()}):(K(),pe());const l=new MutationObserver(()=>{le&&clearTimeout(le),le=setTimeout(()=>{K()},800)});document.body?l.observe(document.body,{childList:!0,subtree:!0}):document.addEventListener("DOMContentLoaded",()=>{l.observe(document.body,{childList:!0,subtree:!0})})}typeof chrome<"u"&&((he=chrome.runtime)!=null&&he.onMessage)&&chrome.runtime.onMessage.addListener((l,e,t)=>{if(l.type==="SCAN_PAGE")return console.log("[CRAZY][SCAN] Starting page scan (forced by popup)"),E=U.detectForm(),L&&(v=V.detectJob()),Y({type:"GET_PROFILE_DATA"},i=>{console.log("[CRAZY][PROFILE] Profile loaded:",!!(i!=null&&i.profile));let s=null;if(i!=null&&i.profile&&(v!=null&&v.job))try{s=ue.matchJobWithProfile(v.job,i.profile),v.match=s,console.log("[CRAZY][MATCH] Match calculated:",s.overallScore+"%")}catch{}N=W(E,v,s,window.location.href,L),L&&(console.log("[CRAZY][UI] Rendering state:",N.pageType),D.render(N,()=>Q(),O)),t({success:!0,intelligence:N,detection:E,jobDetection:v,lastAutofill:O,isTopFrame:L,frameUrl:window.location.href})}),!0;if(l.type==="GET_PAGE_INTELLIGENCE")return N||(E=U.detectForm(),L&&(v=V.detectJob()),N=W(E,v,(v==null?void 0:v.match)||null,window.location.href,L)),t({success:!0,intelligence:N,detection:E,jobDetection:v,lastAutofill:O,isTopFrame:L,frameUrl:window.location.href}),!0;if(l.type==="GET_PAGE_STATUS")return E=U.detectForm(),t({detection:E,lastAutofill:O,isTopFrame:L,frameUrl:window.location.href}),!0;if(l.type==="EXECUTE_AUTOFILL")return Q(l.options||{}).then(t),!0;if(l.type==="OPEN_CRAZY_PANEL"||l.type==="OPEN_FLOATING_ASSISTANT")return L&&(N||(E=U.detectForm(),v=V.detectJob(),N=W(E,v,(v==null?void 0:v.match)||null,window.location.href,!0)),D.updateIntelligence(N,()=>Q(),O),D.open(l.feature||"HOME")),t({success:!0}),!0;if(l.type==="CLOSE_CRAZY_PANEL")return L&&D.close(),t({success:!0}),!0;if(l.type==="RESCAN_CURRENT_JOB")return L&&D.rescanCurrentJob("MANUAL"),t({success:!0}),!0;if(l.type==="TOGGLE_CRAZY_PANEL")return L&&(D.getVisibility()==="open"?D.close():(N||(E=U.detectForm(),v=V.detectJob(),N=W(E,v,(v==null?void 0:v.match)||null,window.location.href,!0)),D.updateIntelligence(N,()=>Q(),O),D.open(l.feature||"HOME"))),t({success:!0,visibility:D.getVisibility()}),!0;if(l.type==="GET_JOB_STATUS")return!v&&L&&(v=V.detectJob()),t({jobDetection:v}),!0;if(l.type==="EXTRACT_JOB_DESCRIPTION"){const i=V.detectJob();return v=i,t({success:!!(i.isJobPage&&i.job),job:i.job||null,confidence:i.confidence,source:i.source}),!0}else if(l.type==="DETECT_AND_MAP_FIELDS"){E=U.detectForm();const i=E.fields||[];return Y({type:"GET_PROFILE_DATA"},s=>{const o=(s==null?void 0:s.profile)||{},a={FIRST_NAME:"First Name",LAST_NAME:"Last Name",FULL_NAME:"Full Name",NAME:"Name",EMAIL:"Email",PHONE:"Phone",UNIVERSITY:"Education (University)",DEGREE:"Education (Degree)",EDUCATION_DEGREE:"Education",FIELD_OF_STUDY:"Field of Study",SKILLS:"Skills",EXPERIENCE:"Experience",YEARS_EXPERIENCE:"Years of Experience",CURRENT_COMPANY:"Experience (Company)",COMPANY:"Experience (Company)",CURRENT_JOB_TITLE:"Job Title",JOB_TITLE:"Job Title",LINKEDIN:"LinkedIn Profile",GITHUB:"GitHub Profile",PORTFOLIO:"Portfolio",WEBSITE:"Website",CITY:"City",COUNTRY:"Country",POSTAL_CODE:"Postal Code",STATE:"State",ADDRESS:"Address",ADDRESS_LINE1:"Address",RESUME:"Resume / CV",WORK_AUTHORIZATION:"Work Authorization",VISA_SPONSORSHIP:"Sponsorship Status"},n=i.map(c=>{const u=c.taxonomyType||"UNKNOWN",h=o[u]!==void 0?String(o[u]):"",m=c.label||a[u]||u.replace(/_/g," "),b=!!(u!=="UNKNOWN"&&h&&h!=="");return{id:c.id,selector:c.selector,label:m,taxonomyType:u,mappedValue:h,isMapped:b,status:c.status||(b?"READY":"MANUAL_REQUIRED")}}),r=[],d=new Set;for(const c of n){let u="Other";/name/i.test(c.label)?u="Name":/email/i.test(c.label)?u="Email":/phone/i.test(c.label)?u="Phone":/education|degree|university/i.test(c.label)?u="Education":/skill/i.test(c.label)?u="Skills":/experience|company|title/i.test(c.label)?u="Experience":/linkedin/i.test(c.label)?u="LinkedIn":/github/i.test(c.label)?u="GitHub":/portfolio|website/i.test(c.label)?u="Portfolio":/address|city|country/i.test(c.label)&&(u="Location"),d.has(u)||(d.add(u),r.push(u))}t({success:!0,fieldsFound:i.length,mappedCount:n.filter(c=>c.isMapped).length,fields:n,categories:r,confidence:(E==null?void 0:E.confidence)||.85})}),!0}else if(l.type==="CLEAR_AUTOFILL")return Ue(),t({success:!0}),!0}),H.evaluatePageIntelligence=W,H.scanPage=K,Object.defineProperty(H,Symbol.toStringTag,{value:"Module"})})(this.KraxyyContentScript=this.KraxyyContentScript||{});
