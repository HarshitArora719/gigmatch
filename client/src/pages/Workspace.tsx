import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import api from '../lib/axios';
import {
  Sparkles,
  Search,
  Bell,
  Send,
  Plus,
  FolderKanban,
  FileText,
  Users,
  MessageSquare,
  CreditCard,
  Star,
  ArrowUpRight,
  CheckCircle2,
  X,
  Menu,
  ExternalLink,
  ShieldCheck,
  Clock,
  LogOut,
  ChevronRight,
  FileCheck2,
  Lock,
  Download,
  AlertCircle,
  Paperclip,
  Image as ImageIcon,
  Check,
  Briefcase,
  Layers,
  ArrowLeft,
  FileCode,
  FileArchive,
  RefreshCw,
  Upload,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';

// ─── Type Definitions ───────────────────────────────────────────────────────
interface OrderData {
  _id: string;
  gig: { _id: string; title: string; description: string; category: string; budget: number; deadline?: string; tags?: string[] };
  client: { _id: string; name: string; email: string; avatar?: string };
  freelancer: { _id: string; name: string; email: string; avatar?: string };
  proposal: { coverLetter: string; proposedPrice: number; estimatedDays: number };
  totalAmount: number;
  status: string;
  milestones: Array<{
    _id?: string;
    title: string;
    description?: string;
    amount: number;
    dueDate?: string;
    status: string;
    paidAt?: string;
  }>;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface MessageData {
  _id: string;
  orderId: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: string;
}

interface DeliverableData {
  _id: string;
  order: string;
  milestoneIndex: number;
  uploadedBy: { _id: string; name: string } | string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  notes?: string;
  version: string;
  status: string;
  reviewedBy?: { _id: string; name: string } | string;
  reviewedAt?: string;
  rejectionNotes?: string;
  createdAt: string;
}

interface ActivityData {
  _id: string;
  order: string;
  user?: { _id: string; name: string } | string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
}

// ─── Helper Functions ───────────────────────────────────────────────────────
const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const formatFileSize = (bytes: number) => {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
};

const getFileIcon = (fileType: string) => {
  if (fileType.includes('pdf') || fileType.includes('document')) return FileText;
  if (fileType.includes('zip') || fileType.includes('archive') || fileType.includes('compressed')) return FileArchive;
  return FileCode;
};

const getInitials = (name: string) =>
  name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();

const statusDisplayMap: Record<string, { label: string; color: string }> = {
  active: { label: 'IN PROGRESS', color: 'text-emerald-700 bg-emerald-50 border-emerald-200/50' },
  in_review: { label: 'UNDER REVIEW', color: 'text-amber-700 bg-amber-50 border-amber-200/50' },
  completed: { label: 'COMPLETED', color: 'text-emerald-700 bg-emerald-50 border-emerald-200/50' },
  cancelled: { label: 'CANCELLED', color: 'text-red-700 bg-red-50 border-red-200/50' },
  disputed: { label: 'DISPUTED', color: 'text-orange-700 bg-orange-50 border-orange-200/50' },
};

// ─── Component ──────────────────────────────────────────────────────────────
export default function Workspace() {
  const { user, logout } = useAuthStore();
  const { socket, connectSocket, disconnectSocket } = useChatStore();
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const orderId = paramId || searchParams.get('id') || '';

  // Navigation and UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // ── Data States ─────────────────────────────────────────────────────────
  const [order, setOrder] = useState<OrderData | null>(null);
  const [financial, setFinancial] = useState({ totalAmount: 0, paidAmount: 0, remainingAmount: 0 });
  const [progress, setProgress] = useState(0);
  const [userRole, setUserRole] = useState<'client' | 'freelancer'>('client');

  const [messages, setMessages] = useState<MessageData[]>([]);
  const [deliverables, setDeliverables] = useState<DeliverableData[]>([]);
  const [activities, setActivities] = useState<ActivityData[]>([]);

  // ── Loading / Error States ──────────────────────────────────────────────
  const [orderLoading, setOrderLoading] = useState(true);
  const [orderError, setOrderError] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState('');
  const [deliverablesLoading, setDeliverablesLoading] = useState(true);
  const [deliverablesError, setDeliverablesError] = useState('');
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState('');

  // ── Chat State ──────────────────────────────────────────────────────────
  const [chatInput, setChatInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Action States ───────────────────────────────────────────────────────
  const [milestoneActionLoading, setMilestoneActionLoading] = useState<string | null>(null);
  const [deliverableActionLoading, setDeliverableActionLoading] = useState<string | null>(null);
  const [completingOrder, setCompletingOrder] = useState(false);

  // ── Upload State ────────────────────────────────────────────────────────
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadMilestoneIndex, setUploadMilestoneIndex] = useState(0);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  // ── Revision Modal State ────────────────────────────────────────────────
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionTarget, setRevisionTarget] = useState<any>(null);
  const [revisionNotes, setRevisionNotes] = useState('');

  // ── Data Fetching ─────────────────────────────────────────────────────

  const fetchOrder = useCallback(async () => {
    if (!orderId) { setOrderError('No order ID provided'); setOrderLoading(false); return; }
    setOrderLoading(true);
    setOrderError('');
    try {
      const res = await api.get(`/api/orders/${orderId}`);
      setOrder(res.data.data.order);
      setFinancial(res.data.data.financial);
      setProgress(res.data.data.progress);
      setUserRole(res.data.data.role);
    } catch (err: any) {
      setOrderError(err.response?.data?.message || 'Failed to load order');
    } finally {
      setOrderLoading(false);
    }
  }, [orderId]);

  const fetchMessages = useCallback(async () => {
    if (!orderId) return;
    setMessagesLoading(true);
    setMessagesError('');
    try {
      const res = await api.get(`/api/messages/order/${orderId}`);
      setMessages(res.data.data.messages || []);
    } catch (err: any) {
      setMessagesError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  }, [orderId]);

  const fetchDeliverables = useCallback(async () => {
    if (!orderId) return;
    setDeliverablesLoading(true);
    setDeliverablesError('');
    try {
      const res = await api.get(`/api/deliverables/order/${orderId}`);
      setDeliverables(res.data.data.deliverables || []);
    } catch (err: any) {
      setDeliverablesError(err.response?.data?.message || 'Failed to load deliverables');
    } finally {
      setDeliverablesLoading(false);
    }
  }, [orderId]);

  const fetchActivities = useCallback(async () => {
    if (!orderId) return;
    setActivitiesLoading(true);
    setActivitiesError('');
    try {
      const res = await api.get(`/api/activities/order/${orderId}`);
      setActivities(res.data.data.activities || []);
    } catch (err: any) {
      setActivitiesError(err.response?.data?.message || 'Failed to load activities');
    } finally {
      setActivitiesLoading(false);
    }
  }, [orderId]);

  // ── Initial Load ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { navigate('/'); return; }
    if (!orderId) { setOrderError('No order ID provided. Navigate to an order from the Orders page.'); setOrderLoading(false); return; }

    fetchOrder();
    fetchMessages();
    fetchDeliverables();
    fetchActivities();
  }, [user, orderId, fetchOrder, fetchMessages, fetchDeliverables, fetchActivities, navigate]);

  // ── Socket.io Real-time Chat ────────────────────────────────────────────
  useEffect(() => {
    if (!orderId) return;
    connectSocket();

    return () => {
      // Don't disconnect globally — just leave the room
    };
  }, [orderId, connectSocket]);

  useEffect(() => {
    if (!socket || !orderId) return;

    socket.emit('joinOrder', orderId);

    const handleReceiveMessage = (msg: MessageData) => {
      setMessages(prev => {
        // Avoid duplicates (we already add our own messages optimistically)
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on('receiveMessage', handleReceiveMessage);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [socket, orderId]);

  // ── Auto-scroll chat ───────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Chat Send ─────────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !orderId || sendingMessage) return;

    const content = chatInput.trim();
    setChatInput('');
    setSendingMessage(true);

    try {
      const res = await api.post('/api/messages/', { orderId, content });
      const sentMsg = res.data.data.message;
      setMessages(prev => {
        if (prev.some(m => m._id === sentMsg._id)) return prev;
        return [...prev, sentMsg];
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send message');
      setChatInput(content); // Restore input on error
    } finally {
      setSendingMessage(false);
    }
  };

  // ── Milestone Actions ─────────────────────────────────────────────────
  const handleMilestoneAction = async (milestoneIndex: number, newStatus: string) => {
    const loadingKey = `${milestoneIndex}-${newStatus}`;
    setMilestoneActionLoading(loadingKey);
    try {
      await api.patch(`/api/orders/${orderId}/milestones/${milestoneIndex}`, { status: newStatus });
      toast.success(`Milestone ${newStatus === 'approved' ? 'approved & payment released' : 'status updated'}!`);
      fetchOrder();
      fetchActivities();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update milestone');
    } finally {
      setMilestoneActionLoading(null);
    }
  };

  // ── Complete Order ────────────────────────────────────────────────────
  const handleCompleteOrder = async () => {
    setCompletingOrder(true);
    try {
      await api.post(`/api/orders/${orderId}/complete`);
      toast.success('Order marked as completed!');
      fetchOrder();
      fetchActivities();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete order');
    } finally {
      setCompletingOrder(false);
    }
  };

  // ── Deliverable Actions ───────────────────────────────────────────────
  const handleApproveDeliverable = async (deliverableId: string) => {
    setDeliverableActionLoading(deliverableId);
    try {
      await api.patch(`/api/deliverables/${deliverableId}/approve`);
      toast.success('Deliverable approved!');
      fetchDeliverables();
      fetchActivities();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve deliverable');
    } finally {
      setDeliverableActionLoading(null);
    }
  };

  const handleRequestChanges = (item: any) => {
    setRevisionTarget(item);
    setRevisionNotes('');
    setRevisionModalOpen(true);
  };

  const submitRevisionRequest = async () => {
    if (!revisionNotes.trim()) {
      toast.error('Please specify the revision requirements.');
      return;
    }

    if (revisionTarget?._id && revisionTarget?.fileName) {
      // It's a deliverable
      setDeliverableActionLoading(revisionTarget._id);
      try {
        await api.patch(`/api/deliverables/${revisionTarget._id}/reject`, {
          rejectionNotes: revisionNotes.trim(),
        });
        toast.success('Revision request sent!');
        fetchDeliverables();
        fetchActivities();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to request revisions');
      } finally {
        setDeliverableActionLoading(null);
      }
    } else {
      // It's a milestone — reject it
      const milestoneIndex = order?.milestones.findIndex((m: any) => m.title === revisionTarget?.title);
      if (milestoneIndex !== undefined && milestoneIndex >= 0) {
        await handleMilestoneAction(milestoneIndex, 'rejected');
      }
    }
    setRevisionModalOpen(false);
  };

  // ── Upload Deliverable ────────────────────────────────────────────────
  const handleUploadDeliverable = async () => {
    if (!uploadFile) { toast.error('Please select a file'); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('orderId', orderId);
      formData.append('milestoneIndex', String(uploadMilestoneIndex));
      formData.append('notes', uploadNotes);

      await api.post('/api/deliverables/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Deliverable uploaded successfully!');
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadNotes('');
      fetchDeliverables();
      fetchActivities();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // ── Derived Values ────────────────────────────────────────────────────

  const displayName = user?.name || 'User';
  const userInitials = getInitials(user?.name || 'U');

  const isClient = userRole === 'client';
  const isFreelancer = userRole === 'freelancer';

  const otherParty = order
    ? (isClient ? order.freelancer : order.client)
    : null;

  const otherPartyInitials = otherParty ? getInitials(otherParty.name) : '??';
  const otherPartyName = otherParty?.name || 'Unknown';

  const orderStatus = statusDisplayMap[order?.status || 'active'] || statusDisplayMap.active;

  // Compute current milestone info
  const currentMilestoneIndex = order
    ? order.milestones.findIndex((m: any) => m.status !== 'approved')
    : 0;
  const currentMilestoneLabel = order
    ? `Sprint Milestone ${(currentMilestoneIndex >= 0 ? currentMilestoneIndex : order.milestones.length - 1) + 1} of ${order.milestones.length}`
    : '';

  const sidebarNavItems = [
    { name: 'Dashboard', icon: Sparkles, path: '/dashboard' },
    { name: 'Projects', icon: FolderKanban, path: '/dashboard?tab=Projects' },
    { name: 'Proposals', icon: FileText, path: '/dashboard?tab=Proposals' },
    { name: 'Freelancers', icon: Users, path: '/dashboard?tab=Freelancers' },
    { name: 'Messages', icon: MessageSquare, path: '/dashboard?tab=Messages' },
    { name: 'Payments', icon: CreditCard, path: '/dashboard?tab=Payments' },
    { name: 'Reviews & History', icon: Star, path: '/dashboard?tab=Reviews & History' },
  ];

  // ── Loading State for entire page ─────────────────────────────────────
  if (orderLoading) {
    return (
      <div className="min-h-screen bg-paper text-ink flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 size={40} className="animate-spin text-purple mx-auto" />
          <p className="text-sm font-semibold text-ink/50">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // ── Error State for order ─────────────────────────────────────────────
  if (orderError || !order) {
    return (
      <div className="min-h-screen bg-paper text-ink flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-8">
          <div className="w-16 h-16 rounded-full bg-coral/10 flex items-center justify-center mx-auto">
            <AlertCircle size={28} className="text-coral" />
          </div>
          <h2 className="font-display text-2xl font-bold text-ink">Workspace Unavailable</h2>
          <p className="text-sm text-ink/60 font-medium">{orderError || 'Order not found'}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button onClick={fetchOrder} className="btn-secondary !py-2.5 !px-5 !text-sm">
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
            <button onClick={() => navigate('/orders')} className="btn-primary !py-2.5 !px-5 !text-sm">
              <ArrowLeft size={14} />
              <span>Back to Orders</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Inline Loading/Error/Empty Components ─────────────────────────────
  const SectionLoading = () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={24} className="animate-spin text-purple" />
      <span className="ml-2 text-sm font-medium text-ink/50">Loading...</span>
    </div>
  );

  const SectionError = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div className="text-center py-8 space-y-3">
      <AlertCircle size={22} className="text-coral mx-auto" />
      <p className="text-sm text-ink/60 font-medium">{message}</p>
      <button onClick={onRetry} className="btn-secondary !py-2 !px-4 !text-xs mx-auto">
        <RefreshCw size={13} />
        <span>Retry</span>
      </button>
    </div>
  );

  const SectionEmpty = ({ message, icon: Icon }: { message: string; icon: any }) => (
    <div className="text-center py-10 space-y-3">
      <div className="w-12 h-12 rounded-full bg-soft flex items-center justify-center mx-auto">
        <Icon size={20} className="text-ink/30" />
      </div>
      <p className="text-sm text-ink/50 font-medium">{message}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col lg:flex-row antialiased selection:bg-purple/15 selection:text-ink">
      
      {/* ====================================================
          LEFT SIDEBAR (Fixed / Sticky 252px, Background #18181B)
          ==================================================== */}
      <aside className="hidden lg:flex flex-col w-[252px] h-screen sticky top-0 bg-[#18181B] text-white p-[28px_18px] justify-between z-30 shrink-0 select-none border-r border-white/5">
        <div className="flex flex-col">
          {/* Top Logo */}
          <Link
            to="/"
            className="flex items-center gap-0.5 no-underline mb-7 px-1 group"
            title="Return to GigMatch Home"
          >
            <span className="font-clash text-[22px] font-bold tracking-tight text-white group-hover:text-white/90 transition-colors">
              GIGMATCH
            </span>
            <span className="font-clash text-[22px] font-bold text-[#FF6B6B] leading-none">
              *
            </span>
          </Link>

          {/* User Identity Card */}
          <div
            onClick={() => navigate('/profile')}
            className="bg-white/[0.06] border border-white/[0.08] hover:border-purple/40 hover:bg-white/[0.10] transition-all rounded-[18px] p-3.5 mb-6 flex items-center gap-3 cursor-pointer group"
            title="View Profile"
          >
            <div className="w-10 h-10 rounded-[12px] bg-[#22D3EE] text-[#18181B] font-bold font-clash flex items-center justify-center text-sm shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              {userInitials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white font-bold text-sm truncate leading-tight group-hover:text-white/95">
                {displayName}
              </span>
              <span className="text-white/50 text-xs truncate mt-0.5 font-medium group-hover:text-white/70">
                {isClient ? 'Employer workspace' : 'Freelancer workspace'}
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col space-y-1.5" aria-label="Workspace navigation">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.name === 'Projects';
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[14px] text-sm font-semibold transition-all duration-200 cursor-pointer text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#FF6B6B] text-white shadow-md shadow-purple/20'
                      : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon
                    size={17}
                    className={isActive ? 'text-white' : 'text-white/60'}
                  />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-1 px-1">
          <Link
            to="/dashboard"
            className="flex items-center justify-between text-xs font-medium text-white/60 hover:text-white py-2 px-2 rounded-lg hover:bg-white/[0.04] transition-colors no-underline"
          >
            <span>← Return to Overview</span>
            <ChevronRight size={13} />
          </Link>
          <button
            onClick={async () => {
              if (user) await logout();
              navigate('/');
            }}
            className="flex items-center gap-2 text-xs font-medium text-white/40 hover:text-[#FF6B6B] py-2 px-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer bg-transparent border-0 text-left"
          >
            <LogOut size={13} />
            <span>Switch account / Exit</span>
          </button>
        </div>
      </aside>

      {/* ====================================================
          MOBILE DRAWER SIDEBAR
          ==================================================== */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-[270px] max-w-[80vw] h-full bg-[#18181B] text-white p-6 flex flex-col justify-between z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between mb-6">
                <Link
                  to="/"
                  className="flex items-center gap-0.5 no-underline"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="font-clash text-[22px] font-bold text-white">
                    GIGMATCH
                  </span>
                  <span className="font-clash text-[22px] font-bold text-[#FF6B6B]">
                    *
                  </span>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer border-0 bg-transparent"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex flex-col space-y-1.5">
                {sidebarNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[14px] text-sm font-semibold text-white/70 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer text-left"
                    >
                      <Icon size={17} />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          MAIN WORKSPACE CANVAS
          ==================================================== */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-paper">
        
        {/* Top Utility Breadcrumb Bar */}
        <header className="sticky top-0 z-20 bg-paper/90 backdrop-blur-md border-b border-border px-4 sm:px-6 md:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-ink hover:bg-soft cursor-pointer border-0 bg-transparent"
            >
              <Menu size={22} />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-ink/50">
              <Link to="/dashboard" className="hover:text-purple transition-colors no-underline text-ink/60">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-ink">Active Sprint Workspace</span>
              <span>/</span>
              <span className="text-purple font-bold truncate max-w-[200px] sm:max-w-none">
                {order.gig.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary !py-2 !px-3.5 !text-xs hidden sm:inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Workspace link copied to clipboard!');
              }}
              className="btn-primary !py-2 !px-4 !text-xs"
            >
              <ExternalLink size={13} />
              <span>Share Channel</span>
            </button>
          </div>
        </header>

        {/* ====================================================
            WORKSPACE BODY
            ==================================================== */}
        <div className="flex-1 px-4 sm:px-6 md:px-8 py-8 max-w-[1400px] w-full mx-auto space-y-8">
          
          {/* ====================================================
              1. PROJECT HEADER OVERVIEW CARD
              ==================================================== */}
          <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left Title & Metadata */}
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${orderStatus.color}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {orderStatus.label}
                  </span>
                  <span className="text-xs font-bold text-purple bg-purple/10 px-3 py-1 rounded-full">
                    {currentMilestoneLabel}
                  </span>
                  <span className="text-xs text-ink/40 font-medium">
                    ID: {order._id.slice(-8)}
                  </span>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight leading-tight">
                  {order.gig.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-ink/70 pt-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-clash font-bold text-xs text-ink shadow-xs"
                      style={{ backgroundColor: '#A3E635' }}
                    >
                      {otherPartyInitials}
                    </div>
                    <span>Collaborator: <strong className="text-ink">{otherPartyName}</strong></span>
                  </div>
                  <span>·</span>
                  <span>Started: <strong className="text-ink">{formatDate(order.createdAt)}</strong></span>
                  {order.gig.deadline && (
                    <>
                      <span>·</span>
                      <span>Deadline: <strong className="text-ink">{formatDate(order.gig.deadline)}</strong></span>
                    </>
                  )}
                </div>
              </div>

              {/* Right Budget & Quick Actions */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-border/50">
                <div className="text-left lg:text-right">
                  <span className="text-[11px] font-bold text-ink/40 uppercase tracking-wider block">Contract Value</span>
                  <span className="font-display font-extrabold text-3xl text-ink leading-tight block">
                    {formatCurrency(order.totalAmount)}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 lg:justify-end mt-0.5">
                    <ShieldCheck size={13} />
                    <span>100% Escrow Protected</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => toast.info('Viewing original brief specifications')}
                    className="btn-secondary !py-2 !px-3.5 !text-xs"
                  >
                    <FileText size={14} />
                    <span>View Brief</span>
                  </button>
                  {isClient && order.status === 'active' && (
                    <button
                      onClick={handleCompleteOrder}
                      disabled={completingOrder}
                      className="btn-primary !py-2 !px-4 !text-xs"
                    >
                      {completingOrder ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      <span>Mark Complete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Overall Sprint Progress Bar */}
            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="flex items-center justify-between text-xs font-bold text-ink mb-2">
                <span>Overall Deliverable Progress</span>
                <span className="text-purple">{progress}% Complete</span>
              </div>
              <div className="w-full h-3 bg-soft rounded-full overflow-hidden">
                <div
                  className="h-full gradient-primary rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </section>

          {/* ====================================================
              2. MAIN MIDDLE WORKSPACE: CHAT & DELIVERABLES (Side-by-Side)
              ==================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column (8 cols): Large Interactive Chat Area */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Chat Container */}
              <section className="bg-white rounded-[28px] border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col h-[580px]">
                {/* Chat Top Bar */}
                <div className="p-4 sm:p-5 border-b border-border bg-paper/50 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-[14px] flex items-center justify-center font-clash font-bold text-sm text-ink shrink-0 shadow-xs ring-2 ring-white"
                      style={{ backgroundColor: '#A3E635' }}
                    >
                      {otherPartyInitials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-ink">{otherPartyName}</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active Now
                        </span>
                      </div>
                      <p className="text-xs text-ink/50">{isClient ? 'Freelancer' : 'Client'} · Order {order._id.slice(-8)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple bg-purple/10 px-3 py-1 rounded-full hidden sm:inline-block">
                      {currentMilestoneLabel ? `${currentMilestoneLabel.split(' ').slice(0, 3).join(' ')} Channel` : 'Workspace Channel'}
                    </span>
                  </div>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-paper">
                  <div className="text-center my-1">
                    <span className="inline-block bg-white text-ink/50 text-[11px] font-semibold px-4 py-1 rounded-full border border-border">
                      Encrypted workspace sprint communication
                    </span>
                  </div>

                  {messagesLoading ? (
                    <SectionLoading />
                  ) : messagesError ? (
                    <SectionError message={messagesError} onRetry={fetchMessages} />
                  ) : messages.length === 0 ? (
                    <SectionEmpty message="No messages yet. Start the conversation!" icon={MessageSquare} />
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === user?.id;
                      return (
                        <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className="flex items-end gap-2.5 max-w-[85%] sm:max-w-[75%]">
                            {!isMe && (
                              <div
                                className="w-8 h-8 rounded-[10px] flex items-center justify-center font-clash font-bold text-[11px] text-ink shrink-0 mb-1"
                                style={{ backgroundColor: '#A3E635' }}
                              >
                                {otherPartyInitials}
                              </div>
                            )}
                            <div
                              className={`p-4 rounded-[20px] text-xs sm:text-sm leading-relaxed shadow-xs ${
                                isMe
                                  ? 'gradient-primary text-white rounded-br-xs'
                                  : 'bg-white text-ink border border-border rounded-bl-xs'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.content}</p>

                              <span
                                className={`text-[10px] mt-2 block text-right font-medium ${
                                  isMe ? 'text-white/70' : 'text-ink/40'
                                }`}
                              >
                                {formatTime(msg.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 sm:p-4 bg-white border-t border-border shrink-0">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => toast.info('Select files to upload to workspace')}
                      className="p-2.5 rounded-full text-ink/50 hover:text-purple hover:bg-soft transition-colors cursor-pointer border-0 bg-transparent"
                      title="Attach file"
                    >
                      <Paperclip size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toast.info('Attach image preview')}
                      className="p-2.5 rounded-full text-ink/50 hover:text-purple hover:bg-soft transition-colors cursor-pointer border-0 bg-transparent"
                      title="Attach image"
                    >
                      <ImageIcon size={18} />
                    </button>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={`Message ${otherPartyName} in workspace...`}
                      className="flex-1 bg-soft border border-border rounded-full px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-purple focus:bg-white transition-all text-ink"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || sendingMessage}
                      className="btn-primary !py-2.5 !px-5 !text-xs sm:!text-sm disabled:opacity-40"
                    >
                      {sendingMessage ? <Loader2 size={14} className="animate-spin" /> : <span>Send</span>}
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              </section>

              {/* Deliverables Management Section */}
              <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                      Submitted Deliverables
                    </h2>
                    <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                      Inspect, download, and approve milestone assets or request revisions.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {isFreelancer && (
                      <button
                        onClick={() => { setUploadMilestoneIndex(currentMilestoneIndex >= 0 ? currentMilestoneIndex : 0); setUploadModalOpen(true); }}
                        className="btn-primary !py-2 !px-3.5 !text-xs"
                      >
                        <Upload size={14} />
                        <span>Upload</span>
                      </button>
                    )}
                    <span className="text-xs font-bold text-purple bg-purple/10 px-3 py-1 rounded-full">
                      {deliverables.length} Assets Logged
                    </span>
                  </div>
                </div>

                {deliverablesLoading ? (
                  <SectionLoading />
                ) : deliverablesError ? (
                  <SectionError message={deliverablesError} onRetry={fetchDeliverables} />
                ) : deliverables.length === 0 ? (
                  <SectionEmpty message={isFreelancer ? 'No deliverables uploaded yet. Upload your first deliverable!' : 'No deliverables uploaded yet. Waiting for the freelancer to submit work.'} icon={FileCheck2} />
                ) : (
                  <div className="space-y-3.5">
                    {deliverables.map((deliv) => {
                      const Icon = getFileIcon(deliv.fileType);
                      const statusLabel = deliv.status === 'pending' ? 'Under Review' : deliv.status === 'approved' ? 'Approved' : 'Rejected';
                      const statusColor = deliv.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                        : deliv.status === 'rejected'
                        ? 'bg-red-50 text-red-700 border border-red-200/50'
                        : 'bg-amber-50 text-amber-700 border border-amber-200/50';
                      const milestoneLabel = order.milestones[deliv.milestoneIndex]
                        ? `Milestone ${deliv.milestoneIndex + 1}`
                        : `Milestone ${deliv.milestoneIndex + 1}`;

                      return (
                        <div
                          key={deliv._id}
                          className="bg-soft/60 rounded-[20px] p-4 sm:p-5 border border-border/50 hover:border-purple/30 hover:bg-white hover:shadow-xs transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3.5 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-2xl bg-purple/10 text-purple flex items-center justify-center shrink-0">
                              <Icon size={22} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-bold text-sm sm:text-base text-ink truncate">{deliv.fileName}</h4>
                                <span className="text-[11px] font-bold bg-white px-2 py-0.5 rounded-md border border-border text-ink/70">
                                  {deliv.version}
                                </span>
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${statusColor}`}>
                                  {statusLabel}
                                </span>
                              </div>
                              <p className="text-xs text-ink/50 mt-1">
                                {milestoneLabel} · {formatFileSize(deliv.fileSize)} · Uploaded {formatDateTime(deliv.createdAt)}
                              </p>
                              {deliv.notes && (
                                <p className="text-xs text-ink/60 mt-1 italic">Notes: {deliv.notes}</p>
                              )}
                              {deliv.rejectionNotes && (
                                <p className="text-xs text-red-600 mt-1 font-medium">Revision notes: {deliv.rejectionNotes}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
                            <a
                              href={deliv.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-secondary !py-2 !px-3 !text-xs no-underline"
                              title="Download File"
                            >
                              <Download size={14} />
                              <span>Download</span>
                            </a>
                            {isClient && deliv.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleRequestChanges(deliv)}
                                  className="btn-secondary !py-2 !px-3 !text-xs text-coral hover:text-coral"
                                  title="Request Revisions"
                                  disabled={deliverableActionLoading === deliv._id}
                                >
                                  <RefreshCw size={14} />
                                  <span>Revisions</span>
                                </button>
                                <button
                                  onClick={() => handleApproveDeliverable(deliv._id)}
                                  disabled={deliverableActionLoading === deliv._id}
                                  className="btn-primary !py-2 !px-4 !text-xs"
                                >
                                  {deliverableActionLoading === deliv._id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                  <span>Approve</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Milestones & Sprint Progress Section */}
              <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                      Milestone Timeline & Sprint Deliverables
                    </h2>
                    <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                      Funds are released upon client verification of milestone deliverables.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/50">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>Escrow Protected</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {order.milestones.map((m, idx) => {
                    const milestoneStatus = m.status;
                    const loadingKey = `${idx}-`;
                    const isActionLoading = milestoneActionLoading?.startsWith(String(idx));

                    return (
                      <div
                        key={idx}
                        className={`rounded-[22px] p-5 border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          milestoneStatus === 'approved'
                            ? 'bg-emerald-50/40 border-emerald-200/60'
                            : milestoneStatus === 'in_progress' || milestoneStatus === 'submitted'
                            ? 'bg-purple/5 border-purple/30 ring-1 ring-purple/20'
                            : milestoneStatus === 'rejected'
                            ? 'bg-red-50/30 border-red-200/60'
                            : 'bg-soft/50 border-border/60 opacity-85'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-clash font-bold text-sm shrink-0 ${
                            milestoneStatus === 'approved'
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : milestoneStatus === 'in_progress' || milestoneStatus === 'submitted'
                              ? 'gradient-primary text-white shadow-xs'
                              : milestoneStatus === 'rejected'
                              ? 'bg-red-500 text-white shadow-xs'
                              : 'bg-white text-ink/40 border border-border'
                          }`}>
                            {milestoneStatus === 'approved' ? <Check size={16} /> : idx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-base text-ink">{m.title}</h4>
                              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                milestoneStatus === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : milestoneStatus === 'in_progress'
                                  ? 'bg-purple/15 text-purple'
                                  : milestoneStatus === 'submitted'
                                  ? 'bg-amber-100 text-amber-800'
                                  : milestoneStatus === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {milestoneStatus === 'in_progress' ? 'In Progress' : milestoneStatus === 'approved' ? 'Completed' : milestoneStatus.charAt(0).toUpperCase() + milestoneStatus.slice(1)}
                              </span>
                            </div>
                            {m.description && (
                              <p className="text-xs text-ink/65 font-medium mt-1 leading-relaxed">
                                {m.description}
                              </p>
                            )}
                            <div className="text-xs text-ink/50 mt-1 font-medium">
                              {m.dueDate && <>Due: {formatDate(m.dueDate)} · </>}Allocated: <strong className="text-ink">{formatCurrency(m.amount)}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border/40">
                          {/* Freelancer actions */}
                          {isFreelancer && milestoneStatus === 'pending' && (
                            <button
                              onClick={() => handleMilestoneAction(idx, 'in_progress')}
                              disabled={isActionLoading}
                              className="btn-primary !py-2 !px-4 !text-xs"
                            >
                              {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Briefcase size={14} />}
                              <span>Start Work</span>
                            </button>
                          )}
                          {isFreelancer && milestoneStatus === 'in_progress' && (
                            <button
                              onClick={() => handleMilestoneAction(idx, 'submitted')}
                              disabled={isActionLoading}
                              className="btn-primary !py-2 !px-4 !text-xs"
                            >
                              {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                              <span>Submit for Review</span>
                            </button>
                          )}
                          {isFreelancer && milestoneStatus === 'rejected' && (
                            <button
                              onClick={() => handleMilestoneAction(idx, 'in_progress')}
                              disabled={isActionLoading}
                              className="btn-primary !py-2 !px-4 !text-xs"
                            >
                              {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                              <span>Resume Work</span>
                            </button>
                          )}
                          
                          {/* Client actions */}
                          {isClient && milestoneStatus === 'submitted' && (
                            <>
                              <button
                                onClick={() => handleRequestChanges(m)}
                                className="btn-secondary !py-2 !px-3.5 !text-xs"
                                disabled={isActionLoading}
                              >
                                <span>Request Changes</span>
                              </button>
                              <button
                                onClick={() => handleMilestoneAction(idx, 'approved')}
                                disabled={isActionLoading}
                                className="btn-primary !py-2 !px-4 !text-xs"
                              >
                                {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                                <span>Release Escrow ({formatCurrency(m.amount)})</span>
                              </button>
                            </>
                          )}

                          {milestoneStatus === 'approved' && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full">
                              <CheckCircle2 size={14} />
                              <span>Paid & Released</span>
                            </span>
                          )}
                          {milestoneStatus === 'pending' && isClient && (
                            <span className="text-xs font-medium text-ink/40">
                              Awaiting Sprint Kickoff
                            </span>
                          )}
                          {(milestoneStatus === 'in_progress' || milestoneStatus === 'rejected') && isClient && (
                            <span className="text-xs font-medium text-ink/40">
                              {milestoneStatus === 'in_progress' ? 'Freelancer working...' : 'Revisions requested'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Project Payments Section */}
              <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                      Project Financial Summary
                    </h2>
                    <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                      Milestone breakdown and escrow ledger for this contract.
                    </p>
                  </div>
                  <button
                    onClick={() => toast.success('Invoice summary downloaded!')}
                    className="btn-secondary !py-2 !px-4 !text-xs"
                  >
                    <Download size={13} />
                    <span>Download Invoice</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-soft p-4 rounded-2xl border border-border/60">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink/40 block mb-1">Total Agreed Budget</span>
                    <span className="font-display font-extrabold text-2xl text-ink leading-tight">{formatCurrency(financial.totalAmount)}</span>
                  </div>
                  <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/60">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">Released to Freelancer</span>
                    <span className="font-display font-extrabold text-2xl text-emerald-700 leading-tight">{formatCurrency(financial.paidAmount)}</span>
                  </div>
                  <div className="bg-purple/5 p-4 rounded-2xl border border-purple/20">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple block mb-1">Remaining in Escrow</span>
                    <span className="font-display font-extrabold text-2xl text-purple leading-tight">{formatCurrency(financial.remainingAmount)}</span>
                  </div>
                </div>
              </section>

              {/* Activity Timeline Section */}
              <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight mb-6">
                  Activity Timeline & Project Log
                </h2>

                {activitiesLoading ? (
                  <SectionLoading />
                ) : activitiesError ? (
                  <SectionError message={activitiesError} onRetry={fetchActivities} />
                ) : activities.length === 0 ? (
                  <SectionEmpty message="No activity events yet. Events will appear as the project progresses." icon={Clock} />
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                    {activities.map((ev) => (
                      <div key={ev._id} className="relative group">
                        <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-white border-2 border-purple ring-4 ring-purple/10" />
                        <div className="bg-soft/50 group-hover:bg-soft p-4 rounded-2xl border border-border/50 transition-colors">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-bold text-sm text-ink">{ev.title}</h4>
                            <span className="text-[11px] font-medium text-ink/40">{formatDateTime(ev.createdAt)}</span>
                          </div>
                          <p className="text-xs text-ink/65 leading-relaxed">{ev.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Right Column (4 cols): Freelancer Bio, Scope & Escrow Info */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Freelancer/Client Profile Card */}
              <div className="bg-white rounded-[28px] p-6 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-5">
                <div className="flex items-center justify-between">
                  <span className="eyebrow text-purple">{isClient ? 'ASSIGNED CREATOR' : 'PROJECT CLIENT'}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-[20px] flex items-center justify-center font-clash font-bold text-2xl text-ink shrink-0 shadow-md ring-4 ring-white"
                    style={{ backgroundColor: '#A3E635' }}
                  >
                    {otherPartyInitials}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-ink leading-tight">
                      {otherPartyName}
                    </h3>
                    <p className="text-xs text-ink/60 mt-0.5 font-medium">{otherParty?.email}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      const chatEl = document.querySelector('input[type="text"]') as HTMLInputElement;
                      chatEl?.focus();
                    }}
                    className="w-full btn-primary !py-2.5 !text-xs justify-center"
                  >
                    <MessageSquare size={14} />
                    <span>Direct Message</span>
                  </button>
                </div>
              </div>

              {/* Project Assets & Useful Links Card */}
              <div className="bg-white rounded-[28px] p-6 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-4">
                <h3 className="font-display font-bold text-lg text-ink">
                  Connected Workspace Links
                </h3>
                <div className="space-y-2.5 text-xs font-semibold">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toast.info('Opening Figma shared file...');
                    }}
                    className="p-3 rounded-xl bg-soft hover:bg-purple/10 text-ink hover:text-purple flex items-center justify-between transition-colors no-underline border border-border/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileCode size={16} className="text-purple" />
                      <span>Shared Figma File (Live Drafts)</span>
                    </div>
                    <ArrowUpRight size={14} />
                  </a>

                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toast.info('Opening GitHub repository...');
                    }}
                    className="p-3 rounded-xl bg-soft hover:bg-purple/10 text-ink hover:text-purple flex items-center justify-between transition-colors no-underline border border-border/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <Layers size={16} className="text-cyan" />
                      <span>GitHub Component Library Repo</span>
                    </div>
                    <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>

              {/* Escrow Guarantee Card */}
              <div className="bg-gradient-to-br from-purple/5 to-coral/5 rounded-[28px] p-6 border border-purple/20 space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <span>GigMatch Escrow Guaranteed</span>
                </div>
                <p className="text-xs text-ink/75 leading-relaxed font-medium">
                  Your funds remain securely vaulted. Milestone releases happen only after you review and approve deliverables.
                </p>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* ====================================================
          MODAL: REQUEST REVISIONS MODAL
          ==================================================== */}
      <Dialog open={revisionModalOpen} onOpenChange={setRevisionModalOpen}>
        <DialogContent className="max-w-xl bg-white rounded-[28px] p-6 sm:p-7 border border-border shadow-2xl">
          {revisionTarget && (
            <div className="space-y-5">
              <DialogHeader>
                <span className="eyebrow text-coral">REQUEST REVISIONS</span>
                <DialogTitle className="font-display text-2xl font-bold text-ink mt-1">
                  Request Changes for {revisionTarget.name || revisionTarget.fileName || revisionTarget.title || 'Deliverable'}
                </DialogTitle>
                <DialogDescription className="text-xs text-ink/60">
                  Provide specific notes for {otherPartyName} to refine the deliverables.
                </DialogDescription>
              </DialogHeader>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-2">
                  Change Request Details
                </label>
                <textarea
                  rows={4}
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="E.g. Please adjust the primary purple contrast token and export SVG icons at 24px and 32px grids..."
                  className="w-full bg-soft border border-border rounded-2xl p-4 text-xs sm:text-sm font-medium text-ink focus:outline-none focus:border-purple leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setRevisionModalOpen(false)}
                  className="btn-secondary !py-2 !px-4 !text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitRevisionRequest}
                  className="btn-primary !py-2 !px-5 !text-xs"
                >
                  <Send size={14} />
                  <span>Send Revision Request</span>
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ====================================================
          MODAL: UPLOAD DELIVERABLE (Freelancer Only)
          ==================================================== */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-w-xl bg-white rounded-[28px] p-6 sm:p-7 border border-border shadow-2xl">
          <div className="space-y-5">
            <DialogHeader>
              <span className="eyebrow text-purple">UPLOAD DELIVERABLE</span>
              <DialogTitle className="font-display text-2xl font-bold text-ink mt-1">
                Submit Work for Milestone {uploadMilestoneIndex + 1}
              </DialogTitle>
              <DialogDescription className="text-xs text-ink/60">
                Upload your deliverable file and add any notes for the client.
              </DialogDescription>
            </DialogHeader>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-2">
                Select Milestone
              </label>
              <select
                value={uploadMilestoneIndex}
                onChange={(e) => setUploadMilestoneIndex(Number(e.target.value))}
                className="w-full bg-soft border border-border rounded-xl p-3 text-sm font-medium text-ink focus:outline-none focus:border-purple"
              >
                {order.milestones.map((m, idx) => (
                  <option key={idx} value={idx}>
                    Milestone {idx + 1}: {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-2">
                File (Max 50 MB)
              </label>
              <input
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full bg-soft border border-border rounded-xl p-3 text-sm font-medium text-ink focus:outline-none focus:border-purple file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple/10 file:text-purple"
              />
              {uploadFile && (
                <p className="text-xs text-ink/50 mt-1">{uploadFile.name} ({formatFileSize(uploadFile.size)})</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-2">
                Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                placeholder="Describe what's included in this deliverable..."
                className="w-full bg-soft border border-border rounded-2xl p-4 text-xs sm:text-sm font-medium text-ink focus:outline-none focus:border-purple leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="btn-secondary !py-2 !px-4 !text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadDeliverable}
                disabled={!uploadFile || uploading}
                className="btn-primary !py-2 !px-5 !text-xs disabled:opacity-40"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                <span>{uploading ? 'Uploading...' : 'Upload Deliverable'}</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
