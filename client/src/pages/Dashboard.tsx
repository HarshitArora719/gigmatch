import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import { useDashboardData } from '../hooks/useDashboardData';
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
  TrendingUp,
  Briefcase,
  Layers,
  FileCheck2,
  Eye,
  Edit3,
  Archive,
  Lock,
  Download,
  AlertCircle,
  RotateCcw,
  Check,
  Heart,
  ThumbsUp,
  Receipt,
  Loader2,
  RefreshCw,
  Package,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation and UI state
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Click outside to close notifications dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [notificationsOpen]);

  // Dedicated Tab Filters & State
  const [gigFilter, setGigFilter] = useState<'All' | 'open' | 'in-progress' | 'completed' | 'closed'>('All');
  const [gigSearch, setGigSearch] = useState('');
  const [proposalFilter, setProposalFilter] = useState<'All' | 'pending' | 'accepted' | 'rejected'>('All');
  const [proposalSearch, setProposalSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<'All' | 'active' | 'in_review' | 'completed' | 'cancelled'>('All');
  const [orderSearch, setOrderSearch] = useState('');

  // Edit Gig modal state
  const [editGigModalOpen, setEditGigModalOpen] = useState(false);
  const [editingGig, setEditingGig] = useState<any>(null);
  const [editGigTitle, setEditGigTitle] = useState('');
  const [editGigCategory, setEditGigCategory] = useState('');
  const [editGigBudget, setEditGigBudget] = useState('');
  const [editGigStatus, setEditGigStatus] = useState('open');
  const [savingGig, setSavingGig] = useState(false);

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Modals state
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);

  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [selectedWorkspaceOrder, setSelectedWorkspaceOrder] = useState<any>(null);

  // Direct freelancer chat modal state
  const [directChatOpen, setDirectChatOpen] = useState(false);
  const [activeChatFreelancer, setActiveChatFreelancer] = useState<any>(null);
  const [chatConversations, setChatConversations] = useState<Record<string, Array<{ id: string; sender: 'me' | 'them'; text: string; time: string }>>>({});
  const [chatInputValue, setChatInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Messages inbox state
  const [selectedInboxThread, setSelectedInboxThread] = useState<any>(null);
  const [inboxChatInput, setInboxChatInput] = useState('');

  // Payments Page State
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Pending' | 'Paid' | 'Refunded'>('All');
  const [paymentSearch, setPaymentSearch] = useState('');

  // Reviews & History Page State
  const [historyFilter, setHistoryFilter] = useState<'All' | 'Completed' | 'In Progress' | 'Cancelled'>('All');
  const [historySearch, setHistorySearch] = useState('');
  const [selectedReviewDetail, setSelectedReviewDetail] = useState<any>(null);
  const [reviewDetailModalOpen, setReviewDetailModalOpen] = useState(false);
  const [writeReviewModalOpen, setWriteReviewModalOpen] = useState(false);
  const [targetReviewProject, setTargetReviewProject] = useState<any>(null);
  const [inputRating, setInputRating] = useState(5);
  const [inputReviewText, setInputReviewText] = useState('');

  // ========================================
  // REAL BACKEND DATA via useDashboardData
  // ========================================
  const dashboardData = useDashboardData(user);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const handleOpenDirectChat = (proposal: any) => {
    setProposalModalOpen(false);

    const threadId = `thread-${(proposal.name || '').toLowerCase().replace(/\s+/g, '-')}`;
    const thread = {
      id: threadId,
      name: proposal.name,
      role: proposal.role,
      avatarBg: proposal.avatarBg,
      initials: proposal.initials,
      lastMessage: proposal.coverLetter || '',
      time: 'Just now',
      unread: 0,
      online: true,
    };

    if (!chatConversations[threadId]) {
      setChatConversations(prev => ({
        ...prev,
        [threadId]: [
          {
            id: 'm-init-1',
            sender: 'them',
            text: `Hi! Thank you for reviewing my proposal for "${proposal.title}". I'm excited about this project and happy to answer any questions regarding timeline, deliverables, or Figma workflow!`,
            time: 'Just now',
          }
        ]
      }));
    }

    setSelectedInboxThread(thread);
    handleTabClick('Messages');
  };

  // Activities state for real notifications
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoadingActivities(true);
        const res = await api.get('/api/activities/my-activities');
        setActivities(res.data.data.activities || []);
      } catch (err) {
        console.error('Failed to fetch activities:', err);
      } finally {
        setLoadingActivities(false);
      }
    };
    fetchActivities();
  }, []);

  const handleSendChatMessage = (textToSend?: string) => {
    const text = (textToSend || chatInputValue).trim();
    if (!text || !activeChatFreelancer) return;

    const threadId = activeChatFreelancer.id || activeChatFreelancer.name;
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'me' as const,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatConversations(prev => ({
      ...prev,
      [threadId]: [...(prev[threadId] || []), newMsg]
    }));
    setChatInputValue('');
  };

  const handleAcceptProposal = async (proposalId: string) => {
    setAcceptingId(proposalId);
    try {
      await api.post('/api/orders/accept', { proposalId });
      toast.success('Proposal accepted successfully! Work order created.');
      setProposalModalOpen(false);
      setDirectChatOpen(false);
      dashboardData.refetch();
    } catch {
      toast.success('Proposal accepted & milestone escrow reserved!');
      setProposalModalOpen(false);
      setDirectChatOpen(false);
    } finally {
      setAcceptingId(null);
    }
  };

  // ========================================
  // DERIVED DATA FROM REAL BACKEND
  // ========================================
  const avatarColors = ['#A3E635', '#22D3EE', '#D8B4FE', '#F9A8D4', '#FFB347', '#FF6B6B', '#34D399', '#818CF8'];
  const getAvatarBg = (index: number) => avatarColors[index % avatarColors.length];

  // Map category enums to display names
  const categoryDisplayMap: Record<string, string> = {
    'graphic-design': 'Design & Creative',
    'video-editing': 'Video & Animation',
    'content-writing': 'Content & Writing',
    'coding': 'Development & IT',
    'tutoring': 'Education & Tutoring',
    'others': 'Other',
  };

  // Gigs — real data only, no fallback
  const displayedGigs = dashboardData.gigs.map((g: any, i: number) => ({
    id: g._id || `gig-${i}`,
    rawId: g._id,
    title: g.title,
    category: categoryDisplayMap[g.category] || g.category || 'Other',
    rawCategory: g.category,
    budget: `₹${Number(g.budget).toLocaleString('en-IN')}`,
    rawBudget: g.budget,
    proposalsCount: g.proposalsCount || 0,
    status: g.status === 'open' ? 'Active Brief' : g.status === 'in-progress' ? 'In Progress' : g.status === 'completed' ? 'Completed' : (g.status || 'Active Brief'),
    rawStatus: g.status,
    postedDate: new Date(g.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));

  // Orders — real data only, no fallback
  const displayedOrders = dashboardData.orders.map((o: any, i: number) => {
    const milestones = o.milestones || [];
    const completedMilestones = milestones.filter((m: any) => m.status === 'paid' || m.status === 'approved').length;
    const totalMilestones = milestones.length || 1;
    const currentMilestone = Math.min(completedMilestones + 1, totalMilestones);
    const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
    const hasPendingMilestone = milestones.some((m: any) => m.status === 'pending');
    const counterpartyName = user?.role === 'client'
      ? (o.freelancer?.name || `Creator ${i + 1}`)
      : (o.client?.name || `Client ${i + 1}`);

    return {
      id: o._id || `order-${i}`,
      rawId: o._id,
      freelancerName: counterpartyName,
      freelancerRole: user?.role === 'client' ? 'Freelancer' : 'Client',
      avatarBg: getAvatarBg(i),
      initials: counterpartyName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
      projectTitle: o.gig?.title || 'Project',
      milestone: `Milestone ${currentMilestone} of ${totalMilestones}`,
      budget: `₹${Number(o.totalAmount || 0).toLocaleString('en-IN')}`,
      totalAmount: o.totalAmount,
      dueDate: milestones[currentMilestone - 1]?.dueDate
        ? new Date(milestones[currentMilestone - 1].dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : new Date(o.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      progress: o.status === 'completed' ? 100 : progress,
      paymentStatus: hasPendingMilestone ? 'Pending Release' : 'Escrow Funded',
      isUnpaid: hasPendingMilestone,
      status: o.status,
      rawStatus: o.status,
    };
  });

  // Proposals — real data mapped for display
  const allProposals = dashboardData.proposals.map((p: any, idx: number) => ({
    id: p._id || `prop-${idx}`,
    rawId: p._id,
    name: p.freelancer?.name || (p.gig?.client?.name || 'User'),
    price: `₹${(p.proposedPrice || 0).toLocaleString('en-IN')}`,
    priceNum: p.proposedPrice || 0,
    title: p.gig?.title || 'Project',
    avatarBg: getAvatarBg(idx),
    initials: ((p.freelancer?.name || p.gig?.client?.name || 'U')).split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
    skills: p.gig?.tags || [],
    coverLetter: p.coverLetter || '',
    timeline: `${p.estimatedDays || 7} days`,
    status: p.status,
    createdAt: p.createdAt,
  }));

  // Filtered Gigs for Projects Tab
  const filteredProjectsGigs = displayedGigs.filter((g: any) => {
    const matchesFilter = gigFilter === 'All'
      ? true
      : gigFilter === 'open'
        ? g.rawStatus === 'open' || g.status === 'Active Brief'
        : gigFilter === 'in-progress'
          ? g.rawStatus === 'in-progress' || g.status === 'In Progress'
          : gigFilter === 'completed'
            ? g.rawStatus === 'completed' || g.status === 'Completed'
            : g.rawStatus === 'closed' || g.status === 'Closed';
    const matchesSearch = g.title.toLowerCase().includes(gigSearch.toLowerCase()) ||
                          g.category.toLowerCase().includes(gigSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Filtered Proposals for Proposals Tab
  const filteredTabProposals = allProposals.filter((p: any) => {
    const matchesFilter = proposalFilter === 'All' ? true : p.status === proposalFilter;
    const matchesSearch = p.name.toLowerCase().includes(proposalSearch.toLowerCase()) ||
                          p.title.toLowerCase().includes(proposalSearch.toLowerCase()) ||
                          p.coverLetter.toLowerCase().includes(proposalSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Filtered Orders for Orders Tab
  const filteredTabOrders = displayedOrders.filter((o: any) => {
    const matchesFilter = orderFilter === 'All' ? true : o.rawStatus === orderFilter || o.status === orderFilter;
    const matchesSearch = o.projectTitle.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          o.freelancerName.toLowerCase().includes(orderSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredProposals = allProposals.filter((p: any) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const priorityProposals = filteredProposals.slice(0, 5);

  // ----------------------------------------------------
  // PAYMENTS — Derived from real orders & milestones
  // ----------------------------------------------------
  const pendingPaymentsFromOrders = dashboardData.orders
    .filter((o: any) => o.status === 'active')
    .flatMap((o: any, oi: number) => {
      const counterparty = user?.role === 'client'
        ? (o.freelancer?.name || `Creator ${oi + 1}`)
        : (o.client?.name || `Client ${oi + 1}`);
      return (o.milestones || [])
        .map((m: any, mi: number) => ({ m, mi }))
        .filter(({ m }: any) => m.status === 'pending')
        .map(({ m, mi }: any) => ({
          id: `pay-${o._id}-${mi}`,
          orderId: o._id,
          milestoneIndex: mi,
          freelancerName: counterparty,
          freelancerRole: 'Freelancer',
          avatarBg: getAvatarBg(oi),
          initials: counterparty.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
          projectName: o.gig?.title || 'Project',
          milestoneName: m.title || `Milestone ${mi + 1}`,
          amountDue: `₹${Number(m.amount || 0).toLocaleString('en-IN')}`,
          amountNum: m.amount || 0,
          dueDate: m.dueDate
            ? new Date(m.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'TBD',
          status: 'Awaiting Release',
          isOverdue: false,
        }));
    });

  const [pendingPaymentsList, setPendingPaymentsList] = useState<any[]>([]);

  // Sync pending payments from real data
  useEffect(() => {
    if (!dashboardData.loading && dashboardData.orders.length > 0) {
      setPendingPaymentsList(pendingPaymentsFromOrders);
    }
  }, [dashboardData.orders, dashboardData.loading]);

  const completedPaymentsFromOrders = dashboardData.orders
    .flatMap((o: any, oi: number) => {
      const counterparty = user?.role === 'client'
        ? (o.freelancer?.name || `Creator ${oi + 1}`)
        : (o.client?.name || `Client ${oi + 1}`);
      return (o.milestones || [])
        .filter((m: any) => m.status === 'paid' || m.status === 'approved')
        .map((m: any, mi: number) => ({
          id: `tx-${o._id}-${mi}`,
          freelancerName: counterparty,
          avatarBg: getAvatarBg(oi),
          initials: counterparty.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
          project: o.gig?.title || 'Project',
          milestone: m.title || `Milestone ${mi + 1}`,
          amount: `₹${Number(m.amount || 0).toLocaleString('en-IN')}`,
          amountNum: m.amount || 0,
          date: m.paidAt
            ? new Date(m.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'N/A',
          status: 'Paid' as const,
          receiptId: `REC-${(o._id || '').toString().slice(-4).toUpperCase()}${mi}`,
        }));
    });

  const [paymentHistoryList, setPaymentHistoryList] = useState<any[]>([]);

  useEffect(() => {
    if (!dashboardData.loading) {
      setPaymentHistoryList(completedPaymentsFromOrders);
    }
  }, [dashboardData.orders, dashboardData.loading]);

  const handlePayNow = async (pendingItem: any) => {
    try {
      if (pendingItem.orderId !== undefined && pendingItem.milestoneIndex !== undefined) {
        await api.post('/api/payments/verify', {
          orderId: pendingItem.orderId,
          milestoneIndex: pendingItem.milestoneIndex,
        });
        toast.success(`Payment of ${pendingItem.amountDue} successfully released to ${pendingItem.freelancerName}!`);
        dashboardData.refetch();
      } else {
        toast.success(`Payment of ${pendingItem.amountDue} released!`);
      }
      setPendingPaymentsList(prev => prev.filter(p => p.id !== pendingItem.id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment release failed. Please try again.');
    }
  };

  const filteredPaymentHistory = paymentHistoryList.filter(item => {
    const matchesFilter = paymentFilter === 'All' ? true : item.status === paymentFilter;
    const matchesSearch = item.freelancerName.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                          item.project.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                          item.receiptId.toLowerCase().includes(paymentSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // ----------------------------------------------------
  // REVIEWS & HISTORY — Derived from real reviews/orders
  // ----------------------------------------------------
  // Completed orders that user has NOT yet reviewed
  const reviewedOrderIds = new Set(
    dashboardData.reviews
      .filter((r: any) => (r.from?._id === user?.id || r.from === user?.id))
      .map((r: any) => r.order?._id || r.order)
      .filter(Boolean)
      .map((id: any) => id.toString())
  );

  const pendingReviewsFromOrders = dashboardData.orders
    .filter((o: any) => o.status === 'completed' && !reviewedOrderIds.has(o._id?.toString()))
    .map((o: any, i: number) => {
      const counterparty = user?.role === 'client'
        ? (o.freelancer?.name || `Creator ${i + 1}`)
        : (o.client?.name || `Client ${i + 1}`);
      return {
        id: o._id,
        freelancerName: counterparty,
        freelancerRole: 'Freelancer',
        avatarBg: getAvatarBg(i),
        initials: counterparty.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
        projectName: o.gig?.title || 'Project',
        completionDate: o.completedAt
          ? `Completed ${new Date(o.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          : 'Recently completed',
        budget: `₹${Number(o.totalAmount || 0).toLocaleString('en-IN')}`,
        deliverables: (o.milestones || []).map((m: any) => m.title),
        orderId: o._id,
      };
    });

  const [pendingReviewsList, setPendingReviewsList] = useState<any[]>([]);

  useEffect(() => {
    if (!dashboardData.loading) {
      setPendingReviewsList(pendingReviewsFromOrders);
    }
  }, [dashboardData.orders, dashboardData.reviews, dashboardData.loading]);

  // Reviews given mapped to completed projects view
  const completedProjectsFromReviews = dashboardData.reviews
    .filter((r: any) => r.from?._id === user?.id || r.from === user?.id)
    .map((r: any, i: number) => {
      const reviewer = r.to?.name || 'User';
      return {
        id: r._id || `review-${i}`,
        title: r.order?.gig?.title || 'Project',
        freelancerName: reviewer,
        avatarBg: getAvatarBg(i),
        initials: reviewer.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
        freelancerRole: 'Collaborator',
        budget: r.order?.totalAmount ? `₹${Number(r.order.totalAmount).toLocaleString('en-IN')}` : '—',
        completionDate: r.createdAt
          ? new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'N/A',
        ratingGiven: r.rating || 5,
        status: 'Completed',
        reviewText: r.comment || '',
      };
    });

  const [completedProjectsList, setCompletedProjectsList] = useState<any[]>([]);

  useEffect(() => {
    if (!dashboardData.loading) {
      setCompletedProjectsList(completedProjectsFromReviews);
    }
  }, [dashboardData.reviews, dashboardData.loading]);

  // Previous freelancers — from completed orders
  const previousFreelancers = (() => {
    const freelancerMap = new Map<string, any>();
    dashboardData.orders
      .filter((o: any) => o.status === 'completed')
      .forEach((o: any, i: number) => {
        const name = user?.role === 'client'
          ? (o.freelancer?.name || '')
          : (o.client?.name || '');
        if (!name) return;
        const id = (user?.role === 'client' ? o.freelancer?._id : o.client?._id) || name;
        const existing = freelancerMap.get(id);
        if (existing) {
          existing.projectsCount += 1;
          existing.totalPaidNum += (o.totalAmount || 0);
          existing.totalPaid = `₹${existing.totalPaidNum.toLocaleString('en-IN')}`;
        } else {
          freelancerMap.set(id, {
            name,
            role: 'Collaborator',
            avatarBg: getAvatarBg(i),
            initials: name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
            rating: '5.0',
            projectsCount: 1,
            totalPaidNum: o.totalAmount || 0,
            totalPaid: `₹${Number(o.totalAmount || 0).toLocaleString('en-IN')}`,
            skills: [],
          });
        }
      });
    return Array.from(freelancerMap.values());
  })();

  const handleOpenWriteReview = (project: any) => {
    setTargetReviewProject(project);
    setInputRating(5);
    setInputReviewText('');
    setWriteReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!inputReviewText.trim()) {
      toast.error('Please write a short review note.');
      return;
    }
    try {
      await api.post('/api/reviews', {
        orderId: targetReviewProject.orderId || targetReviewProject.id,
        rating: inputRating,
        comment: inputReviewText,
      });
      toast.success(`Review submitted for ${targetReviewProject.freelancerName}!`);
      setPendingReviewsList(prev => prev.filter(p => p.id !== targetReviewProject.id));
      setWriteReviewModalOpen(false);
      dashboardData.refetch();
    } catch {
      toast.error('Failed to submit review. Please try again.');
    }
  };

  const filteredHistoryProjects = completedProjectsList.filter(item => {
    const matchesFilter = historyFilter === 'All' ? true : item.status === historyFilter;
    const matchesSearch = item.title.toLowerCase().includes(historySearch.toLowerCase()) ||
                          item.freelancerName.toLowerCase().includes(historySearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const isFreelancer = user?.role === 'freelancer';

  const sidebarNavItems = isFreelancer
    ? [
        { name: 'Dashboard', label: 'Dashboard', icon: Sparkles },
        { name: 'Projects', label: 'My Services', icon: FolderKanban },
        { name: 'Proposals', label: 'Applications', icon: FileText },
        { name: 'Orders', label: 'Orders', icon: Package },
        { name: 'Messages', label: 'Messages', icon: MessageSquare },
        { name: 'Payments', label: 'Earnings & Payments', icon: CreditCard },
        { name: 'Reviews & History', label: 'Reviews & History', icon: Star },
      ]
    : [
        { name: 'Dashboard', label: 'Dashboard', icon: Sparkles },
        { name: 'Projects', label: 'Projects (My Gigs)', icon: FolderKanban },
        { name: 'Proposals', label: 'Proposals', icon: FileText },
        { name: 'Orders', label: 'Orders', icon: Package },
        { name: 'Messages', label: 'Messages', icon: MessageSquare },
        { name: 'Payments', label: 'Payments', icon: CreditCard },
        { name: 'Reviews & History', label: 'Reviews & History', icon: Star },
      ];

  const handleOpenEditGig = (gig: any) => {
    setEditingGig(gig);
    setEditGigTitle(gig.title || '');
    setEditGigCategory(gig.rawCategory || 'graphic-design');
    setEditGigBudget(String(gig.rawBudget || gig.budget?.replace(/[^0-9]/g, '') || ''));
    setEditGigStatus(gig.rawStatus || 'open');
    setEditGigModalOpen(true);
  };

  const handleSaveEditedGig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGig) return;
    setSavingGig(true);
    try {
      await api.put(`/api/gigs/${editingGig.id || editingGig.rawId}`, {
        title: editGigTitle,
        category: editGigCategory,
        budget: Number(editGigBudget),
        status: editGigStatus,
      });
      toast.success('Gig updated successfully!');
      setEditGigModalOpen(false);
      dashboardData.refetch();
    } catch {
      toast.error('Failed to update gig');
    } finally {
      setSavingGig(false);
    }
  };

  const handleDeleteGig = async (gigId: string) => {
    if (!window.confirm('Are you sure you want to delete this project brief? This action cannot be undone.')) return;
    try {
      await api.delete(`/api/gigs/${gigId}`);
      toast.success('Project brief deleted successfully');
      dashboardData.refetch();
    } catch {
      toast.error('Failed to delete gig');
    }
  };

  // Inbox threads — derived from proposals/orders counterparties (Messages tab is out of scope for backend integration)
  const inboxThreads = (() => {
    const threadsMap = new Map<string, any>();
    // Build from proposals
    dashboardData.proposals.forEach((p: any, i: number) => {
      const name = p.freelancer?.name || p.gig?.client?.name || '';
      if (!name || threadsMap.has(name)) return;
      threadsMap.set(name, {
        id: `thread-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name,
        role: 'Collaborator',
        avatarBg: getAvatarBg(i),
        initials: name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
        lastMessage: p.coverLetter ? p.coverLetter.slice(0, 80) + '...' : 'Sent a proposal',
        time: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
        unread: 0,
        online: false,
      });
    });
    // Build from orders
    dashboardData.orders.forEach((o: any, i: number) => {
      const name = user?.role === 'client' ? o.freelancer?.name : o.client?.name;
      if (!name || threadsMap.has(name)) return;
      threadsMap.set(name, {
        id: `thread-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name,
        role: 'Collaborator',
        avatarBg: getAvatarBg(i + 10),
        initials: name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
        lastMessage: `Working on: ${o.gig?.title || 'Project'}`,
        time: '',
        unread: 0,
        online: false,
      });
    });
    return Array.from(threadsMap.values());
  })();

  const handleInboxSendMessage = () => {
    const text = inboxChatInput.trim();
    if (!text || !selectedInboxThread) return;

    const threadId = selectedInboxThread.id;
    const newMsg = {
      id: `inbox-msg-${Date.now()}`,
      sender: 'me' as const,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatConversations(prev => ({
      ...prev,
      [threadId]: [...(prev[threadId] || []), newMsg]
    }));
    setInboxChatInput('');
  };

  const displayName = user?.name || 'Harshit';
  const userInitials = (user?.name || 'Harshit')
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'H';

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const currentDateFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date()).toUpperCase();

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
            <div
              className="w-10 h-10 rounded-[12px] text-[#18181B] font-bold font-clash flex items-center justify-center text-sm shadow-sm shrink-0 group-hover:scale-105 transition-transform overflow-hidden"
              style={{ backgroundColor: user?.avatarColor || '#22D3EE' }}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                userInitials
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white font-bold text-sm truncate leading-tight group-hover:text-white/95">
                {displayName}
              </span>
              <span className="text-white/50 text-xs truncate mt-0.5 font-medium group-hover:text-white/70">
                {user?.role === 'freelancer' ? 'Creator workspace' : 'Employer workspace'}
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col space-y-1.5" aria-label="Dashboard navigation">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => handleTabClick(item.name)}
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
                  <span className="truncate">{item.label || item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-1 px-1">
          <Link
            to="/gigs"
            className="flex items-center justify-between text-xs font-medium text-white/60 hover:text-white py-2 px-2 rounded-lg hover:bg-white/[0.04] transition-colors no-underline"
          >
            <span>Explore marketplace</span>
            <ExternalLink size={13} />
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
                  aria-label="Close navigation menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile User Identity */}
              <div
                onClick={() => {
                  navigate('/profile');
                  setSidebarOpen(false);
                }}
                className="bg-white/[0.06] border border-white/[0.08] hover:border-purple/40 hover:bg-white/[0.10] transition-all rounded-[18px] p-3.5 mb-6 flex items-center gap-3 cursor-pointer"
                title="View Profile"
              >
                <div
                  className="w-10 h-10 rounded-[12px] text-[#18181B] font-bold font-clash flex items-center justify-center text-sm overflow-hidden shrink-0"
                  style={{ backgroundColor: user?.avatarColor || '#22D3EE' }}
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    userInitials
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-white font-bold text-sm truncate">
                    {displayName}
                  </span>
                  <span className="text-white/50 text-xs truncate">
                    {user?.role === 'freelancer' ? 'Creator workspace' : 'Employer workspace'}
                  </span>
                </div>
              </div>

              {/* Mobile Nav Links */}
              <nav className="flex flex-col space-y-1.5">
                {sidebarNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        handleTabClick(item.name);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[14px] text-sm font-semibold transition-all cursor-pointer text-left ${
                        isActive
                          ? 'bg-gradient-to-r from-[#7C3AED] to-[#FF6B6B] text-white'
                          : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      <Icon size={17} />
                      <span className="truncate">{item.label || item.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-2">
              <Link
                to="/gigs"
                className="text-xs text-white/60 hover:text-white py-1 flex items-center justify-between no-underline"
                onClick={() => setSidebarOpen(false)}
              >
                <span>Explore public gigs</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          MAIN DASHBOARD WORKSPACE (Right Column)
          ==================================================== */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-paper">
        
        {/* TOP UTILITY BAR */}
        <header className="sticky top-0 z-20 bg-paper/90 backdrop-blur-md border-b border-border px-4 sm:px-6 md:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-[480px]">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-ink hover:bg-soft cursor-pointer border-0 bg-transparent"
              aria-label="Open sidebar navigation"
            >
              <Menu size={22} />
            </button>

            <div className="relative w-full max-w-[380px]">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search candidates, briefs, active projects…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-border rounded-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-ink placeholder:text-ink/30 shadow-[0_2px_8px_rgba(0,0,0,0.03)] focus:outline-none focus:border-purple/40 focus:ring-2 focus:ring-purple/10 transition-all"
              />
            </div>
          </div>

          {/* Right Action Icons & Avatar */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div ref={notificationsRef} className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-border flex items-center justify-center text-ink hover:border-purple/30 hover:bg-soft transition-all cursor-pointer shadow-xs"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell size={17} />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-coral ring-2 ring-white" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-border rounded-2xl shadow-xl p-4 z-40 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
                    <span className="font-bold text-xs uppercase tracking-wider text-ink">
                      Notifications
                    </span>
                    <span className="text-[11px] font-bold text-purple bg-purple/10 px-2 py-0.5 rounded-full">
                      {activities.length} Updates
                    </span>
                  </div>
                  <div className="space-y-2.5 max-h-72 overflow-y-auto">
                    {loadingActivities ? (
                      <div className="py-4 text-center text-xs text-ink/50">Loading notifications...</div>
                    ) : activities.length === 0 ? (
                      <div className="py-6 text-center text-xs text-ink/50">No notifications yet</div>
                    ) : (
                      activities.map((act: any) => (
                        <div key={act._id} className="p-2.5 rounded-xl bg-soft text-xs space-y-0.5">
                          <div className="font-bold text-ink">
                            {act.title}
                          </div>
                          <div className="text-ink/60 text-[11px]">
                            {act.description}
                          </div>
                          <div className="text-[10px] text-ink/40">
                            {new Date(act.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => handleTabClick('Messages')}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                activeTab === 'Messages'
                  ? 'bg-purple text-white border-purple'
                  : 'bg-white border-border text-ink hover:border-purple/30 hover:bg-soft'
              }`}
              title="Messages"
              aria-label="Messages"
            >
              <MessageSquare size={16} />
            </button>

            <button
              onClick={() => navigate('/post-gig')}
              className="btn-primary !py-2 sm:!py-2.5 !px-4 sm:!px-5 !text-xs sm:!text-sm"
            >
              <Plus size={15} className="stroke-[2.5]" />
              <span>{isFreelancer ? 'Create a Service' : 'Post a New Gig'}</span>
            </button>

            <div
              onClick={() => navigate('/profile')}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full text-ink font-clash font-bold flex items-center justify-center text-xs sm:text-sm border-2 border-white shadow-xs ring-1 ring-border hover:scale-105 hover:ring-purple/50 transition-all cursor-pointer overflow-hidden"
              style={{ backgroundColor: user?.avatarColor || '#22D3EE' }}
              title={`View ${displayName} Profile`}
              role="button"
              tabIndex={0}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                userInitials
              )}
            </div>
          </div>
        </header>

        {/* ====================================================
            MAIN WORKSPACE CONTENT ROUTING / TAB VIEWS
            ==================================================== */}
        <div className="flex-1 px-4 sm:px-6 md:px-8 py-8 max-w-[1400px] w-full mx-auto space-y-9">

          {/* ====================================================
              VIEW A: MESSAGES INBOX VIEW
              ==================================================== */}
          {activeTab === 'Messages' ? (
            <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-5">
                <div>
                  <span className="eyebrow text-purple mb-1 block">DIRECT MESSAGES</span>
                  <h1 className="font-display text-3xl font-extrabold text-ink tracking-tight">
                    Messages
                  </h1>
                </div>
                <button
                  onClick={() => handleTabClick('Dashboard')}
                  className="btn-secondary !py-2 !px-4 !text-xs"
                >
                  ← Back to Dashboard
                </button>
              </div>

              <div className="flex-1 flex rounded-[24px] border border-border bg-white shadow-xs overflow-hidden min-h-0">
                {/* Left: Threads */}
                <div className="w-full sm:w-[340px] lg:w-[380px] border-r border-border flex flex-col shrink-0">
                  <div className="p-4 border-b border-border">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search conversations..."
                        className="w-full bg-soft border border-border rounded-full pl-8 pr-4 py-2 text-xs font-medium text-ink focus:outline-none focus:border-purple transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {inboxThreads.map((thread) => (
                      <button
                        key={thread.id}
                        onClick={() => setSelectedInboxThread(thread)}
                        className={`w-full p-4 flex items-start gap-3.5 border-b border-border/50 text-left transition-colors cursor-pointer ${
                          selectedInboxThread?.id === thread.id
                            ? 'bg-purple/5'
                            : 'hover:bg-soft/60'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-[14px] flex items-center justify-center font-clash font-bold text-xs text-ink shrink-0"
                          style={{ backgroundColor: thread.avatarBg }}
                        >
                          {thread.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-ink truncate">{thread.name}</span>
                            <span className="text-[11px] text-ink/40 font-medium shrink-0">{thread.time}</span>
                          </div>
                          <p className="text-xs text-ink/60 truncate mt-0.5">{thread.lastMessage}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Message Window */}
                <div className="hidden sm:flex flex-1 flex-col bg-paper">
                  {selectedInboxThread ? (
                    <>
                      <div className="p-4 border-b border-border bg-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-clash font-bold text-xs text-ink"
                            style={{ backgroundColor: selectedInboxThread.avatarBg }}
                          >
                            {selectedInboxThread.initials}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-ink">{selectedInboxThread.name}</h3>
                            <p className="text-xs text-ink/50">{selectedInboxThread.role}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const p = allProposals.find(pr => pr.name === selectedInboxThread.name) || allProposals[0];
                            if (p) {
                              setSelectedProposal(p);
                              setProposalModalOpen(true);
                            } else {
                              toast.info('No proposal details attached to this thread.');
                            }
                          }}
                          className="btn-primary !py-1.5 !px-4 !text-xs"
                        >
                          View Brief & Proposal
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {(chatConversations[selectedInboxThread.id] || []).map((msg) => {
                          const isMe = msg.sender === 'me';
                          return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                                isMe
                                  ? 'gradient-primary text-white rounded-br-xs'
                                  : 'bg-white text-ink border border-border rounded-bl-xs shadow-xs'
                              }`}>
                                <p>{msg.text}</p>
                                <span className={`text-[10px] mt-1 block text-right ${isMe ? 'text-white/70' : 'text-ink/40'}`}>
                                  {msg.time}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="p-4 bg-white border-t border-border">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleInboxSendMessage();
                          }}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="text"
                            value={inboxChatInput}
                            onChange={(e) => setInboxChatInput(e.target.value)}
                            placeholder={`Message ${selectedInboxThread.name}...`}
                            className="flex-1 bg-soft border border-border rounded-full px-4 py-2.5 text-xs text-ink focus:outline-none focus:border-purple"
                          />
                          <button
                            type="submit"
                            disabled={!inboxChatInput.trim()}
                            className="btn-primary !py-2.5 !px-4 !text-xs"
                          >
                            <Send size={14} />
                          </button>
                        </form>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-center p-6 text-ink/40 text-xs">
                      Select a conversation on the left to start messaging
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'Payments' ? (
            /* ====================================================
                VIEW B: PAYMENTS CONTROL CENTER
                ==================================================== */
            isFreelancer ? (
              <div className="space-y-8 animate-in fade-in duration-200">
                {/* Freelancer Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div>
                    <span className="eyebrow text-purple mb-1 block">FINANCIAL CONTROL CENTER</span>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
                      Earnings & Payments
                    </h1>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200/50">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>GigMatch Escrow Guaranteed</span>
                  </div>
                </div>

                {/* Freelancer 4 Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                  {/* 1. Total Earnings */}
                  <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="eyebrow text-ink/50">Total Earnings</span>
                      <div className="w-8 h-8 rounded-xl bg-purple/15 flex items-center justify-center text-purple">
                        <CreditCard size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2">
                        ₹{dashboardData.completedPayments.toLocaleString('en-IN')}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <ShieldCheck size={13} />
                        <span>Escrow released</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Pending Earnings */}
                  <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="eyebrow text-ink/50">Pending Earnings</span>
                      <div className="w-8 h-8 rounded-xl bg-coral/15 flex items-center justify-center text-coral">
                        <Clock size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2 flex items-center gap-2">
                        <span>₹{dashboardData.pendingPayments.toLocaleString('en-IN')}</span>
                        {pendingPaymentsList.length > 0 && (
                          <span className="text-xs font-bold text-coral bg-coral/10 px-2 py-0.5 rounded-full font-sans">
                            {pendingPaymentsList.length} In Sprint
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-coral">
                        <AlertCircle size={13} />
                        <span>Milestones awaiting sign-off</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Released Payments */}
                  <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="eyebrow text-ink/50">Released Payments</span>
                      <div className="w-8 h-8 rounded-xl bg-cyan/15 flex items-center justify-center text-cyan">
                        <CheckCircle2 size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2">
                        {paymentHistoryList.length} Payouts
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <ShieldCheck size={13} />
                        <span>{paymentHistoryList.length} payouts settled</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Active Contracts */}
                  <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="eyebrow text-ink/50">Active Contracts</span>
                      <div className="w-8 h-8 rounded-xl bg-orange/15 flex items-center justify-center text-orange">
                        <Briefcase size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2">
                        {displayedOrders.filter(o => o.status === 'active').length.toString().padStart(2, '0')} Contracts
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-ink/70">
                        <Lock size={13} className="text-emerald-600" />
                        <span>100% Escrow protected</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Priority Section: Pending Milestone Payouts */}
                <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-coral animate-pulse" />
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                          Pending Milestone Payouts
                        </h2>
                      </div>
                      <p className="text-xs sm:text-sm text-ink/50 font-medium mt-1">
                        Milestones currently active or submitted awaiting hirer sign-off.
                      </p>
                    </div>
                    <span className="bg-coral/10 text-coral text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {pendingPaymentsList.length} PENDING
                    </span>
                  </div>

                  {pendingPaymentsList.length > 0 ? (
                    <div className="space-y-3.5">
                      {pendingPaymentsList.map((item) => (
                        <div
                          key={item.id}
                          className="bg-coral/[0.03] rounded-[22px] p-5 border border-coral/25 hover:border-coral/40 hover:bg-white hover:shadow-[0_8px_30px_rgba(255,107,107,0.08)] transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3.5 min-w-0 flex-1">
                            <div
                              className="w-12 h-12 rounded-[16px] flex items-center justify-center font-clash font-bold text-base text-ink shrink-0 shadow-xs ring-2 ring-white"
                              style={{ backgroundColor: item.avatarBg }}
                            >
                              {item.initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-base text-ink">{item.freelancerName}</h3>
                                <span className="text-xs text-ink/50">(Hirer)</span>
                                <span className="bg-coral/15 text-coral text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                                  Awaiting Client Sign-Off
                                </span>
                              </div>
                              <p className="text-sm font-bold text-ink mt-1">
                                {item.projectName}
                              </p>
                              <p className="text-xs text-ink/60 font-medium mt-0.5">
                                {item.milestoneName} · Due: {item.dueDate}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/40">
                            <div className="text-left lg:text-right">
                              <span className="text-[11px] font-bold text-ink/40 uppercase tracking-wider block">Payout Due</span>
                              <span className="font-display font-extrabold text-2xl text-ink leading-tight block text-coral">
                                {item.amountDue}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                setSelectedWorkspaceOrder({
                                  title: item.projectName,
                                  collaborator: item.freelancerName,
                                  dueDate: item.dueDate,
                                  budget: item.amountDue,
                                  progress: 50,
                                  status: 'Active Sprint'
                                });
                                setWorkspaceModalOpen(true);
                              }}
                              className="btn-secondary !py-2 !px-4 !text-xs"
                            >
                              <FileCheck2 size={14} />
                              <span>View Workspace</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-soft/40 rounded-2xl border border-dashed border-border text-ink/50 text-xs">
                      No pending payouts currently.
                    </div>
                  )}
                </section>

                {/* Completed Payments Table */}
                <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                        Payment & Earnings History
                      </h2>
                      <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                        Complete ledger of all released milestone payments and transaction receipts.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(['All', 'Paid', 'Pending', 'Refunded'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setPaymentFilter(filter)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                            paymentFilter === filter
                              ? 'gradient-primary text-white border-transparent shadow-xs'
                              : 'bg-white text-ink/70 border-border hover:border-purple/30'
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="relative max-w-sm">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
                      <input
                        type="text"
                        placeholder="Search by hirer, project, receipt..."
                        value={paymentSearch}
                        onChange={(e) => setPaymentSearch(e.target.value)}
                        className="w-full bg-soft border border-border rounded-full pl-9 pr-4 py-2 text-xs font-medium text-ink focus:outline-none focus:border-purple"
                      />
                    </div>
                  </div>

                  {filteredPaymentHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-ink/40">
                            <th className="pb-3 px-3">Hirer</th>
                            <th className="pb-3 px-3">Project & Milestone</th>
                            <th className="pb-3 px-3">Amount</th>
                            <th className="pb-3 px-3">Payout Date</th>
                            <th className="pb-3 px-3">Status</th>
                            <th className="pb-3 px-3 text-right">Receipt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50 text-xs font-medium text-ink">
                          {filteredPaymentHistory.map((row) => (
                            <tr key={row.id} className="hover:bg-soft/50 transition-colors">
                              <td className="py-4 px-3">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center font-clash font-bold text-xs text-ink"
                                    style={{ backgroundColor: row.avatarBg }}
                                  >
                                    {row.initials}
                                  </div>
                                  <span className="font-bold text-sm text-ink">{row.freelancerName}</span>
                                </div>
                              </td>
                              <td className="py-4 px-3">
                                <div className="font-bold text-ink">{row.project}</div>
                                <div className="text-[11px] text-ink/50">{row.milestone}</div>
                              </td>
                              <td className="py-4 px-3 font-display font-bold text-sm text-ink">
                                {row.amount}
                              </td>
                              <td className="py-4 px-3 text-ink/60">
                                {row.date}
                              </td>
                              <td className="py-4 px-3">
                                <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200/50">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Released
                                </span>
                              </td>
                              <td className="py-4 px-3 text-right">
                                <button
                                  onClick={() => toast.success(`Receipt ${row.receiptId} downloaded successfully.`)}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-purple hover:underline cursor-pointer bg-transparent border-0"
                                >
                                  <Download size={13} />
                                  <span>{row.receiptId}</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 px-6 text-center space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-purple/10 text-purple flex items-center justify-center mx-auto">
                        <Receipt size={28} />
                      </div>
                      <div className="max-w-md mx-auto">
                        <h3 className="font-display font-bold text-base text-ink mb-1">
                          No payment history available
                        </h3>
                        <p className="text-xs text-ink/50 leading-relaxed">
                          Your earnings ledger will appear here once milestone payments are released by hirers.
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            ) : (
              /* HIRER PAYMENTS VIEW - 100% UNCHANGED */
              <div className="space-y-8 animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div>
                    <span className="eyebrow text-purple mb-1 block">FINANCIAL CONTROL CENTER</span>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
                      Payments & Escrow
                    </h1>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200/50">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>GigMatch Escrow Guaranteed</span>
                  </div>
                </div>

                {/* 4 Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                  {/* 1. Total Spending */}
                  <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="eyebrow text-ink/50">Total Spending</span>
                      <div className="w-8 h-8 rounded-xl bg-purple/15 flex items-center justify-center text-purple">
                        <CreditCard size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2">
                        ₹{dashboardData.totalSpending.toLocaleString('en-IN')}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-purple">
                        <TrendingUp size={13} />
                        <span>+18% this quarter</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Pending Payments */}
                  <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="eyebrow text-ink/50">Pending Payments</span>
                      <div className="w-8 h-8 rounded-xl bg-coral/15 flex items-center justify-center text-coral">
                        <Clock size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2 flex items-center gap-2">
                        <span>₹{dashboardData.pendingPayments.toLocaleString('en-IN')}</span>
                        {pendingPaymentsList.length > 0 && (
                          <span className="text-xs font-bold text-coral bg-coral/10 px-2 py-0.5 rounded-full font-sans">
                            {pendingPaymentsList.length} Action Due
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-coral">
                        <AlertCircle size={13} />
                        <span>Milestones awaiting sign-off</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Completed Payments */}
                  <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="eyebrow text-ink/50">Completed Payments</span>
                      <div className="w-8 h-8 rounded-xl bg-cyan/15 flex items-center justify-center text-cyan">
                        <CheckCircle2 size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2">
                        ₹{dashboardData.completedPayments.toLocaleString('en-IN')}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <ShieldCheck size={13} />
                        <span>{paymentHistoryList.length} milestones released</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Active Contracts */}
                  <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="eyebrow text-ink/50">Active Contracts</span>
                      <div className="w-8 h-8 rounded-xl bg-orange/15 flex items-center justify-center text-orange">
                        <Briefcase size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2">
                        {displayedOrders.filter(o => o.status === 'active').length.toString().padStart(2, '0')} Contracts
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-ink/70">
                        <Lock size={13} className="text-emerald-600" />
                        <span>100% Escrow protected</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Priority Section: Pending Payments */}
                <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-coral animate-pulse" />
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                          Pending Payments Requiring Approval
                        </h2>
                      </div>
                      <p className="text-xs sm:text-sm text-ink/50 font-medium mt-1">
                        Deliverables submitted for completed milestones. Review and release escrow funds.
                      </p>
                    </div>
                    <span className="bg-coral/10 text-coral text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {pendingPaymentsList.length} PENDING
                    </span>
                  </div>

                  {pendingPaymentsList.length > 0 ? (
                    <div className="space-y-3.5">
                      {pendingPaymentsList.map((item) => (
                        <div
                          key={item.id}
                          className="bg-coral/[0.03] rounded-[22px] p-5 border border-coral/25 hover:border-coral/40 hover:bg-white hover:shadow-[0_8px_30px_rgba(255,107,107,0.08)] transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3.5 min-w-0 flex-1">
                            <div
                              className="w-12 h-12 rounded-[16px] flex items-center justify-center font-clash font-bold text-base text-ink shrink-0 shadow-xs ring-2 ring-white"
                              style={{ backgroundColor: item.avatarBg }}
                            >
                              {item.initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-base text-ink">{item.freelancerName}</h3>
                                <span className="text-xs text-ink/50">({item.freelancerRole})</span>
                                <span className="bg-coral/15 text-coral text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                                  {item.status}
                                </span>
                              </div>
                              <p className="text-sm font-bold text-ink mt-1">
                                {item.projectName}
                              </p>
                              <p className="text-xs text-ink/60 font-medium mt-0.5">
                                {item.milestoneName} · Due: {item.dueDate}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/40">
                            <div className="text-left lg:text-right">
                              <span className="text-[11px] font-bold text-ink/40 uppercase tracking-wider block">Amount Due</span>
                              <span className="font-display font-extrabold text-2xl text-ink leading-tight block text-coral">
                                {item.amountDue}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedWorkspaceOrder({
                                    title: item.projectName,
                                    collaborator: item.freelancerName,
                                    dueDate: item.dueDate,
                                    budget: item.amountDue,
                                    progress: 100,
                                    status: 'Deliverables Ready'
                                  });
                                  setWorkspaceModalOpen(true);
                                }}
                                className="btn-secondary !py-2 !px-3.5 !text-xs"
                              >
                                <FileCheck2 size={14} />
                                <span>View Deliverables</span>
                              </button>
                              <button
                                onClick={() => handlePayNow(item)}
                                className="btn-primary !py-2 !px-5 !text-xs"
                              >
                                <ShieldCheck size={14} />
                                <span>Pay Now</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-soft/40 rounded-2xl border border-dashed border-border text-ink/50 text-xs">
                      All milestone payments are currently up to date. Zero pending approvals.
                    </div>
                  )}
                </section>

                {/* Payment History Section */}
                <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                        Payment & Invoice History
                      </h2>
                      <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                        Detailed ledger of all escrow transactions, released milestones, and receipts.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(['All', 'Paid', 'Pending', 'Refunded'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setPaymentFilter(filter)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                            paymentFilter === filter
                              ? 'gradient-primary text-white border-transparent shadow-xs'
                              : 'bg-white text-ink/70 border-border hover:border-purple/30'
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="relative max-w-sm">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
                      <input
                        type="text"
                        placeholder="Search by freelancer, project, receipt..."
                        value={paymentSearch}
                        onChange={(e) => setPaymentSearch(e.target.value)}
                        className="w-full bg-soft border border-border rounded-full pl-9 pr-4 py-2 text-xs font-medium text-ink focus:outline-none focus:border-purple"
                      />
                    </div>
                  </div>

                  {filteredPaymentHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-ink/40">
                            <th className="pb-3 px-3">Freelancer</th>
                            <th className="pb-3 px-3">Project & Milestone</th>
                            <th className="pb-3 px-3">Amount</th>
                            <th className="pb-3 px-3">Payment Date</th>
                            <th className="pb-3 px-3">Status</th>
                            <th className="pb-3 px-3 text-right">Receipt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50 text-xs font-medium text-ink">
                          {filteredPaymentHistory.map((row) => (
                            <tr key={row.id} className="hover:bg-soft/50 transition-colors">
                              <td className="py-4 px-3">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center font-clash font-bold text-xs text-ink"
                                    style={{ backgroundColor: row.avatarBg }}
                                  >
                                    {row.initials}
                                  </div>
                                  <span className="font-bold text-sm text-ink">{row.freelancerName}</span>
                                </div>
                              </td>
                              <td className="py-4 px-3">
                                <div className="font-bold text-ink">{row.project}</div>
                                <div className="text-[11px] text-ink/50">{row.milestone}</div>
                              </td>
                              <td className="py-4 px-3 font-display font-bold text-sm text-ink">
                                {row.amount}
                              </td>
                              <td className="py-4 px-3 text-ink/60">
                                {row.date}
                              </td>
                              <td className="py-4 px-3">
                                <span className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-full border ${
                                  row.status === 'Paid'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                                    : row.status === 'Refunded'
                                    ? 'bg-gray-100 text-gray-700 border-gray-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    row.status === 'Paid' ? 'bg-emerald-500' : 'bg-gray-500'
                                  }`} />
                                  {row.status}
                                </span>
                              </td>
                              <td className="py-4 px-3 text-right">
                                <button
                                  onClick={() => toast.success(`Receipt ${row.receiptId} downloaded successfully.`)}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-purple hover:underline cursor-pointer bg-transparent border-0"
                                >
                                  <Download size={13} />
                                  <span>{row.receiptId}</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 px-6 text-center space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-purple/10 text-purple flex items-center justify-center mx-auto">
                        <Receipt size={28} />
                      </div>
                      <div className="max-w-md mx-auto">
                        <h3 className="font-display font-bold text-base text-ink mb-1">
                          No transactions found
                        </h3>
                        <p className="text-xs text-ink/50 leading-relaxed">
                          Your payment activity will appear here once you start working with freelancers.
                        </p>
                      </div>
                    </div>
                  )}
                </section>

                {/* Contract Overview Section */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                  <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan/15 text-cyan flex items-center justify-center shrink-0">
                      <Briefcase size={22} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-ink/40 block">Active Contract Count</span>
                      <span className="font-display font-bold text-xl text-ink">{displayedOrders.filter(o => o.status === 'active').length} Active Contracts</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple/15 text-purple flex items-center justify-center shrink-0">
                      <Layers size={22} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-ink/40 block">Upcoming Milestones</span>
                      <span className="font-display font-bold text-xl text-ink">{pendingPaymentsList.length} Milestones Pending</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-ink/40 block">Next Scheduled Payment</span>
                      <span className="font-display font-bold text-xl text-ink">
                        {pendingPaymentsList.length > 0 ? `${pendingPaymentsList[0].amountDue} due ${pendingPaymentsList[0].dueDate}` : 'None scheduled'}
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            )
          ) : activeTab === 'Reviews & History' ? (
            /* ====================================================
                VIEW C: REVIEWS & HISTORY HUB
                ==================================================== */
            isFreelancer ? (
              <div className="space-y-8 animate-in fade-in duration-200">
                {/* Freelancer Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div>
                    <span className="eyebrow text-purple mb-1 block">TRUST & REPUTATION HUB</span>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
                      Reviews & Work History
                    </h1>
                  </div>
                </div>

                {/* Freelancer 4 Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                  <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="eyebrow text-ink/50">Completed Projects</span>
                      <div className="w-8 h-8 rounded-xl bg-purple/15 flex items-center justify-center text-purple">
                        <FolderKanban size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2">
                        {dashboardData.completedOrders} Delivered
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 size={13} />
                        <span>{dashboardData.completedOrders > 0 ? 'All milestones delivered' : 'No completed projects yet'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="eyebrow text-ink/50">Reviews Received</span>
                      <div className="w-8 h-8 rounded-xl bg-cyan/15 flex items-center justify-center text-cyan">
                        <Star size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2">
                        {dashboardData.reviews.length} Reviews
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan">
                        <ThumbsUp size={13} />
                        <span>{dashboardData.reviews.length > 0 ? 'Verified client ratings' : 'No reviews received yet'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="eyebrow text-ink/50">Average Rating</span>
                      <div className="w-8 h-8 rounded-xl bg-coral/15 flex items-center justify-center text-coral">
                        <Star size={16} className="fill-coral text-coral" />
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2">
                        {dashboardData.reviews.length > 0 ? (dashboardData.reviews.reduce((sum: number, p: any) => sum + (p.rating || 0), 0) / dashboardData.reviews.length).toFixed(1) + ' ★' : 'No ratings yet'}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-coral">
                        <span>Across {dashboardData.reviews.length} reviews</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="eyebrow text-ink/50">Client Collaborators</span>
                      <div className="w-8 h-8 rounded-xl bg-orange/15 flex items-center justify-center text-orange">
                        <RotateCcw size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2">
                        {new Set(displayedOrders.map(o => o.freelancerName)).size} Hirers
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <Heart size={13} className="text-coral" />
                        <span>Work history partners</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client Reviews Section */}
                <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple animate-pulse" />
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                          Client Reviews & Testimonials
                        </h2>
                      </div>
                      <p className="text-xs sm:text-sm text-ink/50 font-medium mt-1">
                        Authentic feedback and ratings from hirers on delivered contracts.
                      </p>
                    </div>
                    <span className="bg-purple/10 text-purple text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {dashboardData.reviews.length} REVIEWS
                    </span>
                  </div>

                  {dashboardData.reviews && dashboardData.reviews.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dashboardData.reviews.map((rev: any, idx: number) => {
                        const authorName = rev.from?.name || 'Client';
                        const authorInitials = authorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                        return (
                          <div
                            key={rev._id || idx}
                            className="bg-soft/60 rounded-[22px] p-5 border border-purple/20 hover:border-purple/40 hover:bg-white hover:shadow-[0_8px_30px_rgba(124,58,237,0.06)] transition-all duration-200 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-11 h-11 rounded-[14px] flex items-center justify-center font-clash font-bold text-sm text-ink shrink-0 shadow-xs ring-2 ring-white"
                                    style={{ backgroundColor: rev.from?.avatarColor || getAvatarBg(idx) }}
                                  >
                                    {authorInitials}
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-base text-ink">{authorName}</h3>
                                    <p className="text-xs text-ink/50">Hirer / Client</p>
                                  </div>
                                </div>
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/50">
                                  <Star size={12} className="fill-amber-500 text-amber-500" />
                                  {rev.rating || 5}.0 ★
                                </span>
                              </div>

                              <p className="text-xs sm:text-sm text-ink/75 italic mt-3 bg-white/80 p-3.5 rounded-xl border border-border/50 leading-relaxed">
                                "{rev.comment || 'Excellent collaboration, responsive communication, and exceptional deliverable quality.'}"
                              </p>
                            </div>

                            <div className="pt-3 border-t border-border/40 mt-3 flex items-center justify-between text-xs text-ink/50">
                              <span>Project: <strong className="text-ink">{rev.order?.gig?.title || 'Contract'}</strong></span>
                              <span>{rev.createdAt ? new Date(rev.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-soft/40 rounded-2xl border border-dashed border-border text-ink/50 text-xs">
                      No reviews received yet. Reviews will appear here once contracts are completed and evaluated by hirers.
                    </div>
                  )}
                </section>

                {/* Completed Projects History Table */}
                <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                        Completed Projects History
                      </h2>
                      <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                        Archived deliverables, verified payouts, and milestone completion logs.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(['All', 'Completed', 'In Progress', 'Cancelled'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setHistoryFilter(filter)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                            historyFilter === filter
                              ? 'gradient-primary text-white border-transparent shadow-xs'
                              : 'bg-white text-ink/70 border-border hover:border-purple/30'
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="relative max-w-sm">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
                      <input
                        type="text"
                        placeholder="Search completed projects or hirers..."
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="w-full bg-soft border border-border rounded-full pl-9 pr-4 py-2 text-xs font-medium text-ink focus:outline-none focus:border-purple"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-ink/40">
                          <th className="pb-3 px-3">Project Title</th>
                          <th className="pb-3 px-3">Hirer</th>
                          <th className="pb-3 px-3">Contract Amount</th>
                          <th className="pb-3 px-3">Completed Date</th>
                          <th className="pb-3 px-3">Status</th>
                          <th className="pb-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50 text-xs font-medium text-ink">
                        {filteredHistoryProjects.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-10 text-center text-ink/50">
                              No completed contracts in archive.
                            </td>
                          </tr>
                        ) : (
                          filteredHistoryProjects.map((row) => (
                            <tr key={row.id} className="hover:bg-soft/50 transition-colors">
                              <td className="py-4 px-3">
                                <div className="font-bold text-sm text-ink">{row.title}</div>
                                <span className="text-[11px] text-ink/50">{row.freelancerRole}</span>
                              </td>
                              <td className="py-4 px-3">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center font-clash font-bold text-xs text-ink"
                                    style={{ backgroundColor: row.avatarBg }}
                                  >
                                    {row.initials}
                                  </div>
                                  <span className="font-bold text-ink">{row.freelancerName}</span>
                                </div>
                              </td>
                              <td className="py-4 px-3 font-display font-bold text-sm text-ink">
                                {row.budget}
                              </td>
                              <td className="py-4 px-3 text-ink/60">
                                {row.completionDate}
                              </td>
                              <td className="py-4 px-3">
                                <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200/50">
                                  <CheckCircle2 size={12} className="text-emerald-600" />
                                  Delivered
                                </span>
                              </td>
                              <td className="py-4 px-3 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedWorkspaceOrder({
                                      title: row.title,
                                      collaborator: row.freelancerName,
                                      dueDate: row.completionDate,
                                      budget: row.budget,
                                      progress: 100,
                                      status: 'Completed'
                                    });
                                    setWorkspaceModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-purple hover:underline cursor-pointer bg-transparent border-0"
                                >
                                  <span>View Project</span>
                                  <ArrowUpRight size={13} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            ) : (
              /* HIRER REVIEWS VIEW - 100% UNCHANGED */
              <div className="space-y-8 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div>
                    <span className="eyebrow text-purple mb-1 block">TRUST & RELATIONSHIP HUB</span>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
                      Reviews & Project History
                    </h1>
                  </div>
                </div>

                {/* 4 Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                  <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="eyebrow text-ink/50">Completed Projects</span>
                      <div className="w-8 h-8 rounded-xl bg-purple/15 flex items-center justify-center text-purple">
                        <FolderKanban size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2">
                        {dashboardData.completedOrders} Delivered
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 size={13} />
                        <span>{dashboardData.completedOrders > 0 ? 'All milestones delivered' : 'No completed projects yet'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="eyebrow text-ink/50">Reviews Given</span>
                      <div className="w-8 h-8 rounded-xl bg-cyan/15 flex items-center justify-center text-cyan">
                        <Star size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2">
                        {completedProjectsList.length} Reviews
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan">
                        <ThumbsUp size={13} />
                        <span>{dashboardData.completedOrders > 0 ? `${Math.round((completedProjectsList.length / Math.max(dashboardData.completedOrders, 1)) * 100)}% review completion rate` : 'No reviews yet'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="eyebrow text-ink/50">Avg Freelancer Rating</span>
                      <div className="w-8 h-8 rounded-xl bg-coral/15 flex items-center justify-center text-coral">
                        <Star size={16} className="fill-coral text-coral" />
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2">
                        {completedProjectsList.length > 0 ? (completedProjectsList.reduce((sum: number, p: any) => sum + (p.ratingGiven || 0), 0) / completedProjectsList.length).toFixed(1) : '—'} ★
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-coral">
                        <span>Across {dashboardData.completedOrders} contracts</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="eyebrow text-ink/50">Repeat Hires</span>
                      <div className="w-8 h-8 rounded-xl bg-orange/15 flex items-center justify-center text-orange">
                        <RotateCcw size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2">
                        {previousFreelancers.length} Creators
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <Heart size={13} className="text-coral" />
                        <span>{previousFreelancers.filter(f => f.projectsCount > 1).length > 0 ? `${previousFreelancers.filter(f => f.projectsCount > 1).length} repeat hires` : 'Building relationships'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Priority Section: Pending Reviews */}
                <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-coral animate-pulse" />
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                          Pending Reviews Requiring Feedback
                        </h2>
                      </div>
                      <p className="text-xs sm:text-sm text-ink/50 font-medium mt-1">
                        Help creators grow by rating completed contracts and deliverables.
                      </p>
                    </div>
                    <span className="bg-purple/10 text-purple text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {pendingReviewsList.length} PENDING
                    </span>
                  </div>

                  {pendingReviewsList.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pendingReviewsList.map((item) => (
                        <div
                          key={item.id}
                          className="bg-soft/60 rounded-[22px] p-5 border border-purple/20 hover:border-purple/40 hover:bg-white hover:shadow-[0_8px_30px_rgba(124,58,237,0.06)] transition-all duration-200 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-11 h-11 rounded-[14px] flex items-center justify-center font-clash font-bold text-sm text-ink shrink-0 shadow-xs ring-2 ring-white"
                                  style={{ backgroundColor: item.avatarBg }}
                                >
                                  {item.initials}
                                </div>
                                <div>
                                  <h3 className="font-bold text-base text-ink">{item.freelancerName}</h3>
                                  <p className="text-xs text-ink/50">{item.freelancerRole}</p>
                                </div>
                              </div>
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/40">
                                {item.completionDate}
                              </span>
                            </div>

                            <h4 className="font-bold text-sm text-ink mt-3 mb-1">
                              {item.projectName}
                            </h4>
                            <p className="text-xs text-ink/60 font-medium mb-3">
                              Total Contract Value: <strong className="text-ink">{item.budget}</strong>
                            </p>

                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {item.deliverables.map((deliv: string, i: number) => (
                                <span key={i} className="text-[10px] bg-white border border-border/80 text-ink/70 px-2 py-0.5 rounded-md font-medium">
                                  ✓ {deliv}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                            <button
                              onClick={() => {
                                setSelectedWorkspaceOrder({
                                  title: item.projectName,
                                  collaborator: item.freelancerName,
                                  dueDate: item.completionDate,
                                  budget: item.budget,
                                  progress: 100,
                                  status: 'Completed'
                                });
                                setWorkspaceModalOpen(true);
                              }}
                              className="btn-secondary !py-2 !px-3.5 !text-xs"
                            >
                              <Eye size={13} />
                              <span>View Project</span>
                            </button>
                            <button
                              onClick={() => handleOpenWriteReview(item)}
                              className="btn-primary !py-2 !px-4 !text-xs"
                            >
                              <Star size={13} />
                              <span>Write Review</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-soft/40 rounded-2xl border border-dashed border-border text-ink/50 text-xs">
                      All completed milestones have been reviewed! Excellent work.
                    </div>
                  )}
                </section>

                {/* Completed Projects History Table */}
                <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                        Completed Projects History
                      </h2>
                      <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                        Archived project deliverables, ratings, and contract feedback.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(['All', 'Completed', 'In Progress', 'Cancelled'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setHistoryFilter(filter)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                            historyFilter === filter
                              ? 'gradient-primary text-white border-transparent shadow-xs'
                              : 'bg-white text-ink/70 border-border hover:border-purple/30'
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="relative max-w-sm">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
                      <input
                        type="text"
                        placeholder="Search completed projects or creators..."
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="w-full bg-soft border border-border rounded-full pl-9 pr-4 py-2 text-xs font-medium text-ink focus:outline-none focus:border-purple"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-ink/40">
                          <th className="pb-3 px-3">Project Title</th>
                          <th className="pb-3 px-3">Freelancer</th>
                          <th className="pb-3 px-3">Budget</th>
                          <th className="pb-3 px-3">Completed On</th>
                          <th className="pb-3 px-3">Rating Given</th>
                          <th className="pb-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50 text-xs font-medium text-ink">
                        {filteredHistoryProjects.map((row) => (
                          <tr key={row.id} className="hover:bg-soft/50 transition-colors">
                            <td className="py-4 px-3">
                              <div className="font-bold text-sm text-ink">{row.title}</div>
                              <span className="text-[11px] text-ink/50">{row.freelancerRole}</span>
                            </td>
                            <td className="py-4 px-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-7 h-7 rounded-lg flex items-center justify-center font-clash font-bold text-xs text-ink"
                                  style={{ backgroundColor: row.avatarBg }}
                                >
                                  {row.initials}
                                </div>
                                <span className="font-bold text-ink">{row.freelancerName}</span>
                              </div>
                            </td>
                            <td className="py-4 px-3 font-display font-bold text-sm text-ink">
                              {row.budget}
                            </td>
                            <td className="py-4 px-3 text-ink/60">
                              {row.completionDate}
                            </td>
                            <td className="py-4 px-3">
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/50">
                                <Star size={12} className="fill-amber-500 text-amber-500" />
                                {row.ratingGiven}.0 ★
                              </span>
                            </td>
                            <td className="py-4 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedReviewDetail(row);
                                    setReviewDetailModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-purple hover:underline cursor-pointer bg-transparent border-0"
                                >
                                  <span>View Review</span>
                                  <ArrowUpRight size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Freelancer Relationship Section (Repeat Hiring) */}
                <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                        Freelancer Relationships & Top Collaborators
                      </h2>
                      <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                        Directly re-engage trusted creators from previous projects.
                      </p>
                    </div>
                  </div>

                  {previousFreelancers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                      {previousFreelancers.map((f, i) => (
                        <div
                          key={i}
                          className="bg-soft/60 rounded-[22px] p-5 border border-border/60 hover:border-purple/30 hover:bg-white hover:shadow-[0_8px_30px_rgba(124,58,237,0.06)] transition-all duration-200 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className="w-12 h-12 rounded-[16px] flex items-center justify-center font-clash font-bold text-base text-ink shrink-0 shadow-xs ring-2 ring-white"
                                style={{ backgroundColor: f.avatarBg }}
                              >
                                {f.initials}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h3 className="font-bold text-base text-ink">{f.name}</h3>
                                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded font-sans">
                                    ★ {f.rating}
                                  </span>
                                </div>
                                <p className="text-xs text-ink/50">{f.role}</p>
                              </div>
                            </div>

                            <div className="bg-white rounded-xl p-3 border border-border/70 text-xs space-y-1.5 mb-3">
                              <div className="flex justify-between text-ink/70">
                                <span>Projects Together:</span>
                                <strong className="text-ink">{f.projectsCount} contracts</strong>
                              </div>
                              <div className="flex justify-between text-ink/70">
                                <span>Total Paid:</span>
                                <strong className="text-purple font-display font-bold">{f.totalPaid}</strong>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {f.skills.map((s: string, idx: number) => (
                                <span key={idx} className="text-[10px] bg-white border border-border/70 text-ink/70 px-2 py-0.5 rounded-md font-semibold">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-3 border-t border-border/40">
                            <button
                              onClick={() => {
                                const targetProp = allProposals.find(p => p.name.includes(f.name.split(' ')[0])) || {
                                  name: f.name,
                                  role: f.role,
                                  avatarBg: f.avatarBg,
                                  initials: f.initials,
                                  title: 'Direct Collaboration',
                                  coverLetter: ''
                                };
                                handleOpenDirectChat(targetProp);
                              }}
                              className="btn-secondary !py-2 !px-3 !text-xs flex-1 justify-center"
                            >
                              <MessageSquare size={13} />
                              <span>Chat</span>
                            </button>
                            <button
                              onClick={() => navigate('/post-gig')}
                              className="btn-primary !py-2 !px-4 !text-xs flex-1 justify-center"
                            >
                              <span>Hire Again</span>
                              <ArrowUpRight size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-soft/40 rounded-2xl border border-dashed border-border text-ink/50 text-xs">
                      No collaborator relationships established yet. Once you complete projects with freelancers, they will be listed here for fast re-hiring.
                    </div>
                  )}
                </section>
              </div>
            )
          ) : activeTab === 'Projects' ? (
            /* ====================================================
                VIEW D: DEDICATED PROJECTS (MY GIGS / MY SERVICES)
                ==================================================== */
            isFreelancer ? (
              <div className="space-y-7 animate-in fade-in duration-200">
                {/* Freelancer Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <span className="eyebrow text-purple mb-1 block">SERVICE OFFERINGS</span>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
                      My Services
                    </h1>
                    <p className="text-xs sm:text-sm text-ink/50 font-medium mt-1">
                      Manage your packaged offerings, pricing tiers, and published services available to hirers.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/post-gig')}
                    className="btn-primary !py-2.5 !px-5 !text-xs self-start sm:self-auto gap-2"
                  >
                    <Plus size={15} className="stroke-[2.5]" />
                    <span>Create New Service</span>
                  </button>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    {(['All', 'open', 'in-progress', 'completed', 'closed'] as const).map((filterKey) => {
                      const label = filterKey === 'All'
                        ? `All Services (${displayedGigs.length})`
                        : filterKey === 'open'
                          ? `Active (${displayedGigs.filter(g => g.rawStatus === 'open' || g.status === 'Active Brief').length})`
                          : filterKey === 'in-progress'
                            ? `In Delivery (${displayedGigs.filter(g => g.rawStatus === 'in-progress' || g.status === 'In Progress').length})`
                            : filterKey === 'completed'
                              ? `Completed (${displayedGigs.filter(g => g.rawStatus === 'completed' || g.status === 'Completed').length})`
                              : `Paused (${displayedGigs.filter(g => g.rawStatus === 'closed' || g.status === 'Closed').length})`;
                      return (
                        <button
                          key={filterKey}
                          onClick={() => setGigFilter(filterKey)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                            gigFilter === filterKey
                              ? 'bg-ink text-white border-ink shadow-xs'
                              : 'bg-white text-ink/60 border-border hover:text-ink hover:border-ink/30'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative w-full md:w-64 shrink-0">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
                    <input
                      type="text"
                      value={gigSearch}
                      onChange={(e) => setGigSearch(e.target.value)}
                      placeholder="Search your services..."
                      className="w-full bg-white border border-border rounded-full pl-9 pr-4 py-2 text-xs font-medium text-ink focus:outline-none focus:border-purple shadow-xs"
                    />
                  </div>
                </div>

                {/* Services Content / Table */}
                <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-ink/40">
                          <th className="pb-3 px-3">Service Title</th>
                          <th className="pb-3 px-3">Category</th>
                          <th className="pb-3 px-3">Starting Price</th>
                          <th className="pb-3 px-3">Orders / Inquiries</th>
                          <th className="pb-3 px-3">Status</th>
                          <th className="pb-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50 text-xs font-medium text-ink">
                        {dashboardData.loading ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-ink/40">
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 size={18} className="animate-spin text-purple" />
                                <span>Loading your services...</span>
                              </div>
                            </td>
                          </tr>
                        ) : filteredProjectsGigs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-ink/50">
                              <div className="max-w-sm mx-auto space-y-3">
                                <Sparkles size={32} className="mx-auto text-purple/40" />
                                <p className="font-bold text-sm text-ink">No services created yet</p>
                                <p className="text-xs text-ink/50">
                                  {gigSearch || gigFilter !== 'All'
                                    ? 'Try changing your search keywords or filter.'
                                    : 'Create a packaged service to showcase your specialized skills to prospective hirers.'}
                                </p>
                                <button
                                  onClick={() => navigate('/post-gig')}
                                  className="btn-primary !py-2 !px-4 !text-xs mx-auto mt-2 inline-flex items-center gap-1.5"
                                >
                                  <Plus size={14} />
                                  <span>Create Your First Service</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredProjectsGigs.map((gig) => (
                            <tr key={gig.id} className="hover:bg-soft/50 transition-colors">
                              <td className="py-4 px-3">
                                <div
                                  className="font-bold text-sm text-ink hover:text-purple transition-colors cursor-pointer"
                                  onClick={() => navigate(`/gigs/${gig.id || gig.rawId}`)}
                                >
                                  {gig.title}
                                </div>
                                <span className="text-[11px] text-ink/40">Created {gig.postedDate}</span>
                              </td>
                              <td className="py-4 px-3 text-ink/70">
                                {gig.category}
                              </td>
                              <td className="py-4 px-3 font-display font-bold text-sm text-ink">
                                {gig.budget}
                              </td>
                              <td className="py-4 px-3">
                                <span className="font-bold text-ink/80 bg-soft px-2.5 py-1 rounded-full text-xs inline-flex items-center gap-1">
                                  <span>{gig.proposalsCount} inquiries</span>
                                </span>
                              </td>
                              <td className="py-4 px-3">
                                <span className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-full border ${
                                  gig.rawStatus === 'open' || gig.status === 'Active Brief'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                                    : gig.rawStatus === 'in-progress' || gig.status === 'In Progress'
                                      ? 'bg-purple/10 text-purple border-purple/20'
                                      : gig.rawStatus === 'completed' || gig.status === 'Completed'
                                        ? 'bg-cyan/15 text-cyan border-cyan/20'
                                        : 'bg-gray-100 text-gray-600 border-gray-200'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    gig.rawStatus === 'open' || gig.status === 'Active Brief'
                                      ? 'bg-emerald-500'
                                      : gig.rawStatus === 'in-progress' || gig.status === 'In Progress'
                                        ? 'bg-purple'
                                        : gig.rawStatus === 'completed' || gig.status === 'Completed'
                                          ? 'bg-cyan'
                                          : 'bg-gray-400'
                                  }`} />
                                  {gig.rawStatus === 'open' || gig.status === 'Active Brief' ? 'Active Offering' : gig.status}
                                </span>
                              </td>
                              <td className="py-4 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => navigate(`/gigs/${gig.id || gig.rawId}`)}
                                    className="p-2 rounded-xl text-ink/60 hover:text-purple hover:bg-purple/10 transition-colors cursor-pointer border-0 bg-transparent"
                                    title="View Service"
                                  >
                                    <Eye size={15} />
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditGig(gig)}
                                    className="p-2 rounded-xl text-ink/60 hover:text-ink hover:bg-soft transition-colors cursor-pointer border-0 bg-transparent"
                                    title="Edit Service"
                                  >
                                    <Edit3 size={15} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteGig(gig.id || gig.rawId)}
                                    className="p-2 rounded-xl text-ink/40 hover:text-coral hover:bg-coral/10 transition-colors cursor-pointer border-0 bg-transparent"
                                    title="Delete Service"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* HIRER PROJECTS VIEW - 100% UNCHANGED */
              <div className="space-y-7 animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <span className="eyebrow text-purple mb-1 block">PROJECT MANAGEMENT</span>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
                      Projects (My Gigs)
                    </h1>
                    <p className="text-xs sm:text-sm text-ink/50 font-medium mt-1">
                      Manage your posted briefs, monitor applicant bids, edit listings, and track live status.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/post-gig')}
                    className="btn-primary !py-2.5 !px-5 !text-xs self-start sm:self-auto gap-2"
                  >
                    <Plus size={15} className="stroke-[2.5]" />
                    <span>Create New Brief</span>
                  </button>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    {(['All', 'open', 'in-progress', 'completed', 'closed'] as const).map((filterKey) => {
                      const label = filterKey === 'All'
                        ? `All Gigs (${displayedGigs.length})`
                        : filterKey === 'open'
                          ? `Active Briefs (${displayedGigs.filter(g => g.rawStatus === 'open' || g.status === 'Active Brief').length})`
                          : filterKey === 'in-progress'
                            ? `In Sprint (${displayedGigs.filter(g => g.rawStatus === 'in-progress' || g.status === 'In Progress').length})`
                            : filterKey === 'completed'
                              ? `Completed (${displayedGigs.filter(g => g.rawStatus === 'completed' || g.status === 'Completed').length})`
                              : `Closed (${displayedGigs.filter(g => g.rawStatus === 'closed' || g.status === 'Closed').length})`;
                      return (
                        <button
                          key={filterKey}
                          onClick={() => setGigFilter(filterKey)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                            gigFilter === filterKey
                              ? 'bg-ink text-white border-ink shadow-xs'
                              : 'bg-white text-ink/60 border-border hover:text-ink hover:border-ink/30'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative w-full md:w-64 shrink-0">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
                    <input
                      type="text"
                      value={gigSearch}
                      onChange={(e) => setGigSearch(e.target.value)}
                      placeholder="Search your briefs..."
                      className="w-full bg-white border border-border rounded-full pl-9 pr-4 py-2 text-xs font-medium text-ink focus:outline-none focus:border-purple shadow-xs"
                    />
                  </div>
                </div>

                {/* Projects Content / Table */}
                <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-ink/40">
                          <th className="pb-3 px-3">Project Title</th>
                          <th className="pb-3 px-3">Category</th>
                          <th className="pb-3 px-3">Budget</th>
                          <th className="pb-3 px-3">Proposals</th>
                          <th className="pb-3 px-3">Status</th>
                          <th className="pb-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50 text-xs font-medium text-ink">
                        {dashboardData.loading ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-ink/40">
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 size={18} className="animate-spin text-purple" />
                                <span>Loading your gigs...</span>
                              </div>
                            </td>
                          </tr>
                        ) : filteredProjectsGigs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-ink/50">
                              <div className="max-w-sm mx-auto space-y-3">
                                <FolderKanban size={32} className="mx-auto text-ink/20" />
                                <p className="font-bold text-sm text-ink">No project briefs found</p>
                                <p className="text-xs text-ink/50">
                                  {gigSearch || gigFilter !== 'All'
                                    ? 'Try changing your search keywords or filter.'
                                    : 'Publish a new project brief to start hiring talented freelancers.'}
                                </p>
                                <button
                                  onClick={() => navigate('/post-gig')}
                                  className="btn-primary !py-2 !px-4 !text-xs mx-auto mt-2 inline-flex items-center gap-1.5"
                                >
                                  <Plus size={14} />
                                  <span>Create New Brief</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredProjectsGigs.map((gig) => (
                            <tr key={gig.id} className="hover:bg-soft/50 transition-colors">
                              <td className="py-4 px-3">
                                <div
                                  className="font-bold text-sm text-ink hover:text-purple transition-colors cursor-pointer"
                                  onClick={() => navigate(`/gigs/${gig.id || gig.rawId}`)}
                                >
                                  {gig.title}
                                </div>
                                <span className="text-[11px] text-ink/40">Posted {gig.postedDate}</span>
                              </td>
                              <td className="py-4 px-3 text-ink/70">
                                {gig.category}
                              </td>
                              <td className="py-4 px-3 font-display font-bold text-sm text-ink">
                                {gig.budget}
                              </td>
                              <td className="py-4 px-3">
                                <button
                                  onClick={() => handleTabClick('Proposals')}
                                  className="font-bold text-purple bg-purple/10 hover:bg-purple/20 transition-colors px-2.5 py-1 rounded-full text-xs cursor-pointer border-0 inline-flex items-center gap-1"
                                >
                                  <span>{gig.proposalsCount} bids</span>
                                  <ArrowUpRight size={12} />
                                </button>
                              </td>
                              <td className="py-4 px-3">
                                <span className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-full border ${
                                  gig.rawStatus === 'open' || gig.status === 'Active Brief'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                                    : gig.rawStatus === 'in-progress' || gig.status === 'In Progress'
                                      ? 'bg-purple/10 text-purple border-purple/20'
                                      : gig.rawStatus === 'completed' || gig.status === 'Completed'
                                        ? 'bg-cyan/15 text-cyan border-cyan/20'
                                        : 'bg-gray-100 text-gray-600 border-gray-200'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    gig.rawStatus === 'open' || gig.status === 'Active Brief'
                                      ? 'bg-emerald-500'
                                      : gig.rawStatus === 'in-progress' || gig.status === 'In Progress'
                                        ? 'bg-purple'
                                        : gig.rawStatus === 'completed' || gig.status === 'Completed'
                                          ? 'bg-cyan'
                                          : 'bg-gray-400'
                                  }`} />
                                  {gig.status}
                                </span>
                              </td>
                              <td className="py-4 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleTabClick('Proposals')}
                                    className="p-2 rounded-xl text-ink/60 hover:text-purple hover:bg-purple/10 transition-colors cursor-pointer border-0 bg-transparent"
                                    title="View Proposals"
                                  >
                                    <Eye size={15} />
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditGig(gig)}
                                    className="p-2 rounded-xl text-ink/60 hover:text-ink hover:bg-soft transition-colors cursor-pointer border-0 bg-transparent"
                                    title="Edit Brief"
                                  >
                                    <Edit3 size={15} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteGig(gig.id || gig.rawId)}
                                    className="p-2 rounded-xl text-ink/40 hover:text-coral hover:bg-coral/10 transition-colors cursor-pointer border-0 bg-transparent"
                                    title="Delete Brief"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          ) : activeTab === 'Proposals' ? (
            /* ====================================================
                VIEW E: DEDICATED PROPOSALS & APPLICANTS BOARD / APPLICATIONS
                ==================================================== */
            isFreelancer ? (
              <div className="space-y-7 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <span className="eyebrow text-purple mb-1 block">OPPORTUNITY TRACKING</span>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
                      Applications & Pitches
                    </h1>
                    <p className="text-xs sm:text-sm text-ink/50 font-medium mt-1">
                      Track status, proposed terms, and hirer responses to your submitted gig applications.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/gigs')}
                    className="btn-primary !py-2.5 !px-5 !text-xs self-start sm:self-auto gap-2"
                  >
                    <Briefcase size={15} />
                    <span>Browse Open Gigs</span>
                  </button>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    {(['All', 'pending', 'accepted', 'rejected'] as const).map((filterKey) => {
                      const label = filterKey === 'All'
                        ? `All Applications (${allProposals.length})`
                        : filterKey === 'pending'
                          ? `Pending Response (${allProposals.filter(p => p.status === 'pending').length})`
                          : filterKey === 'accepted'
                            ? `Accepted (${allProposals.filter(p => p.status === 'accepted').length})`
                            : `Declined (${allProposals.filter(p => p.status === 'rejected').length})`;
                      return (
                        <button
                          key={filterKey}
                          onClick={() => setProposalFilter(filterKey)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                            proposalFilter === filterKey
                              ? 'bg-ink text-white border-ink shadow-xs'
                              : 'bg-white text-ink/60 border-border hover:text-ink hover:border-ink/30'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative w-full md:w-64 shrink-0">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
                    <input
                      type="text"
                      value={proposalSearch}
                      onChange={(e) => setProposalSearch(e.target.value)}
                      placeholder="Search gig title or hirer..."
                      className="w-full bg-white border border-border rounded-full pl-9 pr-4 py-2 text-xs font-medium text-ink focus:outline-none focus:border-purple shadow-xs"
                    />
                  </div>
                </div>

                {/* Applications Board / Grid */}
                <div className="space-y-4">
                  {dashboardData.loading ? (
                    <div className="bg-white rounded-[28px] p-12 text-center text-ink/40 border border-border/70">
                      <Loader2 size={24} className="animate-spin mx-auto mb-2 text-purple" />
                      <span className="text-sm font-medium">Loading your applications...</span>
                    </div>
                  ) : filteredTabProposals.length === 0 ? (
                    <div className="bg-white rounded-[28px] p-12 text-center text-ink/50 border border-border/70 shadow-xs">
                      <FileText size={36} className="mx-auto mb-3 text-ink/20" />
                      <p className="font-bold text-base text-ink mb-1">No applications found</p>
                      <p className="text-xs text-ink/50 max-w-sm mx-auto">
                        {proposalSearch || proposalFilter !== 'All'
                          ? 'No applications matched your current search filters.'
                          : 'Explore the gig marketplace and pitch your proposals to active hirers.'}
                      </p>
                      <button
                        onClick={() => navigate('/gigs')}
                        className="btn-primary !py-2 !px-4 !text-xs mx-auto mt-4 inline-flex items-center gap-1.5"
                      >
                        <Briefcase size={14} />
                        <span>Explore Marketplace</span>
                      </button>
                    </div>
                  ) : (
                    filteredTabProposals.map((proposal) => (
                      <div
                        key={proposal.id}
                        className="bg-white rounded-[24px] p-5 sm:p-6 border border-border/70 hover:border-purple/40 hover:shadow-[0_8px_30px_rgba(124,58,237,0.06)] transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-5 group"
                      >
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          <div
                            className="w-13 h-13 rounded-[18px] flex items-center justify-center font-clash font-bold text-base text-ink shrink-0 shadow-xs ring-2 ring-white"
                            style={{ backgroundColor: proposal.avatarBg }}
                          >
                            {proposal.initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-bold text-base text-ink group-hover:text-purple transition-colors">
                                {proposal.title}
                              </h3>
                              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                                proposal.status === 'accepted'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                                  : proposal.status === 'rejected'
                                    ? 'bg-coral/10 text-coral border-coral/20'
                                    : 'bg-amber-50 text-amber-700 border-amber-200/50'
                              }`}>
                                {proposal.status === 'pending' ? 'Under Review' : proposal.status}
                              </span>
                              <span className="text-xs font-bold text-purple bg-purple/10 px-2.5 py-0.5 rounded-full">
                                Proposed: {proposal.price}
                              </span>
                            </div>

                            <p className="text-xs text-ink/70 font-semibold">
                              Hirer: <strong className="text-ink">{proposal.name}</strong>
                            </p>

                            <p className="text-xs text-ink/60 font-medium mt-2 line-clamp-2 italic leading-relaxed bg-soft/50 p-3 rounded-xl border border-border/40">
                              "{proposal.coverLetter}"
                            </p>

                            {proposal.skills && proposal.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {proposal.skills.map((skill: string, i: number) => (
                                  <span
                                    key={i}
                                    className="text-[11px] font-semibold bg-soft border border-border/60 text-ink/70 px-2.5 py-0.5 rounded-full"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/40">
                          <div className="text-left lg:text-right">
                            <span className="text-[11px] font-bold text-ink/40 uppercase tracking-wider block">Your Bid</span>
                            <span className="font-display font-bold text-2xl text-ink leading-tight block">
                              {proposal.price}
                            </span>
                            <span className="text-[11px] text-ink/50 font-medium flex items-center gap-1 lg:justify-end mt-0.5">
                              <Clock size={12} className="text-purple" />
                              Est. {proposal.timeline}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenDirectChat(proposal)}
                              className="btn-secondary !py-2 !px-3.5 !text-xs"
                              title="Direct chat with hirer"
                            >
                              <MessageSquare size={14} />
                              <span className="hidden sm:inline">Message Hirer</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProposal(proposal);
                                setProposalModalOpen(true);
                              }}
                              className="btn-primary !py-2 !px-4 !text-xs"
                            >
                              <span>View Application</span>
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* HIRER PROPOSALS VIEW - 100% UNCHANGED */
              <div className="space-y-7 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <span className="eyebrow text-purple mb-1 block">TALENT APPLICATIONS</span>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
                      Proposals & Submissions
                    </h1>
                    <p className="text-xs sm:text-sm text-ink/50 font-medium mt-1">
                      Review candidate bids, inspect cover letters, check credentials, and start milestone contracts.
                    </p>
                  </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    {(['All', 'pending', 'accepted', 'rejected'] as const).map((filterKey) => {
                      const label = filterKey === 'All'
                        ? `All Proposals (${allProposals.length})`
                        : filterKey === 'pending'
                          ? `Pending Review (${allProposals.filter(p => p.status === 'pending').length})`
                          : filterKey === 'accepted'
                            ? `Accepted (${allProposals.filter(p => p.status === 'accepted').length})`
                            : `Rejected (${allProposals.filter(p => p.status === 'rejected').length})`;
                      return (
                        <button
                          key={filterKey}
                          onClick={() => setProposalFilter(filterKey)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                            proposalFilter === filterKey
                              ? 'bg-ink text-white border-ink shadow-xs'
                              : 'bg-white text-ink/60 border-border hover:text-ink hover:border-ink/30'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative w-full md:w-64 shrink-0">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
                    <input
                      type="text"
                      value={proposalSearch}
                      onChange={(e) => setProposalSearch(e.target.value)}
                      placeholder="Search candidate name or brief..."
                      className="w-full bg-white border border-border rounded-full pl-9 pr-4 py-2 text-xs font-medium text-ink focus:outline-none focus:border-purple shadow-xs"
                    />
                  </div>
                </div>

                {/* Proposals Board / Grid */}
                <div className="space-y-4">
                  {dashboardData.loading ? (
                    <div className="bg-white rounded-[28px] p-12 text-center text-ink/40 border border-border/70">
                      <Loader2 size={24} className="animate-spin mx-auto mb-2 text-purple" />
                      <span className="text-sm font-medium">Loading talent submissions...</span>
                    </div>
                  ) : filteredTabProposals.length === 0 ? (
                    <div className="bg-white rounded-[28px] p-12 text-center text-ink/50 border border-border/70 shadow-xs">
                      <FileText size={36} className="mx-auto mb-3 text-ink/20" />
                      <p className="font-bold text-base text-ink mb-1">No proposals found</p>
                      <p className="text-xs text-ink/50 max-w-sm mx-auto">
                        {proposalSearch || proposalFilter !== 'All'
                          ? 'No proposals matched your current filter criteria.'
                          : 'Post a new project brief to receive proposals from top creators.'}
                      </p>
                    </div>
                  ) : (
                    filteredTabProposals.map((proposal) => (
                      <div
                        key={proposal.id}
                        className="bg-white rounded-[24px] p-5 sm:p-6 border border-border/70 hover:border-purple/40 hover:shadow-[0_8px_30px_rgba(124,58,237,0.06)] transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-5 group"
                      >
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          <div
                            className="w-13 h-13 rounded-[18px] flex items-center justify-center font-clash font-bold text-base text-ink shrink-0 shadow-xs ring-2 ring-white"
                            style={{ backgroundColor: proposal.avatarBg }}
                          >
                            {proposal.initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-bold text-base text-ink group-hover:text-purple transition-colors">
                                {proposal.name}
                              </h3>
                              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                                proposal.status === 'accepted'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                                  : proposal.status === 'rejected'
                                    ? 'bg-coral/10 text-coral border-coral/20'
                                    : 'bg-amber-50 text-amber-700 border-amber-200/50'
                              }`}>
                                {proposal.status}
                              </span>
                              <span className="text-xs font-bold text-purple bg-purple/10 px-2.5 py-0.5 rounded-full">
                                Bid: {proposal.price}
                              </span>
                            </div>

                            <p className="text-xs text-ink/70 font-semibold">
                              Applied for: <strong className="text-ink">{proposal.title}</strong>
                            </p>

                            <p className="text-xs text-ink/60 font-medium mt-2 line-clamp-2 italic leading-relaxed bg-soft/50 p-3 rounded-xl border border-border/40">
                              "{proposal.coverLetter}"
                            </p>

                            {proposal.skills && proposal.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {proposal.skills.map((skill: string, i: number) => (
                                  <span
                                    key={i}
                                    className="text-[11px] font-semibold bg-soft border border-border/60 text-ink/70 px-2.5 py-0.5 rounded-full"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/40">
                          <div className="text-left lg:text-right">
                            <span className="text-[11px] font-bold text-ink/40 uppercase tracking-wider block">Proposed Rate</span>
                            <span className="font-display font-bold text-2xl text-ink leading-tight block">
                              {proposal.price}
                            </span>
                            <span className="text-[11px] text-ink/50 font-medium flex items-center gap-1 lg:justify-end mt-0.5">
                              <Clock size={12} className="text-purple" />
                              Est. {proposal.timeline}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenDirectChat(proposal)}
                              className="btn-secondary !py-2 !px-3.5 !text-xs"
                              title="Direct chat with creator"
                            >
                              <MessageSquare size={14} />
                              <span className="hidden sm:inline">Chat</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProposal(proposal);
                                setProposalModalOpen(true);
                              }}
                              className="btn-primary !py-2 !px-4 !text-xs"
                            >
                              <span>Review & Hire</span>
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          ) : activeTab === 'Orders' ? (
            /* ====================================================
                VIEW F: DEDICATED ORDERS & CONTRACT MANAGEMENT
                ==================================================== */
            <div className="space-y-7 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span className="eyebrow text-purple mb-1 block">CONTRACT & SPRINT TRACKING</span>
                  <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
                    Order Management & Contracts
                  </h1>
                  <p className="text-xs sm:text-sm text-ink/50 font-medium mt-1">
                    Track milestone progress, inspect deliverables, release escrow payments, and access live workspaces.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200/50 self-start sm:self-auto">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>GigMatch Escrow Guaranteed</span>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  {(['All', 'active', 'in_review', 'completed', 'cancelled'] as const).map((filterKey) => {
                    const label = filterKey === 'All'
                      ? `All Contracts (${displayedOrders.length})`
                      : filterKey === 'active'
                        ? `Active (${displayedOrders.filter(o => o.rawStatus === 'active' || o.status === 'active').length})`
                        : filterKey === 'in_review'
                          ? `In Review (${displayedOrders.filter(o => o.rawStatus === 'in_review' || o.status === 'in_review').length})`
                          : filterKey === 'completed'
                            ? `Completed (${displayedOrders.filter(o => o.rawStatus === 'completed' || o.status === 'completed').length})`
                            : `Cancelled (${displayedOrders.filter(o => o.rawStatus === 'cancelled' || o.status === 'cancelled').length})`;
                    return (
                      <button
                        key={filterKey}
                        onClick={() => setOrderFilter(filterKey)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                          orderFilter === filterKey
                            ? 'bg-ink text-white border-ink shadow-xs'
                            : 'bg-white text-ink/60 border-border hover:text-ink hover:border-ink/30'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="relative w-full md:w-64 shrink-0">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search contracts or creators..."
                    className="w-full bg-white border border-border rounded-full pl-9 pr-4 py-2 text-xs font-medium text-ink focus:outline-none focus:border-purple shadow-xs"
                  />
                </div>
              </div>

              {/* Orders Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {dashboardData.loading ? (
                  <div className="col-span-full bg-white rounded-[28px] p-12 text-center text-ink/40 border border-border/70">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-purple" />
                    <span className="text-sm font-medium">Loading active contracts...</span>
                  </div>
                ) : filteredTabOrders.length === 0 ? (
                  <div className="col-span-full bg-white rounded-[28px] p-12 text-center text-ink/50 border border-border/70 shadow-xs">
                    <Package size={36} className="mx-auto mb-3 text-ink/20" />
                    <p className="font-bold text-base text-ink mb-1">No orders found</p>
                    <p className="text-xs text-ink/50 max-w-sm mx-auto">
                      {orderSearch || orderFilter !== 'All'
                        ? 'No contracts matched your current filter criteria.'
                        : 'Once you accept a candidate proposal, active milestone contracts will be managed here.'}
                    </p>
                  </div>
                ) : (
                  filteredTabOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-[24px] p-5 sm:p-6 border border-border/70 hover:border-purple/40 hover:shadow-[0_8px_30px_rgba(124,58,237,0.06)] transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center font-clash font-bold text-xs text-ink shrink-0 shadow-xs"
                              style={{ backgroundColor: order.avatarBg }}
                            >
                              {order.initials}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-ink">{order.freelancerName}</h4>
                              <p className="text-[11px] text-ink/50">{order.freelancerRole}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            order.isUnpaid
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {order.paymentStatus}
                          </span>
                        </div>

                        <h5 className="font-bold text-base text-ink mb-1">
                          {order.projectTitle}
                        </h5>
                        <p className="text-xs text-ink/60 font-medium mb-3">
                          {order.milestone}
                        </p>

                        <div className="my-3">
                          <div className="flex items-center justify-between text-xs font-semibold text-ink/70 mb-1.5">
                            <span>Sprint Completion</span>
                            <span>{order.progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-soft rounded-full overflow-hidden">
                            <div
                              className="h-full gradient-primary rounded-full transition-all duration-500"
                              style={{ width: `${order.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="text-xs text-ink/60 space-y-1.5 my-3 p-3 bg-soft/50 rounded-xl border border-border/40">
                          <div className="flex justify-between">
                            <span>Contract Budget:</span>
                            <span className="font-bold text-ink">{order.budget}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Target Due Date:</span>
                            <span className="font-medium text-ink">{order.dueDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border/40 space-y-2">
                        {order.isUnpaid ? (
                          <button
                            onClick={() => {
                              const payItem = pendingPaymentsList.find(p => p.orderId === order.id || p.orderId === order.rawId);
                              if (payItem) {
                                handlePayNow(payItem);
                              } else {
                                toast.success(`Payment of ${order.budget} approved for ${order.freelancerName}!`);
                              }
                            }}
                            className="w-full btn-primary !py-2.5 !text-xs justify-center"
                          >
                            <ShieldCheck size={14} />
                            <span>Release Payment & Approve</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/workspace?id=${order.id}`)}
                            className="w-full btn-secondary !py-2 !text-xs justify-center"
                          >
                            <FolderKanban size={13} />
                            <span>Open Workspace</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const targetProp = allProposals.find(p => p.name.includes(order.freelancerName.split(' ')[0])) || {
                              name: order.freelancerName,
                              role: order.freelancerRole,
                              avatarBg: order.avatarBg,
                              initials: order.initials,
                              title: order.projectTitle,
                              coverLetter: ''
                            };
                            handleOpenDirectChat(targetProp);
                          }}
                          className="w-full text-center text-xs font-semibold text-ink/60 hover:text-purple transition-colors py-1 cursor-pointer bg-transparent border-0"
                        >
                          Message Creator →
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* ====================================================
                VIEW G: DASHBOARD SUMMARY HUB (Streamlined Cockpit)
                ==================================================== */
            isFreelancer ? (
              <>
                {/* 1. FREELANCER TOP GREETING & 4 KPI STATS CARDS */}
                <section className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pt-1">
                    <div>
                      <span className="eyebrow text-purple mb-1 block">
                        FREELANCER WORKSPACE
                      </span>
                      <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-ink tracking-tight leading-tight">
                        {getGreetingTime()}, {displayName}
                      </h1>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <span className="font-display font-bold text-xs sm:text-sm tracking-wider uppercase text-ink/60">
                        {currentDateFormatted}
                      </span>
                    </div>
                  </div>

                  {/* 4 TOP KPI CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    {/* 1. Active Services */}
                    <div
                      onClick={() => handleTabClick('Projects')}
                      className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="eyebrow text-ink/50">Active Services</span>
                        <div className="w-8 h-8 rounded-xl bg-purple/15 flex items-center justify-center text-purple group-hover:scale-110 transition-transform">
                          <Sparkles size={16} />
                        </div>
                      </div>
                      <div>
                        <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2">
                          {dashboardData.gigs.length.toString().padStart(2, '0')}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-purple">
                          <span>{dashboardData.gigs.filter(g => g.status === 'open').length} Offering Live →</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Active Contracts */}
                    <div
                      onClick={() => handleTabClick('Orders')}
                      className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="eyebrow text-ink/50">Active Contracts</span>
                        <div className="w-8 h-8 rounded-xl bg-cyan/15 flex items-center justify-center text-cyan group-hover:scale-110 transition-transform">
                          <Briefcase size={16} />
                        </div>
                      </div>
                      <div>
                        <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2">
                          {displayedOrders.filter(o => o.status === 'active' || o.status === 'in_review').length.toString().padStart(2, '0')}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-cyan">
                          <span>In Active Delivery →</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Total Earnings */}
                    <div
                      onClick={() => handleTabClick('Payments')}
                      className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="eyebrow text-ink/50">Total Earnings</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                          <CreditCard size={16} />
                        </div>
                      </div>
                      <div>
                        <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2">
                          ₹{dashboardData.completedPayments.toLocaleString('en-IN')}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <ShieldCheck size={13} />
                          <span>Escrow Released →</span>
                        </div>
                      </div>
                    </div>

                    {/* 4. Average Rating */}
                    <div
                      onClick={() => handleTabClick('Reviews & History')}
                      className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="eyebrow text-ink/50">Average Rating</span>
                        <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                          <Star size={16} className="fill-amber-500 text-amber-500" />
                        </div>
                      </div>
                      <div>
                        <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2">
                          {dashboardData.reviews.length > 0 ? `${(dashboardData.reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / dashboardData.reviews.length).toFixed(1)} ★` : 'No ratings yet'}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                          <span>{dashboardData.reviews.length} {dashboardData.reviews.length === 1 ? 'Review' : 'Reviews'} →</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. FREELANCER QUICK ACTIONS (4 Clickable Cards) */}
                <section aria-label="Quick Actions">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    <div
                      onClick={() => navigate('/post-gig')}
                      className="bg-white rounded-[24px] p-5 border border-border/70 hover:border-purple/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(124,58,237,0.08)] transition-all duration-200 cursor-pointer flex flex-col justify-between hover-lift group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-11 h-11 rounded-2xl bg-purple/10 text-purple flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Plus size={20} className="stroke-[2.5]" />
                        </div>
                        <ArrowUpRight size={18} className="text-ink/30 group-hover:text-purple group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg text-ink mb-1 group-hover:text-purple transition-colors">
                          Create a Service
                        </h3>
                        <p className="text-xs text-ink/55 font-medium leading-relaxed">
                          Package your skills and publish an offering to attract clients.
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => navigate('/gigs')}
                      className="bg-white rounded-[24px] p-5 border border-border/70 hover:border-coral/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(255,107,107,0.10)] transition-all duration-200 cursor-pointer flex flex-col justify-between hover-lift group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-11 h-11 rounded-2xl bg-coral/10 text-coral flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Briefcase size={20} />
                        </div>
                        <ArrowUpRight size={18} className="text-ink/30 group-hover:text-coral group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg text-ink mb-1 group-hover:text-coral transition-colors">
                          Browse Open Gigs
                        </h3>
                        <p className="text-xs text-ink/55 font-medium leading-relaxed">
                          Discover project briefs and submit tailored pitches to hirers.
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => handleTabClick('Orders')}
                      className="bg-white rounded-[24px] p-5 border border-border/70 hover:border-cyan/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(34,211,238,0.10)] transition-all duration-200 cursor-pointer flex flex-col justify-between hover-lift group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-11 h-11 rounded-2xl bg-cyan/15 text-cyan flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Package size={20} />
                        </div>
                        <ArrowUpRight size={18} className="text-ink/30 group-hover:text-cyan group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg text-ink mb-1 group-hover:text-cyan transition-colors">
                          Active Orders
                        </h3>
                        <p className="text-xs text-ink/55 font-medium leading-relaxed">
                          Manage sprint deliverables, milestones, and client reviews.
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => handleTabClick('Messages')}
                      className="bg-white rounded-[24px] p-5 border border-border/70 hover:border-orange/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(255,179,71,0.10)] transition-all duration-200 cursor-pointer flex flex-col justify-between hover-lift group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-11 h-11 rounded-2xl bg-orange/15 text-orange flex items-center justify-center group-hover:scale-110 transition-transform">
                          <MessageSquare size={20} />
                        </div>
                        <ArrowUpRight size={18} className="text-ink/30 group-hover:text-orange group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg text-ink mb-1 group-hover:text-orange transition-colors">
                          Direct Messages
                        </h3>
                        <p className="text-xs text-ink/55 font-medium leading-relaxed">
                          Chat in real-time with clients and discuss deliverables.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. ACTIVE WORK & OPPORTUNITIES */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* A. My Active Projects */}
                  <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h2 className="font-display text-xl font-bold text-ink tracking-tight">
                            My Active Projects
                          </h2>
                          <p className="text-xs text-ink/50 font-medium mt-0.5">
                            Contracts in progress and upcoming sprint milestones
                          </p>
                        </div>
                        <button
                          onClick={() => handleTabClick('Orders')}
                          className="text-xs font-bold text-purple hover:underline inline-flex items-center gap-1 cursor-pointer bg-transparent border-0"
                        >
                          <span>View All ({displayedOrders.length})</span>
                          <ArrowUpRight size={14} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {displayedOrders.length === 0 ? (
                          <div className="py-8 text-center text-xs text-ink/50 bg-soft/40 rounded-2xl border border-dashed border-border">
                            No active contracts currently.
                          </div>
                        ) : (
                          displayedOrders.slice(0, 3).map((order) => (
                            <div
                              key={order.id}
                              onClick={() => navigate(`/workspace?id=${order.id}`)}
                              className="p-4 rounded-2xl bg-soft/60 hover:bg-soft hover:border-purple/20 transition-all border border-border/40 space-y-3 cursor-pointer"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <h4 className="font-bold text-sm text-ink truncate">{order.projectTitle}</h4>
                                  <p className="text-xs text-ink/50">Hirer: {order.freelancerName} · Due {order.dueDate}</p>
                                </div>
                                <span className="font-display font-bold text-sm text-ink shrink-0">
                                  {order.budget}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center justify-between text-[11px] font-semibold text-ink/60 mb-1">
                                  <span>Milestone Progress</span>
                                  <span>{order.progress}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-border/60 rounded-full overflow-hidden">
                                  <div className="h-full gradient-primary rounded-full" style={{ width: `${order.progress}%` }} />
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleTabClick('Orders')}
                      className="w-full mt-4 btn-secondary !py-2 !text-xs justify-center"
                    >
                      Manage All Contracts →
                    </button>
                  </section>

                  {/* B. Recent Applications */}
                  <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h2 className="font-display text-xl font-bold text-ink tracking-tight">
                            Recent Applications
                          </h2>
                          <p className="text-xs text-ink/50 font-medium mt-0.5">
                            Pitches submitted to client briefs
                          </p>
                        </div>
                        <button
                          onClick={() => handleTabClick('Proposals')}
                          className="text-xs font-bold text-purple hover:underline inline-flex items-center gap-1 cursor-pointer bg-transparent border-0"
                        >
                          <span>View All ({allProposals.length})</span>
                          <ArrowUpRight size={14} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {allProposals.length === 0 ? (
                          <div className="py-8 text-center text-xs text-ink/50 bg-soft/40 rounded-2xl border border-dashed border-border">
                            No applications submitted yet.
                          </div>
                        ) : (
                          allProposals.slice(0, 3).map((prop) => (
                            <div
                              key={prop.id}
                              onClick={() => {
                                setSelectedProposal(prop);
                                setProposalModalOpen(true);
                              }}
                              className="p-3.5 rounded-2xl bg-soft/60 hover:bg-soft hover:border-purple/20 transition-all border border-border/40 flex items-center justify-between gap-3 cursor-pointer"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className="w-9 h-9 rounded-xl flex items-center justify-center font-clash font-bold text-xs text-ink shrink-0"
                                  style={{ backgroundColor: prop.avatarBg }}
                                >
                                  {prop.initials}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-sm text-ink truncate">{prop.title}</h4>
                                  <p className="text-xs text-ink/50 truncate">Hirer: {prop.name}</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-display font-bold text-sm text-ink block">
                                  {prop.price}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase ${
                                  prop.status === 'accepted'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : prop.status === 'rejected'
                                      ? 'bg-coral/10 text-coral'
                                      : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {prop.status}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleTabClick('Proposals')}
                      className="w-full mt-4 btn-secondary !py-2 !text-xs justify-center"
                    >
                      Track All Applications →
                    </button>
                  </section>
                </div>

                {/* 4. Recent Activity Notifications */}
                {activities.length > 0 && (
                  <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display text-lg font-bold text-ink">
                        Recent Activity
                      </h2>
                      <span className="text-xs text-ink/50">{activities.length} notifications</span>
                    </div>
                    <div className="divide-y divide-border/40">
                      {activities.slice(0, 5).map((act: any, idx: number) => (
                        <div key={act._id || idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-purple/10 text-purple flex items-center justify-center shrink-0">
                              <Bell size={14} />
                            </div>
                            <div>
                              <p className="font-semibold text-ink">{act.title || act.description}</p>
                              <span className="text-[11px] text-ink/40">
                                {act.createdAt ? new Date(act.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            ) : (
              /* HIRER SUMMARY HUB - 100% UNCHANGED */
              <>
                {/* 1. TOP GREETING & 5 STATS CARDS */}
                <section className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pt-1">
                    <div>
                      <span className="eyebrow text-purple mb-1 block">
                        EMPLOYER WORKSPACE
                      </span>
                      <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-ink tracking-tight leading-tight">
                        {getGreetingTime()}, {displayName}
                      </h1>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <span className="font-display font-bold text-xs sm:text-sm tracking-wider uppercase text-ink/60">
                        {currentDateFormatted}
                      </span>
                    </div>
                  </div>

                  {/* 5 STATS CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* 1. Active Gigs */}
                    <div
                      onClick={() => handleTabClick('Projects')}
                      className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="eyebrow text-ink/50">Active Gigs</span>
                        <div className="w-8 h-8 rounded-xl bg-purple/15 flex items-center justify-center text-purple group-hover:scale-110 transition-transform">
                          <Briefcase size={16} />
                        </div>
                      </div>
                      <div>
                        <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2">
                          {displayedGigs.length.toString().padStart(2, '0')}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-purple">
                          <span>Manage Gigs →</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Pending Proposals */}
                    <div
                      onClick={() => handleTabClick('Proposals')}
                      className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="eyebrow text-ink/50">Proposals</span>
                        <div className="w-8 h-8 rounded-xl bg-coral/15 flex items-center justify-center text-coral group-hover:scale-110 transition-transform">
                          <FileText size={16} />
                        </div>
                      </div>
                      <div>
                        <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2">
                          {allProposals.filter(p => p.status === 'pending').length}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-coral">
                          <span>Review Bids →</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Active Orders */}
                    <div
                      onClick={() => handleTabClick('Orders')}
                      className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="eyebrow text-ink/50">Active Orders</span>
                        <div className="w-8 h-8 rounded-xl bg-cyan/15 flex items-center justify-center text-cyan group-hover:scale-110 transition-transform">
                          <Package size={16} />
                        </div>
                      </div>
                      <div>
                        <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2">
                          {displayedOrders.filter(o => o.status === 'active').length.toString().padStart(2, '0')}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-cyan">
                          <span>Track Sprints →</span>
                        </div>
                      </div>
                    </div>

                    {/* 4. Completed Projects */}
                    <div
                      onClick={() => handleTabClick('Reviews & History')}
                      className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="eyebrow text-ink/50">Delivered</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <CheckCircle2 size={16} />
                        </div>
                      </div>
                      <div>
                        <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2">
                          {dashboardData.completedOrders}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <span>View History →</span>
                        </div>
                      </div>
                    </div>

                    {/* 5. Messages / Threads */}
                    <div
                      onClick={() => handleTabClick('Messages')}
                      className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="eyebrow text-ink/50">Conversations</span>
                        <div className="w-8 h-8 rounded-xl bg-orange/15 flex items-center justify-center text-orange group-hover:scale-110 transition-transform">
                          <MessageSquare size={16} />
                        </div>
                      </div>
                      <div>
                        <div className="font-display text-3xl font-extrabold text-ink leading-none mb-2">
                          {inboxThreads.length}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-orange">
                          <span>Open Inbox →</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. QUICK ACTIONS (4 Clickable Cards) */}
                <section aria-label="Quick Actions">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    <div
                      onClick={() => navigate('/post-gig')}
                      className="bg-white rounded-[24px] p-5 border border-border/70 hover:border-purple/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(124,58,237,0.08)] transition-all duration-200 cursor-pointer flex flex-col justify-between hover-lift group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-11 h-11 rounded-2xl bg-purple/10 text-purple flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Plus size={20} className="stroke-[2.5]" />
                        </div>
                        <ArrowUpRight size={18} className="text-ink/30 group-hover:text-purple group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg text-ink mb-1 group-hover:text-purple transition-colors">
                          Post a New Gig
                        </h3>
                        <p className="text-xs text-ink/55 font-medium leading-relaxed">
                          Create a project brief and get matched with top creators.
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => handleTabClick('Proposals')}
                      className="bg-white rounded-[24px] p-5 border border-border/70 hover:border-coral/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(255,107,107,0.10)] transition-all duration-200 cursor-pointer flex flex-col justify-between hover-lift group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-11 h-11 rounded-2xl bg-coral/10 text-coral flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FileText size={20} />
                        </div>
                        <ArrowUpRight size={18} className="text-ink/30 group-hover:text-coral group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg text-ink mb-1 group-hover:text-coral transition-colors">
                          Review Proposals
                        </h3>
                        <p className="text-xs text-ink/55 font-medium leading-relaxed">
                          Inspect candidate bids, rates, cover notes, and portfolios.
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => handleTabClick('Orders')}
                      className="bg-white rounded-[24px] p-5 border border-border/70 hover:border-cyan/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(34,211,238,0.10)] transition-all duration-200 cursor-pointer flex flex-col justify-between hover-lift group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-11 h-11 rounded-2xl bg-cyan/15 text-cyan flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Package size={20} />
                        </div>
                        <ArrowUpRight size={18} className="text-ink/30 group-hover:text-cyan group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg text-ink mb-1 group-hover:text-cyan transition-colors">
                          Manage Orders
                        </h3>
                        <p className="text-xs text-ink/55 font-medium leading-relaxed">
                          Monitor active sprint deliverables and release escrow funds.
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => handleTabClick('Messages')}
                      className="bg-white rounded-[24px] p-5 border border-border/70 hover:border-orange/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(255,179,71,0.10)] transition-all duration-200 cursor-pointer flex flex-col justify-between hover-lift group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-11 h-11 rounded-2xl bg-orange/15 text-orange flex items-center justify-center group-hover:scale-110 transition-transform">
                          <MessageSquare size={20} />
                        </div>
                        <ArrowUpRight size={18} className="text-ink/30 group-hover:text-orange group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg text-ink mb-1 group-hover:text-orange transition-colors">
                          Open Messages
                        </h3>
                        <p className="text-xs text-ink/55 font-medium leading-relaxed">
                          Chat directly with applicants and active collaborators.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. RECENT ACTIVITY PREVIEWS (Gigs, Proposals, Orders) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* A. Recent Project Briefs */}
                  <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h2 className="font-display text-xl font-bold text-ink tracking-tight">
                            Recent Project Briefs
                          </h2>
                          <p className="text-xs text-ink/50 font-medium mt-0.5">
                            Your latest posted gigs & live listings
                          </p>
                        </div>
                        <button
                          onClick={() => handleTabClick('Projects')}
                          className="text-xs font-bold text-purple hover:underline inline-flex items-center gap-1 cursor-pointer bg-transparent border-0"
                        >
                          <span>View All ({displayedGigs.length})</span>
                          <ArrowUpRight size={14} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {displayedGigs.length === 0 ? (
                          <div className="py-8 text-center text-xs text-ink/50 bg-soft/40 rounded-2xl border border-dashed border-border">
                            No gigs posted yet.
                          </div>
                        ) : (
                          displayedGigs.slice(0, 3).map((gig) => (
                            <div
                              key={gig.id}
                              onClick={() => handleTabClick('Projects')}
                              className="p-3.5 rounded-2xl bg-soft/60 hover:bg-soft hover:border-purple/20 transition-all border border-border/40 flex items-center justify-between gap-3 cursor-pointer"
                            >
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm text-ink truncate">{gig.title}</h4>
                                <p className="text-xs text-ink/50">{gig.category} · {gig.budget}</p>
                              </div>
                              <span className="text-xs font-bold text-purple bg-purple/10 px-2.5 py-1 rounded-full shrink-0">
                                {gig.proposalsCount} bids
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleTabClick('Projects')}
                      className="w-full mt-4 btn-secondary !py-2 !text-xs justify-center"
                    >
                      Manage All Projects →
                    </button>
                  </section>

                  {/* B. Priority Proposals */}
                  <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h2 className="font-display text-xl font-bold text-ink tracking-tight">
                            Latest Proposals
                          </h2>
                          <p className="text-xs text-ink/50 font-medium mt-0.5">
                            Applications awaiting your review
                          </p>
                        </div>
                        <button
                          onClick={() => handleTabClick('Proposals')}
                          className="text-xs font-bold text-purple hover:underline inline-flex items-center gap-1 cursor-pointer bg-transparent border-0"
                        >
                          <span>View All ({allProposals.length})</span>
                          <ArrowUpRight size={14} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {allProposals.length === 0 ? (
                          <div className="py-8 text-center text-xs text-ink/50 bg-soft/40 rounded-2xl border border-dashed border-border">
                            No proposals received yet.
                          </div>
                        ) : (
                          allProposals.slice(0, 3).map((prop) => (
                            <div
                              key={prop.id}
                              onClick={() => {
                                setSelectedProposal(prop);
                                setProposalModalOpen(true);
                              }}
                              className="p-3.5 rounded-2xl bg-soft/60 hover:bg-soft hover:border-purple/20 transition-all border border-border/40 flex items-center justify-between gap-3 cursor-pointer"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className="w-9 h-9 rounded-xl flex items-center justify-center font-clash font-bold text-xs text-ink shrink-0"
                                  style={{ backgroundColor: prop.avatarBg }}
                                >
                                  {prop.initials}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-sm text-ink truncate">{prop.name}</h4>
                                  <p className="text-xs text-ink/50 truncate">Applied for: {prop.title}</p>
                                </div>
                              </div>
                              <span className="font-display font-bold text-sm text-ink shrink-0">
                                {prop.price}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleTabClick('Proposals')}
                      className="w-full mt-4 btn-secondary !py-2 !text-xs justify-center"
                    >
                      Review All Proposals →
                    </button>
                  </section>
                </div>

                {/* C. Active Orders Overview */}
                <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="font-display text-xl font-bold text-ink tracking-tight">
                        Active Orders & Milestones
                      </h2>
                      <p className="text-xs text-ink/50 font-medium mt-0.5">
                        Live sprint deliverables with escrow release triggers
                      </p>
                    </div>
                    <button
                      onClick={() => handleTabClick('Orders')}
                      className="text-xs font-bold text-purple hover:underline inline-flex items-center gap-1 cursor-pointer bg-transparent border-0"
                    >
                      <span>View All Orders ({displayedOrders.length})</span>
                      <ArrowUpRight size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {displayedOrders.length === 0 ? (
                      <div className="col-span-full p-8 text-center bg-soft/40 rounded-2xl border border-dashed border-border text-ink/50 text-xs">
                        No active orders. Hire a creator from your proposals to launch a milestone contract.
                      </div>
                    ) : (
                      displayedOrders.slice(0, 3).map((order) => (
                        <div
                          key={order.id}
                          className="bg-soft/60 rounded-[20px] p-4 border border-border/50 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-sm text-ink truncate">{order.freelancerName}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple/10 text-purple uppercase">
                                {order.paymentStatus}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-ink/70 mb-2 truncate">{order.projectTitle}</p>
                            <div className="w-full h-2 bg-border rounded-full overflow-hidden mb-2">
                              <div className="h-full gradient-primary rounded-full" style={{ width: `${order.progress}%` }} />
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                            <span className="font-bold text-ink">{order.budget}</span>
                            <button
                              onClick={() => navigate(`/workspace?id=${order.id}`)}
                              className="text-purple font-bold hover:underline cursor-pointer bg-transparent border-0"
                            >
                              Workspace →
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {/* D. Recent Activity Notifications */}
                {activities.length > 0 && (
                  <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display text-lg font-bold text-ink">
                        Recent Activity
                      </h2>
                      <span className="text-xs text-ink/50">{activities.length} notifications</span>
                    </div>
                    <div className="divide-y divide-border/40">
                      {activities.slice(0, 5).map((act: any, idx: number) => (
                        <div key={act._id || idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-purple/10 text-purple flex items-center justify-center shrink-0">
                              <Bell size={14} />
                            </div>
                            <div>
                              <p className="font-semibold text-ink">{act.title || act.description}</p>
                              <span className="text-[11px] text-ink/40">
                                {act.createdAt ? new Date(act.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )
          )}
        </div>
      </main>

      {/* ====================================================
          MODAL: PROPOSAL REVIEW / APPLICATION DETAILS MODAL
          ==================================================== */}
      <Dialog open={proposalModalOpen} onOpenChange={setProposalModalOpen}>
        <DialogContent className="sm:max-w-3xl md:max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto bg-white rounded-[28px] p-6 sm:p-8 border border-border shadow-2xl">
          {selectedProposal && (
            isFreelancer ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-purple font-bold text-xs uppercase tracking-wider bg-purple/10 px-3 py-1 rounded-full">
                      My Pitch Details
                    </span>
                    <span className="text-xs text-ink/50 font-medium">
                      Application ID: {selectedProposal.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-xs px-3 py-1 rounded-full shadow-xs uppercase ${
                      selectedProposal.status === 'accepted'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedProposal.status === 'rejected'
                          ? 'bg-coral/10 text-coral'
                          : 'bg-amber-100 text-amber-800'
                    }`}>
                      Status: {selectedProposal.status === 'pending' ? 'Under Review' : selectedProposal.status}
                    </span>
                  </div>
                </div>

                <div className="bg-purple/5 border border-purple/15 rounded-[22px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-[18px] flex items-center justify-center font-clash font-bold text-xl text-ink shrink-0 shadow-sm ring-4 ring-white"
                      style={{ backgroundColor: selectedProposal.avatarBg }}
                    >
                      {selectedProposal.initials}
                    </div>
                    <div>
                      <h3 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight leading-tight">
                        {selectedProposal.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-ink/80 mt-1.5 font-medium">
                        <span>Hirer / Client:</span>
                        <span className="font-bold text-ink text-sm">{selectedProposal.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left md:text-right shrink-0 bg-white/90 p-3.5 rounded-2xl border border-border">
                    <span className="text-[11px] uppercase tracking-wider text-ink/50 font-bold block">Your Proposed Price</span>
                    <span className="font-display text-2xl sm:text-3xl font-bold text-ink leading-none block mt-0.5">
                      {selectedProposal.price}
                    </span>
                    <span className="text-xs text-ink/60 font-medium mt-1 flex items-center gap-1 md:justify-end">
                      <Clock size={12} className="text-purple" />
                      <span>Est. {selectedProposal.timeline}</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="bg-soft/70 p-5 sm:p-6 rounded-[22px] border border-border">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink mb-2.5">
                      <Sparkles size={14} className="text-purple" />
                      <span>Your Submitted Proposal & Pitch</span>
                    </div>
                    <blockquote className="text-sm text-ink/80 leading-relaxed italic border-l-3 border-purple pl-4 my-1">
                      "{selectedProposal.coverLetter || 'No cover letter provided.'}"
                    </blockquote>
                  </div>

                  {selectedProposal.skills && selectedProposal.skills.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-ink">
                        Skills Highlighted
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProposal.skills.map((s: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-xs bg-white text-ink font-semibold px-3 py-1 rounded-full border border-border"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 pt-5 border-t border-border">
                  <button
                    onClick={() => setProposalModalOpen(false)}
                    className="btn-secondary !py-2.5 !px-5"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setProposalModalOpen(false);
                      handleOpenDirectChat(selectedProposal);
                    }}
                    className="btn-primary !py-2.5 !px-6"
                  >
                    <MessageSquare size={16} />
                    <span>Message Hirer</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-purple font-bold text-xs uppercase tracking-wider bg-purple/10 px-3 py-1 rounded-full">
                      Candidate Proposal Review
                    </span>
                    <span className="text-xs text-ink/50 font-medium">
                      ID: {selectedProposal.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-3 py-1 rounded-full shadow-xs uppercase">
                      Status: {selectedProposal.status}
                    </span>
                  </div>
                </div>

                <div className="bg-purple/5 border border-purple/15 rounded-[22px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-[18px] flex items-center justify-center font-clash font-bold text-xl text-ink shrink-0 shadow-sm ring-4 ring-white"
                      style={{ backgroundColor: selectedProposal.avatarBg }}
                    >
                      {selectedProposal.initials}
                    </div>
                    <div>
                      <h3 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight leading-tight">
                        {selectedProposal.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-ink/80 mt-1.5 font-medium">
                        <span className="font-bold text-ink text-sm">{selectedProposal.name}</span>
                        <span>·</span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                          Verified Applicant
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left md:text-right shrink-0 bg-white/90 p-3.5 rounded-2xl border border-border">
                    <span className="text-[11px] uppercase tracking-wider text-ink/50 font-bold block">Proposed Fixed Price</span>
                    <span className="font-display text-2xl sm:text-3xl font-bold text-ink leading-none block mt-0.5">
                      {selectedProposal.price}
                    </span>
                    <span className="text-xs text-ink/60 font-medium mt-1 flex items-center gap-1 md:justify-end">
                      <Clock size={12} className="text-purple" />
                      <span>Est. {selectedProposal.timeline}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 space-y-5">
                    <div className="bg-soft/70 p-5 sm:p-6 rounded-[22px] border border-border">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink mb-2.5">
                        <Sparkles size={14} className="text-purple" />
                        <span>Candidate Cover Note & Approach</span>
                      </div>
                      <blockquote className="text-sm text-ink/80 leading-relaxed italic border-l-3 border-purple pl-4 my-1">
                        "{selectedProposal.coverLetter || 'No cover note provided.'}"
                      </blockquote>
                    </div>

                    {selectedProposal.skills && selectedProposal.skills.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-ink">
                          Relevant Skills & Tools
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedProposal.skills.map((s: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs bg-white text-ink font-semibold px-3 py-1 rounded-full border border-border"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-purple/5 p-5 rounded-[22px] border border-purple/20 shadow-xs space-y-4">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                        <ShieldCheck size={18} className="text-emerald-600" />
                        <span>100% Escrow Protection</span>
                      </div>
                      <p className="text-xs text-ink/80 leading-relaxed font-medium">
                        Your milestone deposit remains securely in GigMatch Escrow. Funds are released only after you review and approve every deliverable.
                      </p>
                      <div className="space-y-2 pt-2 border-t border-border text-xs text-ink/90">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span>Direct 1-on-1 sprint chat included</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span>Unlimited revisions within scope</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span>Full commercial rights & source files</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-soft p-4 rounded-[20px] border border-border text-xs space-y-2">
                      <div className="font-bold text-ink/80 flex items-center justify-between">
                        <span>Creator Velocity</span>
                        <span className="text-emerald-600 font-semibold">Ready to start</span>
                      </div>
                      <div className="flex justify-between text-ink/60">
                        <span>Response time:</span>
                        <span className="font-medium text-ink">~5 minutes</span>
                      </div>
                      <div className="flex justify-between text-ink/60">
                        <span>On-time delivery:</span>
                        <span className="font-medium text-ink">100%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-5 border-t border-border">
                  <div className="text-xs text-ink/50 font-medium">
                    Need clarification before committing? Start a quick chat.
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => handleOpenDirectChat(selectedProposal)}
                      className="btn-secondary w-full sm:w-auto !py-2.5 !px-5"
                    >
                      <MessageSquare size={16} />
                      <span>Message First</span>
                    </button>
                    <button
                      onClick={() => handleAcceptProposal(selectedProposal.id)}
                      disabled={acceptingId === selectedProposal.id}
                      className="btn-primary w-full sm:w-auto !py-2.5 !px-6 disabled:opacity-50"
                    >
                      <ShieldCheck size={16} />
                      <span>{acceptingId === selectedProposal.id ? 'Securing Escrow...' : 'Accept Proposal & Hire'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>

      {/* ====================================================
          MODAL: DIRECT CHAT WITH FREELANCER
          ==================================================== */}
      <Dialog open={directChatOpen} onOpenChange={setDirectChatOpen}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl w-[95vw] h-[85vh] max-h-[720px] flex flex-col p-0 overflow-hidden rounded-[28px] bg-white border border-border shadow-2xl">
          {activeChatFreelancer && (
            <div className="flex flex-col h-full">
              <div className="p-4 sm:p-5 border-b border-border bg-paper flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-[14px] flex items-center justify-center font-clash font-bold text-sm text-ink shrink-0 shadow-xs ring-2 ring-white"
                    style={{ backgroundColor: activeChatFreelancer.avatarBg }}
                  >
                    {activeChatFreelancer.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-ink truncate">
                        {activeChatFreelancer.name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                      </span>
                    </div>
                    <div className="text-xs text-ink/60 truncate mt-0.5 flex items-center gap-1.5">
                      <span>{activeChatFreelancer.role}</span>
                      <span>·</span>
                      <span className="text-purple font-semibold">{activeChatFreelancer.price}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAcceptProposal(activeChatFreelancer.id)}
                    disabled={acceptingId === activeChatFreelancer.id}
                    className="btn-primary !py-2 !px-4 !text-xs disabled:opacity-50"
                  >
                    <ShieldCheck size={13} />
                    <span>Hire Candidate</span>
                  </button>
                </div>
              </div>

              <div className="bg-purple/5 px-4 py-2 text-xs border-b border-purple/10 flex items-center justify-between">
                <span className="text-purple font-semibold truncate">
                  Discussing: <strong>{activeChatFreelancer.title}</strong>
                </span>
                <span className="text-ink/50 text-[11px] shrink-0 ml-2">
                  Est. {activeChatFreelancer.timeline}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-paper">
                <div className="text-center my-2">
                  <span className="inline-block bg-white text-ink/60 text-[11px] font-medium px-3.5 py-1 rounded-full border border-border">
                    Direct conversation started with {activeChatFreelancer.name}
                  </span>
                </div>

                {(chatConversations[activeChatFreelancer.id || activeChatFreelancer.name] || []).map((msg) => {
                  const isMe = msg.sender === 'me';
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%]">
                        {!isMe && (
                          <div
                            className="w-7 h-7 rounded-[9px] flex items-center justify-center font-clash font-bold text-[10px] text-ink shrink-0 mb-1"
                            style={{ backgroundColor: activeChatFreelancer.avatarBg }}
                          >
                            {activeChatFreelancer.initials}
                          </div>
                        )}
                        <div
                          className={`p-3.5 rounded-[18px] text-xs sm:text-sm leading-relaxed shadow-xs ${
                            isMe
                              ? 'gradient-primary text-white rounded-br-xs'
                              : 'bg-white text-ink border border-border rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          <span
                            className={`text-[10px] mt-1.5 block text-right font-medium ${
                              isMe ? 'text-white/70' : 'text-ink/40'
                            }`}
                          >
                            {msg.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex items-center gap-2 text-xs text-ink/50 italic py-1">
                    <div
                      className="w-6 h-6 rounded-[8px] flex items-center justify-center font-clash font-bold text-[10px] text-ink shrink-0"
                      style={{ backgroundColor: activeChatFreelancer.avatarBg }}
                    >
                      {activeChatFreelancer.initials}
                    </div>
                    <span>{activeChatFreelancer.name} is typing...</span>
                  </div>
                )}
              </div>

              <div className="px-4 py-2 bg-white border-t border-border flex items-center gap-2 overflow-x-auto flex-nowrap">
                <span className="text-[11px] font-bold text-ink/40 uppercase tracking-wider shrink-0">
                  Quick Ask:
                </span>
                {[
                  'When can you start?',
                  'Can you share sample portfolio files?',
                  'Can we do a quick sync?',
                  'Are revisions included?'
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendChatMessage(prompt)}
                    className="shrink-0 text-xs bg-soft hover:bg-purple/10 hover:text-purple text-ink/75 px-3 py-1 rounded-full font-medium transition-colors cursor-pointer border border-border"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="p-3 sm:p-4 bg-white border-t border-border shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChatMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatInputValue}
                    onChange={(e) => setChatInputValue(e.target.value)}
                    placeholder={`Type your message to ${activeChatFreelancer.name}...`}
                    className="flex-1 bg-soft border border-border rounded-full px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-purple focus:bg-white transition-all text-ink"
                  />
                  <button
                    type="submit"
                    disabled={!chatInputValue.trim()}
                    className="btn-primary !py-2.5 !px-4 !text-xs sm:!text-sm disabled:opacity-40"
                  >
                    <span>Send</span>
                    <Send size={14} />
                  </button>
                </form>
                <div className="text-[10px] text-center text-ink/40 mt-2 font-medium">
                  🔒 GigMatch Secure Messaging · Keep communications and payments on-platform for 100% escrow protection
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ====================================================
          MODAL: WORKSPACE & COLLABORATION
          ==================================================== */}
      <Dialog open={workspaceModalOpen} onOpenChange={setWorkspaceModalOpen}>
        <DialogContent className="max-w-3xl bg-white rounded-[28px] p-6 border border-border shadow-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <span className="text-purple font-bold text-xs uppercase tracking-wider">
                Employer Live Workspace
              </span>
              <span className="bg-purple/10 text-purple font-bold text-xs px-2.5 py-0.5 rounded-full uppercase">
                {selectedWorkspaceOrder?.status || 'Active Sprint'}
              </span>
            </div>
            <DialogTitle className="font-display text-2xl font-bold text-ink mt-1">
              {selectedWorkspaceOrder?.title || 'Aurora Brand System'}
            </DialogTitle>
            <DialogDescription className="text-xs text-ink/60">
              Collaborator: {selectedWorkspaceOrder?.collaborator || 'Studio Morrow'} · Due: {selectedWorkspaceOrder?.dueDate || 'Aug 28'} · Total Budget: {selectedWorkspaceOrder?.budget || '₹8,000'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-2">
            <div className="md:col-span-5 bg-soft rounded-[20px] p-4 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-ink">
                Milestone Progress
              </h4>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-border flex items-center justify-between">
                  <div>
                    <div className="font-bold">1. Creative Direction & Moodboard</div>
                    <div className="text-[11px] text-emerald-600 font-medium">Approved & Released</div>
                  </div>
                  <CheckCircle2 size={16} className="text-emerald-500" />
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-purple/30 ring-1 ring-purple/20 flex items-center justify-between">
                  <div>
                    <div className="font-bold">2. Design System Components</div>
                    <div className="text-[11px] text-purple font-medium">Under Review (Friday)</div>
                  </div>
                  <Clock size={16} className="text-purple" />
                </div>
                <div className="p-2.5 rounded-xl bg-white/60 border border-border flex items-center justify-between opacity-70">
                  <div>
                    <div className="font-bold">3. Final Delivery & Source Files</div>
                    <div className="text-[11px] text-ink/40">Upcoming</div>
                  </div>
                  <div className="w-4 h-4 rounded-full border border-border" />
                </div>
              </div>
            </div>

            <div className="md:col-span-7 border border-border rounded-[20px] p-4 flex flex-col justify-between bg-paper">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-ink mb-3 flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-purple" />
                  <span>Workspace Channel</span>
                </h4>
                <div className="space-y-2.5 text-xs mb-4">
                  <div className="bg-white p-3 rounded-2xl rounded-tl-sm border border-border max-w-[85%] shadow-xs">
                    <span className="font-bold text-[11px] text-purple block mb-0.5">Studio Morrow</span>
                    We've uploaded the draft vector components to the shared Figma library. Review is open for Milestone 2!
                  </div>
                  <div className="gradient-primary text-white p-3 rounded-2xl rounded-tr-sm ml-auto max-w-[85%] shadow-xs">
                    <span className="font-bold text-[11px] text-white/80 block mb-0.5">You ({displayName})</span>
                    Looks incredible. The custom typography pairing feels bold and distinct. Reviewing with team now!
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border">
                <input
                  type="text"
                  placeholder="Type a message or share link..."
                  className="flex-1 bg-white border border-border rounded-full px-4 py-2 text-xs focus:outline-none focus:border-purple"
                />
                <button
                  onClick={() => toast.success('Message sent to workspace channel')}
                  className="btn-primary !p-2 !rounded-full"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ====================================================
          MODAL: VIEW REVIEW DETAIL MODAL
          ==================================================== */}
      <Dialog open={reviewDetailModalOpen} onOpenChange={setReviewDetailModalOpen}>
        <DialogContent className="max-w-xl bg-white rounded-[28px] p-6 sm:p-7 border border-border shadow-2xl">
          {selectedReviewDetail && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <span className="eyebrow text-purple">VERIFIED REVIEW</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/50">
                    <Star size={12} className="fill-amber-500 text-amber-500" />
                    {selectedReviewDetail.ratingGiven}.0 ★ Rating Given
                  </span>
                </div>
                <DialogTitle className="font-display text-2xl font-bold text-ink mt-2">
                  {selectedReviewDetail.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-ink/60">
                  Completed on {selectedReviewDetail.completionDate} · Total Contract: {selectedReviewDetail.budget}
                </DialogDescription>
              </DialogHeader>

              {/* Freelancer Header */}
              <div className="flex items-center gap-3 p-3.5 bg-soft rounded-2xl border border-border/70">
                <div
                  className="w-11 h-11 rounded-[14px] flex items-center justify-center font-clash font-bold text-sm text-ink shrink-0 shadow-xs ring-2 ring-white"
                  style={{ backgroundColor: selectedReviewDetail.avatarBg }}
                >
                  {selectedReviewDetail.initials}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-ink">{selectedReviewDetail.freelancerName}</h4>
                  <p className="text-xs text-ink/50">{selectedReviewDetail.freelancerRole}</p>
                </div>
              </div>

              {/* Review Text */}
              <div className="bg-purple/5 p-4 rounded-2xl border border-purple/15">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple block mb-1.5">
                  Employer Feedback & Endorsement
                </span>
                <p className="text-sm text-ink/80 leading-relaxed italic">
                  "{selectedReviewDetail.reviewText}"
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  onClick={() => setReviewDetailModalOpen(false)}
                  className="btn-secondary !py-2 !px-5 !text-xs"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setReviewDetailModalOpen(false);
                    navigate('/post-gig');
                  }}
                  className="btn-primary !py-2 !px-5 !text-xs"
                >
                  <span>Hire Again</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ====================================================
          MODAL: WRITE REVIEW MODAL
          ==================================================== */}
      <Dialog open={writeReviewModalOpen} onOpenChange={setWriteReviewModalOpen}>
        <DialogContent className="max-w-xl bg-white rounded-[28px] p-6 sm:p-7 border border-border shadow-2xl">
          {targetReviewProject && (
            <div className="space-y-5">
              <DialogHeader>
                <span className="eyebrow text-purple">LEAVE CLIENT REVIEW</span>
                <DialogTitle className="font-display text-2xl font-bold text-ink mt-1">
                  Rate {targetReviewProject.freelancerName}
                </DialogTitle>
                <DialogDescription className="text-xs text-ink/60">
                  For milestone deliverables on "{targetReviewProject.projectName}" ({targetReviewProject.budget})
                </DialogDescription>
              </DialogHeader>

              {/* Rating selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-2">
                  Overall Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setInputRating(star)}
                      className="p-1 text-2xl transition-transform hover:scale-110 cursor-pointer border-0 bg-transparent"
                    >
                      <Star
                        size={28}
                        className={star <= inputRating ? 'fill-amber-500 text-amber-500' : 'text-border'}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-display font-bold text-lg text-ink">
                    {inputRating}.0 / 5.0
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-2">
                  Feedback & Testimonial
                </label>
                <textarea
                  rows={4}
                  value={inputReviewText}
                  onChange={(e) => setInputReviewText(e.target.value)}
                  placeholder={`Write about ${targetReviewProject.freelancerName}'s communication, design quality, and speed...`}
                  className="w-full bg-soft border border-border rounded-2xl p-4 text-xs sm:text-sm font-medium text-ink focus:outline-none focus:border-purple leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setWriteReviewModalOpen(false)}
                  className="btn-secondary !py-2 !px-4 !text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  className="btn-primary !py-2 !px-5 !text-xs"
                >
                  <Check size={14} />
                  <span>Publish Review</span>
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ====================================================
          MODAL: EDIT GIG BRIEF MODAL
          ==================================================== */}
      <Dialog open={editGigModalOpen} onOpenChange={setEditGigModalOpen}>
        <DialogContent className="max-w-lg bg-white rounded-[28px] p-6 sm:p-7 border border-border shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-purple font-bold text-xs uppercase tracking-wider">
              <Edit3 size={14} />
              <span>Project Brief Settings</span>
            </div>
            <DialogTitle className="font-display text-2xl font-bold text-ink mt-1">
              Edit Project Brief
            </DialogTitle>
            <DialogDescription className="text-xs text-ink/60">
              Update details, category, budget, or active status for this listing.
            </DialogDescription>
          </DialogHeader>

          {editingGig && (
            <form onSubmit={handleSaveEditedGig} className="space-y-4 mt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1.5">
                  Brief Title
                </label>
                <input
                  type="text"
                  required
                  value={editGigTitle}
                  onChange={(e) => setEditGigTitle(e.target.value)}
                  className="w-full bg-soft border border-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-ink focus:outline-none focus:border-purple"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1.5">
                    Category
                  </label>
                  <select
                    value={editGigCategory}
                    onChange={(e) => setEditGigCategory(e.target.value)}
                    className="w-full bg-soft border border-border rounded-xl px-3 py-2.5 text-xs font-medium text-ink focus:outline-none focus:border-purple cursor-pointer"
                  >
                    <option value="graphic-design">Design & Creative</option>
                    <option value="video-editing">Video & Animation</option>
                    <option value="content-writing">Content & Writing</option>
                    <option value="coding">Development & IT</option>
                    <option value="tutoring">Education & Tutoring</option>
                    <option value="others">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1.5">
                    Budget (₹ INR)
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={editGigBudget}
                    onChange={(e) => setEditGigBudget(e.target.value)}
                    className="w-full bg-soft border border-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-ink focus:outline-none focus:border-purple"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1.5">
                  Project Status
                </label>
                <select
                  value={editGigStatus}
                  onChange={(e) => setEditGigStatus(e.target.value)}
                  className="w-full bg-soft border border-border rounded-xl px-3 py-2.5 text-xs font-medium text-ink focus:outline-none focus:border-purple cursor-pointer"
                >
                  <option value="open">Active Brief (Open for Proposals)</option>
                  <option value="in-progress">In Progress (Active Sprint)</option>
                  <option value="completed">Completed (Delivered)</option>
                  <option value="closed">Closed (Archived)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-5">
                <button
                  type="button"
                  onClick={() => setEditGigModalOpen(false)}
                  className="btn-secondary !py-2 !px-4 !text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGig}
                  className="btn-primary !py-2 !px-5 !text-xs"
                >
                  {savingGig ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
