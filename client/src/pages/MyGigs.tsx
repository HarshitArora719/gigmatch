import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import {
  Briefcase, Plus, Clock, IndianRupee, Users, Eye, Edit3, XCircle,
  ChevronRight, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '../components/ui/skeleton';

export default function MyGigs() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [gigs, setGigs] = useState<any[]>([]);
  const [proposalCounts, setProposalCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    if (user.role !== 'client') { navigate('/gigs'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [gigsRes, proposalsRes] = await Promise.all([
        api.get('/api/gigs/my-gigs'),
        api.get('/api/proposals/my-gigs-proposals'),
      ]);

      setGigs(gigsRes.data.data.gigs || []);

      const counts: Record<string, number> = {};
      (proposalsRes.data.data.proposals || []).forEach((p: any) => {
        const gigId = typeof p.gig === 'object' ? p.gig?._id : p.gig;
        if (gigId) counts[gigId] = (counts[gigId] || 0) + 1;
      });
      setProposalCounts(counts);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load your gigs');
    } finally {
      setLoading(false);
    }
  };

  const statusStyles: Record<string, string> = {
    open: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
    'in-progress': 'bg-purple/10 text-purple border-purple/20',
    completed: 'bg-lime/20 text-ink border-lime/40',
    cancelled: 'bg-coral/10 text-coral border-coral/20',
  };

  const categoryLabels: Record<string, string> = {
    'graphic-design': 'Design & Creative',
    'video-editing': 'Video & Animation',
    'content-writing': 'Writing & Translation',
    coding: 'Development & IT',
    tutoring: 'Tutoring & Teaching',
    others: 'Other Services',
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-paper py-10">
        <div className="container-app space-y-6">
          <Skeleton className="h-10 w-48 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-[28px]" />
            ))}
          </div>
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
          <span className="text-ink font-bold">My Gigs</span>
        </div>
      </nav>

      <div className="container-app pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-purple mb-2 block">MANAGE GIGS</span>
            <h1
              className="font-display font-extrabold text-ink tracking-[-0.02em]"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
            >
              My Posted Gigs
            </h1>
          </div>
          <button onClick={() => navigate('/post-gig')} className="btn-primary !py-2.5 !px-5 !text-sm">
            <Plus size={16} />
            <span>Post a New Gig</span>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-coral/10 border border-coral/20 text-coral text-sm font-medium flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
            <button onClick={fetchData} className="ml-auto text-xs font-bold underline cursor-pointer bg-transparent border-none text-coral">
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!error && gigs.length === 0 && (
          <div className="py-20 text-center border border-dashed border-ink/15 rounded-[24px] bg-white">
            <div className="mx-auto h-14 w-14 rounded-full bg-soft flex items-center justify-center mb-4 text-ink/40">
              <Briefcase size={22} />
            </div>
            <h3 className="font-display font-bold text-ink text-lg mb-2">No gigs yet</h3>
            <p className="text-sm text-ink/50 font-medium max-w-sm mx-auto mb-6">
              Post your first gig to start receiving proposals from talented freelancers.
            </p>
            <button onClick={() => navigate('/post-gig')} className="btn-primary !text-sm">
              <Plus size={16} />
              <span>Post Your First Gig</span>
            </button>
          </div>
        )}

        {/* Gigs grid */}
        {gigs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {gigs.map((gig) => {
              const count = proposalCounts[gig._id] || 0;
              return (
                <div
                  key={gig._id}
                  className="bg-white rounded-[24px] border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] transition-all duration-200"
                >
                  <div>
                    {/* Status + Category */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          statusStyles[gig.status] || statusStyles.open
                        }`}
                      >
                        {(gig.status || 'open').replace('-', ' ')}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple bg-purple/10 px-2.5 py-1 rounded-full">
                        {categoryLabels[gig.category] || gig.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-display font-bold text-ink text-base leading-snug mb-3 line-clamp-2">
                      {gig.title}
                    </h3>

                    {/* Meta rows */}
                    <div className="space-y-2 text-xs text-ink/60 font-medium">
                      <div className="flex items-center gap-2">
                        <IndianRupee size={13} className="text-ink/40" />
                        <span>₹{gig.budget?.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-ink/40" />
                        <span>Posted {formatDate(gig.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={13} className="text-ink/40" />
                        <span className={count > 0 ? 'text-purple font-bold' : ''}>
                          {count} Proposal{count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-4 border-t border-border/50 flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate(`/my-gigs/${gig._id}/proposals`)}
                      className="btn-primary !py-2 !px-4 !text-xs flex-1"
                    >
                      <Eye size={14} />
                      <span>Proposals ({count})</span>
                    </button>
                    <button onClick={() => toast.info('Edit gig coming soon')} className="btn-secondary !py-2 !px-3 !text-xs">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => toast.info('Close gig coming soon')} className="btn-secondary !py-2 !px-3 !text-xs">
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
