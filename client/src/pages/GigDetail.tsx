import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import {
  CheckCircle2,
  Send,
  Clock,
  FileText,
  ChevronRight,
  Bookmark,
  Share2,
  ShieldCheck,
  Sparkles,
  MapPin,
  Download,
  Eye,
  MessageSquare,
  ArrowUpRight,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Paperclip
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '../components/ui/skeleton';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const getFileUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE}${cleanPath}`;
};

export default function GigDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setAuthModal } = useAuthStore();

  const [gig, setGig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProposal, setShowProposal] = useState(false);
  const [proposal, setProposal] = useState({ coverLetter: '', proposedPrice: '', estimatedDays: '' });
  const [submitting, setSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [similarGigs, setSimilarGigs] = useState<any[]>([]);

  // Socket.IO real-time proposal count integration
  const { socket, connectSocket } = useChatStore();

  useEffect(() => {
    connectSocket();
  }, [connectSocket]);

  useEffect(() => {
    if (!socket || !id) return;

    const handleProposalsUpdate = ({ gigId, proposalsCount }: { gigId: string; proposalsCount: number }) => {
      if (gigId === id) {
        setGig((prev: any) => (prev ? { ...prev, proposalsCount } : prev));
      }
    };

    socket.on('gigProposalsUpdated', handleProposalsUpdate);
    return () => {
      socket.off('gigProposalsUpdated', handleProposalsUpdate);
    };
  }, [socket, id]);

  useEffect(() => {
    fetchGig();
  }, [id, user?.id]);

  const fetchGig = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/gigs/${id}`);
      const gigData = res.data.data.gig;
      setGig(gigData);

      // Pre-fill proposal suggested price from gig budget
      if (gigData?.budget) {
        setProposal(prev => ({
          ...prev,
          proposedPrice: prev.proposedPrice || String(gigData.budget),
          estimatedDays: prev.estimatedDays || '7'
        }));
      }

      // Fetch similar gigs in the same category
      try {
        const catQuery = gigData?.category ? `&category=${encodeURIComponent(gigData.category)}` : '';
        let simRes = await api.get(`/api/gigs?status=open&limit=6${catQuery}`);
        let allGigs = simRes.data.data?.gigs || [];
        let filtered = allGigs.filter((g: any) => g._id !== id);

        // If no gigs found in same category, fallback to open gigs
        if (filtered.length === 0 && gigData?.category) {
          const fallbackRes = await api.get(`/api/gigs?status=open&limit=6`);
          const fallbackGigs = fallbackRes.data.data?.gigs || [];
          filtered = fallbackGigs.filter((g: any) => g._id !== id);
        }
        setSimilarGigs(filtered.slice(0, 3));
      } catch (err) {
        console.error('Failed to fetch similar gigs', err);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleProposalSubmit = async () => {
    if (!proposal.coverLetter || !proposal.proposedPrice || !proposal.estimatedDays) {
      toast.error('Please fill in all proposal fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/proposals', {
        gigId: id,
        coverLetter: proposal.coverLetter,
        proposedPrice: Number(proposal.proposedPrice),
        estimatedDays: Number(proposal.estimatedDays),
      });
      setGig((prev: any) => (prev ? {
        ...prev,
        hasApplied: true,
        proposalsCount: (prev.proposalsCount || 0) + 1
      } : prev));
      toast.success('Proposal submitted successfully!');
      setShowProposal(false);
      navigate('/dashboard?tab=Proposals');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to submit proposal');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Gig link copied to clipboard!');
  };

  const handleToggleSave = () => {
    if (!user) {
      setAuthModal(true, 'login');
      return;
    }
    setIsSaved(!isSaved);
    if (!isSaved) {
      toast.success('Gig saved to your wishlist!');
    } else {
      toast.info('Gig removed from wishlist.');
    }
  };

  const handleMessageClient = () => {
    if (!user) {
      setAuthModal(true, 'login');
      return;
    }
    const clientId = gig.client?._id || gig.client?.id || (typeof gig.client === 'string' ? gig.client : '');
    const currentUserId = user?.id || (user as any)?._id || '';
    if (currentUserId && clientId && String(currentUserId) === String(clientId)) {
      toast.info('This is your own gig brief.');
      return;
    }
    // Navigate to dashboard Messages tab with hirer info
    const clientNameParam = gig.client?.name || '';
    const clientAvatar = gig.client?.avatar || '';
    const clientAvatarColor = gig.client?.avatarColor || '';
    const gigTitle = gig.title || '';
    const gigId = gig._id || id || '';
    let url = `/dashboard?tab=Messages&chatWith=${clientId}&chatName=${encodeURIComponent(clientNameParam)}`;
    if (clientAvatar) url += `&chatAvatar=${encodeURIComponent(clientAvatar)}`;
    if (clientAvatarColor) url += `&chatAvatarColor=${encodeURIComponent(clientAvatarColor)}`;
    if (gigTitle) url += `&gigTitle=${encodeURIComponent(gigTitle)}`;
    if (gigId) url += `&gigId=${gigId}`;
    navigate(url);
  };

  const scrollToProposal = () => {
    const doScroll = () => {
      const formEl = document.getElementById('proposal-form-section');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const textarea = formEl.querySelector('textarea') as HTMLTextAreaElement | null;
        if (textarea) {
          textarea.focus({ preventScroll: true });
        }
        return true;
      }
      return false;
    };

    if (!doScroll()) {
      setTimeout(() => {
        if (!doScroll()) {
          setTimeout(doScroll, 100);
        }
      }, 50);
    }
  };

  const handleApplyClick = () => {
    if (!user) {
      setAuthModal(true, 'login');
      return;
    }
    const clientId = gig.client?._id || gig.client?.id || (typeof gig.client === 'string' ? gig.client : '');
    const currentUserId = user?.id || (user as any)?._id || '';
    if (currentUserId && clientId && String(currentUserId) === String(clientId)) {
      toast.info('You are the employer who posted this gig.');
      return;
    }
    if (user.role === 'client') {
      toast.info('You are currently logged in as an Employer.');
      return;
    }
    if ((gig.status || 'open') !== 'open') {
      toast.error('This gig is no longer accepting proposals.');
      return;
    }
    if (gig.hasApplied) {
      toast.info('You have already submitted a proposal for this gig.');
      return;
    }
    setShowProposal(true);
    scrollToProposal();
  };

  // Fetch similar gigs in the same category
  const displayedSimilarGigs = similarGigs;

  if (loading) {
    return (
      <div className="bg-paper min-h-screen py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          <Skeleton className="h-6 w-48 rounded-md" />
          <div className="grid lg:grid-cols-[1fr_360px] gap-8">
            <div className="space-y-6">
              <Skeleton className="h-12 w-3/4 rounded-2xl" />
              <Skeleton className="h-6 w-1/3 rounded-full" />
              <Skeleton className="h-64 w-full rounded-[28px] mt-6" />
              <Skeleton className="h-32 w-full rounded-[28px]" />
            </div>
            <Skeleton className="h-[480px] w-full rounded-[28px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="min-h-[70vh] bg-paper flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-purple/10 text-purple flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="font-display text-2xl font-bold text-ink mb-2">Gig Not Found</h2>
        <p className="text-sm text-ink/60 mb-6 max-w-md">
          This gig brief may have expired, been filled by another creator, or is no longer accessible.
        </p>
        <button onClick={() => navigate('/gigs')} className="btn-primary">
          Explore All Opportunities
        </button>
      </div>
    );
  }

  const clientId = gig.client?._id || gig.client?.id || (typeof gig.client === 'string' ? gig.client : '');
  const currentUserId = user?.id || (user as any)?._id || '';
  const isOwner = Boolean(currentUserId && clientId && String(currentUserId) === String(clientId));
  const isGigOpen = (gig.status || 'open') === 'open';
  const hasApplied = Boolean(gig.hasApplied);

  const clientName = gig.client?.name || 'Verified Studio';
  const clientInitials = clientName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'VS';

  const experienceLevel = gig.experienceLevel || 'Intermediate to Expert';
  const categoryLabel = (gig.category || 'General').replace('-', ' ');
  const formattedDate = gig.createdAt
    ? new Date(gig.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recently';
  const deadlineDisplay = gig.deadline
    ? new Date(gig.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Flexible';

  const bidPriceNumber = Number(proposal.proposedPrice) || 0;
  const platformFee = Math.round(bidPriceNumber * 0.10);
  const netEarnings = Math.max(0, bidPriceNumber - platformFee);

  // Normalize attachments list from gig.attachments AND gig.images (both are combined)
  const rawAttachments: Array<{ name: string; url: string; size?: number; type?: string }> = [];
  if (gig.attachments && Array.isArray(gig.attachments)) {
    gig.attachments.forEach((att: any, i: number) => {
      if (typeof att === 'string') {
        rawAttachments.push({ name: `Attachment ${i + 1}`, url: getFileUrl(att) });
      } else if (att?.url) {
        rawAttachments.push({
          name: att.name || `Attachment ${i + 1}`,
          url: getFileUrl(att.url),
          size: att.size,
          type: att.type,
        });
      }
    });
  }
  if (gig.images && Array.isArray(gig.images)) {
    gig.images.forEach((img: string, i: number) => {
      const fullUrl = getFileUrl(img);
      // Avoid duplicating if already present in attachments
      const alreadyIncluded = rawAttachments.some(a => a.url === fullUrl || a.url === img);
      if (!alreadyIncluded) {
        rawAttachments.push({ name: `Project Asset ${i + 1}`, url: fullUrl, type: 'image/jpeg' });
      }
    });
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-paper text-ink pb-24 antialiased selection:bg-purple/15 selection:text-ink">
      
      {/* ====================================================
          BREADCRUMBS BAR
          ==================================================== */}
      <nav className="border-b border-border/70 bg-white/70 backdrop-blur-md sticky top-0 z-20" aria-label="Breadcrumb">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between text-xs font-semibold text-ink/50">
          <div className="flex items-center gap-2 min-w-0">
            <Link to="/" className="hover:text-purple transition-colors no-underline text-ink/60 shrink-0">
              Home
            </Link>
            <ChevronRight size={13} className="shrink-0 text-ink/30" />
            <Link to="/gigs" className="hover:text-purple transition-colors no-underline text-ink/60 shrink-0">
              Explore Gigs
            </Link>
            <ChevronRight size={13} className="shrink-0 text-ink/30" />
            <span className="capitalize text-ink/70 shrink-0">{categoryLabel}</span>
            <ChevronRight size={13} className="shrink-0 text-ink/30 hidden sm:inline" />
            <span className="text-ink font-bold truncate max-w-[220px] sm:max-w-none hidden sm:inline">
              {gig.title}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg text-ink/60 hover:text-purple hover:bg-purple/10 transition-colors cursor-pointer border-0 bg-transparent"
              title="Share Gig"
            >
              <Share2 size={16} />
            </button>
            <button
              onClick={handleToggleSave}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer border-0 bg-transparent ${
                isSaved ? 'text-coral bg-coral/10' : 'text-ink/60 hover:text-coral hover:bg-coral/10'
              }`}
              title="Save to Wishlist"
            >
              <Bookmark size={16} className={isSaved ? 'fill-current' : ''} />
            </button>
          </div>
        </div>
      </nav>

      {/* ====================================================
          MAIN TWO-COLUMN LAYOUT
          ==================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ====================================================
              LEFT COLUMN: MAIN CONTENT AREA (70% ~ 8 cols)
              ==================================================== */}
          <main className="lg:col-span-8 space-y-8">
            
            {/* 1. GIG OVERVIEW CARD */}
            <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6 relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-purple bg-purple/10 px-3.5 py-1.5 rounded-full capitalize">
                    {categoryLabel}
                  </span>
                  {gig.status === 'completed' && (
                    <span className="text-xs font-bold text-zinc-700 bg-zinc-100 px-3 py-1.5 rounded-full border border-zinc-200 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-zinc-600" />
                      <span>Contract Completed</span>
                    </span>
                  )}
                  {gig.status === 'in-progress' && (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 flex items-center gap-1.5">
                      <Clock size={14} className="text-amber-600" />
                      <span>In Progress</span>
                    </span>
                  )}
                  {(!gig.status || gig.status === 'open') && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/50 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Open for Proposals</span>
                    </span>
                  )}
                  <span className="text-xs font-semibold text-ink/50 bg-soft px-3 py-1.5 rounded-full flex items-center gap-1">
                    <MapPin size={13} />
                    <span>Remote / Worldwide</span>
                  </span>
                </div>

                <span className="text-xs font-medium text-ink/40 flex items-center gap-1.5">
                  <Clock size={13} />
                  <span>Posted {formattedDate}</span>
                </span>
              </div>

              {/* Title */}
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight leading-tight">
                {gig.title}
              </h1>

              {/* Key Quick Metadata Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-soft/70 p-3.5 rounded-2xl border border-border/50">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink/40 block mb-1">
                    Experience Level
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-ink">{experienceLevel}</span>
                </div>

                <div className="bg-soft/70 p-3.5 rounded-2xl border border-border/50">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink/40 block mb-1">
                    Proposals Volume
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-purple flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple animate-pulse" />
                    {gig.proposalsCount || 0} {(gig.proposalsCount || 0) === 1 ? 'Submission' : 'Submissions'}
                  </span>
                </div>

                <div className="bg-soft/70 p-3.5 rounded-2xl border border-border/50 col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink/40 block mb-1">
                    Payment Escrow
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>100% Vaulted</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons for Mobile/Tablet quick apply */}
              <div className="flex flex-wrap items-center gap-3 pt-2 lg:hidden">
                {isOwner ? (
                  <button
                    onClick={() => navigate(`/my-gigs/${gig._id}/proposals`)}
                    className="btn-primary !py-2.5 !px-6 !text-sm flex-1 justify-center"
                  >
                    <span>Review Proposals ({gig.proposalsCount || 0})</span>
                  </button>
                ) : hasApplied ? (
                  <button
                    onClick={() => navigate('/dashboard?tab=Proposals')}
                    className="btn-secondary !py-2.5 !px-6 !text-sm flex-1 justify-center text-emerald-700 border-emerald-300 bg-emerald-50"
                  >
                    <CheckCircle2 size={15} />
                    <span>Proposal Submitted</span>
                  </button>
                ) : !isGigOpen ? (
                  <div className="text-xs font-bold text-ink/60 bg-soft py-2.5 px-4 rounded-xl flex-1 text-center border border-border">
                    {gig.status === 'completed' ? 'Contract Completed' : 'Submissions Closed'}
                  </div>
                ) : (
                  <button
                    onClick={handleApplyClick}
                    className="btn-primary !py-2.5 !px-6 !text-sm flex-1 justify-center"
                  >
                    <Send size={15} />
                    <span>{user ? 'Apply for this Gig' : 'Login to Apply'}</span>
                  </button>
                )}
                <button
                  onClick={handleToggleSave}
                  className="btn-secondary !py-2.5 !px-4 !text-sm"
                >
                  <Bookmark size={15} className={isSaved ? 'fill-current text-coral' : ''} />
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </section>

            {/* 2. PROJECT DESCRIPTION SECTION */}
            <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                  About This Project
                </h2>
                <span className="eyebrow text-purple">FULL SPECIFICATION</span>
              </div>

              <div className="text-sm sm:text-base leading-relaxed text-ink/80 space-y-4 font-normal">
                {gig.description ? (
                  <div className="whitespace-pre-line leading-relaxed font-sans">
                    {gig.description}
                  </div>
                ) : (
                  <p className="italic text-ink/50">
                    No detailed description provided by the client. Review skills and contact the client for clarification.
                  </p>
                )}
              </div>

              {/* Trust Callout Banner */}
              <div className="bg-gradient-to-r from-purple/5 to-cyan/5 rounded-2xl p-4 sm:p-5 border border-purple/15 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-white shadow-xs text-purple flex items-center justify-center shrink-0">
                  <Sparkles size={18} />
                </div>
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-ink text-sm">GigMatch Quality & Payment Guarantee</h4>
                  <p className="text-ink/65 leading-relaxed font-medium">
                    This gig is protected under our verified milestone escrow system. Funds are held securely before work begins and released as you deliver each milestone.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. SKILLS REQUIRED SECTION */}
            {gig.tags && gig.tags.length > 0 && (
              <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-5">
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                      Skills & Expertise Required
                    </h2>
                    <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                      The employer is looking for creators with demonstrated experience in:
                    </p>
                  </div>
                  <span className="text-xs font-bold text-purple bg-purple/10 px-3 py-1 rounded-full">
                    {gig.tags.length} Skills
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  {gig.tags.map((tag: string, idx: number) => (
                    <span
                      key={tag}
                      className={`text-xs sm:text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200 cursor-default ${
                        idx === 0
                          ? 'bg-purple/10 text-purple border border-purple/25 font-bold shadow-xs'
                          : 'bg-soft text-ink hover:bg-purple/5 hover:text-purple border border-border/60'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* 4. ATTACHMENTS & PROJECT BRIEFS */}
            <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-5">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                    Project Attachments & Assets
                  </h2>
                  <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                    Supplemental documentation, wireframes, and design guidelines uploaded by the employer.
                  </p>
                </div>
                <span className="eyebrow text-ink/40">
                  {rawAttachments.length > 0 ? `${rawAttachments.length} ATTACHED` : 'ATTACHMENTS'}
                </span>
              </div>

              {rawAttachments.length > 0 ? (
                <div className="space-y-3">
                  {rawAttachments.map((att, idx) => {
                    const isImg =
                      att.type?.startsWith('image/') ||
                      att.url.startsWith('data:image') ||
                      /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(att.url);
                    const isCode =
                      att.type?.includes('code') ||
                      /\.(js|ts|tsx|jsx|json|py|html|css)(\?.*)?$/i.test(att.name || att.url);
                    const isPdf =
                      att.type?.includes('pdf') ||
                      /\.pdf(\?.*)?$/i.test(att.name || att.url);

                    return (
                      <div
                        key={idx}
                        className="bg-soft/60 rounded-2xl p-4 border border-border/60 hover:border-purple/30 hover:bg-white transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {isImg ? (
                            <div className="w-12 h-12 rounded-xl bg-purple/10 border border-border/40 overflow-hidden flex items-center justify-center shrink-0">
                              <img
                                src={att.url}
                                alt={att.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                              isPdf
                                ? 'bg-red-500/10 text-red-500'
                                : isCode
                                ? 'bg-sky-500/10 text-sky-600'
                                : 'bg-purple/10 text-purple'
                            }`}>
                              {isPdf ? <FileText size={22} /> : isCode ? <Paperclip size={22} /> : <Paperclip size={22} />}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-sm text-ink truncate">
                              {att.name}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-ink/50 mt-0.5 font-medium">
                              {att.size ? <span>{formatFileSize(att.size)}</span> : null}
                              {att.size && <span>·</span>}
                              <span className="uppercase text-[10px] font-bold text-ink/40">
                                {isImg ? 'Image Asset' : isPdf ? 'PDF Document' : isCode ? 'Code / Config' : 'Attachment Asset'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary !py-2 !px-3.5 !text-xs inline-flex items-center gap-1.5"
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </a>
                          <a
                            href={att.url}
                            download={att.name || `attachment-${idx + 1}`}
                            className="btn-secondary !py-2 !px-3.5 !text-xs inline-flex items-center gap-1.5"
                          >
                            <Download size={14} />
                            <span>Download</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center rounded-2xl bg-soft/40 border border-dashed border-border/60">
                  <p className="text-xs text-ink/50 font-medium">
                    No supplemental assets or files attached to this brief.
                  </p>
                </div>
              )}
            </section>

            {/* 5. CLIENT INFORMATION CARD */}
            <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                  About the Employer
                </h2>
                <span className="bg-lime text-ink text-xs font-bold px-3 py-1 rounded-full font-clash">
                  Verified Employer
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => gig.client?._id && navigate(`/profile/${gig.client._id}`)}
                    className="w-16 h-16 rounded-[20px] font-clash font-bold text-xl text-ink flex items-center justify-center shadow-md ring-4 ring-white shrink-0 overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                    style={{ backgroundColor: gig.client?.avatarColor || '#22D3EE' }}
                  >
                    {gig.client?.avatar ? (
                      <img
                        src={gig.client.avatar}
                        alt={clientName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      clientInitials
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-xl text-ink leading-tight">
                        {clientName}
                      </h3>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online now" />
                    </div>
                    <p className="text-xs text-ink/60 font-medium mt-1 flex items-center gap-2">
                      <span>Platform Member</span>
                      <span>·</span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <ShieldCheck size={13} />
                        <span>Payment Verified</span>
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {gig.client?._id && !isOwner && (
                    <button
                      onClick={() => navigate(`/profile/${gig.client._id}`)}
                      className="btn-secondary !py-2.5 !px-4 !text-xs"
                    >
                      <span>View Profile</span>
                    </button>
                  )}
                  {isOwner ? (
                    <button
                      onClick={() => navigate(`/my-gigs/${gig._id}/proposals`)}
                      className="btn-primary !py-2.5 !px-4 !text-xs"
                    >
                      <span>Review Proposals ({gig.proposalsCount || 0})</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleMessageClient}
                      className="btn-primary !py-2.5 !px-4 !text-xs"
                    >
                      <MessageSquare size={14} />
                      <span>Message Client</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Employer Track Record Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-soft/70 p-3.5 rounded-2xl border border-border/50">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink/40 block mb-1">
                    Account Status
                  </span>
                  <span className="font-display font-extrabold text-sm sm:text-base text-emerald-700">Verified</span>
                </div>
                <div className="bg-soft/70 p-3.5 rounded-2xl border border-border/50">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink/40 block mb-1">
                    Category Brief
                  </span>
                  <span className="font-display font-extrabold text-sm sm:text-base text-ink capitalize">{categoryLabel}</span>
                </div>
                <div className="bg-soft/70 p-3.5 rounded-2xl border border-border/50">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink/40 block mb-1">
                    Escrow Protection
                  </span>
                  <span className="font-display font-extrabold text-sm sm:text-base text-emerald-700">100% Vaulted</span>
                </div>
                <div className="bg-soft/70 p-3.5 rounded-2xl border border-border/50">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink/40 block mb-1">
                    Project Budget
                  </span>
                  <span className="font-display font-extrabold text-sm sm:text-base text-purple">₹{Number(gig.budget || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </section>

            {/* INTERACTIVE PROPOSAL SUBMISSION AREA */}
            {showProposal && (
              <section id="proposal-form-section" className="bg-white rounded-[28px] p-6 sm:p-8 border-2 border-purple/40 shadow-[0_8px_30px_rgba(124,58,237,0.12)] space-y-6 scroll-mt-28">
                <div className="flex items-center justify-between border-b border-border/70 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl gradient-primary text-white flex items-center justify-center shadow-sm">
                      <Send size={18} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-2xl text-ink">
                        Submit Your Proposal
                      </h3>
                      <p className="text-xs text-ink/50 font-medium">
                        Pitch your expertise, timeline, and custom milestone breakdown.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowProposal(false)}
                    className="text-xs font-semibold text-ink/40 hover:text-ink cursor-pointer bg-transparent border-0"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Cover Letter */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                      Cover Letter & Approach <span className="text-coral">*</span>
                    </label>
                    <textarea
                      rows={6}
                      placeholder="Explain your approach, why you're a great fit, and link references to relevant work in your portfolio..."
                      value={proposal.coverLetter}
                      onChange={(e) => setProposal({ ...proposal, coverLetter: e.target.value })}
                      className="w-full bg-soft border border-border rounded-2xl p-4 text-sm font-medium text-ink focus:outline-none focus:border-purple focus:bg-white transition-all leading-relaxed"
                    />
                  </div>

                  {/* Pricing and Timeline inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                        Your Proposed Bid Price (₹) <span className="text-coral">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 font-bold text-sm">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="100"
                          min="100"
                          placeholder="e.g. 8000"
                          value={proposal.proposedPrice}
                          onChange={(e) => setProposal({ ...proposal, proposedPrice: e.target.value })}
                          className="w-full bg-soft border border-border rounded-2xl pl-8 pr-4 py-3.5 text-sm font-bold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                        />
                      </div>
                      
                      {/* Live Fee Breakdown */}
                      {bidPriceNumber > 0 && (
                        <div className="p-3 rounded-xl bg-purple/5 border border-purple/15 text-xs space-y-1 text-ink/70">
                          <div className="flex justify-between">
                            <span>Platform fee (10%):</span>
                            <span className="font-semibold text-coral">-₹{platformFee.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between font-bold text-ink border-t border-purple/10 pt-1">
                            <span>You will receive:</span>
                            <span className="text-emerald-700">₹{netEarnings.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                        Estimated Delivery Days <span className="text-coral">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 7"
                        value={proposal.estimatedDays}
                        onChange={(e) => setProposal({ ...proposal, estimatedDays: e.target.value })}
                        className="w-full bg-soft border border-border rounded-2xl px-4 py-3.5 text-sm font-bold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                      />
                      <p className="text-[11px] text-ink/50">
                        Include adequate time for review and revisions.
                      </p>
                    </div>
                  </div>

                  {/* Submission Action */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                    <span className="text-xs text-ink/50 font-medium">
                      By submitting, you agree to GigMatch creator terms and milestone escrow rules.
                    </span>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setShowProposal(false)}
                        className="btn-secondary !py-3 !px-5 !text-sm flex-1 sm:flex-initial"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleProposalSubmit}
                        disabled={submitting}
                        className="btn-primary !py-3 !px-8 !text-sm flex-1 sm:flex-initial disabled:opacity-50"
                      >
                        <Send size={15} />
                        <span>{submitting ? 'Submitting...' : 'Submit Proposal'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 6. SIMILAR GIGS SECTION */}
            {displayedSimilarGigs.length > 0 && (
              <section className="space-y-5 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                      Similar Opportunities
                    </h2>
                    <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                      Other active commissions in {categoryLabel}
                    </p>
                  </div>
                  <Link
                    to="/gigs"
                    className="text-xs font-bold text-purple hover:underline no-underline inline-flex items-center gap-1"
                  >
                    <span>Explore all</span>
                    <ArrowUpRight size={14} />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {displayedSimilarGigs.map((simGig, idx) => (
                    <div
                      key={simGig._id || idx}
                      onClick={() => navigate(`/gigs/${simGig._id}`)}
                      className="bg-white rounded-[24px] p-5 border border-border/70 hover:border-purple/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(124,58,237,0.08)] transition-all duration-200 cursor-pointer flex flex-col justify-between hover-lift group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple bg-purple/10 px-2.5 py-1 rounded-full">
                            {simGig.category || categoryLabel}
                          </span>
                          <ArrowUpRight
                            size={16}
                            className="text-ink/30 group-hover:text-purple group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                          />
                        </div>

                        <h4 className="font-bold text-sm text-ink group-hover:text-purple transition-colors line-clamp-2 leading-snug mb-2">
                          {simGig.title}
                        </h4>
                      </div>

                      <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider block">Budget</span>
                          <span className="font-display font-extrabold text-sm text-ink">
                            ₹{Number(simGig.budget || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          simGig.status === 'completed'
                            ? 'text-zinc-600 bg-zinc-100'
                            : simGig.status === 'in-progress'
                            ? 'text-amber-700 bg-amber-50'
                            : 'text-emerald-700 bg-emerald-50'
                        }`}>
                          {simGig.status === 'completed' ? 'Completed' : simGig.status === 'in-progress' ? 'In Progress' : 'Open'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </main>

          {/* ====================================================
              RIGHT COLUMN: STICKY APPLICATION SIDEBAR (30% ~ 4 cols)
              ==================================================== */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
            
            {/* Primary Sticky Budget & CTA Card */}
            <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="eyebrow text-ink/45">FIXED CLIENT BUDGET</span>
                  {gig.status === 'completed' ? (
                    <span className="text-xs font-bold text-zinc-700 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200">
                      Completed
                    </span>
                  ) : gig.status === 'in-progress' ? (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      In Progress
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
                      Escrow Ready
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-display text-4xl sm:text-5xl font-extrabold text-ink tracking-tight">
                    ₹{Number(gig.budget || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 mt-2">
                  <ShieldCheck size={14} />
                  <span>100% Payment Protected in Escrow</span>
                </p>
              </div>

              <div className="h-px bg-border/70 w-full" />

              {/* Key Highlights List */}
              <div className="space-y-3.5 text-xs font-medium text-ink/75">
                <div className="flex items-center justify-between">
                  <span className="text-ink/50">Project Category:</span>
                  <strong className="text-ink font-semibold capitalize">{categoryLabel}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink/50">Experience Needed:</span>
                  <strong className="text-ink font-semibold">{experienceLevel}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink/50">Proposals Received:</span>
                  <strong className="text-purple font-bold">
                    {gig.proposalsCount || 0} {(gig.proposalsCount || 0) === 1 ? 'Submission' : 'Submissions'}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink/50">Target Turnaround:</span>
                  <strong className="text-ink font-semibold">{deadlineDisplay}</strong>
                </div>
              </div>

              <div className="h-px bg-border/70 w-full" />

              {/* Action Buttons */}
              <div className="space-y-2.5">
                {isOwner ? (
                  <div className="bg-purple/5 border border-purple/20 p-4 rounded-2xl text-center space-y-2.5">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-purple">
                      <Sparkles size={15} />
                      <span>You posted this gig</span>
                    </div>
                    <p className="text-[11px] text-ink/60 leading-relaxed">
                      Review submitted proposals, evaluate creators, and fund milestones.
                    </p>
                    <button
                      onClick={() => navigate(`/my-gigs/${gig._id}/proposals`)}
                      className="w-full btn-primary !py-3 !text-xs justify-center shadow-md shadow-purple/15"
                    >
                      <span>Review Proposals ({gig.proposalsCount || 0})</span>
                    </button>
                    <Link
                      to="/dashboard?tab=Projects"
                      className="block text-center text-xs font-bold text-purple hover:underline pt-1"
                    >
                      Manage in Dashboard →
                    </Link>
                  </div>
                ) : !isGigOpen ? (
                  <div className="bg-soft p-4 rounded-2xl text-center border border-border/70 space-y-1.5">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-ink/70">
                      <AlertCircle size={15} className="text-ink/40" />
                      <span>
                        {gig.status === 'completed' ? 'Contract Completed' : 'Submissions Closed'}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink/50">
                      {gig.status === 'completed'
                        ? 'This project has been completed and is no longer accepting proposals.'
                        : 'A creator has been selected for this project.'}
                    </p>
                    <Link
                      to="/gigs"
                      className="inline-block mt-2 text-xs font-bold text-purple hover:underline"
                    >
                      Browse Other Gigs →
                    </Link>
                  </div>
                ) : hasApplied ? (
                  <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl text-center space-y-2">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span>Proposal Submitted</span>
                    </div>
                    <p className="text-[11px] text-emerald-700/80">
                      You have already submitted a proposal for this gig.
                    </p>
                    <button
                      onClick={() => navigate('/dashboard?tab=Proposals')}
                      className="w-full btn-secondary !py-2.5 !text-xs justify-center"
                    >
                      <span>View My Proposals</span>
                    </button>
                  </div>
                ) : user?.role === 'freelancer' ? (
                  <button
                    onClick={handleApplyClick}
                    className="w-full btn-primary !py-3.5 !text-sm justify-center shadow-lg shadow-purple/20"
                  >
                    <Send size={16} />
                    <span>Apply for this Gig</span>
                  </button>
                ) : !user ? (
                  <button
                    onClick={() => setAuthModal(true, 'login')}
                    className="w-full btn-primary !py-3.5 !text-sm justify-center shadow-lg shadow-purple/20"
                  >
                    <Send size={16} />
                    <span>Login to Apply</span>
                  </button>
                ) : (
                  <div className="bg-soft p-3.5 rounded-2xl text-center border border-border/60">
                    <p className="text-xs font-semibold text-ink/60">
                      You are currently logged in as an Employer.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleToggleSave}
                    className={`btn-secondary !py-2.5 !text-xs justify-center ${
                      isSaved ? 'text-coral border-coral/30 bg-coral/5' : ''
                    }`}
                  >
                    <Bookmark size={14} className={isSaved ? 'fill-current' : ''} />
                    <span>{isSaved ? 'Saved' : 'Save Gig'}</span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="btn-secondary !py-2.5 !text-xs justify-center"
                  >
                    <Share2 size={14} />
                    <span>Share Gig</span>
                  </button>
                </div>
              </div>

              {/* Creator Peace of Mind Checklist */}
              <div className="pt-2 space-y-2.5 border-t border-border/50 text-[11px] text-ink/60 font-medium">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>No upfront bidding tokens required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Milestone deliverables with dispute protection</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Prompt payouts directly into your linked bank</span>
                </div>
              </div>
            </div>

            {/* Support / Help Card */}
            <div className="bg-soft/70 rounded-[24px] p-5 border border-border/60 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-ink">
                <Sparkles size={14} className="text-purple" />
                <span>Tips for Standing Out</span>
              </div>
              <p className="text-xs text-ink/65 leading-relaxed">
                Clients on GigMatch look for relevant case studies and concrete timelines. Tailor your proposal specifically to the requirements.
              </p>
            </div>

          </aside>

        </div>
      </div>

      {/* ====================================================
          MOBILE STICKY BOTTOM ACTION BAR
          ==================================================== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-border p-4 shadow-lg flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 block">
            Fixed Budget
          </span>
          <span className="font-display font-extrabold text-xl text-ink">
            ₹{Number(gig.budget || 0).toLocaleString('en-IN')}
          </span>
        </div>

        {isOwner ? (
          <button
            onClick={() => navigate(`/my-gigs/${gig._id}/proposals`)}
            className="btn-primary !py-2.5 !px-5 !text-xs shrink-0"
          >
            <span>Review Proposals ({gig.proposalsCount || 0})</span>
          </button>
        ) : hasApplied ? (
          <button
            onClick={() => navigate('/dashboard?tab=Proposals')}
            className="btn-secondary !py-2.5 !px-5 !text-xs shrink-0 text-emerald-700 border-emerald-300 bg-emerald-50"
          >
            <CheckCircle2 size={14} />
            <span>Applied</span>
          </button>
        ) : !isGigOpen ? (
          <span className="text-xs font-bold text-ink/50 bg-soft py-2 px-3 rounded-lg border border-border">
            {gig.status === 'completed' ? 'Completed' : 'Closed'}
          </span>
        ) : (
          <button
            onClick={handleApplyClick}
            className="btn-primary !py-2.5 !px-6 !text-xs shrink-0"
          >
            <Send size={14} />
            <span>{user ? 'Apply Now' : 'Login to Apply'}</span>
          </button>
        )}
      </div>

    </div>
  );
}
