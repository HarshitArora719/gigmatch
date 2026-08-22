import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import AnimatedSection from '../components/AnimatedSection';

/* ──────────────────────────────────────────────
   DATA
   ────────────────────────────────────────────── */

const opportunities = [
  {
    bg: 'bg-cyan',
    rotate: '-rotate-[2deg]',
    match: '92%',
    title: 'AI Platform Engineer',
    meta: '$7,000–$9,000 · Hybrid',
    skills: ['Python', 'LLMs'],
  },
  {
    bg: 'bg-coral',
    rotate: 'rotate-[2deg]',
    match: '89%',
    title: 'Node.js Systems Build',
    meta: '$5,000–$7,500 · Remote',
    skills: ['Node.js', 'AWS'],
  },
  {
    bg: 'bg-orange',
    rotate: '-rotate-[1deg]',
    match: '96%',
    title: 'Product Design Sprint',
    meta: '$4,500–$6,000 · Remote',
    skills: ['Figma', 'Strategy'],
  },
];

const benefits = [
  {
    title: 'Personalized AI Matching',
    description: 'See the work most aligned to where you want to grow.',
    rotate: '-rotate-[1.5deg]',
    accent: 'purple',
    bg: 'bg-purple/5',
    iconBg: 'bg-purple/15',
    iconColor: 'text-purple',
    borderColor: 'border-l-purple/40',
  },
  {
    title: 'Verified Clients',
    description: 'Build momentum with serious briefs and transparent expectations.',
    rotate: 'rotate-[1deg]',
    accent: 'cyan',
    bg: 'bg-cyan/5',
    iconBg: 'bg-cyan/15',
    iconColor: 'text-cyan',
    borderColor: 'border-l-cyan/40',
  },
  {
    title: 'Fast Applications',
    description: 'Apply with context, confidence, and a profile that does the work.',
    rotate: 'rotate-[1.5deg]',
    accent: 'coral',
    bg: 'bg-coral/5',
    iconBg: 'bg-coral/15',
    iconColor: 'text-coral',
    borderColor: 'border-l-coral/40',
  },
  {
    title: 'Career Growth',
    description: 'Surface ambitious projects that strengthen your portfolio.',
    rotate: '-rotate-[1deg]',
    accent: 'orange',
    bg: 'bg-orange/5',
    iconBg: 'bg-orange/15',
    iconColor: 'text-orange',
    borderColor: 'border-l-orange/40',
  },
];

const journeySteps = [
  { num: '01', label: 'Make your mark', color: 'text-cyan' },
  { num: '02', label: 'Get creatively matched', color: 'text-orange' },
  { num: '03', label: 'Make work you\'re proud of', color: 'text-coral' },
];

/* ──────────────────────────────────────────────
   HOME PAGE
   ────────────────────────────────────────────── */

export default function Home() {
  const navigate = useNavigate();
  const { setAuthModal } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/gigs?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-paper overflow-hidden">

      {/* ════════════════════════════════════════
          HERO SECTION
          ════════════════════════════════════════ */}
      <section className="relative pt-4 pb-14 md:pt-6 md:pb-20 lg:pt-8 lg:pb-24 overflow-hidden">
        {/* Organic color fields */}
        <div
          className="absolute top-[-10%] left-[-8%] w-[420px] h-[420px] rounded-full opacity-40 blur-[120px] animate-float-slow pointer-events-none"
          style={{ background: '#A3E635' }}
          aria-hidden="true"
        />
        <div
          className="absolute top-[-5%] right-[-6%] w-[380px] h-[380px] rounded-full opacity-35 blur-[110px] animate-float-medium pointer-events-none"
          style={{ background: '#22D3EE' }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-[5%] right-[10%] w-[350px] h-[350px] rounded-full opacity-30 blur-[100px] animate-float-fast pointer-events-none"
          style={{ background: '#FF6B6B' }}
          aria-hidden="true"
        />

        <div className="container-app relative z-10">
          <div className="max-w-[860px] mx-auto text-center">
            {/* Top pill label */}
            <AnimatedSection>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-white text-xs font-bold uppercase tracking-widest -rotate-[3deg] mb-5">
                <Sparkles size={14} className="text-cyan" />
                FOR THE ONES WHO MAKE THINGS
              </div>
            </AnimatedSection>

            {/* Headline */}
            <AnimatedSection delay={100} className="overflow-visible">
              <h1
                className="font-display font-extrabold text-ink leading-[1.18] tracking-[-0.015em] mb-5 pb-3 overflow-visible"
                style={{ fontSize: 'clamp(2.25rem, 5.5vw, 4.25rem)' }}
              >
                <span className="block whitespace-nowrap">Where freelancers</span>
                <span className="block whitespace-nowrap">find work worth</span>
                <span className="block whitespace-nowrap pb-1.5">showing off.</span>
              </h1>
            </AnimatedSection>

            {/* Supporting copy */}
            <AnimatedSection delay={200}>
              <p className="text-base md:text-lg text-ink/70 font-medium max-w-[500px] mx-auto leading-relaxed mb-7">
                Discover projects, clients, and opportunities tailored to your skills and ambitions.
              </p>
            </AnimatedSection>

            {/* Buttons */}
            <AnimatedSection delay={300}>
              <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                <button
                  onClick={() => setAuthModal(true, 'register')}
                  className="btn-primary text-[0.9375rem] px-7 py-3"
                >
                  Get Started
                </button>
                <button
                  onClick={() => navigate('/gigs')}
                  className="btn-secondary text-[0.9375rem] px-7 py-3"
                >
                  Explore Gigs
                </button>
              </div>
            </AnimatedSection>

            {/* Search bar */}
            <AnimatedSection delay={400}>
              <form
                onSubmit={handleSearch}
                className={`relative flex items-center max-w-[700px] mx-auto rounded-full bg-white p-1.5 transition-all duration-300 ${searchFocused
                  ? 'shadow-[0_8px_40px_rgba(124,58,237,0.12)] border-purple/30 ring-2 ring-purple/10'
                  : 'shadow-[0_4px_24px_rgba(0,0,0,0.06)] border-border'
                  } border`}
              >
                <Search
                  size={20}
                  className={`absolute left-5 transition-colors duration-200 ${searchFocused ? 'text-purple' : 'text-ink/30'
                    }`}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search for dream projects, skills, startups, or clients…"
                  className="w-full h-12 md:h-14 pl-12 pr-32 md:pr-36 rounded-full border-none text-[0.9375rem] md:text-base outline-none text-ink bg-transparent placeholder:text-ink/30 font-medium"
                  aria-label="Search for projects, skills, or clients"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-5 md:px-7 rounded-full gradient-primary text-white font-bold text-sm transition-transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer border-none"
                >
                  Search
                </button>
              </form>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          RECOMMENDED OPPORTUNITIES
          ════════════════════════════════════════ */}
      <section className="section-padding bg-paper" id="features">
        <div className="container-app">
          <AnimatedSection>
            <div className="text-center mb-14 md:mb-16">
              <span className="eyebrow text-purple mb-3 inline-block">FRESHLY MATCHED</span>
              <h2
                className="font-display font-extrabold text-ink tracking-[-0.02em] mb-4"
                style={{ fontSize: 'clamp(1.75rem, 4vw, 2.875rem)' }}
              >
                Work that belongs in your portfolio.
              </h2>
              <p className="text-ink/60 text-lg max-w-[520px] mx-auto font-medium">
                Not another endless job board. A curated drop of briefs made for your next great piece.
              </p>
            </div>
          </AnimatedSection>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-7 max-w-[1000px] mx-auto">
            {opportunities.map((opp, i) => (
              <AnimatedSection key={opp.title} delay={i * 120}>
                <div
                  className={`${opp.bg} ${opp.rotate} rounded-[28px] p-7 md:p-8 flex flex-col justify-between min-h-[320px] transition-all duration-300 ease-out hover:!rotate-0 hover:scale-[1.06] hover:-translate-y-3 hover:shadow-[0_24px_70px_rgba(0,0,0,0.18)] cursor-pointer group`}
                >
                  {/* Match badge */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-ink/10 text-ink text-xs font-bold tracking-wide">
                      {opp.match} MATCH
                    </span>
                  </div>

                  {/* Title */}
                  <div className="flex-1 flex flex-col justify-end">
                    <h3 className="font-display font-extrabold text-ink text-xl md:text-2xl tracking-normal mb-2 leading-snug">
                      {opp.title}
                    </h3>
                    <p className="text-ink/70 text-sm font-medium mb-4">{opp.meta}</p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      {opp.skills.map(skill => (
                        <span
                          key={skill}
                          className="px-3 py-1 rounded-full bg-ink/8 text-ink text-xs font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-1.5 text-ink font-bold text-sm group-hover:gap-2.5 transition-all">
                      View the brief
                      <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CREATIVE CAREER SECTION
          ════════════════════════════════════════ */}
      <section className="section-padding bg-soft" id="how-it-works">
        <div className="container-app">
          <AnimatedSection>
            <div className="text-center mb-14">
              <h2
                className="font-display font-extrabold text-ink tracking-[-0.02em] mb-4"
                style={{ fontSize: 'clamp(1.75rem, 4vw, 2.875rem)' }}
              >
                Build your creative career.
              </h2>
              <p className="text-ink/60 text-lg max-w-[480px] mx-auto font-medium">
                Get discovered. Find meaningful work. Build a reputation people remember.
              </p>
            </div>
          </AnimatedSection>

          {/* Benefits grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 max-w-[800px] mx-auto">
            {benefits.map((benefit, i) => (
              <AnimatedSection key={benefit.title} delay={i * 100}>
                <div
                  className={`${benefit.rotate} ${benefit.bg} border border-border/40 border-l-4 ${benefit.borderColor} rounded-[24px] p-7 md:p-8 transition-all duration-300 ease-out hover:!rotate-0 hover:scale-[1.04] hover:-translate-y-2 hover:shadow-[0_16px_50px_rgba(0,0,0,0.10)] group`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl ${benefit.iconBg} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}>
                    <Sparkles size={18} className={benefit.iconColor} />
                  </div>

                  <h3 className="font-display font-bold text-ink text-lg tracking-normal mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-ink/55 text-[0.9375rem] leading-relaxed font-medium">
                    {benefit.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          AI MATCHING STORY SECTION
          ════════════════════════════════════════ */}
      <section className="section-padding bg-ink text-white overflow-hidden">
        <div className="container-app">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left column */}
            <AnimatedSection>
              <div>
                <span className="eyebrow text-lime mb-4 inline-block">
                  NOT A FILTER. A CREATIVE RADAR.
                </span>
                <h2
                  className="font-display font-extrabold text-white tracking-[-0.02em] mb-6"
                  style={{ fontSize: 'clamp(1.75rem, 4vw, 2.875rem)' }}
                >
                  The right work finds you.
                </h2>
                <p className="text-white/55 text-lg font-medium leading-relaxed mb-10 max-w-[440px]">
                  GigMatch learns what you make, what you're curious about, and where you're headed — then sends the right momentum your way.
                </p>

                {/* Journey steps */}
                <div className="space-y-5">
                  {journeySteps.map(step => (
                    <div key={step.num} className="flex items-center gap-4">
                      <span className={`font-display font-extrabold text-lg ${step.color}`}>
                        {step.num}
                      </span>
                      <span className="text-white/80 font-semibold text-base">
                        — {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            {/* Right column — Feature card */}
            <AnimatedSection delay={200}>
              <div className="rotate-[2deg] gradient-primary rounded-[32px] p-8 md:p-10 text-white relative overflow-hidden">
                {/* Subtle inner glow */}
                <div className="absolute top-[-30%] right-[-20%] w-[200px] h-[200px] rounded-full bg-white/10 blur-[80px] pointer-events-none" aria-hidden="true" />

                <h3 className="font-display font-extrabold text-2xl md:text-3xl tracking-normal mb-2 leading-snug">
                  Your next creative leap
                </h3>
                <p className="text-white/70 text-[0.9375rem] font-medium mb-8">
                  The opportunity signal is looking bright.
                </p>

                {/* Frosted row */}
                <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 mb-6">
                  <span className="font-semibold text-sm text-white/90">Creative momentum</span>
                  <span className="font-bold text-sm text-lime uppercase tracking-wider">ON</span>
                </div>

                <div className="space-y-3">
                  <p className="text-white/55 text-sm font-medium">
                    Fresh briefs are waiting for your perspective.
                  </p>
                  <p className="text-white/55 text-sm font-medium">
                    Your portfolio is the invitation.
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FINAL CTA
          ════════════════════════════════════════ */}
      <section className="section-padding bg-paper relative overflow-hidden">
        {/* Organic fields */}
        <div
          className="absolute top-[20%] left-[-5%] w-[300px] h-[300px] rounded-full opacity-30 blur-[100px] animate-float-medium pointer-events-none"
          style={{ background: '#FFB347' }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-[10%] right-[-3%] w-[280px] h-[280px] rounded-full opacity-25 blur-[90px] animate-float-slow pointer-events-none"
          style={{ background: '#22D3EE' }}
          aria-hidden="true"
        />

        <div className="container-app relative z-10">
          <AnimatedSection>
            <div className="text-center max-w-[600px] mx-auto">
              <span className="eyebrow text-purple mb-4 inline-block">
                YOUR NEXT CHAPTER STARTS HERE
              </span>
              <h2
                className="font-display font-extrabold text-ink tracking-[-0.02em] mb-5"
                style={{ fontSize: 'clamp(1.75rem, 4vw, 2.875rem)' }}
              >
                Ready for your next opportunity?
              </h2>
              <p className="text-ink/55 text-lg font-medium leading-relaxed mb-10">
                Show the world what you can do.<br />
                We'll help the right people see it.
              </p>
              <button
                onClick={() => navigate('/gigs')}
                className="btn-primary text-base px-10 py-4"
              >
                Find your next gig
              </button>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
