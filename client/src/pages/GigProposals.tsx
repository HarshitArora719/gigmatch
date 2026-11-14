import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import {
  ChevronRight, AlertCircle, IndianRupee, Calendar,
  CheckCircle2, XCircle, FileText, Send, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '../components/ui/skeleton';
import { openRazorpayModal } from '../lib/razorpay';
import DemoPaymentModal from '../components/DemoPaymentModal';

export default function GigProposals() {
  const { gigId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [gig, setGig] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Demo payment fallback state (when Razorpay is not configured)
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoPaymentDetails, setDemoPaymentDetails] = useState<any>(null);
  const [demoPaymentLoading, setDemoPaymentLoading] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    if (user.role !== 'client') { navigate('/gigs'); return; }
    fetchData();
  }, [user, gigId]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [gigRes, proposalsRes] = await Promise.all([
        api.get(`/api/gigs/${gigId}`),
        api.get(`/api/proposals/gig/${gigId}`),
      ]);
      setGig(gigRes.data.data.gig);
      setProposals(proposalsRes.data.data.proposals || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (proposalId: string) => {
    setActionLoading(proposalId);
    try {
      const res = await api.post('/api/payments/create-order', { proposalId });
      const data = res.data.data;

      if (data.mode === 'razorpay') {
        // Razorpay Gateway Flow (Live / Test mode)
        await openRazorpayModal({
          key: data.keyId,
          amount: data.amount,
          currency: data.currency || 'INR',
          name: 'GigMatch Escrow',
          description: `Escrow Hold for ${data.gigTitle || gig?.title || 'Project'}`,
          order_id: data.orderId,
          prefill: {
            name: user?.name,
            email: user?.email,
          },
          handler: async (response) => {
            try {
              setActionLoading(proposalId);
              const verifyRes = await api.post('/api/payments/verify-signature', {
                proposalId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              toast.success('Payment verified & escrow held! Order is now active.');
              fetchData();
              if (verifyRes.data.data.order?._id) {
                navigate(`/dashboard?tab=Workspace&orderId=${verifyRes.data.data.order._id}`);
              }
            } catch (err: any) {
              toast.error(err.response?.data?.message || 'Payment signature verification failed.');
            } finally {
              setActionLoading(null);
            }
          },
          onDismiss: async () => {
            setActionLoading(null);
            await api.post('/api/payments/record-failure', {
              razorpay_order_id: data.orderId,
              reason: 'Payment cancelled by client',
            }).catch(() => {});
            toast.info('Payment was cancelled. Order was not created.');
          },
          onFailed: async (error: any) => {
            setActionLoading(null);
            await api.post('/api/payments/record-failure', {
              razorpay_order_id: data.orderId,
              reason: error?.description || 'Payment failed at gateway',
            }).catch(() => {});
            toast.error(`Payment failed: ${error?.description || 'Transaction unsuccessful'}. Order not created.`);
          },
        });
      } else {
        // Fallback: Razorpay keys not configured -> Open Demo Payment Modal
        setDemoPaymentDetails({
          proposalId,
          gigTitle: data.gigTitle || gig?.title,
          totalAmount: data.totalAmount,
          platformCommission: data.platformCommission,
          freelancerEarnings: data.freelancerEarnings,
        });
        setDemoModalOpen(true);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmDemoPayment = async () => {
    if (!demoPaymentDetails?.proposalId) return;
    setDemoPaymentLoading(true);
    try {
      const res = await api.post('/api/payments/demo-payment', {
        proposalId: demoPaymentDetails.proposalId,
      });
      toast.success('Demo payment confirmed! Order created & escrow secured.');
      setDemoModalOpen(false);
      fetchData();
      if (res.data.data.order?._id) {
        navigate(`/dashboard?tab=Workspace&orderId=${res.data.data.order._id}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process demo payment');
    } finally {
      setDemoPaymentLoading(false);
    }
  };

  const handleReject = async (proposalId: string) => {
    setActionLoading(proposalId);
    try {
      await api.put(`/api/proposals/${proposalId}/reject`);
      toast.success('Proposal rejected.');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject proposal');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const statusStyles: Record<string, string> = {
    pending: 'bg-orange/10 text-orange border-orange/20',
    accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
    rejected: 'bg-coral/10 text-coral border-coral/20',
    withdrawn: 'bg-ink/8 text-ink/60 border-ink/15',
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-paper py-10">
        <div className="container-app max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-32 w-full rounded-[28px]" />
          <Skeleton className="h-48 w-full rounded-[28px]" />
          <Skeleton className="h-48 w-full rounded-[28px]" />
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
          <Link to="/my-gigs" className="hover:text-purple transition-colors no-underline text-ink/60">My Gigs</Link>
          <ChevronRight size={13} className="text-ink/30" />
          <span className="text-ink font-bold truncate max-w-[200px]">Proposals</span>
        </div>
      </nav>

      <div className="container-app max-w-4xl mx-auto pt-8">
        {/* Back link */}
        <button
          onClick={() => navigate('/my-gigs')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-purple transition-colors mb-6 bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to My Gigs
        </button>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-coral/10 border border-coral/20 text-coral text-sm font-medium flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Gig Summary Card */}
        {gig && (
          <div className="bg-white rounded-[28px] border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6 sm:p-8 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple bg-purple/10 px-2.5 py-1 rounded-full">
                {(gig.category || '').replace('-', ' ')}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                gig.status === 'open' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' : 'bg-purple/10 text-purple border-purple/20'
              }`}>
                {(gig.status || 'open').replace('-', ' ')}
              </span>
            </div>
            <h1 className="font-display font-extrabold text-ink text-xl sm:text-2xl tracking-tight mb-3">
              {gig.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-ink/60 font-medium">
              <span className="flex items-center gap-1.5">
                <IndianRupee size={14} className="text-ink/40" />
                ₹{gig.budget?.toLocaleString('en-IN')}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-ink/40" />
                Posted {formatDate(gig.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Send size={14} className="text-ink/40" />
                {proposals.length} Proposal{proposals.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-ink text-xl tracking-tight">
            Submitted Proposals
          </h2>
          <span className="text-xs font-bold uppercase tracking-wider text-ink/40">
            {proposals.length} TOTAL
          </span>
        </div>

        {/* Empty */}
        {proposals.length === 0 && !error && (
          <div className="py-16 text-center border border-dashed border-ink/15 rounded-[24px] bg-white">
            <div className="mx-auto h-14 w-14 rounded-full bg-soft flex items-center justify-center mb-4 text-ink/40">
              <FileText size={22} />
            </div>
            <h3 className="font-display font-bold text-ink text-lg mb-2">No proposals yet</h3>
            <p className="text-sm text-ink/50 font-medium max-w-sm mx-auto">
              Proposals from freelancers will appear here once they apply to your gig.
            </p>
          </div>
        )}

        {/* Proposals List */}
        <div className="space-y-4">
          {proposals.map((p) => {
            const isPending = p.status === 'pending';
            const isActionTarget = actionLoading === p._id;
            return (
              <div
                key={p._id}
                className={`bg-white rounded-[24px] border shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 transition-all duration-200 ${
                  isPending ? 'border-border/70 hover:border-purple/30 hover:shadow-[0_8px_30px_rgba(124,58,237,0.06)]' : 'border-border/50'
                }`}
              >
                {/* Top row: Freelancer + Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div
                    className="flex items-center gap-3 cursor-pointer group/user"
                    onClick={() => p.freelancer?._id && navigate(`/profile/${p.freelancer._id}`)}
                    title="View Freelancer Public Profile"
                  >
                    <div
                      className="w-10 h-10 rounded-[14px] flex items-center justify-center font-display font-bold text-sm shrink-0 group-hover/user:scale-105 transition-transform overflow-hidden shadow-xs ring-2 ring-white"
                      style={{ backgroundColor: p.freelancer?.avatarColor || '#22D3EE' }}
                    >
                      {p.freelancer?.avatar ? (
                        <img
                          src={p.freelancer.avatar}
                          alt={p.freelancer?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (p.freelancer?.name || 'U')[0].toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-ink group-hover/user:text-purple transition-colors">{p.freelancer?.name || 'Unknown Freelancer'}</h4>
                      <p className="text-xs text-ink/50 font-medium">Submitted {formatDate(p.createdAt)}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border self-start sm:self-auto ${
                    statusStyles[p.status] || statusStyles.pending
                  }`}>
                    {p.status}
                  </span>
                </div>

                {/* Bid details */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-soft/70 p-3 rounded-xl border border-border/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 block mb-0.5">Bid Amount</span>
                    <span className="font-display font-extrabold text-base text-ink">₹{p.proposedPrice?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-soft/70 p-3 rounded-xl border border-border/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 block mb-0.5">Delivery Time</span>
                    <span className="font-display font-extrabold text-base text-ink">{p.estimatedDays} Days</span>
                  </div>
                </div>

                {/* Cover letter */}
                <div className="mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 block mb-1.5">Cover Letter</span>
                  <p className="text-sm text-ink/75 leading-relaxed font-normal bg-soft/40 rounded-xl p-4 border border-border/40">
                    {p.coverLetter || 'No cover letter provided.'}
                  </p>
                </div>

                {/* Actions (only for pending) */}
                {isPending && (
                  <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                    <button
                      onClick={() => handleAccept(p._id)}
                      disabled={!!actionLoading}
                      className="btn-primary !py-2.5 !px-5 !text-xs flex-1 sm:flex-none disabled:opacity-50"
                    >
                      <CheckCircle2 size={14} />
                      <span>{isActionTarget ? 'Accepting...' : 'Accept & Create Order'}</span>
                    </button>
                    <button
                      onClick={() => handleReject(p._id)}
                      disabled={!!actionLoading}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold border border-coral/30 text-coral bg-coral/5 hover:bg-coral/10 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <XCircle size={14} />
                      <span>{isActionTarget ? 'Rejecting...' : 'Reject'}</span>
                    </button>
                  </div>
                )}

                {/* Accepted message */}
                {p.status === 'accepted' && (
                  <div className="pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 size={14} />
                      <span>Accepted — Order created.</span>
                      <button
                        onClick={() => navigate('/orders')}
                        className="ml-auto text-purple font-bold hover:underline bg-transparent border-none cursor-pointer text-xs"
                      >
                        View Orders →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ====================================================
          MODAL: DEMO PAYMENT FALLBACK
          ==================================================== */}
      <DemoPaymentModal
        open={demoModalOpen}
        onOpenChange={setDemoModalOpen}
        details={demoPaymentDetails}
        onConfirm={handleConfirmDemoPayment}
        loading={demoPaymentLoading}
      />

    </div>
  );
}
