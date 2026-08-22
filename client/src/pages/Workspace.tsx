import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
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
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';

export default function Workspace() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id') || 'ord-1';

  // Navigation and UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'All' | 'Chat' | 'Deliverables' | 'Milestones' | 'Payments'>('All');

  // Complete Project State
  const [projectData, setProjectData] = useState({
    id: projectId,
    title: 'Aurora Brand System & Visual Language',
    freelancer: {
      name: 'Nia Okafor',
      role: 'Lead Brand Identity Designer',
      avatarBg: '#A3E635',
      initials: 'NO',
      rating: '5.0',
      reviewsCount: 38,
      successRate: '99%',
      projectsCompleted: 24,
      responseTime: '< 10 mins',
      badges: ['Top Rated', 'Verified Creator', 'Preferred Partner']
    },
    status: 'IN PROGRESS',
    budget: '₹8,000',
    budgetNum: 8000,
    paidAmount: '₹4,000',
    remainingAmount: '₹4,000',
    startDate: 'Aug 10, 2026',
    deadline: 'Aug 28, 2026',
    progress: 72,
  });

  // Milestones State
  const [milestones, setMilestones] = useState([
    {
      id: 'm1',
      number: 1,
      name: 'Creative Direction & Moodboard',
      description: 'Comprehensive aesthetic audit, colorways, and typography pairings deck.',
      amount: '₹4,000',
      status: 'Completed',
      dueDate: 'Aug 14, 2026',
      isPaid: true
    },
    {
      id: 'm2',
      number: 2,
      name: 'Design System & Token Library',
      description: 'Complete Figma design system with color, spacing, and typography tokens.',
      amount: '₹2,500',
      status: 'In Progress',
      dueDate: 'Aug 22, 2026',
      isPaid: false
    },
    {
      id: 'm3',
      number: 3,
      name: 'Final Production Assets & Export Package',
      description: 'SVG iconography, vectorized logo locks, and developer handoff documentation.',
      amount: '₹1,500',
      status: 'Pending',
      dueDate: 'Aug 28, 2026',
      isPaid: false
    }
  ]);

  // Deliverables State
  const [deliverables, setDeliverables] = useState([
    {
      id: 'del-1',
      name: 'Aurora_Design_Tokens_v2.1.fig',
      milestone: 'Milestone 2',
      uploadDate: 'Aug 17, 2026 at 2:30 PM',
      fileType: 'Figma Library',
      fileSize: '42.8 MB',
      version: 'v2.1',
      status: 'Under Review',
      icon: FileCode,
      downloadUrl: '#'
    },
    {
      id: 'del-2',
      name: 'Brand_Guidelines_Book_Draft.pdf',
      milestone: 'Milestone 1',
      uploadDate: 'Aug 14, 2026 at 11:15 AM',
      fileType: 'PDF Document',
      fileSize: '18.4 MB',
      version: 'v1.0',
      status: 'Approved',
      icon: FileText,
      downloadUrl: '#'
    },
    {
      id: 'del-3',
      name: 'Vector_Iconography_Suite.zip',
      milestone: 'Milestone 2',
      uploadDate: 'Aug 16, 2026 at 5:40 PM',
      fileType: 'ZIP Archive',
      fileSize: '9.2 MB',
      version: 'v1.2',
      status: 'Approved',
      icon: FileArchive,
      downloadUrl: '#'
    }
  ]);

  // Chat Messages State
  const [messages, setMessages] = useState([
    {
      id: 'msg-1',
      sender: 'them',
      text: "Hi Harshit! I've uploaded the draft vector components and updated the shared Figma design token library for Milestone 2. Ready for your review!",
      time: '11:20 AM',
      attachment: {
        name: 'Aurora_Tokens_v2.1.fig',
        size: '42.8 MB',
        type: 'figma'
      }
    },
    {
      id: 'msg-2',
      sender: 'me',
      text: 'Thanks Nia! Reviewing with the team now. The custom typography pairing feels exceptionally bold and crisp.',
      time: '11:45 AM'
    },
    {
      id: 'msg-3',
      sender: 'them',
      text: "Awesome! Let me know if you need any subtle tweaks to the secondary color contrast ratios before we freeze Milestone 2.",
      time: '12:05 PM'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Activity Timeline Data
  const [timelineEvents, setTimelineEvents] = useState([
    {
      id: 't-1',
      title: 'Deliverable v2.1 Uploaded',
      description: 'Nia uploaded Aurora_Design_Tokens_v2.1.fig for Milestone 2 review.',
      time: 'Today at 2:30 PM',
      type: 'deliverable'
    },
    {
      id: 't-2',
      title: 'Milestone 1 Payment Released',
      description: '₹4,000 released from GigMatch Escrow to Nia Okafor.',
      time: 'Aug 14, 2026',
      type: 'payment'
    },
    {
      id: 't-3',
      title: 'Milestone 1 Approved',
      description: 'Creative Direction & Moodboard was reviewed and signed off.',
      time: 'Aug 14, 2026',
      type: 'approval'
    },
    {
      id: 't-4',
      title: 'Contract Escrow Funded',
      description: 'Employer deposited ₹8,000 into GigMatch 100% Escrow Protection.',
      time: 'Aug 10, 2026',
      type: 'escrow'
    },
    {
      id: 't-5',
      title: 'Proposal Accepted & Project Kickoff',
      description: 'Candidate proposal from Nia Okafor accepted by Harshit.',
      time: 'Aug 10, 2026',
      type: 'start'
    }
  ]);

  // Modals state
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionTarget, setRevisionTarget] = useState<any>(null);
  const [revisionNotes, setRevisionNotes] = useState('');

  // Handle Send Chat
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'me',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setChatInput('');

    // Simulate smart freelancer reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const botMsg = {
        id: `msg-${Date.now() + 1}`,
        sender: 'them',
        text: `Got it! I've noted that feedback and will incorporate it right into the active branch deliverables.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    }, 1100);
  };

  // Milestone Actions
  const handleApproveMilestone = (milestoneId: string) => {
    setMilestones(prev =>
      prev.map(m => (m.id === milestoneId ? { ...m, status: 'Completed', isPaid: true } : m))
    );
    toast.success('Milestone approved & payment released from Escrow!');
  };

  const handleRequestChanges = (item: any) => {
    setRevisionTarget(item);
    setRevisionNotes('');
    setRevisionModalOpen(true);
  };

  const submitRevisionRequest = () => {
    if (!revisionNotes.trim()) {
      toast.error('Please specify the revision requirements.');
      return;
    }
    toast.success(`Revision request sent to ${projectData.freelancer.name}!`);
    setRevisionModalOpen(false);
  };

  const displayName = user?.name || 'Harshit';
  const userInitials = (user?.name || 'Harshit')
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'H';

  const sidebarNavItems = [
    { name: 'Dashboard', icon: Sparkles, path: '/dashboard' },
    { name: 'Projects', icon: FolderKanban, path: '/dashboard?tab=Projects' },
    { name: 'Proposals', icon: FileText, path: '/dashboard?tab=Proposals' },
    { name: 'Freelancers', icon: Users, path: '/dashboard?tab=Freelancers' },
    { name: 'Messages', icon: MessageSquare, path: '/dashboard?tab=Messages' },
    { name: 'Payments', icon: CreditCard, path: '/dashboard?tab=Payments' },
    { name: 'Reviews & History', icon: Star, path: '/dashboard?tab=Reviews & History' },
  ];

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
                Employer workspace
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
                {projectData.title}
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
              onClick={() => toast.success('Workspace link copied to clipboard!')}
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
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {projectData.status}
                  </span>
                  <span className="text-xs font-bold text-purple bg-purple/10 px-3 py-1 rounded-full">
                    Sprint Milestone 2 of 3
                  </span>
                  <span className="text-xs text-ink/40 font-medium">
                    ID: {projectData.id}
                  </span>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight leading-tight">
                  {projectData.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-ink/70 pt-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-clash font-bold text-xs text-ink shadow-xs"
                      style={{ backgroundColor: projectData.freelancer.avatarBg }}
                    >
                      {projectData.freelancer.initials}
                    </div>
                    <span>Collaborator: <strong className="text-ink">{projectData.freelancer.name}</strong></span>
                  </div>
                  <span>·</span>
                  <span>Started: <strong className="text-ink">{projectData.startDate}</strong></span>
                  <span>·</span>
                  <span>Deadline: <strong className="text-ink">{projectData.deadline}</strong></span>
                </div>
              </div>

              {/* Right Budget & Quick Actions */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-border/50">
                <div className="text-left lg:text-right">
                  <span className="text-[11px] font-bold text-ink/40 uppercase tracking-wider block">Contract Value</span>
                  <span className="font-display font-extrabold text-3xl text-ink leading-tight block">
                    {projectData.budget}
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
                  <button
                    onClick={() => toast.success('Project marked ready for final sign-off!')}
                    className="btn-primary !py-2 !px-4 !text-xs"
                  >
                    <CheckCircle2 size={14} />
                    <span>Mark Complete</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Overall Sprint Progress Bar */}
            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="flex items-center justify-between text-xs font-bold text-ink mb-2">
                <span>Overall Deliverable Progress</span>
                <span className="text-purple">{projectData.progress}% Complete</span>
              </div>
              <div className="w-full h-3 bg-soft rounded-full overflow-hidden">
                <div
                  className="h-full gradient-primary rounded-full transition-all duration-700"
                  style={{ width: `${projectData.progress}%` }}
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
                      style={{ backgroundColor: projectData.freelancer.avatarBg }}
                    >
                      {projectData.freelancer.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-ink">{projectData.freelancer.name}</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active Now
                        </span>
                      </div>
                      <p className="text-xs text-ink/50">{projectData.freelancer.role} · Avg response: {projectData.freelancer.responseTime}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple bg-purple/10 px-3 py-1 rounded-full hidden sm:inline-block">
                      Milestone 2 Channel
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

                  {messages.map((msg) => {
                    const isMe = msg.sender === 'me';
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className="flex items-end gap-2.5 max-w-[85%] sm:max-w-[75%]">
                          {!isMe && (
                            <div
                              className="w-8 h-8 rounded-[10px] flex items-center justify-center font-clash font-bold text-[11px] text-ink shrink-0 mb-1"
                              style={{ backgroundColor: projectData.freelancer.avatarBg }}
                            >
                              {projectData.freelancer.initials}
                            </div>
                          )}
                          <div
                            className={`p-4 rounded-[20px] text-xs sm:text-sm leading-relaxed shadow-xs ${
                              isMe
                                ? 'gradient-primary text-white rounded-br-xs'
                                : 'bg-white text-ink border border-border rounded-bl-xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            
                            {/* File attachment preview */}
                            {msg.attachment && (
                              <div className="mt-3 p-2.5 rounded-xl bg-purple/10 border border-purple/20 flex items-center justify-between gap-3 text-ink">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileCode size={18} className="text-purple shrink-0" />
                                  <div className="min-w-0">
                                    <div className="font-bold text-xs truncate">{msg.attachment.name}</div>
                                    <div className="text-[10px] text-ink/60">{msg.attachment.size}</div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => toast.success(`Downloading ${msg.attachment?.name}`)}
                                  className="p-1.5 rounded-lg bg-white hover:bg-purple/10 text-purple transition-colors cursor-pointer border border-border"
                                >
                                  <Download size={13} />
                                </button>
                              </div>
                            )}

                            <span
                              className={`text-[10px] mt-2 block text-right font-medium ${
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
                        style={{ backgroundColor: projectData.freelancer.avatarBg }}
                      >
                        {projectData.freelancer.initials}
                      </div>
                      <span>{projectData.freelancer.name} is typing...</span>
                    </div>
                  )}
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
                      placeholder={`Message ${projectData.freelancer.name} in workspace...`}
                      className="flex-1 bg-soft border border-border rounded-full px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-purple focus:bg-white transition-all text-ink"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="btn-primary !py-2.5 !px-5 !text-xs sm:!text-sm disabled:opacity-40"
                    >
                      <span>Send</span>
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
                  <span className="text-xs font-bold text-purple bg-purple/10 px-3 py-1 rounded-full self-start sm:self-auto">
                    {deliverables.length} Assets Logged
                  </span>
                </div>

                <div className="space-y-3.5">
                  {deliverables.map((deliv) => {
                    const Icon = deliv.icon;
                    return (
                      <div
                        key={deliv.id}
                        className="bg-soft/60 rounded-[20px] p-4 sm:p-5 border border-border/50 hover:border-purple/30 hover:bg-white hover:shadow-xs transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-2xl bg-purple/10 text-purple flex items-center justify-center shrink-0">
                            <Icon size={22} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-sm sm:text-base text-ink truncate">{deliv.name}</h4>
                              <span className="text-[11px] font-bold bg-white px-2 py-0.5 rounded-md border border-border text-ink/70">
                                {deliv.version}
                              </span>
                              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                deliv.status === 'Approved'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200/50'
                              }`}>
                                {deliv.status}
                              </span>
                            </div>
                            <p className="text-xs text-ink/50 mt-1">
                              {deliv.milestone} · {deliv.fileType} ({deliv.fileSize}) · Uploaded {deliv.uploadDate}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
                          <button
                            onClick={() => toast.success(`Downloading ${deliv.name}...`)}
                            className="btn-secondary !py-2 !px-3 !text-xs"
                            title="Download File"
                          >
                            <Download size={14} />
                            <span>Download</span>
                          </button>
                          <button
                            onClick={() => handleRequestChanges(deliv)}
                            className="btn-secondary !py-2 !px-3 !text-xs text-coral hover:text-coral"
                            title="Request Revisions"
                          >
                            <RefreshCw size={14} />
                            <span>Revisions</span>
                          </button>
                          {deliv.status !== 'Approved' && (
                            <button
                              onClick={() => {
                                setDeliverables(prev =>
                                  prev.map(d => (d.id === deliv.id ? { ...d, status: 'Approved' } : d))
                                );
                                toast.success(`Deliverable ${deliv.name} approved!`);
                              }}
                              className="btn-primary !py-2 !px-4 !text-xs"
                            >
                              <Check size={14} />
                              <span>Approve</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                  {milestones.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-[22px] p-5 border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        m.status === 'Completed'
                          ? 'bg-emerald-50/40 border-emerald-200/60'
                          : m.status === 'In Progress'
                          ? 'bg-purple/5 border-purple/30 ring-1 ring-purple/20'
                          : 'bg-soft/50 border-border/60 opacity-85'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-clash font-bold text-sm shrink-0 ${
                          m.status === 'Completed'
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : m.status === 'In Progress'
                            ? 'gradient-primary text-white shadow-xs'
                            : 'bg-white text-ink/40 border border-border'
                        }`}>
                          {m.status === 'Completed' ? <Check size={16} /> : m.number}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-base text-ink">{m.name}</h4>
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              m.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : m.status === 'In Progress'
                                ? 'bg-purple/15 text-purple'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {m.status}
                            </span>
                          </div>
                          <p className="text-xs text-ink/65 font-medium mt-1 leading-relaxed">
                            {m.description}
                          </p>
                          <div className="text-xs text-ink/50 mt-1 font-medium">
                            Due: {m.dueDate} · Allocated: <strong className="text-ink">{m.amount}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border/40">
                        {m.status === 'In Progress' && (
                          <>
                            <button
                              onClick={() => handleRequestChanges(m)}
                              className="btn-secondary !py-2 !px-3.5 !text-xs"
                            >
                              <span>Request Changes</span>
                            </button>
                            <button
                              onClick={() => handleApproveMilestone(m.id)}
                              className="btn-primary !py-2 !px-4 !text-xs"
                            >
                              <ShieldCheck size={14} />
                              <span>Release Escrow ({m.amount})</span>
                            </button>
                          </>
                        )}
                        {m.status === 'Completed' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full">
                            <CheckCircle2 size={14} />
                            <span>Paid & Released</span>
                          </span>
                        )}
                        {m.status === 'Pending' && (
                          <span className="text-xs font-medium text-ink/40">
                            Awaiting Sprint Kickoff
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
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
                    <span className="font-display font-extrabold text-2xl text-ink leading-tight">{projectData.budget}</span>
                  </div>
                  <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/60">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">Released to Freelancer</span>
                    <span className="font-display font-extrabold text-2xl text-emerald-700 leading-tight">{projectData.paidAmount}</span>
                  </div>
                  <div className="bg-purple/5 p-4 rounded-2xl border border-purple/20">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple block mb-1">Remaining in Escrow</span>
                    <span className="font-display font-extrabold text-2xl text-purple leading-tight">{projectData.remainingAmount}</span>
                  </div>
                </div>
              </section>

              {/* Activity Timeline Section */}
              <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight mb-6">
                  Activity Timeline & Project Log
                </h2>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {timelineEvents.map((ev) => (
                    <div key={ev.id} className="relative group">
                      <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-white border-2 border-purple ring-4 ring-purple/10" />
                      <div className="bg-soft/50 group-hover:bg-soft p-4 rounded-2xl border border-border/50 transition-colors">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-bold text-sm text-ink">{ev.title}</h4>
                          <span className="text-[11px] font-medium text-ink/40">{ev.time}</span>
                        </div>
                        <p className="text-xs text-ink/65 leading-relaxed">{ev.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column (4 cols): Freelancer Bio, Scope & Escrow Info */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Freelancer Profile Card */}
              <div className="bg-white rounded-[28px] p-6 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-5">
                <div className="flex items-center justify-between">
                  <span className="eyebrow text-purple">ASSIGNED CREATOR</span>
                  <span className="bg-lime text-ink text-[11px] font-bold px-2.5 py-0.5 rounded-full font-clash">
                    ★ 5.0 Rating
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-[20px] flex items-center justify-center font-clash font-bold text-2xl text-ink shrink-0 shadow-md ring-4 ring-white"
                    style={{ backgroundColor: projectData.freelancer.avatarBg }}
                  >
                    {projectData.freelancer.initials}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-ink leading-tight">
                      {projectData.freelancer.name}
                    </h3>
                    <p className="text-xs text-ink/60 mt-0.5 font-medium">{projectData.freelancer.role}</p>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {projectData.freelancer.badges.map((b, i) => (
                    <span key={i} className="text-[11px] font-bold bg-soft text-purple border border-purple/15 px-2.5 py-0.5 rounded-full">
                      ✓ {b}
                    </span>
                  ))}
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50 text-xs">
                  <div className="p-3 rounded-xl bg-soft">
                    <span className="text-ink/50 text-[11px] block">Job Success</span>
                    <strong className="text-sm font-bold text-emerald-700">{projectData.freelancer.successRate}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-soft">
                    <span className="text-ink/50 text-[11px] block">Completed Gigs</span>
                    <strong className="text-sm font-bold text-ink">{projectData.freelancer.projectsCompleted} Orders</strong>
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
                  <button
                    onClick={() => toast.info(`Viewing public profile for ${projectData.freelancer.name}`)}
                    className="w-full btn-secondary !py-2.5 !text-xs justify-center"
                  >
                    <span>View Full Profile</span>
                    <ExternalLink size={13} />
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
                  Request Changes for {revisionTarget.name || 'Deliverable'}
                </DialogTitle>
                <DialogDescription className="text-xs text-ink/60">
                  Provide specific notes for {projectData.freelancer.name} to refine the deliverables.
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

    </div>
  );
}
