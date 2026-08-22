import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import {
  User,
  MapPin,
  Briefcase,
  Mail,
  Award,
  Clock,
  Settings,
  Save,
  ShieldCheck,
  Star,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Share2,
  TrendingUp,
  Building2,
  Globe,
  Users,
  Calendar,
  MessageSquare,
  ArrowUpRight,
  Plus,
  FileText,
  Lock,
  Heart,
  ChevronRight,
  Filter,
  Check,
  Edit3,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '../components/ui/skeleton';

export default function Profile() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userGigs, setUserGigs] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'All' | 'Completed' | 'Recent'>('All');

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    company: '',
    roleTitle: '',
    location: '',
    website: '',
    teamSize: '',
    industry: '',
    skills: '',
    hourlyRate: '',
    experience: '',
  });

  useEffect(() => {
    fetchProfile();
    fetchUserGigs();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/users/me');
      const u = res.data.data.user;
      setProfile(u);
      setFormData({
        name: u.name || '',
        bio: u.bio || 'Building innovative digital products and collaborating with top-tier independent creators across design, engineering, and product strategy.',
        company: u.company || 'Morrow Studio & Labs',
        roleTitle: u.roleTitle || 'Founder & Product Lead',
        location: u.location || 'New Delhi, India / Remote',
        website: u.website || 'https://morrow.design',
        teamSize: u.teamSize || '10–50 Employees',
        industry: u.industry || 'Digital Products & Design Systems',
        skills: u.skills?.join(', ') || 'Product Strategy, UI/UX Direction, Full-Stack Architecture, Brand Identity',
        hourlyRate: u.hourlyRate || '2500',
        experience: u.experience || '5',
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserGigs = async () => {
    try {
      const res = await api.get('/api/gigs');
      const all = res.data.data?.gigs || [];
      setUserGigs(all.slice(0, 3));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const skillsArray = formData.skills.split(',').map((s) => s.trim()).filter(Boolean);
      await api.post('/api/users/profile', {
        bio: formData.bio,
        skills: skillsArray,
        location: formData.location,
        hourlyRate: Number(formData.hourlyRate) || 0,
        experience: Number(formData.experience) || 0,
      });
      toast.success('Profile updated successfully!');
      setEditing(false);
      fetchProfile();
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Profile link copied to clipboard!');
  };

  // Mock Employer Reviews
  const freelancerReviews = [
    {
      id: 'rev-1',
      name: 'Nia Okafor',
      role: 'Lead Brand Identity Designer',
      avatarBg: '#A3E635',
      initials: 'NO',
      rating: 5,
      date: 'Aug 14, 2026',
      project: 'Aurora Brand System & Visual Language',
      budget: '₹8,000',
      comment:
        'Incredible employer to collaborate with! Clear specifications, swift feedback cycles, and instant escrow release upon milestone handoff. Looking forward to our next sprint together.',
    },
    {
      id: 'rev-2',
      name: 'Lucas Vance',
      role: 'Motion & Interactive Artist',
      avatarBg: '#22D3EE',
      initials: 'LV',
      rating: 5,
      date: 'Jul 28, 2026',
      project: '3D Interactive Product Walkthrough',
      budget: '₹14,000',
      comment:
        'Harshit provided exceptional creative freedom while keeping the project goals and delivery cadence razor-sharp. Communication was seamless on GigMatch.',
    },
    {
      id: 'rev-3',
      name: 'Elena Rostova',
      role: 'Creative Web Developer',
      avatarBg: '#FFB347',
      initials: 'ER',
      rating: 5,
      date: 'Jun 19, 2026',
      project: 'GSAP Animated Landing Page',
      budget: '₹11,500',
      comment:
        'Prompt milestone sign-offs, thorough brief documentation, and zero payment delays. One of the best client relationships on the platform.',
    },
  ];

  // Mock Completed Projects History
  const completedProjects = [
    {
      id: 'proj-1',
      name: 'Aurora Brand System & Token Library',
      freelancer: 'Nia Okafor',
      avatarBg: '#A3E635',
      initials: 'NO',
      category: 'Design & Creative',
      budget: '₹8,000',
      completedDate: 'Aug 14, 2026',
      rating: 5.0,
      status: 'Completed',
    },
    {
      id: 'proj-2',
      name: 'Indie Record Label Web Identity',
      freelancer: 'Elena Rostova',
      avatarBg: '#FFB347',
      initials: 'ER',
      category: 'Development',
      budget: '₹11,500',
      completedDate: 'Jul 22, 2026',
      rating: 5.0,
      status: 'Completed',
    },
    {
      id: 'proj-3',
      name: '3D Interactive Spline Scene',
      freelancer: 'Lucas Vance',
      avatarBg: '#22D3EE',
      initials: 'LV',
      category: 'Motion & 3D',
      budget: '₹14,000',
      completedDate: 'Jun 30, 2026',
      rating: 5.0,
      status: 'Completed',
    },
    {
      id: 'proj-4',
      name: 'Editorial Travel Journal Copy & Narrative',
      freelancer: 'Devon Miles',
      avatarBg: '#FF6B6B',
      initials: 'DM',
      category: 'Writing & Editorial',
      budget: '₹5,000',
      completedDate: 'Jun 12, 2026',
      rating: 4.9,
      status: 'Completed',
    },
  ];

  // Mock Preferred Repeat Freelancers
  const preferredFreelancers = [
    {
      id: 'pref-1',
      name: 'Nia Okafor',
      role: 'Brand Identity Lead',
      avatarBg: '#A3E635',
      initials: 'NO',
      projectsTogether: 3,
      totalPaid: '₹22,000',
      rating: '5.0',
      specialty: 'Figma Design Systems & Art Direction',
      badge: 'Preferred Partner',
    },
    {
      id: 'pref-2',
      name: 'Lucas Vance',
      role: 'Motion & 3D Designer',
      avatarBg: '#22D3EE',
      initials: 'LV',
      projectsTogether: 2,
      totalPaid: '₹25,500',
      rating: '5.0',
      specialty: 'Spline 3D & GSAP Web Experiences',
      badge: 'Top Collaborator',
    },
    {
      id: 'pref-3',
      name: 'Elena Rostova',
      role: 'Creative Web Developer',
      avatarBg: '#FFB347',
      initials: 'ER',
      projectsTogether: 2,
      totalPaid: '₹18,000',
      rating: '5.0',
      specialty: 'Next.js & Micro-Interactions',
      badge: 'Verified Specialist',
    },
  ];

  // Active Open Gigs Showcase
  const activeGigsList = [
    {
      id: 'active-1',
      title: 'Full Brand Visual Identity & Design System',
      category: 'Design & Creative',
      budget: '₹12,000',
      postedDate: '2 days ago',
      proposalsCount: 14,
      status: 'Accepting Proposals',
      bg: '#22D3EE',
    },
    {
      id: 'active-2',
      title: 'Interactive 3D Web Experience with GSAP & WebGL',
      category: 'Development & IT',
      budget: '₹18,500',
      postedDate: '4 days ago',
      proposalsCount: 9,
      status: 'Under Review',
      bg: '#FFB347',
    },
    {
      id: 'active-3',
      title: 'Editorial Copywriting & Product Launch Narrative',
      category: 'Writing & Translation',
      budget: '₹6,500',
      postedDate: '5 days ago',
      proposalsCount: 18,
      status: 'Accepting Proposals',
      bg: '#FF6B6B',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-paper py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          <Skeleton className="h-64 w-full rounded-[28px]" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-[28px]" />
        </div>
      </div>
    );
  }

  const displayName = user?.name || profile?.name || 'Harshit Arora';
  const displayRole = formData.roleTitle || 'Founder & Product Lead';
  const displayCompany = formData.company || 'Morrow Studio & Labs';
  const displayInitials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'HA';

  const filteredHistory = completedProjects.filter((p) => {
    if (historyFilter === 'Completed') return p.status === 'Completed';
    return true;
  });

  return (
    <div className="min-h-screen bg-paper text-ink pb-24 antialiased selection:bg-purple/15 selection:text-ink">
      
      {/* ====================================================
          TOP BREADCRUMB / CONTEXT BAR
          ==================================================== */}
      <nav className="border-b border-border/70 bg-white/70 backdrop-blur-md sticky top-0 z-20" aria-label="Breadcrumb">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between text-xs font-semibold text-ink/50">
          <div className="flex items-center gap-2 min-w-0">
            <Link to="/" className="hover:text-purple transition-colors no-underline text-ink/60 shrink-0">
              Home
            </Link>
            <ChevronRight size={13} className="shrink-0 text-ink/30" />
            <Link to="/dashboard" className="hover:text-purple transition-colors no-underline text-ink/60 shrink-0">
              Dashboard
            </Link>
            <ChevronRight size={13} className="shrink-0 text-ink/30" />
            <span className="text-ink font-bold truncate">Employer Profile</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareProfile}
              className="p-1.5 rounded-lg text-ink/60 hover:text-purple hover:bg-purple/10 transition-colors cursor-pointer border-0 bg-transparent"
              title="Share Profile Link"
            >
              <Share2 size={16} />
            </button>
            <button
              onClick={() => navigate('/profile/edit')}
              className="btn-secondary !py-1.5 !px-3.5 !text-xs inline-flex items-center gap-1.5"
            >
              <Settings size={13} />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ====================================================
          MAIN PROFILE CONTAINER
          ==================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        
        {/* ====================================================
            1. HERO PROFILE HEADER CARD
            ==================================================== */}
        <section className="bg-white rounded-[28px] p-6 sm:p-8 lg:p-10 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] relative overflow-hidden">
          {/* Subtle decorative background gradient */}
          <div
            className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-10 pointer-events-none -mr-20 -mt-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #7C3AED 0%, #22D3EE 100%)' }}
          />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            {/* Avatar & Core Bio Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[24px] bg-[#22D3EE] font-clash font-bold text-2xl sm:text-3xl text-ink flex items-center justify-center shadow-lg ring-4 ring-white shrink-0">
                  {displayInitials}
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-xs flex items-center justify-center text-white"
                  title="Online now"
                >
                  <Check size={12} className="stroke-[3]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">
                    {displayName}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200/60 font-sans shadow-xs">
                    <ShieldCheck size={14} className="text-emerald-700" />
                    <span>Verified Employer</span>
                  </span>
                </div>

                <p className="text-sm sm:text-base font-semibold text-ink/75">
                  {displayRole} · <span className="text-purple font-bold">{displayCompany}</span>
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-ink/55 font-medium pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-ink/40" />
                    <span>{formData.location}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={13} className="text-ink/40" />
                    <span>Member since August 2024</span>
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active Today · Responds &lt; 2h
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-border/50">
              <button
                onClick={() => navigate('/profile/edit')}
                className="btn-secondary !py-2.5 !px-4 !text-xs sm:!text-sm inline-flex items-center gap-2"
              >
                <Edit3 size={15} />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => navigate('/post-gig')}
                className="btn-primary !py-2.5 !px-5 !text-xs sm:!text-sm inline-flex items-center gap-2"
              >
                <Plus size={15} />
                <span>Post a New Gig</span>
              </button>
            </div>
          </div>

          {/* About Bio Section */}
          <div className="mt-8 pt-6 border-t border-border/60">
            <span className="eyebrow text-purple mb-2 block">ABOUT THE EMPLOYER & VISION</span>
            <p className="text-sm sm:text-base leading-relaxed text-ink/80 max-w-4xl font-normal">
              {formData.bio}
            </p>
          </div>
        </section>

        {/* ====================================================
            2. EMPLOYER STATS KPI ROW (5 Cards)
            ==================================================== */}
        <section aria-label="Employer Performance KPIs">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="eyebrow text-ink/50">Projects Posted</span>
                <div className="w-8 h-8 rounded-xl bg-purple/15 text-purple flex items-center justify-center">
                  <Briefcase size={16} />
                </div>
              </div>
              <div>
                <div className="font-display text-3xl font-extrabold text-ink leading-none mb-1.5">
                  24
                </div>
                <span className="text-[11px] font-semibold text-purple flex items-center gap-1">
                  <Sparkles size={12} />
                  <span>3 Active briefs</span>
                </span>
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="eyebrow text-ink/50">Total Hires</span>
                <div className="w-8 h-8 rounded-xl bg-cyan/15 text-cyan flex items-center justify-center">
                  <Users size={16} />
                </div>
              </div>
              <div>
                <div className="font-display text-3xl font-extrabold text-ink leading-none mb-1.5">
                  18
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <TrendingUp size={12} />
                  <span>96% Hire rate</span>
                </span>
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="eyebrow text-ink/50">Completion Rate</span>
                <div className="w-8 h-8 rounded-xl bg-lime text-ink flex items-center justify-center font-bold">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div>
                <div className="font-display text-3xl font-extrabold text-ink leading-none mb-1.5">
                  98%
                </div>
                <span className="text-[11px] font-semibold text-ink/60">
                  On-time milestone delivery
                </span>
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="eyebrow text-ink/50">Total Spending</span>
                <div className="w-8 h-8 rounded-xl bg-orange/15 text-orange flex items-center justify-center">
                  <Lock size={16} />
                </div>
              </div>
              <div>
                <div className="font-display text-3xl font-extrabold text-ink leading-none mb-1.5">
                  ₹2.4L+
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck size={12} />
                  <span>100% Escrow protected</span>
                </span>
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between mb-3">
                <span className="eyebrow text-ink/50">Average Rating</span>
                <div className="w-8 h-8 rounded-xl bg-coral/15 text-coral flex items-center justify-center">
                  <Star size={16} className="fill-current" />
                </div>
              </div>
              <div>
                <div className="font-display text-3xl font-extrabold text-ink leading-none mb-1.5 flex items-center gap-1.5">
                  <span>4.9</span>
                  <span className="text-base text-coral">★</span>
                </div>
                <span className="text-[11px] font-semibold text-ink/60">
                  Across 38 client reviews
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            3. TWO-COLUMN WORKSPACE: (LEFT: GIGS, REVIEWS, HISTORY / RIGHT: COMPANY & METRICS)
            ==================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (8 cols): Active Gigs, Reviews, Completed Projects, Preferred Freelancers */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* ACTIVE GIGS SECTION */}
            <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                    Active Gigs
                  </h2>
                  <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                    Currently open project commissions accepting bids from creators.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/post-gig')}
                  className="btn-secondary !py-2 !px-3.5 !text-xs self-start sm:self-auto"
                >
                  <Plus size={14} />
                  <span>Post Another Gig</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeGigsList.map((gig) => (
                  <div
                    key={gig.id}
                    onClick={() => navigate('/gigs')}
                    className="bg-soft/60 rounded-[22px] p-5 border border-border/60 hover:border-purple/40 hover:bg-white hover:shadow-[0_8px_30px_rgba(124,58,237,0.08)] transition-all duration-200 cursor-pointer flex flex-col justify-between hover-lift group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple bg-purple/10 px-2.5 py-1 rounded-full">
                          {gig.category}
                        </span>
                        <ArrowUpRight
                          size={15}
                          className="text-ink/30 group-hover:text-purple group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                        />
                      </div>

                      <h3 className="font-bold text-sm text-ink group-hover:text-purple transition-colors line-clamp-2 leading-snug mb-2">
                        {gig.title}
                      </h3>
                    </div>

                    <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider block">Budget</span>
                        <span className="font-display font-extrabold text-sm text-ink">{gig.budget}</span>
                      </div>
                      <span className="font-bold text-purple bg-purple/10 px-2 py-0.5 rounded-full text-[11px]">
                        {gig.proposalsCount} bids
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* WHAT FREELANCERS SAY (REVIEWS SECTION) */}
            <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                    What Freelancers Say
                  </h2>
                  <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                    Verified feedback from independent creators who delivered milestones for {displayName}.
                  </p>
                </div>
                <span className="bg-lime text-ink text-xs font-bold px-3 py-1 rounded-full font-clash">
                  ★ 4.9 Rating (38 Reviews)
                </span>
              </div>

              <div className="space-y-4">
                {freelancerReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-soft/50 rounded-[22px] p-5 sm:p-6 border border-border/50 hover:border-purple/25 hover:bg-white transition-all space-y-3.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-[14px] flex items-center justify-center font-clash font-bold text-xs text-ink shadow-xs"
                          style={{ backgroundColor: rev.avatarBg }}
                        >
                          {rev.initials}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-ink">{rev.name}</h4>
                          <p className="text-[11px] text-ink/55 font-medium">{rev.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center text-amber-500 text-xs">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <span key={i}>★</span>
                          ))}
                        </div>
                        <span className="text-xs text-ink/40 font-medium">· {rev.date}</span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-ink/80 leading-relaxed italic font-normal">
                      "{rev.comment}"
                    </p>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-ink/55">
                      <span>Project: <strong className="text-ink">{rev.project}</strong></span>
                      <span>Contract: <strong className="text-purple">{rev.budget}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* COMPLETED PROJECTS & HIRING HISTORY */}
            <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                    Completed Projects
                  </h2>
                  <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                    Hiring track record and signed-off deliverables.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-soft p-1 rounded-xl border border-border/50 text-xs font-semibold">
                  {(['All', 'Completed', 'Recent'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setHistoryFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer border-0 ${
                        historyFilter === filter
                          ? 'bg-white text-ink shadow-xs'
                          : 'text-ink/60 hover:text-ink bg-transparent'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredHistory.map((proj) => (
                  <div
                    key={proj.id}
                    className="bg-soft/40 rounded-2xl p-4 border border-border/50 hover:bg-white hover:border-purple/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-clash font-bold text-xs text-ink shrink-0"
                        style={{ backgroundColor: proj.avatarBg }}
                      >
                        {proj.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-sm text-ink truncate">{proj.name}</h4>
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/50">
                            {proj.status}
                          </span>
                        </div>
                        <p className="text-xs text-ink/50 mt-0.5">
                          Creator: <strong className="text-ink">{proj.freelancer}</strong> · Completed {proj.completedDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40 text-xs">
                      <span className="font-bold text-ink">{proj.budget}</span>
                      <span className="font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/50">
                        ★ {proj.rating}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* PREFERRED & REPEAT FREELANCERS */}
            <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                    Preferred Collaborators
                  </h2>
                  <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                    Creators hired across multiple sprints with 100% on-time milestone sign-offs.
                  </p>
                </div>
                <span className="text-xs font-bold text-purple bg-purple/10 px-3 py-1 rounded-full">
                  3 Repeat Partners
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {preferredFreelancers.map((f) => (
                  <div
                    key={f.id}
                    className="bg-soft/60 rounded-[22px] p-5 border border-border/60 hover:border-purple/30 hover:bg-white hover:shadow-xs transition-all duration-200 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="w-11 h-11 rounded-[14px] flex items-center justify-center font-clash font-bold text-sm text-ink shadow-xs"
                          style={{ backgroundColor: f.avatarBg }}
                        >
                          {f.initials}
                        </div>
                        <span className="text-[10px] font-bold text-purple bg-purple/10 px-2 py-0.5 rounded-full">
                          {f.badge}
                        </span>
                      </div>

                      <h4 className="font-bold text-base text-ink">{f.name}</h4>
                      <p className="text-xs text-ink/60 font-medium mt-0.5">{f.role}</p>

                      <div className="mt-3 pt-3 border-t border-border/50 text-xs space-y-1 text-ink/70 font-medium">
                        <div className="flex justify-between">
                          <span>Projects Together:</span>
                          <strong className="text-ink">{f.projectsTogether} Sprints</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Paid:</span>
                          <strong className="text-purple font-bold">{f.totalPaid}</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate('/post-gig')}
                      className="w-full btn-primary !py-2 !text-xs justify-center"
                    >
                      <Sparkles size={13} />
                      <span>Hire Again</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Right Column (4 cols): Company Information, Activity & Trust Metrics */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* COMPANY INFORMATION CARD */}
            <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-5">
              <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                <h3 className="font-display font-bold text-lg text-ink">
                  Company Information
                </h3>
                <Building2 size={18} className="text-purple" />
              </div>

              <div className="space-y-3.5 text-xs font-medium text-ink/75">
                <div className="flex items-center justify-between">
                  <span className="text-ink/50 flex items-center gap-1.5">
                    <Building2 size={14} />
                    <span>Company Name:</span>
                  </span>
                  <strong className="text-ink font-bold">{displayCompany}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-ink/50 flex items-center gap-1.5">
                    <Sparkles size={14} />
                    <span>Industry:</span>
                  </span>
                  <strong className="text-ink font-semibold">{formData.industry}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-ink/50 flex items-center gap-1.5">
                    <Users size={14} />
                    <span>Team Size:</span>
                  </span>
                  <strong className="text-ink font-semibold">{formData.teamSize}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-ink/50 flex items-center gap-1.5">
                    <MapPin size={14} />
                    <span>HQ Location:</span>
                  </span>
                  <strong className="text-ink font-semibold">{formData.location}</strong>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-ink/50 flex items-center gap-1.5">
                    <Globe size={14} />
                    <span>Website:</span>
                  </span>
                  <a
                    href={formData.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <span>{formData.website.replace('https://', '')}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>

            {/* ACTIVITY & TRUST METRICS */}
            <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-4">
              <h3 className="font-display font-bold text-lg text-ink border-b border-border/60 pb-3">
                Activity & Trust Metrics
              </h3>

              <div className="space-y-3 text-xs font-medium">
                <div className="p-3 rounded-xl bg-soft flex items-center justify-between">
                  <span className="text-ink/60">Last Platform Active</span>
                  <strong className="text-ink font-bold">12 mins ago</strong>
                </div>

                <div className="p-3 rounded-xl bg-soft flex items-center justify-between">
                  <span className="text-ink/60">Average Response Time</span>
                  <strong className="text-emerald-700 font-bold">&lt; 2 Hours</strong>
                </div>

                <div className="p-3 rounded-xl bg-soft flex items-center justify-between">
                  <span className="text-ink/60">Completed Deliverables</span>
                  <strong className="text-ink font-bold">18 Delivered</strong>
                </div>

                <div className="p-3 rounded-xl bg-soft flex items-center justify-between">
                  <span className="text-ink/60">Successful Contracts</span>
                  <strong className="text-emerald-700 font-bold">18 of 19 (95%)</strong>
                </div>

                <div className="p-3 rounded-xl bg-soft flex items-center justify-between">
                  <span className="text-ink/60">Repeat Collaboration Rate</span>
                  <strong className="text-purple font-bold">64% Repeat Hires</strong>
                </div>
              </div>
            </div>

            {/* ESCROW & VERIFICATION BADGE CARD */}
            <div className="bg-gradient-to-br from-purple/5 to-cyan/5 rounded-[28px] p-6 border border-purple/20 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                <ShieldCheck size={18} className="text-emerald-600" />
                <span>100% Escrow Verified Employer</span>
              </div>
              <p className="text-xs text-ink/75 leading-relaxed font-medium">
                This employer funds 100% of agreed milestone amounts upfront into GigMatch Escrow before work begins.
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
