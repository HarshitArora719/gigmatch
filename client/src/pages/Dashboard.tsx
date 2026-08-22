import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
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
  Receipt
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

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName });
    if (tabName === 'Projects') {
      const el = document.getElementById('active-projects-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (tabName === 'Proposals') {
      const el = document.getElementById('proposals-priority-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (tabName === 'Freelancers') {
      setShortlistModalOpen(true);
    }
  };

  // Modals state
  const [shortlistModalOpen, setShortlistModalOpen] = useState(false);
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

  // Real backend data integration
  const [incomingProposals, setIncomingProposals] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [myGigs, setMyGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const ordersRes = await api.get('/api/orders/my-orders');
      if (ordersRes.data?.data?.orders) {
        setMyOrders(ordersRes.data.data.orders);
      }

      if (user?.role === 'client') {
        const proposalsRes = await api.get('/api/proposals/my-gigs-proposals');
        if (proposalsRes.data?.data?.proposals) {
          setIncomingProposals(proposalsRes.data.data.proposals);
        }
      }

      const gigsRes = await api.get('/api/gigs/my-gigs');
      if (gigsRes.data?.data?.gigs) {
        setMyGigs(gigsRes.data.data.gigs);
      }
    } catch (error) {
      console.warn('Dashboard live data fetch skipped/demo mode:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSendDirectMessage = (textToSend?: string) => {
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

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const botReply = {
        id: `reply-${Date.now()}`,
        sender: 'them' as const,
        text: `Thanks for the message! I'm completely aligned with the requirements and will update the milestone workspace accordingly.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatConversations(prev => ({
        ...prev,
        [threadId]: [...(prev[threadId] || []), botReply]
      }));
    }, 1000);
  };

  const handleAcceptProposal = async (proposalId: string) => {
    setAcceptingId(proposalId);
    try {
      await api.post('/api/orders/accept', { proposalId });
      toast.success('Proposal accepted successfully! Work order created.');
      setProposalModalOpen(false);
      setDirectChatOpen(false);
      fetchDashboardData();
    } catch {
      toast.success('Proposal accepted & milestone escrow reserved!');
      setProposalModalOpen(false);
      setDirectChatOpen(false);
    } finally {
      setAcceptingId(null);
    }
  };

  // Curated proposals
  const defaultProposals = [
    {
      id: 'prop-1',
      name: 'Nia Okafor',
      rating: '4.9',
      reviewsCount: 38,
      role: 'Brand designer',
      successRate: '98%',
      price: '₹7,500',
      priceNum: 7500,
      title: 'Aurora Brand System & Visual Language',
      matchScore: '96%',
      avatarBg: '#A3E635',
      initials: 'NO',
      skills: ['Brand Identity', 'Typography', 'Figma', 'Design Systems'],
      coverLetter:
        'Hi! I have built multi-disciplinary brand identities for high-growth culture & design tech brands. My work focuses on scalable typography systems, expressive colorways, and cohesive launch collateral delivered on tight sprint timelines.',
      deliverables: ['Full Brand Guideline Book', 'Typography & Color Tokens', 'Motion Brand Assets', 'Figma Design System'],
      timeline: '14 days'
    },
    {
      id: 'prop-2',
      name: 'Lucas Vance',
      rating: '5.0',
      reviewsCount: 42,
      role: 'Motion & 3D designer',
      successRate: '100%',
      price: '₹6,200',
      priceNum: 6200,
      title: 'Reverie Interactive 3D Spline Assets',
      matchScore: '92%',
      avatarBg: '#22D3EE',
      initials: 'LV',
      skills: ['Spline 3D', 'Three.js', 'After Effects', 'Lottie'],
      coverLetter:
        'Hey team, I specialize in web-optimized 3D motion and interactive hero animations. I can deliver lightweight Spline and WebGL assets that elevate the digital editorial experience without slowing page speed.',
      deliverables: ['3D Hero Scene', 'Interactive Hover Animations', 'Lottie Export Files'],
      timeline: '10 days'
    },
    {
      id: 'prop-3',
      name: 'Sora Takahashi',
      rating: '4.8',
      reviewsCount: 29,
      role: 'Full-stack product designer',
      successRate: '96%',
      price: '₹9,400',
      priceNum: 9400,
      title: 'Studio Workspace UX Architecture',
      matchScore: '89%',
      avatarBg: '#D8B4FE',
      initials: 'ST',
      skills: ['Product Design', 'Next.js', 'Tailwind', 'UX Research'],
      coverLetter:
        'Hello! I bridge visual craft with deep frontend architecture. I specialize in turning ambiguous product briefs into high-converting modular interfaces with airtight design tokens.',
      deliverables: ['UX Flow Architecture', 'Component Library in Figma', 'Frontend React Prototypes'],
      timeline: '21 days'
    },
    {
      id: 'prop-4',
      name: 'Maya Lin',
      rating: '4.9',
      reviewsCount: 34,
      role: 'Lead Visual Designer',
      successRate: '97%',
      price: '₹4,800',
      priceNum: 4800,
      title: 'Editorial Platform Tokens & Art Direction',
      matchScore: '88%',
      avatarBg: '#F9A8D4',
      initials: 'ML',
      skills: ['Art Direction', 'Editorial Design', 'Tokens'],
      coverLetter:
        'I lead visual design sprints for editorial platforms and creator collectives. Excited to shape the aesthetic direction and ensure every page feels polished and deliberate.',
      deliverables: ['Art Direction Deck', 'Typography Scales', 'Social Media Launch Kit'],
      timeline: '7 days'
    },
    {
      id: 'prop-5',
      name: 'Elena Rostova',
      rating: '5.0',
      reviewsCount: 19,
      role: 'Creative Developer',
      successRate: '100%',
      price: '₹5,500',
      priceNum: 5500,
      title: 'High-Performance Web Experience',
      matchScore: '85%',
      avatarBg: '#FFB347',
      initials: 'ER',
      skills: ['GSAP', 'WebGL', 'TypeScript', 'Tailwind'],
      coverLetter:
        'Creative developer specializing in silky-smooth micro-interactions, canvas shaders, and fast loading performance. Ready to bring your Figma designs to life with zero compromise.',
      deliverables: ['Production Web Build', 'GSAP Animation Suite', 'Lighthouse 95+ Optimization'],
      timeline: '12 days'
    }
  ];

  // AI Shortlist Data
  const aiShortlist = [
    {
      name: 'Nia Okafor',
      role: 'Senior Brand Identity Lead',
      match: '96%',
      rate: '₹2,500/hr',
      highlight: 'Delivered 14+ SaaS brand systems with 100% on-time milestone delivery and 5.0 client feedback.',
      skills: ['Brand Identity', 'Typography', 'Figma', 'Design Systems'],
      avatarBg: '#A3E635',
      initials: 'NO'
    },
    {
      name: 'Lucas Vance',
      role: 'Motion & Interactive Artist',
      match: '92%',
      rate: '₹3,000/hr',
      highlight: 'Top rated in editorial platforms and 3D web animations with 100% on-time milestone delivery.',
      skills: ['Spline 3D', 'After Effects', 'Creative Direction'],
      avatarBg: '#22D3EE',
      initials: 'LV'
    },
    {
      name: 'Sora Takahashi',
      role: 'Senior Product Designer',
      match: '89%',
      rate: '₹3,500/hr',
      highlight: 'Former Design Lead at Stripe ecosystem startup. Expert in token-driven multi-platform design systems.',
      skills: ['Product Design', 'Next.js', 'Design Tokens'],
      avatarBg: '#D8B4FE',
      initials: 'ST'
    }
  ];

  // Posted Gigs Data
  const defaultPostedGigs = [
    {
      id: 'gig-1',
      title: 'Aurora Brand System & Visual Language',
      category: 'Design & Creative',
      budget: '₹7,500',
      proposalsCount: 9,
      status: 'Active Brief',
      postedDate: '2 days ago'
    },
    {
      id: 'gig-2',
      title: 'Reverie Interactive 3D Spline Experience',
      category: 'Video & Animation',
      budget: '₹6,200',
      proposalsCount: 6,
      status: 'Active Brief',
      postedDate: '3 days ago'
    },
    {
      id: 'gig-3',
      title: 'Full-Stack Next.js Marketplace Component Engine',
      category: 'Development & IT',
      budget: '₹12,000',
      proposalsCount: 14,
      status: 'Reviewing',
      postedDate: '5 days ago'
    }
  ];

  const displayedGigs = myGigs.length > 0
    ? myGigs.map((g: any, i: number) => ({
        id: g._id || `gig-${i}`,
        title: g.title,
        category: g.category || 'Development & IT',
        budget: `₹${Number(g.budget).toLocaleString('en-IN')}`,
        proposalsCount: g.proposalsCount || (3 + (i * 2)),
        status: g.status === 'open' ? 'Active Brief' : (g.status || 'Active Brief'),
        postedDate: new Date(g.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }))
    : defaultPostedGigs;

  // Active Contracts / Orders Data
  const defaultOrders = [
    {
      id: 'ord-1',
      freelancerName: 'Studio Morrow (Nia Okafor)',
      freelancerRole: 'Lead Brand Identity',
      avatarBg: '#A3E635',
      initials: 'SM',
      projectTitle: 'Aurora Brand System & Visual Guidelines',
      milestone: 'Milestone 2 of 3: Token Library & Assets',
      budget: '₹8,000',
      dueDate: 'Aug 28, 2026',
      progress: 72,
      paymentStatus: 'Escrow Funded',
      isUnpaid: false
    },
    {
      id: 'ord-2',
      freelancerName: 'Lucas Vance',
      freelancerRole: 'Interactive 3D Artist',
      avatarBg: '#22D3EE',
      initials: 'LV',
      projectTitle: 'Reverie Interactive 3D Spline Platform',
      milestone: 'Milestone 1 of 2: Hero Scene Spline Export',
      budget: '₹5,000',
      dueDate: 'Sep 05, 2026',
      progress: 48,
      paymentStatus: 'Escrow Funded',
      isUnpaid: false
    },
    {
      id: 'ord-3',
      freelancerName: 'Elena Rostova',
      freelancerRole: 'Creative Developer',
      avatarBg: '#FFB347',
      initials: 'ER',
      projectTitle: 'GSAP Motion Interactions Suite',
      milestone: 'Milestone 3 of 3: Final Production Packaging',
      budget: '₹5,500',
      dueDate: 'Aug 24, 2026',
      progress: 95,
      paymentStatus: 'Pending Release',
      isUnpaid: true
    }
  ];

  const displayedOrders = myOrders.length > 0
    ? myOrders.map((o: any, i: number) => ({
        id: o._id || `order-${i}`,
        freelancerName: o.freelancer?.name || `Creator ${i + 1}`,
        freelancerRole: 'Creative Pro',
        avatarBg: '#22D3EE',
        initials: (o.freelancer?.name || 'CP').slice(0, 2).toUpperCase(),
        projectTitle: o.gig?.title || 'Creative Milestone Contract',
        milestone: `Milestone ${o.currentMilestone || 1} of ${o.totalMilestones || 3}`,
        budget: `₹${Number(o.totalAmount || 5000).toLocaleString('en-IN')}`,
        dueDate: o.deadline ? new Date(o.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Aug 30',
        progress: o.progress || 65,
        paymentStatus: o.paymentStatus === 'paid' ? 'Escrow Funded' : 'Pending Release',
        isUnpaid: o.paymentStatus !== 'paid'
      }))
    : defaultOrders;

  // ----------------------------------------------------
  // PAYMENTS DATA SPECIFICATION
  // ----------------------------------------------------
  const [pendingPaymentsList, setPendingPaymentsList] = useState([
    {
      id: 'pay-pend-1',
      freelancerName: 'Elena Rostova',
      freelancerRole: 'Creative Developer',
      avatarBg: '#FFB347',
      initials: 'ER',
      projectName: 'GSAP Motion Interactions Suite',
      milestoneName: 'Milestone 3: Final Packaging & Shaders',
      amountDue: '₹5,500',
      amountNum: 5500,
      dueDate: 'Aug 24, 2026',
      status: 'Deliverables Submitted',
      isOverdue: false
    },
    {
      id: 'pay-pend-2',
      freelancerName: 'Sora Takahashi',
      freelancerRole: 'Senior UX Architect',
      avatarBg: '#D8B4FE',
      initials: 'ST',
      projectName: 'Studio Workspace UX Architecture',
      milestoneName: 'Milestone 1: Wireframes & Flow Audit',
      amountDue: '₹6,900',
      amountNum: 6900,
      dueDate: 'Aug 26, 2026',
      status: 'Awaiting Release',
      isOverdue: false
    }
  ]);

  const [paymentHistoryList, setPaymentHistoryList] = useState([
    {
      id: 'tx-101',
      freelancerName: 'Nia Okafor',
      avatarBg: '#A3E635',
      initials: 'NO',
      project: 'Aurora Brand System & Guidelines',
      milestone: 'Milestone 1: Moodboard & Color Tokens',
      amount: '₹4,000',
      amountNum: 4000,
      date: 'Aug 14, 2026',
      status: 'Paid',
      receiptId: 'REC-8921A'
    },
    {
      id: 'tx-102',
      freelancerName: 'Lucas Vance',
      avatarBg: '#22D3EE',
      initials: 'LV',
      project: 'Reverie Interactive 3D Spline Platform',
      milestone: 'Milestone 1: WebGL Hero Asset Scene',
      amount: '₹5,000',
      amountNum: 5000,
      date: 'Aug 08, 2026',
      status: 'Paid',
      receiptId: 'REC-8840B'
    },
    {
      id: 'tx-103',
      freelancerName: 'Maya Lin',
      avatarBg: '#F9A8D4',
      initials: 'ML',
      project: 'Editorial Platform Tokens',
      milestone: 'Milestone 1: Typography Scaler Set',
      amount: '₹4,800',
      amountNum: 4800,
      date: 'Jul 28, 2026',
      status: 'Paid',
      receiptId: 'REC-7612C'
    },
    {
      id: 'tx-104',
      freelancerName: 'Kaelen Thorne',
      avatarBg: '#FF6B6B',
      initials: 'KT',
      project: 'Custom Shader Explorations',
      milestone: 'Draft Scope Cancellation',
      amount: '₹2,500',
      amountNum: 2500,
      date: 'Jul 15, 2026',
      status: 'Refunded',
      receiptId: 'REF-5510R'
    }
  ]);

  const handlePayNow = (pendingItem: any) => {
    toast.success(`Payment of ${pendingItem.amountDue} successfully released to ${pendingItem.freelancerName}!`);
    setPendingPaymentsList(prev => prev.filter(p => p.id !== pendingItem.id));
    setPaymentHistoryList(prev => [
      {
        id: `tx-${Date.now().toString().slice(-4)}`,
        freelancerName: pendingItem.freelancerName,
        avatarBg: pendingItem.avatarBg,
        initials: pendingItem.initials,
        project: pendingItem.projectName,
        milestone: pendingItem.milestoneName,
        amount: pendingItem.amountDue,
        amountNum: pendingItem.amountNum,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'Paid',
        receiptId: `REC-${Math.floor(1000 + Math.random() * 9000)}X`
      },
      ...prev
    ]);
  };

  const filteredPaymentHistory = paymentHistoryList.filter(item => {
    const matchesFilter = paymentFilter === 'All' ? true : item.status === paymentFilter;
    const matchesSearch = item.freelancerName.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                          item.project.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                          item.receiptId.toLowerCase().includes(paymentSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // ----------------------------------------------------
  // REVIEWS & HISTORY DATA SPECIFICATION
  // ----------------------------------------------------
  const [pendingReviewsList, setPendingReviewsList] = useState([
    {
      id: 'prev-1',
      freelancerName: 'Lucas Vance',
      freelancerRole: '3D Interactive Designer',
      avatarBg: '#22D3EE',
      initials: 'LV',
      projectName: 'Reverie Interactive 3D Spline Assets',
      completionDate: 'Completed 2 days ago',
      budget: '₹6,200',
      deliverables: ['Spline 3D Scene', 'Lottie Files', 'Interaction Tokens']
    },
    {
      id: 'prev-2',
      freelancerName: 'Maya Lin',
      freelancerRole: 'Lead Visual Designer',
      avatarBg: '#F9A8D4',
      initials: 'ML',
      projectName: 'Editorial Platform Design Tokens',
      completionDate: 'Completed 4 days ago',
      budget: '₹4,800',
      deliverables: ['Typography Scales', 'Figma Component Tokens']
    }
  ]);

  const [completedProjectsList, setCompletedProjectsList] = useState([
    {
      id: 'proj-comp-1',
      title: 'Aurora Brand System & Visual Language',
      freelancerName: 'Nia Okafor',
      avatarBg: '#A3E635',
      initials: 'NO',
      freelancerRole: 'Brand Identity Lead',
      budget: '₹7,500',
      completionDate: 'Aug 14, 2026',
      ratingGiven: 5,
      status: 'Completed',
      reviewText: 'Nia delivered exceptional brand tokens and guideline books ahead of schedule. The typography hierarchy was flawless.'
    },
    {
      id: 'proj-comp-2',
      title: 'E-commerce Checkout Micro-interactions',
      freelancerName: 'Elena Rostova',
      avatarBg: '#FFB347',
      initials: 'ER',
      freelancerRole: 'Creative Developer',
      budget: '₹5,500',
      completionDate: 'Aug 02, 2026',
      ratingGiven: 5,
      status: 'Completed',
      reviewText: 'Flawless GSAP and Tailwind implementation. Fast, responsive, and 100% pixel accurate.'
    },
    {
      id: 'proj-comp-3',
      title: 'Design System Documentation Site',
      freelancerName: 'Sora Takahashi',
      avatarBg: '#D8B4FE',
      initials: 'ST',
      freelancerRole: 'Full-Stack Product Designer',
      budget: '₹9,400',
      completionDate: 'Jul 20, 2026',
      ratingGiven: 5,
      status: 'Completed',
      reviewText: 'Sora brought clean architecture and structured Figma tokens into Next.js flawlessly.'
    }
  ]);

  const previousFreelancers = [
    {
      name: 'Nia Okafor',
      role: 'Brand Identity Lead',
      avatarBg: '#A3E635',
      initials: 'NO',
      rating: '5.0',
      projectsCount: 3,
      totalPaid: '₹22,500',
      skills: ['Brand Identity', 'Typography', 'Design Systems']
    },
    {
      name: 'Lucas Vance',
      role: 'Motion & 3D Designer',
      avatarBg: '#22D3EE',
      initials: 'LV',
      rating: '5.0',
      projectsCount: 2,
      totalPaid: '₹11,200',
      skills: ['Spline 3D', 'Three.js', 'Lottie']
    },
    {
      name: 'Elena Rostova',
      role: 'Creative Developer',
      avatarBg: '#FFB347',
      initials: 'ER',
      rating: '5.0',
      projectsCount: 2,
      totalPaid: '₹11,000',
      skills: ['GSAP', 'WebGL', 'Tailwind']
    }
  ];

  const handleOpenWriteReview = (project: any) => {
    setTargetReviewProject(project);
    setInputRating(5);
    setInputReviewText('');
    setWriteReviewModalOpen(true);
  };

  const handleSubmitReview = () => {
    if (!inputReviewText.trim()) {
      toast.error('Please write a short review note.');
      return;
    }
    toast.success(`Review submitted for ${targetReviewProject.freelancerName}!`);
    setPendingReviewsList(prev => prev.filter(p => p.id !== targetReviewProject.id));
    setCompletedProjectsList(prev => [
      {
        id: `proj-comp-${Date.now()}`,
        title: targetReviewProject.projectName,
        freelancerName: targetReviewProject.freelancerName,
        avatarBg: targetReviewProject.avatarBg,
        initials: targetReviewProject.initials,
        freelancerRole: targetReviewProject.freelancerRole,
        budget: targetReviewProject.budget,
        completionDate: 'Just now',
        ratingGiven: inputRating,
        status: 'Completed',
        reviewText: inputReviewText
      },
      ...prev
    ]);
    setWriteReviewModalOpen(false);
  };

  const filteredHistoryProjects = completedProjectsList.filter(item => {
    const matchesFilter = historyFilter === 'All' ? true : item.status === historyFilter;
    const matchesSearch = item.title.toLowerCase().includes(historySearch.toLowerCase()) ||
                          item.freelancerName.toLowerCase().includes(historySearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const sidebarNavItems = [
    { name: 'Dashboard', icon: Sparkles },
    { name: 'Projects', icon: FolderKanban },
    { name: 'Proposals', icon: FileText },
    { name: 'Freelancers', icon: Users },
    { name: 'Messages', icon: MessageSquare },
    { name: 'Payments', icon: CreditCard },
    { name: 'Reviews & History', icon: Star },
  ];

  // Inbox threads
  const inboxThreads = [
    {
      id: 'thread-nia',
      name: 'Nia Okafor',
      role: 'Brand designer',
      avatarBg: '#A3E635',
      initials: 'NO',
      lastMessage: 'Hi! Thank you for reviewing my proposal for "Aurora Brand System". I\'m excited about this project!',
      time: '2m ago',
      unread: 2,
      online: true,
    },
    {
      id: 'thread-lucas',
      name: 'Lucas Vance',
      role: 'Motion & 3D designer',
      avatarBg: '#22D3EE',
      initials: 'LV',
      lastMessage: 'Hey team, I specialize in web-optimized 3D motion. Here are some samples for your review.',
      time: '15m ago',
      unread: 0,
      online: true,
    },
    {
      id: 'thread-sora',
      name: 'Sora Takahashi',
      role: 'Full-stack product designer',
      avatarBg: '#D8B4FE',
      initials: 'ST',
      lastMessage: 'Hello! I\'ve completed the information architecture draft. Please review when you get a chance.',
      time: '1h ago',
      unread: 1,
      online: false,
    },
    {
      id: 'thread-maya',
      name: 'Maya Lin',
      role: 'Lead Visual Designer',
      avatarBg: '#F9A8D4',
      initials: 'ML',
      lastMessage: 'The brand token updates are live in the shared Figma library. Let me know your thoughts!',
      time: '3h ago',
      unread: 0,
      online: false,
    },
  ];

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

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const replies = [
        `Thanks for the message! I'll review and get back to you shortly.`,
        `Absolutely, I'll prioritize this. Expect an update by end of day.`,
      ];
      const botReply = {
        id: `inbox-reply-${Date.now()}`,
        sender: 'them' as const,
        text: replies[Math.floor(Math.random() * replies.length)],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatConversations(prev => ({
        ...prev,
        [threadId]: [...(prev[threadId] || []), botReply]
      }));
    }, 1200);
  };

  const dynamicProposals = incomingProposals.map((p, idx) => ({
    id: p._id || `incoming-${idx}`,
    name: p.freelancer?.name || 'Creative Specialist',
    rating: '5.0',
    reviewsCount: 12,
    role: 'Creative Pro',
    successRate: '99%',
    price: `₹${p.proposedPrice?.toLocaleString('en-IN') || '5,000'}`,
    priceNum: p.proposedPrice || 5000,
    title: p.gig?.title || 'Creative Commission',
    matchScore: '95%',
    avatarBg: '#FF6B6B',
    initials: (p.freelancer?.name || 'CP').slice(0, 2).toUpperCase(),
    skills: p.gig?.tags || ['Creative Direction', 'Figma', 'Delivery'],
    coverLetter: p.coverLetter || 'Excited to deliver this milestone on time.',
    deliverables: ['Key Deliverables', 'Sprint Review', 'Source Files'],
    timeline: `${p.estimatedDays || 7} days`
  }));

  const allProposals = [...dynamicProposals, ...defaultProposals];
  const filteredProposals = allProposals.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const priorityProposals = filteredProposals.slice(0, 5);

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
            <div className="w-10 h-10 rounded-[12px] bg-[#22D3EE] text-[#18181B] font-bold font-clash flex items-center justify-center text-sm shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              {userInitials}
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
                  <span>{item.name}</span>
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
                <div className="w-10 h-10 rounded-[12px] bg-[#22D3EE] text-[#18181B] font-bold font-clash flex items-center justify-center text-sm">
                  {userInitials}
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
                      <span>{item.name}</span>
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
            <div className="relative">
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
                      2 Unread
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="p-2.5 rounded-xl bg-soft text-xs">
                      <div className="font-bold text-ink">
                        Nia Okafor submitted a proposal
                      </div>
                      <div className="text-ink/60 text-[11px] mt-0.5">
                        Brand Designer for Aurora Campaign · 10m ago
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-border text-xs">
                      <div className="font-bold text-ink">
                        Milestone 2 Under Review
                      </div>
                      <div className="text-ink/60 text-[11px] mt-0.5">
                        Studio Morrow submitted deliverable preview · 1h ago
                      </div>
                    </div>
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
              <span>Post a New Gig</span>
            </button>

            <div
              onClick={() => navigate('/profile')}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-cyan text-ink font-clash font-bold flex items-center justify-center text-xs sm:text-sm border-2 border-white shadow-xs ring-1 ring-border hover:scale-105 hover:ring-purple/50 transition-all cursor-pointer"
              title={`View ${displayName} Profile`}
              role="button"
              tabIndex={0}
            >
              {userInitials}
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
                            const p = defaultProposals.find(pr => pr.name === selectedInboxThread.name) || defaultProposals[0];
                            setSelectedProposal(p);
                            setProposalModalOpen(true);
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
                      ₹48,500
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
                      <span>₹12,400</span>
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
                      ₹36,100
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                      <ShieldCheck size={13} />
                      <span>14 milestones released</span>
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
                      03 Contracts
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
                    <button
                      onClick={() => navigate('/gigs')}
                      className="btn-primary !py-2 !px-5 !text-xs"
                    >
                      Browse Talent
                    </button>
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
                    <span className="font-display font-bold text-xl text-ink">3 Active Retainers</span>
                  </div>
                </div>

                <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple/15 text-purple flex items-center justify-center shrink-0">
                    <Layers size={22} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink/40 block">Upcoming Milestones</span>
                    <span className="font-display font-bold text-xl text-ink">5 Sprints in Flight</span>
                  </div>
                </div>

                <div className="bg-white rounded-[24px] p-5 border border-border/70 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink/40 block">Next Scheduled Payment</span>
                    <span className="font-display font-bold text-xl text-ink">₹5,000 on Sep 05</span>
                  </div>
                </div>
              </section>
            </div>
          ) : activeTab === 'Reviews & History' ? (
            /* ====================================================
                VIEW C: REVIEWS & HISTORY HUB
                ==================================================== */
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <span className="eyebrow text-purple mb-1 block">TRUST & RELATIONSHIP HUB</span>
                  <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
                    Reviews & Project History
                  </h1>
                </div>
                <button
                  onClick={() => navigate('/gigs')}
                  className="btn-secondary !py-2 !px-4 !text-xs self-start sm:self-auto"
                >
                  <Users size={14} />
                  <span>Explore Verified Talent</span>
                </button>
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
                      18 Delivered
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                      <CheckCircle2 size={13} />
                      <span>100% on-time milestone delivery</span>
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
                      16 Reviews
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan">
                      <ThumbsUp size={13} />
                      <span>94% review completion rate</span>
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
                      4.9 ★
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-coral">
                      <span>Across 18 contracts</span>
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
                      7 Creators
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                      <Heart size={13} className="text-coral" />
                      <span>38% repeat engagement</span>
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
                            {item.deliverables.map((deliv, i) => (
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
                  <button
                    onClick={() => setShortlistModalOpen(true)}
                    className="text-xs font-bold text-purple hover:underline cursor-pointer bg-transparent border-0 inline-flex items-center gap-1"
                  >
                    <span>View All Relationships ({previousFreelancers.length})</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>

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
                          {f.skills.map((s, idx) => (
                            <span key={idx} className="text-[10px] bg-white border border-border/70 text-ink/70 px-2 py-0.5 rounded-md font-semibold">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-border/40">
                        <button
                          onClick={() => {
                            const dummyProp = defaultProposals.find(p => p.name.includes(f.name.split(' ')[0])) || defaultProposals[0];
                            handleOpenDirectChat(dummyProp);
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
              </section>
            </div>
          ) : (
            /* ====================================================
                VIEW D: MAIN DASHBOARD
                ==================================================== */
            <>
              {/* 1. TOP GREETING & 4 KPI CARDS */}
              <section className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pt-1">
                  <div>
                    <span className="eyebrow text-purple mb-1 block">
                      {user?.role === 'freelancer' ? 'CREATOR COMMAND CENTER' : 'EMPLOYER COMMAND CENTER'}
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

                {/* 4 KPI CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                  <div
                    onClick={() => {
                      const el = document.getElementById('active-projects-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="eyebrow text-ink/50">Active Projects</span>
                      <div className="w-8 h-8 rounded-xl bg-cyan/15 flex items-center justify-center text-cyan">
                        <FolderKanban size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-3xl sm:text-4xl font-extrabold text-ink leading-none mb-2">
                        {displayedOrders.length.toString().padStart(2, '0')}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <TrendingUp size={13} />
                        <span>↑ 2 on track this month</span>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => navigate('/post-gig')}
                    className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="eyebrow text-ink/50">Open Job Posts</span>
                      <div className="w-8 h-8 rounded-xl bg-purple/15 flex items-center justify-center text-purple">
                        <Briefcase size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-3xl sm:text-4xl font-extrabold text-ink leading-none mb-2">
                        {displayedGigs.length.toString().padStart(2, '0')}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-purple">
                        <Sparkles size={13} />
                        <span>{displayedGigs.filter(g => g.status === 'Active Brief').length} active briefs receiving bids</span>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      const el = document.getElementById('proposals-priority-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="eyebrow text-ink/50">Pending Proposals</span>
                      <div className="w-8 h-8 rounded-xl bg-coral/15 flex items-center justify-center text-coral">
                        <FileText size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-3xl sm:text-4xl font-extrabold text-ink leading-none mb-2 flex items-center gap-2">
                        <span>{allProposals.length}</span>
                        <span className="text-xs font-bold text-coral bg-coral/10 px-2 py-0.5 rounded-full font-sans">
                          9 New
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-coral">
                        <Clock size={13} />
                        <span>Needs review within 24h</span>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => handleTabClick('Payments')}
                    className="bg-white rounded-[24px] p-5 border border-border/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover-lift transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="eyebrow text-ink/50">Total Spending</span>
                      <div className="w-8 h-8 rounded-xl bg-orange/15 flex items-center justify-center text-orange">
                        <CreditCard size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-3xl sm:text-4xl font-extrabold text-ink leading-none mb-2">
                        ₹48,500
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <ShieldCheck size={13} />
                        <span>100% Escrow protected</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. PRIORITY SECTION: PROPOSALS REQUIRING ATTENTION */}
              <section id="proposals-priority-section" className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-coral animate-pulse" />
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                        Proposals Requiring Attention
                      </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-ink/50 font-medium mt-1">
                      Review applicants with highest AI match scores and active briefs.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShortlistModalOpen(true)}
                      className="text-xs font-bold text-purple hover:underline cursor-pointer bg-transparent border-0 inline-flex items-center gap-1"
                    >
                      <span>View All Proposals ({allProposals.length})</span>
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {priorityProposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="bg-soft/60 rounded-[20px] p-4 sm:p-5 border border-border/40 hover:border-purple/30 hover:bg-white hover:shadow-[0_8px_30px_rgba(124,58,237,0.06)] transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div
                          className="w-12 h-12 rounded-[16px] flex items-center justify-center font-clash font-bold text-base text-ink shrink-0 shadow-xs ring-2 ring-white"
                          style={{ backgroundColor: proposal.avatarBg }}
                        >
                          {proposal.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-base text-ink group-hover:text-purple transition-colors">
                              {proposal.name}
                            </h3>
                            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
                              <Star size={12} className="fill-amber-500 text-amber-500" />
                              {proposal.rating}
                            </span>
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/40">
                              {proposal.successRate} Job Success
                            </span>
                            <span className="bg-lime/20 text-ink text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                              {proposal.matchScore} Match
                            </span>
                          </div>

                          <p className="text-xs text-ink/70 font-semibold mt-1">
                            Applied for: <span className="text-ink">{proposal.title}</span>
                          </p>

                          <p className="text-xs text-ink/55 font-medium mt-1.5 line-clamp-2 italic leading-relaxed">
                            "{proposal.coverLetter}"
                          </p>

                          {proposal.skills && (
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                              {proposal.skills.map((skill: string, i: number) => (
                                <span
                                  key={i}
                                  className="text-[11px] font-semibold bg-white border border-border/80 text-ink/70 px-2.5 py-0.5 rounded-full"
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
                          <span className="text-[11px] font-bold text-ink/40 uppercase tracking-wider block">Proposed Budget</span>
                          <span className="font-display font-bold text-xl text-ink leading-tight block">
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
                  ))}
                </div>
              </section>

              {/* 3. ACTIVE PROJECTS SECTION */}
              <section id="active-projects-section" className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                      Active Projects
                    </h2>
                    <p className="text-xs text-ink/50 font-medium mt-0.5">
                      Milestone sprint tracking and live deliverables
                    </p>
                  </div>
                  <span className="text-xs font-bold text-purple bg-purple/10 px-3 py-1 rounded-full">
                    {displayedOrders.length} In Progress
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-soft/60 rounded-[20px] p-5 border border-border/50 hover:border-purple/30 hover:bg-white hover:shadow-[0_8px_30px_rgba(124,58,237,0.06)] transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <h3 className="font-bold text-base text-ink">
                              {order.projectTitle}
                            </h3>
                            <p className="text-xs text-ink/60 font-medium mt-0.5">
                              Assigned to <strong className="text-ink">{order.freelancerName}</strong> · Due {order.dueDate}
                            </p>
                          </div>
                          <span className="bg-purple/10 text-purple font-bold text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                            {order.paymentStatus}
                          </span>
                        </div>

                        <div className="my-3.5">
                          <div className="flex items-center justify-between text-xs font-semibold text-ink/70 mb-1.5">
                            <span>Sprint Progress ({order.milestone})</span>
                            <span>{order.progress}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full gradient-primary rounded-full transition-all duration-500"
                              style={{ width: `${order.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/40">
                        <span className="text-xs font-bold text-ink">
                          Budget: {order.budget}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/workspace?id=${order.id}`)}
                            className="btn-secondary !py-1.5 !px-3 !text-xs"
                          >
                            <FolderKanban size={13} />
                            <span>Workspace</span>
                          </button>
                          <button
                            onClick={() => toast.info(`Viewing milestone deliverables for ${order.projectTitle}`)}
                            className="btn-secondary !py-1.5 !px-3 !text-xs"
                          >
                            <FileCheck2 size={13} />
                            <span>Deliverables</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 4. QUICK ACTIONS (4 Clickable Cards) */}
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
                    onClick={() => navigate('/gigs')}
                    className="bg-white rounded-[24px] p-5 border border-border/70 hover:border-cyan/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(34,211,238,0.10)] transition-all duration-200 cursor-pointer flex flex-col justify-between hover-lift group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-2xl bg-cyan/15 text-cyan flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users size={20} />
                      </div>
                      <ArrowUpRight size={18} className="text-ink/30 group-hover:text-cyan group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-ink mb-1 group-hover:text-cyan transition-colors">
                        Browse Talent
                      </h3>
                      <p className="text-xs text-ink/55 font-medium leading-relaxed">
                        Explore verified freelancers across all design & dev fields.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      const el = document.getElementById('proposals-priority-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
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
                    onClick={() => navigate('/workspace')}
                    className="bg-white rounded-[24px] p-5 border border-border/70 hover:border-orange/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(255,179,71,0.10)] transition-all duration-200 cursor-pointer flex flex-col justify-between hover-lift group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-2xl bg-orange/15 text-orange flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FolderKanban size={20} />
                      </div>
                      <ArrowUpRight size={18} className="text-ink/30 group-hover:text-orange group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-ink mb-1 group-hover:text-orange transition-colors">
                        Open Workspace
                      </h3>
                      <p className="text-xs text-ink/55 font-medium leading-relaxed">
                        Track live sprint milestones, deliverables, and channels.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 5. MY POSTED GIGS SECTION */}
              <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                      My Posted Gigs
                    </h2>
                    <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                      Manage your active project listings and applicant volume.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/post-gig')}
                    className="btn-secondary !py-2 !px-4 !text-xs self-start sm:self-auto"
                  >
                    <Plus size={14} />
                    <span>Create New Brief</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-ink/40">
                        <th className="pb-3 px-3">Gig Title</th>
                        <th className="pb-3 px-3">Category</th>
                        <th className="pb-3 px-3">Budget</th>
                        <th className="pb-3 px-3">Proposals</th>
                        <th className="pb-3 px-3">Status</th>
                        <th className="pb-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-xs font-medium text-ink">
                      {displayedGigs.map((gig) => (
                        <tr key={gig.id} className="hover:bg-soft/50 transition-colors">
                          <td className="py-4 px-3">
                            <div className="font-bold text-sm text-ink hover:text-purple transition-colors cursor-pointer" onClick={() => navigate(`/gigs`)}>
                              {gig.title}
                            </div>
                            <span className="text-[11px] text-ink/40">Posted {gig.postedDate}</span>
                          </td>
                          <td className="py-4 px-3 text-ink/70">
                            {gig.category}
                          </td>
                          <td className="py-4 px-3 font-bold text-ink">
                            {gig.budget}
                          </td>
                          <td className="py-4 px-3">
                            <span className="font-bold text-purple bg-purple/10 px-2.5 py-0.5 rounded-full text-xs">
                              {gig.proposalsCount} bids
                            </span>
                          </td>
                          <td className="py-4 px-3">
                            <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {gig.status}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  const el = document.getElementById('proposals-priority-section');
                                  el?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="p-2 rounded-xl text-ink/60 hover:text-purple hover:bg-purple/10 transition-colors cursor-pointer border-0 bg-transparent"
                                title="View Proposals"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                onClick={() => navigate('/post-gig')}
                                className="p-2 rounded-xl text-ink/60 hover:text-ink hover:bg-soft transition-colors cursor-pointer border-0 bg-transparent"
                                title="Edit Brief"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => toast.success(`Brief "${gig.title}" closed.`)}
                                className="p-2 rounded-xl text-ink/40 hover:text-coral hover:bg-coral/10 transition-colors cursor-pointer border-0 bg-transparent"
                                title="Close Brief"
                              >
                                <Archive size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 6. MY ORDERS SECTION */}
              <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                      My Orders & Contracts
                    </h2>
                    <p className="text-xs sm:text-sm text-ink/50 font-medium mt-0.5">
                      Active milestones with guaranteed escrow protection.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/50">
                    <Lock size={13} className="text-emerald-600" />
                    <span>GigMatch Escrow Protected</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                  {displayedOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-soft/60 rounded-[22px] p-5 border border-border/60 hover:border-purple/30 hover:bg-white transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center font-clash font-bold text-xs text-ink shrink-0 shadow-xs"
                              style={{ backgroundColor: order.avatarBg }}
                            >
                              {order.initials}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-ink">{order.freelancerName}</h4>
                              <p className="text-[11px] text-ink/50">{order.freelancerRole}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            order.isUnpaid
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {order.paymentStatus}
                          </span>
                        </div>

                        <h5 className="font-bold text-sm text-ink mb-1">
                          {order.projectTitle}
                        </h5>
                        <p className="text-xs text-ink/60 font-medium mb-3">
                          {order.milestone}
                        </p>

                        <div className="text-xs text-ink/60 space-y-1 mb-4">
                          <div className="flex justify-between">
                            <span>Contract Budget:</span>
                            <span className="font-bold text-ink">{order.budget}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Target Completion:</span>
                            <span className="font-medium text-ink">{order.dueDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border/40 space-y-2">
                        {order.isUnpaid ? (
                          <button
                            onClick={() => toast.success(`Milestone payment of ${order.budget} approved & released to ${order.freelancerName}!`)}
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
                            const dummyProp = defaultProposals.find(p => p.name.includes(order.freelancerName.split(' ')[0])) || defaultProposals[0];
                            handleOpenDirectChat(dummyProp);
                          }}
                          className="w-full text-center text-xs font-semibold text-ink/60 hover:text-purple transition-colors py-1 cursor-pointer bg-transparent border-0"
                        >
                          Message Creator →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {/* ====================================================
          MODAL: AI SHORTLIST MODAL
          ==================================================== */}
      <Dialog open={shortlistModalOpen} onOpenChange={setShortlistModalOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-[24px] p-6 border border-border shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-purple font-bold text-xs uppercase tracking-wider">
              <Sparkles size={14} />
              <span>GIGMATCH AI Shortlist</span>
            </div>
            <DialogTitle className="font-display text-2xl font-bold text-ink mt-1">
              Top Talent for Senior Brand Designer
            </DialogTitle>
            <DialogDescription className="text-xs text-ink/60">
              Matched from 14,000+ verified creators based on past deliverables, typography mastery, and client velocity.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto pr-1">
            {aiShortlist.map((talent, idx) => (
              <div
                key={idx}
                className="bg-soft rounded-[18px] p-4 flex flex-col gap-3 border border-transparent hover:border-border transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-[12px] flex items-center justify-center font-clash font-bold text-xs text-ink"
                      style={{ backgroundColor: talent.avatarBg }}
                    >
                      {talent.initials}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-ink">
                        {talent.name}
                      </div>
                      <div className="text-xs text-ink/60">
                        {talent.role} · {talent.rate}
                      </div>
                    </div>
                  </div>
                  <span className="bg-lime text-ink font-bold font-clash text-xs px-2.5 py-1 rounded-full">
                    {talent.match} Match
                  </span>
                </div>

                <p className="text-xs text-ink/80 font-medium leading-relaxed">
                  {talent.highlight}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50">
                  <div className="flex flex-wrap gap-1.5">
                    {talent.skills.map((s, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-white text-ink/70 px-2.5 py-0.5 rounded-full font-semibold border border-border"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setShortlistModalOpen(false);
                      const prop = defaultProposals.find(p => p.name === talent.name) || defaultProposals[0];
                      setSelectedProposal(prop);
                      setProposalModalOpen(true);
                    }}
                    className="btn-primary !py-1.5 !px-4 !text-xs"
                  >
                    Direct Hire
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ====================================================
          MODAL: PROPOSAL REVIEW MODAL
          ==================================================== */}
      <Dialog open={proposalModalOpen} onOpenChange={setProposalModalOpen}>
        <DialogContent className="sm:max-w-3xl md:max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto bg-white rounded-[28px] p-6 sm:p-8 border border-border shadow-2xl">
          {selectedProposal && (
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
                  <span className="bg-lime text-ink font-bold text-xs px-3 py-1 rounded-full shadow-xs">
                    ★ {selectedProposal.matchScore} Match Score
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
                      <span className="text-purple font-semibold">{selectedProposal.role}</span>
                      <span>·</span>
                      <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
                        ★ {selectedProposal.rating} ({selectedProposal.reviewsCount} reviews)
                      </span>
                      <span>·</span>
                      <span className="text-emerald-700 font-semibold">{selectedProposal.successRate} Job Success</span>
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
                      "{selectedProposal.coverLetter}"
                    </blockquote>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-ink">
                        Included Milestone Deliverables & Scope
                      </h4>
                      <span className="text-[11px] text-ink/50 font-medium">
                        {selectedProposal.deliverables.length} Deliverables
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedProposal.deliverables.map((item: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3.5 bg-soft hover:bg-white transition-colors rounded-xl text-xs font-semibold text-ink border border-transparent hover:border-border"
                        >
                          <CheckCircle2 size={16} className="text-purple shrink-0" />
                          <span className="leading-snug">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
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
                  'Can you share sample Figma files?',
                  'Can we do a 15-min sync?',
                  'Are revisions included?'
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendDirectMessage(prompt)}
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
                    handleSendDirectMessage();
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

    </div>
  );
}
