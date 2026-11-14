import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import {
  ChevronRight, AlertCircle, FolderKanban,
  User, Briefcase, CheckCircle2, ExternalLink,
  FileCheck2, RefreshCw
} from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';

export default function Orders() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/orders/my-orders');
      setOrders(res.data.data.orders || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const statusStyles: Record<string, { bg: string; label: string }> = {
    active: { bg: 'bg-purple/10 text-purple border-purple/20', label: 'Active' },
    delivered: { bg: 'bg-blue-50 text-blue-700 border-blue-200/50', label: 'Delivered - Under Review' },
    revision_requested: { bg: 'bg-amber-50 text-amber-700 border-amber-200/50', label: 'Revision Requested' },
    completed: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/50', label: 'Completed' },
    cancelled: { bg: 'bg-coral/10 text-coral border-coral/20', label: 'Cancelled' },
    disputed: { bg: 'bg-orange/10 text-orange border-orange/20', label: 'Disputed' },
  };

  const isClient = user?.role === 'client';

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
          <span className="text-ink font-bold">My Orders</span>
        </div>
      </nav>

      <div className="container-app max-w-4xl mx-auto pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-purple mb-2 block">
              {isClient ? 'CLIENT ORDERS' : 'FREELANCER ORDERS'}
            </span>
            <h1
              className="font-display font-extrabold text-ink tracking-[-0.02em]"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
            >
              My Orders
            </h1>
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink/50">
            {orders.length} ORDER{orders.length !== 1 ? 'S' : ''}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-coral/10 border border-coral/20 text-coral text-sm font-medium flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
            <button onClick={fetchOrders} className="ml-auto text-xs font-bold underline cursor-pointer bg-transparent border-none text-coral">
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!error && orders.length === 0 && (
          <div className="py-20 text-center border border-dashed border-ink/15 rounded-[24px] bg-white">
            <div className="mx-auto h-14 w-14 rounded-full bg-soft flex items-center justify-center mb-4 text-ink/40">
              <FolderKanban size={22} />
            </div>
            <h3 className="font-display font-bold text-ink text-lg mb-2">No orders yet</h3>
            <p className="text-sm text-ink/50 font-medium max-w-sm mx-auto mb-6">
              {isClient
                ? 'Accept a freelancer\'s proposal to create your first order.'
                : 'Once a client accepts your proposal, your order will appear here.'}
            </p>
            <button
              onClick={() => navigate(isClient ? '/my-gigs' : '/gigs')}
              className="btn-primary !text-sm"
            >
              <Briefcase size={16} />
              <span>{isClient ? 'Manage Gigs' : 'Explore Gigs'}</span>
            </button>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order) => {
            const gigTitle = order.gig?.title || 'Untitled Gig';
            const otherPartyName = isClient
              ? order.freelancer?.name || 'Unknown Freelancer'
              : order.client?.name || 'Unknown Client';
            const otherPartyRole = isClient ? 'Freelancer' : 'Client';
            const st = statusStyles[order.status] || statusStyles.active;

            return (
              <div
                key={order._id}
                className="bg-white rounded-[24px] border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] transition-all duration-200"
              >
                {/* Top: Status + Date */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${st.bg}`}>
                    {st.label}
                  </span>
                  <span className="text-xs text-ink/40 font-medium">{formatDate(order.createdAt)}</span>
                </div>

                {/* Gig title */}
                <h3 className="font-display font-bold text-ink text-base leading-snug mb-3">
                  {gigTitle}
                </h3>

                {/* Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-soft/70 p-3 rounded-xl border border-border/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 block mb-0.5">
                      {otherPartyRole}
                    </span>
                    <span className="font-bold text-sm text-ink flex items-center gap-1.5">
                      <User size={13} className="text-ink/40" />
                      {otherPartyName}
                    </span>
                  </div>
                  <div className="bg-soft/70 p-3 rounded-xl border border-border/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 block mb-0.5">Total Amount</span>
                    <span className="font-display font-extrabold text-sm text-ink">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-soft/70 p-3 rounded-xl border border-border/50 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 block mb-0.5">Deliverables</span>
                    <span className="font-bold text-sm text-ink">
                      {order.deliverables?.length || 0} Submitted
                    </span>
                  </div>
                </div>

                {/* Open Workspace - Every order card includes this */}
                <div className="mt-4 pt-3 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    {order.status === 'completed' ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 size={14} />
                        <span>Completed on {order.completedAt ? formatDate(order.completedAt) : 'N/A'}</span>
                      </span>
                    ) : order.status === 'delivered' ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                        <FileCheck2 size={14} />
                        <span>Deliverables awaiting client review</span>
                      </span>
                    ) : order.status === 'revision_requested' ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                        <RefreshCw size={14} />
                        <span>Revision requested</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-ink/50">
                        <span>Sprint in progress</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => navigate(`/dashboard?tab=Workspace&orderId=${order._id}`)}
                    className="btn-primary !py-2 !px-4 !text-xs self-end sm:self-auto shrink-0"
                  >
                    <ExternalLink size={14} />
                    <span>Open Workspace</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
