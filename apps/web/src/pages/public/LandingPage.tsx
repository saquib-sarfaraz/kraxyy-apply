import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Check
} from 'lucide-react';
import { KraxyySculpturalK } from '../../components/3d/KraxyySculpturalK';
import { useSmoothScroll } from '../../hooks/useSmoothScroll';
import { INSTALL_EXTENSION_URL } from '../../config/extension';
import { ChromeIcon } from '../../components/icons/ChromeIcon';

export const LandingPage: React.FC = () => {
  // Initialize Lenis smooth scroll
  useSmoothScroll();

  // Product Sticky Storytelling Step
  const [activeProductStep, setActiveProductStep] = useState<number>(1);

  // Extension Demo State
  const [extState, setExtState] = useState<'detected' | 'filling' | 'filled'>('detected');

  // Pipeline Interactive State
  const [pipelineApps, setPipelineApps] = useState([
    { id: 1, role: 'Frontend Developer', company: 'Acme Technologies', stage: 'APPLIED', comp: '$135k', location: 'Remote' },
    { id: 2, role: 'Software Engineer', company: 'Orbit AI', stage: 'SCREENING', comp: '$150k', location: 'Hybrid' },
    { id: 3, role: 'Product Engineer', company: 'Nova Systems', stage: 'INTERVIEW', comp: '$160k', location: 'Remote' },
    { id: 4, role: 'Fullstack Architect', company: 'Vanguard', stage: 'SAVED', comp: '$175k', location: 'On-site' }
  ]);

  // Advance Kanban pipeline
  const advanceApplication = (id: number) => {
    const stages = ['SAVED', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER'];
    setPipelineApps((prev) =>
      prev.map((app) => {
        if (app.id === id) {
          const currentIndex = stages.indexOf(app.stage);
          const nextIndex = (currentIndex + 1) % stages.length;
          return { ...app, stage: stages[nextIndex] };
        }
        return app;
      })
    );
  };

  return (
    <div className="w-full bg-cream text-charcoal font-sans selection:bg-mustard selection:text-white">
      {/* ============================================================ */}
      {/* 1. HERO SECTION (Interaction-First, 80% Visual, 20% Text) */}
      {/* ============================================================ */}
      <section className="relative min-h-[92vh] pt-28 pb-12 px-6 sm:px-8 max-w-7xl mx-auto flex flex-col justify-between overflow-hidden">
        {/* Subtle Ambient Lighting & Paper Texture */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] bg-radial-soft pointer-events-none -z-10" />
        <div className="absolute inset-0 bg-subtle-grid opacity-40 pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center flex-1 my-auto">
          {/* Left Column: 20% Clean Typography */}
          <div className="lg:col-span-5 space-y-6 z-10">
            {/* Small Eyebrow */}
            <div className="text-[11px] font-mono font-bold tracking-[0.25em] text-mustard uppercase">
              KRAXYY APPLY
            </div>

            {/* Large Minimal Editorial Heading */}
            <h1 className="type-display text-charcoal">
              APPLY WITHOUT<br />
              <span className="text-olive">THE REPETITION.</span>
            </h1>

            {/* Small Supporting Line */}
            <p className="type-body text-charcoal/80 font-normal max-w-sm">
              Your profile, ready for every application.
            </p>

            {/* Strictly 2 Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <Link
                to="/register"
                className="btn-tactile px-6 py-3.5 rounded-xl bg-olive text-cream font-bold text-xs shadow-soft hover:bg-olive-hover transition flex items-center gap-2 group"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 text-mustard-light transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <a
                href="#how-it-works"
                className="px-5 py-3.5 rounded-xl border border-beige bg-cream/70 hover:border-olive/60 font-semibold text-xs text-charcoal transition"
              >
                See How It Works
              </a>
            </div>
          </div>

          {/* Right / Center: 80% Dominant 3D Sculptural K (Directly in Cream environment) */}
          <div className="lg:col-span-7 relative flex items-center justify-center min-h-[460px] lg:min-h-[580px]">
            <KraxyySculpturalK />
          </div>
        </div>

        {/* Scroll Indicator at Bottom of Hero */}
        <div className="flex flex-col items-center justify-center pt-6 pb-2 text-center pointer-events-none select-none">
          <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-charcoal-muted uppercase">
            SCROLL TO EXPLORE
          </span>
          <div className="w-0.5 h-7 bg-beige/60 mt-2 relative overflow-hidden rounded-full">
            <div className="w-full h-3 bg-olive rounded-full animate-scroll-line" />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. TRANSITION SECTION (Large Editorial Typography) */}
      {/* ============================================================ */}
      <section className="py-24 sm:py-32 border-y border-beige/60 bg-cream/40">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 text-center space-y-6">
          <p className="text-xs font-mono font-bold tracking-[0.2em] text-mustard uppercase">
            THE REALITY OF JOB HUNTING
          </p>
          <div className="space-y-2">
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl tracking-tight text-charcoal">
              YOU'VE ALREADY ENTERED
            </h2>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl tracking-tight text-olive">
              THIS INFORMATION.
            </h2>
            <h3 className="font-display font-bold text-2xl sm:text-4xl text-charcoal-muted pt-3">
              WHY TYPE IT AGAIN?
            </h3>
          </div>
          <p className="text-sm sm:text-base text-charcoal/70 max-w-xl mx-auto leading-relaxed pt-2">
            Every company uses a different portal. Greenhouse, Lever, Workday, Ashby.
            Yet every form asks the exact same questions. Kraxyy eliminates the busywork.
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. PRODUCT STORYTELLING SECTION (#autofill) */}
      {/* ============================================================ */}
      <section id="autofill" className="py-28 px-6 sm:px-8 max-w-6xl mx-auto">
        <div className="mb-14 space-y-2">
          <div className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-mustard">
            PRODUCT ARCHITECTURE
          </div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight text-charcoal">
            A continuous, intelligent loop.
          </h2>
        </div>

        {/* Interactive Sticky Storytelling Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Interactive Story Steps */}
          <div className="lg:col-span-5 space-y-4">
            {[
              {
                step: 1,
                num: '01',
                title: 'Canonical Profile',
                desc: 'Your career history, education, skills, and resume stored once in high-fidelity.'
              },
              {
                step: 2,
                num: '02',
                title: 'Field Detection',
                desc: 'DOM heuristics discover compatible inputs instantly without tracking pixels.'
              },
              {
                step: 3,
                num: '03',
                title: 'Instant Population',
                desc: 'Inputs, selects, textareas, and radios populated with React-friendly dispatch.'
              },
              {
                step: 4,
                num: '04',
                title: 'Candidate Review',
                desc: 'Visual audit checklist ensures you verify every single value before submission.'
              }
            ].map((item) => (
              <div
                key={item.step}
                onClick={() => setActiveProductStep(item.step)}
                className={`cursor-pointer p-6 rounded-2xl border transition-all duration-300 ${
                  activeProductStep === item.step
                    ? 'bg-white border-olive/30 shadow-elevated translate-x-2'
                    : 'bg-cream-50/60 border-beige/60 hover:bg-white/60 hover:border-beige'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className={`font-mono text-xs font-bold ${activeProductStep === item.step ? 'text-mustard' : 'text-charcoal-muted'}`}>
                    {item.num}
                  </span>
                  <h3 className="font-display font-bold text-base text-charcoal">{item.title}</h3>
                </div>
                <p className="text-xs text-charcoal-muted leading-relaxed pl-7">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Right Column: Dynamic Responsive Product UI Visualizer */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-beige p-6 shadow-soft min-h-[440px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-beige/60">
                <div className="text-xs font-mono font-bold text-olive uppercase tracking-wider">
                  {activeProductStep === 1 && 'STAGE 1: VERIFIED CREDENTIAL VAULT'}
                  {activeProductStep === 2 && 'STAGE 2: HEURISTIC DOM SCAN'}
                  {activeProductStep === 3 && 'STAGE 3: SYNTHETIC VALUE INJECTION'}
                  {activeProductStep === 4 && 'STAGE 4: ZERO-SILENT-SUBMISSION AUDIT'}
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cream text-charcoal-muted border border-beige">
                  Step {activeProductStep} of 4
                </span>
              </div>

              {/* Dynamic Viewport Content */}
              <div className="pt-6">
                {activeProductStep === 1 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-cream-50 rounded-xl border border-beige space-y-1">
                      <div className="font-bold text-sm text-charcoal">Saquib Sarfaraz</div>
                      <div className="text-xs text-olive font-semibold">Frontend Developer · 5 Years Exp</div>
                      <div className="text-[11px] text-charcoal-muted">saquib@example.com · Bangalore, India</div>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-beige space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-mustard">Verified Skills</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['React.js', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Next.js', 'Redux'].map((skill, i) => (
                          <span key={i} className="px-2.5 py-1 bg-cream text-olive rounded-md text-xs font-medium border border-beige/60">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeProductStep === 2 && (
                  <div className="space-y-3">
                    <div className="p-3 bg-olive-50 rounded-xl border border-olive/20 text-xs text-olive font-medium flex items-center justify-between">
                      <span>✓ Detected Greenhouse application container</span>
                      <span className="font-mono font-bold text-[10px]">99.4% MATCH</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {['first_name → First Name', 'last_name → Last Name', 'email → Email Address', 'phone → Phone Number', 'urls[LinkedIn] → LinkedIn Profile'].map((mapping, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-cream-50 rounded-lg border border-beige/40">
                          <span className="font-mono text-[11px] text-charcoal-muted">{mapping.split(' → ')[0]}</span>
                          <span className="font-semibold text-olive">{mapping.split(' → ')[1]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeProductStep === 3 && (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-cream-50 rounded-xl border border-beige">
                        <span className="text-[10px] text-charcoal-muted uppercase font-bold block mb-1">First Name</span>
                        <span className="font-semibold text-charcoal">Saquib</span>
                      </div>
                      <div className="p-3 bg-cream-50 rounded-xl border border-beige">
                        <span className="text-[10px] text-charcoal-muted uppercase font-bold block mb-1">Last Name</span>
                        <span className="font-semibold text-charcoal">Sarfaraz</span>
                      </div>
                    </div>
                    <div className="p-3 bg-cream-50 rounded-xl border border-beige">
                      <span className="text-[10px] text-charcoal-muted uppercase font-bold block mb-1">LinkedIn</span>
                      <span className="font-semibold text-charcoal">linkedin.com/in/saquib-sarfaraz</span>
                    </div>
                    <div className="p-3 bg-cream-50 rounded-xl border border-beige">
                      <span className="text-[10px] text-charcoal-muted uppercase font-bold block mb-1">GitHub</span>
                      <span className="font-semibold text-charcoal">github.com/saquibsarfaraz</span>
                    </div>
                  </div>
                )}

                {activeProductStep === 4 && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-mustard-50 rounded-xl border border-mustard/30 text-mustard-dark font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-mustard-dark shrink-0" />
                      <span>Review required: Work Authorization declaration</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between p-2 rounded bg-cream-50 border border-beige/40">
                        <span className="text-charcoal font-medium">Full Name & Contact</span>
                        <span className="text-olive font-bold text-[11px]">✓ Verified</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-cream-50 border border-beige/40">
                        <span className="text-charcoal font-medium">Work History & Titles</span>
                        <span className="text-olive font-bold text-[11px]">✓ Verified</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-mustard-50/60 border border-mustard/30">
                        <span className="text-charcoal font-medium">Legal Sponsorship</span>
                        <span className="text-mustard-dark font-bold text-[11px]">⚠ Confirm manually</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-beige/60 flex items-center justify-between text-xs text-charcoal-muted">
              <span>Automatic client-side dispatch</span>
              <span className="font-semibold text-olive">Zero technical friction</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. HOW IT WORKS SECTION (#how-it-works) */}
      {/* ============================================================ */}
      <section id="how-it-works" className="py-28 border-t border-beige/60 bg-cream-50/50">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-3">
            <div className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-mustard">
              WORKFLOW
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight text-charcoal">
              Four steps. Zero repetition.
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
              Designed to feel completely effortless from initial profile setup to offer tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                num: '01',
                title: 'BUILD ONCE',
                summary: 'Your professional information lives in one place.',
                detail: 'Add work experience, verified skills, and resume files into your canonical Kraxyy vault.'
              },
              {
                num: '02',
                title: 'FILL FAST',
                summary: 'Kraxyy detects compatible application fields.',
                detail: 'When you open any job application page, our Chrome extension matches DOM inputs instantly.'
              },
              {
                num: '03',
                title: 'REVIEW',
                summary: 'You review everything before submission.',
                detail: 'Check populated values, verify company-specific questions, and keep full control of your application.'
              },
              {
                num: '04',
                title: 'TRACK',
                summary: 'Keep your applications organized.',
                detail: 'Manage status transitions from Saved to Applied, Screening, Interview, and Offer.'
              }
            ].map((step, idx) => (
              <div key={idx} className="space-y-4 p-6 rounded-2xl bg-white border border-beige shadow-soft">
                <div className="font-mono text-sm font-bold text-mustard">
                  {step.num}
                </div>
                <h3 className="font-display font-bold text-lg text-charcoal tracking-tight">
                  {step.title}
                </h3>
                <p className="text-xs font-semibold text-olive leading-snug">
                  {step.summary}
                </p>
                <p className="text-xs text-charcoal-muted leading-relaxed">
                  {step.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. EXTENSION SHOWCASE SECTION (#extension) */}
      {/* ============================================================ */}
      <section id="extension" className="py-28 px-6 sm:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-mustard">
            CHROME EXTENSION
          </div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight text-charcoal">
            The companion at your side.
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
            A smart action panel designed specifically for modern job applications.
          </p>
        </div>

        {/* Large Browser Mockup with Real Floating Extension Popup */}
        <div className="rounded-2xl border border-beige bg-white shadow-elevated overflow-hidden">
          {/* Browser Chrome Header */}
          <div className="px-4 py-3 bg-cream-dark/60 border-b border-beige flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 max-w-md mx-4 px-3 py-1 bg-white rounded-lg border border-beige text-[11px] text-charcoal-muted font-mono truncate text-center">
              https://boards.greenhouse.io/acme/jobs/482019
            </div>
            <div className="w-12 text-right text-[10px] font-mono text-olive font-bold">
              PORTAL
            </div>
          </div>

          {/* Browser Content Area */}
          <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 bg-cream/20 relative">
            {/* Left: Background Application Webpage Form */}
            <div className="lg:col-span-7 space-y-4 opacity-80 pointer-events-none">
              <div className="space-y-1">
                <h3 className="font-display font-bold text-xl text-charcoal">Frontend Developer</h3>
                <p className="text-xs text-charcoal-muted">Acme Technologies · Bangalore / Remote</p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-charcoal block mb-1">First Name *</label>
                  <input
                    type="text"
                    readOnly
                    value={extState === 'filled' ? 'Saquib' : ''}
                    placeholder="Enter first name"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-beige bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-charcoal block mb-1">Last Name *</label>
                  <input
                    type="text"
                    readOnly
                    value={extState === 'filled' ? 'Sarfaraz' : ''}
                    placeholder="Enter last name"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-beige bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-charcoal block mb-1">Email *</label>
                  <input
                    type="text"
                    readOnly
                    value={extState === 'filled' ? 'saquib@example.com' : ''}
                    placeholder="Enter email address"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-beige bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-charcoal block mb-1">LinkedIn Profile</label>
                  <input
                    type="text"
                    readOnly
                    value={extState === 'filled' ? 'https://linkedin.com/in/saquib-sarfaraz' : ''}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-beige bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Right: The Actual Floating Kraxyy Extension Popup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-[340px] bg-cream rounded-2xl border-2 border-olive/30 shadow-modal p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-beige">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-olive tracking-tight uppercase font-display">KRAXYY</span>
                    <span className="font-bold text-[8px] tracking-[0.2em] text-[#B18B40] uppercase">APPLY</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-olive-50 border border-olive/20 text-[10px] text-olive font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-olive animate-pulse" />
                    <span>Connected</span>
                  </div>
                </div>

                {/* Context Card */}
                <div className="p-3 bg-white rounded-xl border border-beige space-y-1">
                  <span className="text-[9px] font-bold text-olive uppercase tracking-wider block">APPLICATION DETECTED</span>
                  <div className="font-bold text-xs text-charcoal">Acme Technologies</div>
                  <div className="text-[11px] text-charcoal-muted">Frontend Developer · 18 fields ready</div>
                </div>

                {/* Main Action or Results */}
                {extState !== 'filled' ? (
                  <button
                    onClick={() => {
                      setExtState('filling');
                      setTimeout(() => setExtState('filled'), 500);
                    }}
                    disabled={extState === 'filling'}
                    className="btn-tactile w-full py-3 bg-olive text-cream rounded-xl text-xs font-bold uppercase tracking-wider shadow-soft hover:bg-olive-hover transition flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-mustard" />
                    <span>{extState === 'filling' ? 'Auto-Filling...' : 'AUTO-FILL APPLICATION'}</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="p-2 bg-cream-50 rounded-lg border border-beige">
                        <div className="font-display font-extrabold text-lg text-olive leading-none">18</div>
                        <div className="text-[7.5px] font-bold text-charcoal-muted uppercase mt-0.5">FILLED</div>
                      </div>
                      <div className="p-2 bg-mustard-50 rounded-lg border border-mustard/30">
                        <div className="font-display font-extrabold text-lg text-mustard-dark leading-none">3</div>
                        <div className="text-[7.5px] font-bold text-charcoal-muted uppercase mt-0.5">REVIEW</div>
                      </div>
                      <div className="p-2 bg-cream-50 rounded-lg border border-beige">
                        <div className="font-display font-extrabold text-lg text-charcoal-muted leading-none">2</div>
                        <div className="text-[7.5px] font-bold text-charcoal-muted uppercase mt-0.5">EMPTY</div>
                      </div>
                    </div>

                    <button
                      onClick={() => setExtState('detected')}
                      className="w-full py-2 bg-cream border border-beige text-charcoal hover:border-olive rounded-xl text-[11px] font-semibold transition"
                    >
                      Reset Demo
                    </button>
                  </div>
                )}

                {/* Smart Review Card */}
                <div className="p-2.5 bg-beige-50 rounded-xl border border-beige flex items-start gap-2 text-[10px] text-charcoal-muted">
                  <ShieldCheck className="w-3.5 h-3.5 text-olive shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-charcoal">Review before submitting.</strong> Kraxyy fills compatible fields for you. You stay in control of submission.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real Extension Section CTA */}
        <div className="mt-10 p-6 sm:p-8 rounded-2xl bg-white border border-beige shadow-soft flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-olive-50 border border-olive/20 text-[10px] font-mono font-bold uppercase tracking-wider text-olive mb-1">
              <ChromeIcon className="w-3.5 h-3.5" />
              <span>Official Chrome Extension</span>
            </div>
            <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-charcoal tracking-tight">
              Install Kraxyy Extension
            </h3>
            <p className="text-xs sm:text-sm text-charcoal-muted max-w-md">
              Fill repetitive application fields in seconds.
            </p>
          </div>

          <a
            href={INSTALL_EXTENSION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-tactile inline-flex items-center gap-3 px-6 sm:px-7 py-3.5 sm:py-4 rounded-xl bg-olive text-cream font-bold text-xs sm:text-sm shadow-soft hover:bg-olive-hover transition shrink-0 group"
          >
            <ChromeIcon className="w-4 h-4 shrink-0" />
            <span>Install Chrome Extension</span>
            <ArrowRight className="w-4 h-4 text-mustard-light transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. APPLICATIONS PIPELINE SHOWCASE (#pipeline) */}
      {/* ============================================================ */}
      <section id="pipeline" className="py-28 border-t border-beige/60 bg-cream-50/50">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="space-y-2">
              <div className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-mustard">
                TRACKING PIPELINE
              </div>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight text-charcoal">
                Your career pipeline, organized.
              </h2>
            </div>
            <p className="text-xs text-charcoal-muted max-w-xs leading-relaxed">
              Click any application card below to advance it through the interview pipeline.
            </p>
          </div>

          {/* Interactive Pipeline Stages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {['SAVED', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER'].map((stageName) => {
              const appsInStage = pipelineApps.filter((app) => app.stage === stageName);
              return (
                <div key={stageName} className="bg-white rounded-2xl border border-beige p-4 space-y-3 min-h-[260px] flex flex-col">
                  <div className="flex items-center justify-between pb-2 border-b border-beige/60">
                    <span className="font-mono text-xs font-bold text-olive">{stageName}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-cream rounded-md border border-beige text-charcoal-muted">
                      {appsInStage.length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2.5">
                    {appsInStage.map((app) => (
                      <div
                        key={app.id}
                        onClick={() => advanceApplication(app.id)}
                        className="p-3 bg-cream-50 hover:bg-cream rounded-xl border border-beige/70 cursor-pointer transition-all duration-200 hover:scale-[1.02] shadow-xs group"
                      >
                        <div className="font-bold text-xs text-charcoal truncate group-hover:text-olive">
                          {app.role}
                        </div>
                        <div className="text-[11px] text-charcoal-muted truncate">{app.company}</div>
                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-beige/40 text-[10px]">
                          <span className="text-olive font-semibold">{app.comp}</span>
                          <span className="text-mustard font-medium">{app.location}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. FINAL EDITORIAL STATEMENT & CTA */}
      {/* ============================================================ */}
      <section className="py-28 sm:py-36 px-6 sm:px-8 max-w-5xl mx-auto text-center space-y-8">
        <div className="space-y-3">
          <h2 className="font-display font-extrabold text-4xl sm:text-6xl md:text-7xl tracking-tight text-charcoal">
            APPLY SMARTER.
          </h2>
          <h2 className="font-display font-extrabold text-4xl sm:text-6xl md:text-7xl tracking-tight text-olive">
            GO FURTHER.
          </h2>
        </div>

        <p className="text-sm sm:text-base text-charcoal/70 max-w-lg mx-auto leading-relaxed font-normal">
          Stop wasting hours retyping your resume into generic job portals.
          Join ambitious professionals applying with Kraxyy.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            to="/register"
            className="btn-tactile px-8 py-4 rounded-xl bg-olive text-cream font-bold text-sm shadow-soft hover:bg-olive-hover transition flex items-center gap-2 group"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4 text-mustard-light transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <a
            href={INSTALL_EXTENSION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-4 rounded-xl border border-beige bg-white hover:border-olive/60 font-semibold text-sm text-charcoal transition inline-flex items-center gap-2.5"
          >
            <ChromeIcon className="w-4 h-4" />
            <span>Install Chrome Extension</span>
          </a>
          <Link
            to="/login"
            className="px-6 py-4 rounded-xl text-charcoal-muted hover:text-charcoal font-semibold text-sm transition"
          >
            Sign In
          </Link>
        </div>
      </section>
    </div>
  );
};
