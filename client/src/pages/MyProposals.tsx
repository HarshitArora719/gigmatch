import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import {
  ChevronRight, AlertCircle, Send, Briefcase, ArrowUpRight
} from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';

export default function MyProposals() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    if (user.role !== 'freelancer') { navigate('/gigs'); return; }
    fetchProposals();
  }, [user]);

  const fetchProposals = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/proposals/my-proposals');
      setProposals(res.data.data.proposals || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load your proposals');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const statusStyles: Record<string, { bg: string; label: string }> = {
    pending: { bg: 'bg-orange/10 text-orange border-orange/20', label: 'Pending' },
    accepted: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/50', label: 'Accepted' },
    rejected: { bg: 'bg-coral/10 text-coral border-coral/20', label: 'Rejected' },
    withdrawn: { bg: 'bg-ink/8 text-ink/60 border-ink/15', label: 'Withdrawn' },
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-paper py-10">
        <div className="container-app max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48 rounded-2xl" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-[28px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper pb-20">
      {/* Breadcrumb */}
      <nav className="border-b border-border/70 bg-white/70 backdrop-blur-md" aria-label="Breadcrumb">
        <div className="container-app py-3.5 flex items-center gap-2 text-xs font-semibold text-ink/50">
          <Link to="/" className="hover:text-purple transition-colors no-underline text-ink/60">Home</Link>
          <ChevronRight size={13} className="text-ink/30" />
          <span className="text-ink font-bold">My Proposals</span>
        </div>
      </nav>

      <div className="container-app max-w-4xl mx-auto pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-purple mb-2 block">TRACK PROPOSALS</span>
            <h1
              className="font-display font-extrabold text-ink tracking-[-0.02em]"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
            >
              My Proposals
            </h1>
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink/50">
            {proposals.length} SUBMITTED
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-coral/10 border border-coral/20 text-coral text-sm font-medium flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
            <button onClick={fetchProposals} className="ml-auto text-xs font-bold underline cursor-pointer bg-transparent border-none text-coral">
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!error && proposals.length === 0 && (
          <div className="py-20 text-center border border-dashed border-ink/15 rounded-[24px] bg-white">
            <div className="mx-auto h-14 w-14 rounded-full bg-soft flex items-center justify-center mb-4 text-ink/40">
              <Send size={22} />
            </div>
            <h3 className="font-display font-bold text-ink text-lg mb-2">No proposals yet</h3>
            <p className="text-sm text-ink/50 font-medium max-w-sm mx-auto mb-6">
              Browse gigs and submit your first proposal to start landing projects.
            </p>
            <button onClick={() => navigate('/gigs')} className="btn-primary !text-sm">
              <Briefcase size={16} />
              <span>Explore Gigs</span>
            </button>
          </div>
        )}

        {/* Proposals List */}
        <div className="space-y-4">
          {proposals.map((p) => {
            const gigTitle = p.gig?.title || 'Untitled Gig';
            const gigBudget = p.gig?.budget;
            const gigStatus = p.gig?.status;
            const st = statusStyles[p.status] || statusStyles.pending;
            const gigId = typeof p.gig === 'object' ? p.gig?._id : p.gig;

            return (
              <div
                key={p._id}
                className="bg-white rounded-[24px] border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] transition-all duration-200"
              >
                {/* Top: Status */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${st.bg}`}>
                    {st.label}
                  </span>
                  <span className="text-xs text-ink/40 font-medium">{formatDate(p.createdAt)}</span>
                </div>

                {/* Gig title */}
                <button
                  onClick={() => gigId && navigate(`/gigs/${gigId}`)}
                  className="text-left bg-transparent border-none cursor-pointer p-0 group"
                >
                  <h3 className="font-display font-bold text-ink text-base leading-snug mb-1 group-hover:text-purple transition-colors flex items-center gap-1.5">
                    {gigTitle}
                    <ArrowUpRight size={14} className="text-ink/30 group-hover:text-purple transition-colors" />
                  </h3>
                </button>

                {/* Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  <div className="bg-soft/70 p-3 rounded-xl border border-border/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 block mb-0.5">My Bid</span>
                    <span className="font-display font-extrabold text-sm text-ink">₹{p.proposedPrice?.toLocaleString('en-IN')}</span>
                  </div>
                  {gigBudget && (
                    <div className="bg-soft/70 p-3 rounded-xl border border-border/50">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 block mb-0.5">Gig Budget</span>
                      <span className="font-display font-extrabold text-sm text-ink">₹{gigBudget?.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="bg-soft/70 p-3 rounded-xl border border-border/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 block mb-0.5">Delivery</span>
                    <span className="font-display font-extrabold text-sm text-ink">{p.estimatedDays} Days</span>
                  </div>
                  {gigStatus && (
                    <div className="bg-soft/70 p-3 rounded-xl border border-border/50">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 block mb-0.5">Gig Status</span>
                      <span className="font-display font-extrabold text-sm text-ink capitalize">{gigStatus.replace('-', ' ')}</span>
                    </div>
                  )}
                </div>

                {/* Accepted → link to orders */}
                {p.status === 'accepted' && (
                  <div className="mt-4 pt-3 border-t border-border/50">
                    <button
                      onClick={() => navigate('/orders')}
                      className="btn-primary !py-2 !px-5 !text-xs"
                    >
                      <span>View Order →</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
