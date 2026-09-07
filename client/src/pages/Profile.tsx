import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import {
  MapPin,
  Briefcase,
  Calendar,
  Sparkles,
  ExternalLink,
  Share2,
  TrendingUp,
  Building2,
  Globe,
  Users,
  Star,
  CheckCircle2,
  ArrowUpRight,
  Plus,
  ShieldCheck,
  Lock,
  ChevronRight,
  Check,
  Edit3,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  FolderGit2,
  Award,
  Zap,
  ThumbsUp,
  DollarSign,
  Send,
  Code,
  Terminal,
  Layers,
  CheckCheck,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '../components/ui/skeleton';

export default function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'All' | 'Completed' | 'Recent'>('All');

  useEffect(() => {
    fetchProfileData();
  }, [userId, currentUser]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      const target = userId || 'me';
      const res = await api.get(`/api/users/profile/${target}`);
      setProfileData(res.data.data);
    } catch (err: any) {
      console.error('Failed to fetch profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Profile link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <Skeleton className="h-72 w-full rounded-[28px]" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl col-span-2 sm:col-span-1" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <Skeleton className="h-64 rounded-[28px]" />
              <Skeleton className="h-80 rounded-[28px]" />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <Skeleton className="h-64 rounded-[28px]" />
              <Skeleton className="h-64 rounded-[28px]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-paper px-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-[28px] border border-border/70 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-coral/15 text-coral flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h2 className="font-display text-xl font-bold text-ink">Profile Not Found</h2>
          <p className="text-xs text-ink/60">{error || 'The requested profile could not be loaded.'}</p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button onClick={() => navigate('/')} className="btn-secondary !py-2 !px-4 !text-xs">
              Go Home
            </button>
            <button
              onClick={fetchProfileData}
              className="btn-primary !py-2 !px-4 !text-xs inline-flex items-center gap-1.5"
            >
              <RefreshCw size={13} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    user: u,
    profile: p,
    metrics = {},
    reviews = [],
    workHistory = [],
    activeGigs = [],
    preferredCollaborators = [],
    isOwner = false
  } = profileData;

  const isClientProfile = u.role === 'client' || u.role !== 'freelancer';
  const displayName = u.name || 'Verified User';
  const displayRole = p.roleTitle || (u.role === 'freelancer' ? 'Independent Creator' : 'Marketplace Client');
  const displayCompany = p.company || (u.role === 'freelancer' ? 'Independent Studio' : 'Active Client');
  const displayLocation = p.location || 'Remote / Global';
  const displayBio = p.bio || 'Building and collaborating on high-impact projects through GigMatch.';
  const displayInitials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'GM';
  const avatarBg = p.avatarColor || u.avatarColor || '#22D3EE';

  const memberSinceFormatted = u.createdAt
    ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  const filteredHistory = workHistory.filter((item: any) => {
    if (historyFilter === 'Completed') return item.status.toLowerCase() === 'completed';
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
            <span className="text-ink font-bold truncate">{isOwner ? 'My Profile' : `${displayName}'s Profile`}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareProfile}
              className="p-1.5 rounded-lg text-ink/60 hover:text-purple hover:bg-purple/10 transition-colors cursor-pointer border-0 bg-transparent"
              title="Share Profile Link"
            >
              <Share2 size={16} />
            </button>
            {isOwner && (
              <button
                onClick={() => navigate('/profile/edit')}
                className="btn-secondary !py-1.5 !px-3.5 !text-xs inline-flex items-center gap-1.5"
              >
                <Edit3 size={13} />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ====================================================
          MAIN PROFILE CONTAINER
          ==================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        
        {isClientProfile ? (
          /* ====================================================
             HIRER / CLIENT PROFILE (100% UNCHANGED & FINALIZED)
             ==================================================== */
          <>
            <section className="bg-white rounded-[28px] p-6 sm:p-8 lg:p-10 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] relative overflow-hidden">
              <div
                className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-10 pointer-events-none -mr-20 -mt-20 blur-3xl"
                style={{ background: 'radial-gradient(circle, #7C3AED 0%, #22D3EE 100%)' }}
              />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
                  <div className="relative">
                    <div
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-[24px] font-clash font-bold text-2xl sm:text-3xl text-ink flex items-center justify-center shadow-lg ring-4 ring-white shrink-0 overflow-hidden transition-colors"
                      style={{ backgroundColor: avatarBg }}
                    >
                      {(u.avatar || p.avatar) ? (
                        <img
                          src={u.avatar || p.avatar}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        displayInitials
                      )}
                    </div>
                    <div
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-xs flex items-center justify-center text-white"
                      title="Verified Employer"
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
                      {displayRole} {p.company ? <span>· <span className="text-purple font-bold">{p.company}</span></span> : null}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-ink/55 font-medium pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-ink/40" />
                        <span>{displayLocation}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={13} className="text-ink/40" />
                        <span>Member since {memberSinceFormatted}</span>
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Responds {p.responseTime || '< 2h'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-border/50">
                  {isOwner ? (
                    <>
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
                        <span>Post a Gig</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleShareProfile}
                        className="btn-secondary !py-2.5 !px-4 !text-xs sm:!text-sm inline-flex items-center gap-2"
                      >
                        <Share2 size={15} />
                        <span>Share Profile</span>
                      </button>
                      <button
                        onClick={() => navigate('/gigs')}
                        className="btn-primary !py-2.5 !px-5 !text-xs sm:!text-sm inline-flex items-center gap-2"
                      >
                        <Sparkles size={15} />
                        <span>Browse Gigs</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border/60">
                <span className="eyebrow text-purple mb-2 block">
                  ABOUT & HIRING PHILOSOPHY
                </span>
                <p className="text-sm sm:text-base leading-relaxed text-ink/80 max-w-4xl font-normal">
                  {displayBio}
                </p>

                {p.skills && p.skills.length > 0 && (
                  <div className="pt-4 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink/50 block">
                      Technologies Used in Projects / Preferred Tech Stack
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {p.skills.map((s: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-xs font-semibold bg-soft text-ink px-3 py-1 rounded-full border border-border/60"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section aria-label="Performance KPIs">
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
                      {metrics.projectsPosted ?? 0}
                    </div>
                    <span className="text-[11px] font-semibold text-purple flex items-center gap-1">
                      <Sparkles size={12} />
                      <span>{activeGigs.length} Active briefs</span>
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="eyebrow text-ink/50">Total Contracts</span>
                    <div className="w-8 h-8 rounded-xl bg-cyan/15 text-cyan flex items-center justify-center">
                      <Users size={16} />
                    </div>
                  </div>
                  <div>
                    <div className="font-display text-3xl font-extrabold text-ink leading-none mb-1.5">
                      {metrics.totalHires ?? 0}
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <TrendingUp size={12} />
                      <span>{metrics.completionRate || '100%'} completion</span>
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="eyebrow text-ink/50">Completed</span>
                    <div className="w-8 h-8 rounded-xl bg-lime text-ink flex items-center justify-center font-bold">
                      <CheckCircle2 size={16} />
                    </div>
                  </div>
                  <div>
                    <div className="font-display text-3xl font-extrabold text-ink leading-none mb-1.5">
                      {metrics.completedOrdersCount ?? 0}
                    </div>
                    <span className="text-[11px] font-semibold text-ink/60">
                      Signed-off deliverables
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="eyebrow text-ink/50">Total Volume</span>
                    <div className="w-8 h-8 rounded-xl bg-orange/15 text-orange flex items-center justify-center">
                      <Lock size={16} />
                    </div>
                  </div>
                  <div>
                    <div className="font-display text-2xl sm:text-3xl font-extrabold text-ink leading-none mb-1.5">
                      {metrics.totalSpendOrEarned || '₹0'}
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <ShieldCheck size={12} />
                      <span>100% Escrow Protected</span>
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
                      <span>{metrics.averageRating ? metrics.averageRating.toFixed(1) : '5.0'}</span>
                      <span className="text-base text-coral">★</span>
                    </div>
                    <span className="text-[11px] font-semibold text-ink/60">
                      Across {metrics.totalReviews ?? 0} reviews
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-8">
                
                <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                        Active Gigs
                      </h2>
                      <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                        Currently open project commissions accepting bids.
                      </p>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => navigate('/post-gig')}
                        className="btn-secondary !py-2 !px-3.5 !text-xs self-start sm:self-auto inline-flex items-center gap-1.5"
                      >
                        <Plus size={14} />
                        <span>Post Another Gig</span>
                      </button>
                    )}
                  </div>

                  {activeGigs.length === 0 ? (
                    <div className="text-center py-10 px-4 rounded-2xl bg-soft/40 border border-border/50 space-y-2">
                      <Briefcase size={28} className="mx-auto text-ink/30" />
                      <p className="text-xs font-bold text-ink/70">No active gigs posted currently</p>
                      <p className="text-[11px] text-ink/45">
                        {isOwner ? 'Post a new gig to start receiving proposals from top talent.' : 'This member currently has no active open commissions.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {activeGigs.map((gig: any) => (
                        <div
                          key={gig.id}
                          onClick={() => navigate(`/gigs/${gig.id}`)}
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
                  )}
                </section>

                <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                        Past Projects & Hiring History
                      </h2>
                      <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                        Showcase products, ventures, and previous projects to help freelancers understand your work and build trust.
                      </p>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => navigate('/profile/edit')}
                        className="btn-secondary !py-2 !px-3.5 !text-xs self-start sm:self-auto inline-flex items-center gap-1.5"
                      >
                        <Plus size={14} />
                        <span>Manage Past Projects</span>
                      </button>
                    )}
                  </div>

                  {(!p.portfolio || p.portfolio.length === 0) ? (
                    <div className="text-center py-10 px-4 rounded-2xl bg-soft/40 border border-border/50 space-y-2">
                      <FolderGit2 size={28} className="mx-auto text-ink/30" />
                      <p className="text-xs font-bold text-ink/70">
                        No past projects added yet
                      </p>
                      <p className="text-[11px] text-ink/45 max-w-md mx-auto">
                        {isOwner ? 'Add previous products, ventures, or completed projects in Edit Profile to build credibility and help freelancers understand the type of work you create.' : 'No past projects have been published by this hirer yet.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {p.portfolio.map((item: any, idx: number) => (
                        <div
                          key={item._id || idx}
                          className="bg-soft/40 rounded-2xl p-5 border border-border/50 hover:bg-white hover:border-purple/30 hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
                        >
                          <div>
                            {item.url && (
                              <div className="h-32 w-full rounded-xl overflow-hidden mb-3 bg-paper border border-border/40">
                                <img
                                  src={item.url}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <h4 className="font-bold text-base text-ink">{item.title}</h4>
                                  {item.status && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                      item.status === 'Completed'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : item.status === 'In Progress'
                                        ? 'bg-purple/10 text-purple'
                                        : 'bg-sky-100 text-sky-800'
                                    }`}>
                                      {item.status}
                                    </span>
                                  )}
                                </div>
                                {item.freelancersHired !== undefined && item.freelancersHired > 0 && (
                                  <div className="text-[11px] font-semibold text-ink/60 mb-2 flex items-center gap-1">
                                    <Users size={12} className="text-purple" />
                                    <span>
                                      {item.freelancersHired} Freelancer{item.freelancersHired === 1 ? '' : 's'} Hired
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {item.description && (
                              <p className="text-xs text-ink/70 leading-relaxed line-clamp-3 mb-2.5">
                                {item.description}
                              </p>
                            )}
                            {item.technologies && item.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {item.technologies.map((t: string, tidx: number) => (
                                  <span
                                    key={tidx}
                                    className="text-[9px] font-bold bg-white text-ink/70 px-2 py-0.5 rounded-full border border-border/50"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {item.projectLink && (
                            <a
                              href={item.projectLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-purple hover:underline inline-flex items-center gap-1 pt-2 border-t border-border/30"
                            >
                              <span>Open Project</span>
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
                  <div className="flex items-center justify-between border-b border-border/60 pb-4">
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                        Verified Reviews & Feedback
                      </h2>
                      <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                        Authentic ratings from platform collaborators upon signed-off deliverables.
                      </p>
                    </div>
                    <span className="bg-lime text-ink text-xs font-bold px-3 py-1 rounded-full font-clash">
                      ★ {metrics.averageRating ? metrics.averageRating.toFixed(1) : '5.0'} Rating ({reviews.length} Reviews)
                    </span>
                  </div>

                  {reviews.length === 0 ? (
                    <div className="text-center py-10 px-4 rounded-2xl bg-soft/40 border border-border/50 space-y-2">
                      <MessageSquare size={28} className="mx-auto text-ink/30" />
                      <p className="text-xs font-bold text-ink/70">No reviews received yet</p>
                      <p className="text-[11px] text-ink/45">
                        Reviews and ratings will appear here once contracts are completed and evaluated.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((rev: any) => (
                        <div
                          key={rev.id}
                          className="bg-soft/50 rounded-[22px] p-5 sm:p-6 border border-border/50 hover:border-purple/25 hover:bg-white transition-all space-y-3.5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-[14px] flex items-center justify-center font-clash font-bold text-xs text-ink shadow-xs"
                                style={{ backgroundColor: rev.avatarColor || '#22D3EE' }}
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
                                {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                                  <span key={i}>★</span>
                                ))}
                              </div>
                              {rev.date && <span className="text-xs text-ink/40 font-medium">· {rev.date}</span>}
                            </div>
                          </div>

                          {rev.comment && (
                            <p className="text-xs sm:text-sm text-ink/80 leading-relaxed italic font-normal">
                              "{rev.comment}"
                            </p>
                          )}

                          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-ink/55">
                            <span>Project: <strong className="text-ink">{rev.project}</strong></span>
                            {rev.budget && <span>Contract: <strong className="text-purple">{rev.budget}</strong></span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                        Order History
                      </h2>
                      <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                        Live record of platform orders and milestone sign-offs.
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

                  {filteredHistory.length === 0 ? (
                    <div className="text-center py-10 px-4 rounded-2xl bg-soft/40 border border-border/50 space-y-2">
                      <Briefcase size={28} className="mx-auto text-ink/30" />
                      <p className="text-xs font-bold text-ink/70">No project contracts found</p>
                      <p className="text-[11px] text-ink/45">Contracts and delivery milestones will appear here as work progresses.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredHistory.map((proj: any) => (
                        <div
                          key={proj.id}
                          className="bg-soft/40 rounded-2xl p-4 border border-border/50 hover:bg-white hover:border-purple/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center font-clash font-bold text-xs text-ink shrink-0"
                              style={{ backgroundColor: proj.avatarColor || '#22D3EE' }}
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
                                Collaborator: <strong className="text-ink">{proj.partnerName}</strong> · {proj.completedDate}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40 text-xs">
                            <span className="font-bold text-ink">{proj.budget}</span>
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/50">
                              Escrow Verified
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {preferredCollaborators.length > 0 && (
                  <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
                    <div className="flex items-center justify-between border-b border-border/60 pb-4">
                      <div>
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                          Repeat Collaborators
                        </h2>
                        <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                          Partners with multi-contract history and 100% on-time milestone delivery.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-purple bg-purple/10 px-3 py-1 rounded-full">
                        {preferredCollaborators.length} Partners
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {preferredCollaborators.map((f: any) => (
                        <div
                          key={f.id}
                          className="bg-soft/60 rounded-[22px] p-5 border border-border/60 hover:border-purple/30 hover:bg-white hover:shadow-xs transition-all duration-200 flex flex-col justify-between space-y-4"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div
                                className="w-11 h-11 rounded-[14px] flex items-center justify-center font-clash font-bold text-sm text-ink shadow-xs"
                                style={{ backgroundColor: f.avatarColor || '#22D3EE' }}
                              >
                                {f.name.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="text-[10px] font-bold text-purple bg-purple/10 px-2 py-0.5 rounded-full">
                                {f.badge}
                              </span>
                            </div>

                            <h4 className="font-bold text-base text-ink">{f.name}</h4>
                            <p className="text-xs text-ink/60 font-medium mt-0.5">{f.role}</p>

                            <div className="mt-3 pt-3 border-t border-border/50 text-xs space-y-1 text-ink/70 font-medium">
                              <div className="flex justify-between">
                                <span>Contracts Together:</span>
                                <strong className="text-ink">{f.projectsTogether} Orders</strong>
                              </div>
                              <div className="flex justify-between">
                                <span>Volume:</span>
                                <strong className="text-purple font-bold">{f.totalPaid}</strong>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => navigate(`/profile/${f.id}`)}
                            className="w-full btn-secondary !py-2 !text-xs justify-center"
                          >
                            <span>View Profile</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-5">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                    <h3 className="font-display font-bold text-lg text-ink">
                      Credentials & Info
                    </h3>
                    <Building2 size={18} className="text-purple" />
                  </div>

                  <div className="space-y-3.5 text-xs font-medium text-ink/75">
                    <div className="flex items-center justify-between">
                      <span className="text-ink/50 flex items-center gap-1.5">
                        <Building2 size={14} />
                        <span>Organization:</span>
                      </span>
                      <strong className="text-ink font-bold">{displayCompany}</strong>
                    </div>

                    {p.industry && (
                      <div className="flex items-center justify-between">
                        <span className="text-ink/50 flex items-center gap-1.5">
                          <Sparkles size={14} />
                          <span>Industry:</span>
                        </span>
                        <strong className="text-ink font-semibold">{p.industry}</strong>
                      </div>
                    )}

                    {p.teamSize && (
                      <div className="flex items-center justify-between">
                        <span className="text-ink/50 flex items-center gap-1.5">
                          <Users size={14} />
                          <span>Team Size:</span>
                        </span>
                        <strong className="text-ink font-semibold">{p.teamSize}</strong>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-ink/50 flex items-center gap-1.5">
                        <MapPin size={14} />
                        <span>Location:</span>
                      </span>
                      <strong className="text-ink font-semibold">{displayLocation}</strong>
                    </div>

                    {p.website && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-ink/50 flex items-center gap-1.5">
                          <Globe size={14} />
                          <span>Website:</span>
                        </span>
                        <a
                          href={p.website.startsWith('http') ? p.website : `https://${p.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-purple font-bold hover:underline inline-flex items-center gap-1"
                        >
                          <span className="max-w-[120px] truncate">{p.website.replace('https://', '').replace('http://', '')}</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-4">
                  <h3 className="font-display font-bold text-lg text-ink border-b border-border/60 pb-3">
                    Activity & Trust Metrics
                  </h3>

                  <div className="space-y-3 text-xs font-medium">
                    <div className="p-3 rounded-xl bg-soft flex items-center justify-between">
                      <span className="text-ink/60">Response Cadence</span>
                      <strong className="text-emerald-700 font-bold">{p.responseTime || '< 2 Hours'}</strong>
                    </div>

                    <div className="p-3 rounded-xl bg-soft flex items-center justify-between">
                      <span className="text-ink/60">Completed Deliverables</span>
                      <strong className="text-ink font-bold">{metrics.completedOrdersCount ?? 0} Signed-off</strong>
                    </div>

                    <div className="p-3 rounded-xl bg-soft flex items-center justify-between">
                      <span className="text-ink/60">Contract Success Rate</span>
                      <strong className="text-emerald-700 font-bold">{metrics.completionRate || '100%'}</strong>
                    </div>

                    <div className="p-3 rounded-xl bg-soft flex items-center justify-between">
                      <span className="text-ink/60">Profile Credibility</span>
                      <strong className="text-purple font-bold">{p.profileCompletion ?? 100}% Complete</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple/5 to-cyan/5 rounded-[28px] p-6 border border-purple/20 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    <span>100% Escrow Protected Profile</span>
                  </div>
                  <p className="text-xs text-ink/75 leading-relaxed font-medium">
                    All contract transactions, milestone payouts, and reviews on this profile are authenticated by the GigMatch Escrow Protocol.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ====================================================
             FREELANCER PROFILE (100% BACKEND-DRIVEN, ZERO MOCK DATA)
             ==================================================== */
          <>
            {/* 1. FREELANCER HERO HEADER CARD */}
            <section className="bg-white rounded-[28px] p-6 sm:p-8 lg:p-10 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] relative overflow-hidden">
              <div
                className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full opacity-15 pointer-events-none -mr-24 -mt-24 blur-3xl"
                style={{ background: 'radial-gradient(circle, #A3E635 0%, #7C3AED 50%, #22D3EE 100%)' }}
              />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                {/* Avatar & Core Freelancer Identity */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
                  <div className="relative">
                    <div
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-[24px] font-clash font-bold text-2xl sm:text-3xl text-ink flex items-center justify-center shadow-lg ring-4 ring-white shrink-0 overflow-hidden transition-colors"
                      style={{ backgroundColor: avatarBg }}
                    >
                      {(u.avatar || p.avatar) ? (
                        <img
                          src={u.avatar || p.avatar}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        displayInitials
                      )}
                    </div>
                    <div
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-xs flex items-center justify-center text-white"
                      title="Verified Freelancer"
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
                        <span>Verified Freelancer</span>
                      </span>
                      {metrics.totalReviews > 0 && metrics.averageRating >= 4.5 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-purple bg-purple/10 px-3 py-1 rounded-full border border-purple/20">
                          <Award size={13} className="text-purple" />
                          <span>Top Rated Specialist</span>
                        </span>
                      ) : metrics.completedOrdersCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/50">
                          <CheckCircle2 size={13} />
                          <span>Active Creator</span>
                        </span>
                      ) : null}
                    </div>

                    <p className="text-sm sm:text-base font-bold text-purple flex items-center gap-2">
                      <span>{p.roleTitle || 'Independent Creator'}</span>
                      {p.experience && p.experience > 0 ? (
                        <>
                          <span className="text-ink/30">·</span>
                          <span className="text-ink/70 font-semibold text-xs bg-soft px-2.5 py-0.5 rounded-full border border-border/50">
                            {p.experience} Years Exp
                          </span>
                        </>
                      ) : null}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-ink/55 font-medium pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-ink/40" />
                        <span>{displayLocation}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={13} className="text-ink/40" />
                        <span>Member since {memberSinceFormatted}</span>
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/40">
                        <Zap size={12} className="text-emerald-500" />
                        <span>Responds {p.responseTime || '< 2 Hours'}</span>
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Available for Work</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Profile CTAs */}
                <div className="flex flex-wrap items-center gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-border/50">
                  {isOwner ? (
                    <>
                      <button
                        onClick={() => navigate('/profile/edit')}
                        className="btn-secondary !py-2.5 !px-4 !text-xs sm:!text-sm inline-flex items-center gap-2"
                      >
                        <Edit3 size={15} />
                        <span>Edit Profile</span>
                      </button>
                      <button
                        onClick={handleShareProfile}
                        className="btn-primary !py-2.5 !px-5 !text-xs sm:!text-sm inline-flex items-center gap-2"
                      >
                        <Share2 size={15} />
                        <span>Share Profile</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => navigate('/post-gig')}
                        className="btn-primary !py-2.5 !px-5 !text-xs sm:!text-sm inline-flex items-center gap-2 shadow-lg shadow-purple/15"
                      >
                        <Send size={14} />
                        <span>Hire Me / Invite to Project</span>
                      </button>
                      <button
                        onClick={() => {
                          toast.info(`Starting direct conversation with ${displayName}`);
                          navigate('/messages');
                        }}
                        className="btn-secondary !py-2.5 !px-4 !text-xs sm:!text-sm inline-flex items-center gap-2"
                      >
                        <MessageSquare size={14} />
                        <span>Send Message</span>
                      </button>
                      <button
                        onClick={handleShareProfile}
                        className="p-2.5 rounded-xl border border-border/60 hover:bg-soft text-ink/70 hover:text-purple transition-all"
                        title="Share Profile Link"
                      >
                        <Share2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 2. ABOUT ME */}
              <div className="mt-8 pt-6 border-t border-border/60 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="eyebrow text-purple">ABOUT ME</span>
                  {p.hourlyRate ? (
                    <span className="font-display font-extrabold text-sm text-ink bg-soft px-3 py-1 rounded-full border border-border/60">
                      ₹{Number(p.hourlyRate).toLocaleString('en-IN')} <span className="text-xs font-medium text-ink/50">/ hour</span>
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-ink/50 bg-soft px-3 py-1 rounded-full border border-border/60">
                      Hourly rate not specified
                    </span>
                  )}
                </div>

                <p className="text-sm sm:text-base leading-relaxed text-ink/85 max-w-4xl font-normal">
                  {p.bio || (isOwner ? 'No professional summary added yet. Click Edit Profile to add your bio and experience.' : 'No professional summary provided yet.')}
                </p>

                {/* Real Skills & Specializations */}
                {p.skills && p.skills.length > 0 && (
                  <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink/70">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink/40 mr-1">Specializations:</span>
                    {p.skills.slice(0, 6).map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="bg-purple/5 text-purple border border-purple/20 px-3 py-1 rounded-full text-xs font-semibold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* 3. FREELANCER PROFESSIONAL STATS (5 Real KPI Cards) */}
            <section aria-label="Freelancer KPIs">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
                {/* 1. Completed Projects */}
                <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="eyebrow text-ink/50">Completed Projects</span>
                    <div className="w-8 h-8 rounded-xl bg-lime text-ink flex items-center justify-center font-bold">
                      <CheckCircle2 size={16} />
                    </div>
                  </div>
                  <div>
                    <div className="font-display text-3xl font-extrabold text-ink leading-none mb-1.5">
                      {metrics.completedOrdersCount ?? 0}
                    </div>
                    <span className="text-[11px] font-semibold text-ink/60 flex items-center gap-1">
                      {metrics.completedOrdersCount > 0 ? (
                        <>
                          <CheckCheck size={12} className="text-emerald-600" />
                          <span className="text-emerald-600">Signed-Off</span>
                        </>
                      ) : (
                        <span>0 projects delivered</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* 2. Active Contracts */}
                <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="eyebrow text-ink/50">Active Contracts</span>
                    <div className="w-8 h-8 rounded-xl bg-purple/15 text-purple flex items-center justify-center">
                      <Briefcase size={16} />
                    </div>
                  </div>
                  <div>
                    <div className="font-display text-3xl font-extrabold text-ink leading-none mb-1.5">
                      {metrics.activeOrdersCount ?? 0}
                    </div>
                    <span className="text-[11px] font-semibold text-ink/60 flex items-center gap-1">
                      {metrics.activeOrdersCount > 0 ? (
                        <>
                          <Sparkles size={12} className="text-purple" />
                          <span className="text-purple">In Active Delivery</span>
                        </>
                      ) : (
                        <span>No active contracts</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* 3. Client Satisfaction */}
                <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="eyebrow text-ink/50">Client Rating</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <ThumbsUp size={16} />
                    </div>
                  </div>
                  <div>
                    <div className="font-display text-3xl font-extrabold text-ink leading-none mb-1.5">
                      {metrics.totalReviews > 0 ? `${metrics.averageRating.toFixed(1)} ★` : 'N/A'}
                    </div>
                    <span className="text-[11px] font-semibold text-ink/60 flex items-center gap-1">
                      {metrics.totalReviews > 0 ? (
                        <>
                          <Star size={12} className="fill-current text-amber-500" />
                          <span>{metrics.totalReviews} {metrics.totalReviews === 1 ? 'review' : 'reviews'}</span>
                        </>
                      ) : (
                        <span>No reviews yet</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* 4. Total Earnings */}
                <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="eyebrow text-ink/50">Total Earnings</span>
                    <div className="w-8 h-8 rounded-xl bg-orange/15 text-orange flex items-center justify-center">
                      <DollarSign size={16} />
                    </div>
                  </div>
                  <div>
                    <div className="font-display text-2xl sm:text-3xl font-extrabold text-ink leading-none mb-1.5">
                      {metrics.totalSpendOrEarned || '₹0'}
                    </div>
                    <span className="text-[11px] font-semibold text-ink/60 flex items-center gap-1">
                      {metrics.completedOrdersCount > 0 ? (
                        <>
                          <ShieldCheck size={12} className="text-emerald-600" />
                          <span className="text-emerald-600">Escrow Verified</span>
                        </>
                      ) : (
                        <span>₹0 Earned</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* 5. Completion Rate */}
                <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className="eyebrow text-ink/50">Completion Rate</span>
                    <div className="w-8 h-8 rounded-xl bg-coral/15 text-coral flex items-center justify-center">
                      <Zap size={16} />
                    </div>
                  </div>
                  <div>
                    <div className="font-display text-3xl font-extrabold text-ink leading-none mb-1.5">
                      {metrics.totalHires > 0 ? metrics.completionRate : '100%'}
                    </div>
                    <span className="text-[11px] font-semibold text-ink/60 flex items-center gap-1">
                      <Clock size={12} />
                      <span>{p.responseTime || '< 2 Hours'}</span>
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* TWO-COLUMN FREELANCER WORKSPACE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN: Skills, Portfolio, Services, Reviews, Work History */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* 4. SKILLS & TECH STACK (100% REAL FROM PROFILE) */}
                <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                        Skills & Tech Stack
                      </h2>
                      <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                        Verified programming languages, frameworks, libraries, and toolsets.
                      </p>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => navigate('/profile/edit')}
                        className="btn-secondary !py-2 !px-3.5 !text-xs self-start sm:self-auto inline-flex items-center gap-1.5"
                      >
                        <Edit3 size={13} />
                        <span>Update Skills</span>
                      </button>
                    )}
                  </div>

                  {(!p.skills || p.skills.length === 0) ? (
                    <div className="text-center py-8 px-4 rounded-2xl bg-soft/40 border border-border/50 space-y-2">
                      <Code size={28} className="mx-auto text-ink/30" />
                      <p className="text-xs font-bold text-ink/70">No skills added yet</p>
                      <p className="text-[11px] text-ink/45 max-w-md mx-auto">
                        {isOwner
                          ? 'Add your technical skills, frameworks, and programming languages in Edit Profile to help clients find your services.'
                          : 'This creator has not listed any skills on their profile yet.'}
                      </p>
                      {isOwner && (
                        <button
                          onClick={() => navigate('/profile/edit')}
                          className="btn-primary !py-1.5 !px-3.5 !text-xs mt-2 inline-flex items-center gap-1"
                        >
                          <Plus size={13} />
                          <span>Add Skills</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2.5">
                      {p.skills.map((skill: string, idx: number) => (
                        <div
                          key={idx}
                          className="group bg-soft hover:bg-white hover:border-purple/40 hover:shadow-xs px-3.5 py-2 rounded-2xl border border-border/60 transition-all flex items-center gap-2 cursor-default"
                        >
                          <span className="w-2 h-2 rounded-full bg-purple/60 group-hover:bg-purple group-hover:scale-125 transition-all" />
                          <span className="text-xs sm:text-sm font-bold text-ink group-hover:text-purple transition-colors">
                            {skill}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* 5. PORTFOLIO PROJECTS (PORTFOLIO & CASE STUDIES) */}
                <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                          Portfolio & Case Studies
                        </h2>
                        {p.portfolio && p.portfolio.length > 0 && (
                          <span className="bg-purple/10 text-purple text-xs font-bold px-2.5 py-0.5 rounded-full">
                            {p.portfolio.length} Projects
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                        Curated project deliveries, live engineering prototypes, and high-impact case studies.
                      </p>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => navigate('/profile/edit')}
                        className="btn-secondary !py-2 !px-3.5 !text-xs self-start sm:self-auto inline-flex items-center gap-1.5"
                      >
                        <Plus size={14} />
                        <span>Manage Portfolio</span>
                      </button>
                    )}
                  </div>

                  {(!p.portfolio || p.portfolio.length === 0) ? (
                    <div className="text-center py-12 px-4 rounded-2xl bg-soft/40 border border-border/50 space-y-2">
                      <FolderGit2 size={32} className="mx-auto text-ink/30" />
                      <p className="text-xs font-bold text-ink/70">No portfolio projects added yet</p>
                      <p className="text-[11px] text-ink/45 max-w-md mx-auto">
                        {isOwner
                          ? 'Add live demos and project links in Edit Profile to show clients your engineering and design work.'
                          : 'This creator has not published public case studies yet.'}
                      </p>
                      {isOwner && (
                        <button
                          onClick={() => navigate('/profile/edit')}
                          className="btn-primary !py-2 !px-4 !text-xs mt-3 inline-flex items-center gap-1.5"
                        >
                          <Plus size={14} />
                          <span>Add Your First Project</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {p.portfolio.map((item: any, idx: number) => (
                        <div
                          key={item._id || idx}
                          className="bg-soft/40 rounded-2xl p-5 border border-border/50 hover:bg-white hover:border-purple/30 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                        >
                          <div>
                            {item.url ? (
                              <div className="h-36 w-full rounded-xl overflow-hidden mb-3 bg-paper border border-border/40 relative">
                                <img
                                  src={item.url}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                {item.status && (
                                  <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-black/60 text-white backdrop-blur-xs">
                                    {item.status}
                                  </span>
                                )}
                              </div>
                            ) : null}

                            <h4 className="font-bold text-base text-ink group-hover:text-purple transition-colors mb-1.5">
                              {item.title}
                            </h4>

                            {item.description && (
                              <p className="text-xs text-ink/70 leading-relaxed line-clamp-3 mb-3">
                                {item.description}
                              </p>
                            )}

                            {item.technologies && item.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {item.technologies.map((t: string, tidx: number) => (
                                  <span
                                    key={tidx}
                                    className="text-[9px] font-bold bg-white text-ink/70 px-2 py-0.5 rounded-full border border-border/50"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-3 pt-3 border-t border-border/40">
                            {item.projectLink ? (
                              <a
                                href={item.projectLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-purple hover:underline inline-flex items-center gap-1.5"
                              >
                                <span>Live Demo</span>
                                <ExternalLink size={12} />
                              </a>
                            ) : (
                              <span className="text-xs font-medium text-ink/40">Project Verified</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* 7. MY SERVICES (ACTIVE SERVICES CREATED BY USER) */}
                <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                        My Services
                      </h2>
                      <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                        Active service offerings and project commissions published by this creator.
                      </p>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => navigate('/post-gig')}
                        className="btn-secondary !py-2 !px-3.5 !text-xs self-start sm:self-auto inline-flex items-center gap-1.5"
                      >
                        <Plus size={14} />
                        <span>Publish Service</span>
                      </button>
                    )}
                  </div>

                  {(!activeGigs || activeGigs.length === 0) ? (
                    <div className="text-center py-10 px-4 rounded-2xl bg-soft/40 border border-border/50 space-y-2">
                      <Briefcase size={28} className="mx-auto text-ink/30" />
                      <p className="text-xs font-bold text-ink/70">No services published yet</p>
                      <p className="text-[11px] text-ink/45 max-w-md mx-auto">
                        {isOwner
                          ? 'Publish a service or gig to showcase your packaged solutions to clients looking for talent.'
                          : 'This creator has not published any active service packages yet.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeGigs.map((gig: any) => (
                        <div
                          key={gig.id}
                          onClick={() => navigate(`/gigs/${gig.id}`)}
                          className="bg-soft/50 rounded-2xl p-5 border border-border/60 hover:bg-white hover:border-purple/30 hover:shadow-sm transition-all flex flex-col justify-between space-y-4 group cursor-pointer"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-purple bg-purple/10 px-2.5 py-0.5 rounded-full">
                                {gig.category}
                              </span>
                              <ArrowUpRight
                                size={15}
                                className="text-ink/30 group-hover:text-purple group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                              />
                            </div>

                            <h3 className="font-bold text-sm sm:text-base text-ink group-hover:text-purple transition-colors mb-1.5">
                              {gig.title}
                            </h3>
                          </div>

                          <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                            <div>
                              <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider block">Budget</span>
                              <span className="font-display font-extrabold text-base text-ink">{gig.budget}</span>
                            </div>
                            <span className="font-bold text-purple bg-purple/10 px-2.5 py-0.5 rounded-full text-[11px]">
                              {gig.proposalsCount} bids
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* 6. CLIENT REVIEWS & RATINGS (100% REAL REVIEWS) */}
                <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
                  <div className="flex items-center justify-between border-b border-border/60 pb-4">
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                        Client Reviews & Ratings
                      </h2>
                      <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                        Authentic feedback and ratings from clients on successfully delivered contracts.
                      </p>
                    </div>
                    {metrics.totalReviews > 0 ? (
                      <span className="bg-lime text-ink text-xs font-bold px-3 py-1 rounded-full font-clash shadow-xs">
                        ★ {metrics.averageRating.toFixed(1)} ({metrics.totalReviews} {metrics.totalReviews === 1 ? 'Review' : 'Reviews'})
                      </span>
                    ) : (
                      <span className="bg-soft text-ink/60 text-xs font-bold px-3 py-1 rounded-full">
                        No Reviews Yet
                      </span>
                    )}
                  </div>

                  {(!reviews || reviews.length === 0) ? (
                    <div className="text-center py-10 px-4 rounded-2xl bg-soft/40 border border-border/50 space-y-2">
                      <MessageSquare size={28} className="mx-auto text-ink/30" />
                      <p className="text-xs font-bold text-ink/70">No reviews received yet</p>
                      <p className="text-[11px] text-ink/45">
                        Reviews and ratings will appear here once contracts are completed and evaluated by platform clients.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((rev: any) => (
                        <div
                          key={rev.id}
                          className="bg-soft/50 rounded-[22px] p-5 sm:p-6 border border-border/50 hover:border-purple/25 hover:bg-white transition-all space-y-3.5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-[14px] flex items-center justify-center font-clash font-bold text-xs text-ink shadow-xs"
                                style={{ backgroundColor: rev.avatarColor || '#22D3EE' }}
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
                                {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                                  <span key={i}>★</span>
                                ))}
                              </div>
                              {rev.date && <span className="text-xs text-ink/40 font-medium">· {rev.date}</span>}
                            </div>
                          </div>

                          {rev.comment && (
                            <p className="text-xs sm:text-sm text-ink/80 leading-relaxed italic font-normal">
                              "{rev.comment}"
                            </p>
                          )}

                          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-ink/55">
                            <span>Project: <strong className="text-ink">{rev.project}</strong></span>
                            {rev.budget && <span>Contract: <strong className="text-purple">{rev.budget}</strong></span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* 8. WORK HISTORY (100% REAL ORDERS) */}
                <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                        Work History
                      </h2>
                      <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                        Verified timeline of contracts, client collaborations, and milestone sign-offs.
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-soft p-1 rounded-xl border border-border/50 text-xs font-semibold">
                      {(['All', 'Completed', 'Recent'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setHistoryFilter(filter)}
                          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer border-0 ${
                            historyFilter === filter
                              ? 'bg-white text-ink shadow-xs font-bold'
                              : 'text-ink/60 hover:text-ink bg-transparent'
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(!filteredHistory || filteredHistory.length === 0) ? (
                    <div className="text-center py-10 px-4 rounded-2xl bg-soft/40 border border-border/50 space-y-2">
                      <Briefcase size={28} className="mx-auto text-ink/30" />
                      <p className="text-xs font-bold text-ink/70">No work history available</p>
                      <p className="text-[11px] text-ink/45">
                        Contracts and milestone deliveries will appear here as orders are created and signed-off.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredHistory.map((proj: any) => (
                        <div
                          key={proj.id}
                          className="bg-soft/40 rounded-2xl p-4 border border-border/50 hover:bg-white hover:border-purple/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center font-clash font-bold text-xs text-ink shrink-0"
                              style={{ backgroundColor: proj.avatarColor || '#22D3EE' }}
                            >
                              {proj.initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-bold text-sm text-ink truncate">{proj.name}</h4>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  proj.status?.toLowerCase() === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                                    : 'bg-purple/10 text-purple border border-purple/20'
                                }`}>
                                  {proj.status}
                                </span>
                              </div>
                              <p className="text-xs text-ink/50 mt-0.5">
                                Client: <strong className="text-ink">{proj.partnerName}</strong> · {proj.completedDate}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40 text-xs">
                            <span className="font-bold text-ink">{proj.budget}</span>
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/50">
                              Escrow Verified
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* RIGHT COLUMN: 9. Earnings & Achievements, Preferences, 10. Profile CTA */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* 9. EARNINGS & ACHIEVEMENTS CARD (REAL STATS ONLY) */}
                <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-5">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                    <h3 className="font-display font-bold text-lg text-ink">
                      Earnings & Achievements
                    </h3>
                    <Award size={18} className="text-purple" />
                  </div>

                  <div className="space-y-3.5 text-xs font-medium text-ink/75">
                    <div className="p-3.5 rounded-2xl bg-purple/5 border border-purple/15 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple block">Total Platform Volume</span>
                        <span className="font-display font-extrabold text-xl text-ink">
                          {metrics.totalSpendOrEarned || '₹0'}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                        Escrow Verified
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-ink/55 flex items-center gap-1.5">
                        <Award size={14} className="text-purple" />
                        <span>Platform Badge:</span>
                      </span>
                      <span className="font-bold text-purple bg-purple/10 px-2.5 py-0.5 rounded-full text-xs">
                        {metrics.totalReviews >= 5 && metrics.averageRating >= 4.5
                          ? 'Top Rated Creator'
                          : metrics.completedOrdersCount > 0
                          ? 'Verified Creator'
                          : 'New Creator'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-ink/55 flex items-center gap-1.5">
                        <Users size={14} className="text-cyan" />
                        <span>Repeat Client Hires:</span>
                      </span>
                      <strong className="text-ink font-bold">
                        {preferredCollaborators.length > 0
                          ? `${preferredCollaborators.length} Partners`
                          : 'None yet'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-ink/55 flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>Projects Delivered:</span>
                      </span>
                      <strong className="text-ink font-bold">{metrics.completedOrdersCount ?? 0} Signed-Off</strong>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-ink/55 flex items-center gap-1.5">
                        <Clock size={14} className="text-amber-500" />
                        <span>Contract Completion:</span>
                      </span>
                      <strong className="text-emerald-700 font-bold">{metrics.completionRate || '100%'}</strong>
                    </div>
                  </div>
                </div>

                {/* FREELANCE WORKING PREFERENCES */}
                <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-4">
                  <h3 className="font-display font-bold text-lg text-ink border-b border-border/60 pb-3">
                    Working Preferences
                  </h3>

                  <div className="space-y-3 text-xs font-medium">
                    <div className="p-3 rounded-xl bg-soft flex items-center justify-between">
                      <span className="text-ink/60">Hourly Rate</span>
                      <strong className="text-ink font-bold">
                        {p.hourlyRate ? `₹${Number(p.hourlyRate).toLocaleString('en-IN')} / hr` : 'Not specified'}
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-soft flex items-center justify-between">
                      <span className="text-ink/60">Location</span>
                      <strong className="text-ink font-bold">{displayLocation}</strong>
                    </div>

                    <div className="p-3 rounded-xl bg-soft flex items-center justify-between">
                      <span className="text-ink/60">Response Cadence</span>
                      <strong className="text-emerald-700 font-bold">{p.responseTime || '< 2 Hours'}</strong>
                    </div>
                  </div>
                </div>

                {/* 10. PROFILE CTA CARD */}
                <div className="bg-gradient-to-br from-purple/10 via-soft to-cyan/10 rounded-[28px] p-6 sm:p-7 border border-purple/20 space-y-4 shadow-sm">
                  <div className="space-y-1">
                    <span className="eyebrow text-purple">READY TO COLLABORATE?</span>
                    <h3 className="font-display font-extrabold text-xl text-ink">
                      Work with {displayName}
                    </h3>
                    <p className="text-xs text-ink/70 leading-relaxed font-normal">
                      Pitch your project brief directly or hire for a milestone with 100% escrow protection.
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <button
                      onClick={() => navigate('/post-gig')}
                      className="w-full btn-primary !py-3 !text-xs justify-center shadow-md shadow-purple/15"
                    >
                      <Send size={14} />
                      <span>Hire Me / Invite to Project</span>
                    </button>

                    <button
                      onClick={() => {
                        toast.info(`Starting conversation with ${displayName}`);
                        navigate('/messages');
                      }}
                      className="w-full btn-secondary !py-2.5 !text-xs justify-center"
                    >
                      <MessageSquare size={14} />
                      <span>Send Direct Message</span>
                    </button>
                  </div>
                </div>

                {/* ESCROW & VERIFICATION BADGE CARD */}
                <div className="bg-white rounded-[28px] p-6 border border-border/70 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    <span>GigMatch Talent Escrow Protection</span>
                  </div>
                  <p className="text-xs text-ink/75 leading-relaxed font-medium">
                    All client contracts with this freelancer are protected by our automated milestone escrow protocol. Payouts are only released upon your explicit sign-off.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
