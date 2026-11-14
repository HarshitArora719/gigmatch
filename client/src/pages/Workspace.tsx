import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import api from '../lib/axios';
import {
  Send,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldCheck,
  Clock,
  Download,
  AlertCircle,
  Paperclip,
  Check,
  Briefcase,
  FileCode,
  FileText,
  RefreshCw,
  Upload,
  Loader2,
  Code,
  ChevronDown,
  MessageSquare,
  Lock,
  Package,
  FolderArchive,
  FileSpreadsheet,
  Globe,
  Video,
  Image as ImageIcon,
  Plus,
  Trash2,
  File,
  Layers,
  Eye,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import { openRazorpayModal } from '../lib/razorpay';
import DemoPaymentModal, { type DemoPaymentDetails } from '../components/DemoPaymentModal';

// ─── Type Definitions ───────────────────────────────────────────────────────
export interface DeliverableLink {
  title: string;
  url: string;
}

export interface DeliverableFileDetail {
  name: string;
  url: string;
  size?: number;
  fileType?: string;
}

interface OrderDeliverable {
  _id?: string;
  milestoneIndex?: number;
  version?: number;
  status?: string;
  reviewNotes?: string;
  message: string;
  githubUrl?: string;
  liveUrl?: string;
  attachments: string[];
  links?: DeliverableLink[];
  fileDetails?: DeliverableFileDetail[];
  submittedAt: string;
  submittedBy?: { _id: string; name: string } | string;
}

interface RevisionRequest {
  _id?: string;
  deliveryVersion?: number;
  message: string;
  requestedBy?: { _id: string; name: string } | string;
  requestedAt: string;
}

interface OrderData {
  _id: string;
  gig: {
    _id: string;
    title: string;
    description: string;
    category: string;
    budget: number;
    deadline?: string;
    tags?: string[];
    deliverables?: string[];
    requirements?: string[];
  };
  client: { _id: string; name: string; email: string; avatar?: string; avatarColor?: string };
  freelancer: { _id: string; name: string; email: string; avatar?: string; avatarColor?: string };
  proposal: { coverLetter: string; proposedPrice: number; estimatedDays: number };
  conversation?: string;
  totalAmount: number;
  status: string;
  escrowStatus?: string;
  milestones: Array<{
    _id?: string;
    title: string;
    description?: string;
    amount: number;
    dueDate?: string;
    status: string;
    paidAt?: string;
  }>;
  deliverables: OrderDeliverable[];
  revisionRequests: RevisionRequest[];
  completedAt?: string;
  paymentReleasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface MessageData {
  _id: string;
  orderId: string;
  conversationId?: string;
  senderId: string;
  senderName?: string;
  content: string;
  messageType?: string;
  attachments?: any[];
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

export interface WorkspaceViewProps {
  orderId?: string;
  initialOrders?: any[];
  onSelectOrder?: (orderId: string) => void;
  onNavigateTab?: (tabName: string) => void;
}

// ─── Helper Functions ───────────────────────────────────────────────────────
const formatCurrency = (amount: number) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const formatTime = (dateStr?: string | Date) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const getInitials = (name: string) =>
  name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

const statusDisplayMap: Record<string, { label: string; color: string }> = {
  active: { label: 'IN PROGRESS', color: 'text-emerald-700 bg-emerald-50 border-emerald-200/50' },
  delivered: { label: 'DELIVERED', color: 'text-blue-700 bg-blue-50 border-blue-200/50' },
  revision_requested: { label: 'REVISION REQUESTED', color: 'text-amber-700 bg-amber-50 border-amber-200/50' },
  completed: { label: 'COMPLETED', color: 'text-emerald-700 bg-emerald-50 border-emerald-200/50' },
  cancelled: { label: 'CANCELLED', color: 'text-red-700 bg-red-50 border-red-200/50' },
  in_review: { label: 'UNDER REVIEW', color: 'text-amber-700 bg-amber-50 border-amber-200/50' },
  disputed: { label: 'DISPUTED', color: 'text-orange-700 bg-orange-50 border-orange-200/50' },
};

// ─── Module-Level Cache to Eliminate Workspace Tab Switching Stutter ─────────
const orderDataCache = new Map<string, { order: OrderData; financial: any; progress: number }>();
const messagesCache = new Map<string, MessageData[]>();
const activitiesCache = new Map<string, ActivityData[]>();
let allOrdersCache: any[] | null = null;

// ─── Workspace Component ───────────────────────────────────────────────────
export default function WorkspaceView({ orderId: propOrderId, initialOrders, onSelectOrder, onNavigateTab }: WorkspaceViewProps) {
  const { user } = useAuthStore();
  const { socket, connectSocket, emitTyping, emitStopTyping, isUserTyping, isUserOnline } = useChatStore();
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Order ID resolution
  const activeOrderId = propOrderId || searchParams.get('orderId') || searchParams.get('id') || paramId || '';

  // ── Data States with instant cache hydration ───────────────────────────
  const cachedData = activeOrderId ? orderDataCache.get(activeOrderId) : null;
  const [order, setOrder] = useState<OrderData | null>(() => cachedData?.order || null);
  const [financial, setFinancial] = useState(() => cachedData?.financial || { totalAmount: 0, paidAmount: 0, remainingAmount: 0 });
  const [progress, setProgress] = useState<number>(() => cachedData?.progress ?? 0);

  const [messages, setMessages] = useState<MessageData[]>(() => (activeOrderId ? messagesCache.get(activeOrderId) || [] : []));
  const [activities, setActivities] = useState<ActivityData[]>(() => (activeOrderId ? activitiesCache.get(activeOrderId) || [] : []));

  // ── Loading / Error States ──────────────────────────────────────────────
  const [orderLoading, setOrderLoading] = useState(() => (activeOrderId ? !cachedData : false));
  const [orderError, setOrderError] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(() => (activeOrderId ? !messagesCache.has(activeOrderId) : false));
  const [messagesError, setMessagesError] = useState('');
  const [activitiesLoading, setActivitiesLoading] = useState(() => (activeOrderId ? !activitiesCache.has(activeOrderId) : false));
  const [activitiesError, setActivitiesError] = useState('');

  // ── Chat State ──────────────────────────────────────────────────────────
  const [chatInput, setChatInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingChatMedia, setUploadingChatMedia] = useState(false);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // ── Drawer & Modal States ───────────────────────────────────────────────
  const [briefDrawerOpen, setBriefDrawerOpen] = useState(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [submittingRevision, setSubmittingRevision] = useState(false);
  const [approvingPayment, setApprovingPayment] = useState(false);
  const [razorpayModalOpen, setRazorpayModalOpen] = useState(false);
  const [razorpayErrorMsg, setRazorpayErrorMsg] = useState('');

  // ── Milestone Payment & Flow States ─────────────────────────────────────
  const [milestoneActionLoading, setMilestoneActionLoading] = useState<string | null>(null);
  const [payingMilestoneIndex, setPayingMilestoneIndex] = useState<number | null>(null);
  const [payingMilestoneLoading, setPayingMilestoneLoading] = useState(false);
  const [demoPaymentDetails, setDemoPaymentDetails] = useState<DemoPaymentDetails | null>(null);
  const [demoPaymentModalOpen, setDemoPaymentModalOpen] = useState(false);
  const [selectedMilestoneIdx, setSelectedMilestoneIdx] = useState<number>(0);
  const deliverableFormRef = useRef<HTMLDivElement>(null);

  // ── Delivery Submission State ───────────────────────────────────────────
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [deliveryGithubUrl, setDeliveryGithubUrl] = useState('');
  const [deliveryLiveUrl, setDeliveryLiveUrl] = useState('');
  const [deliveryAttachments, setDeliveryAttachments] = useState<string[]>([]);
  const [deliveryFiles, setDeliveryFiles] = useState<DeliverableFileDetail[]>([]);
  const [deliveryLinks, setDeliveryLinks] = useState<DeliverableLink[]>([]);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [submittingDelivery, setSubmittingDelivery] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Multi-Project Switcher State ────────────────────────────────────────
  const [allOrders, setAllOrders] = useState<any[]>(() => {
    if (allOrdersCache && allOrdersCache.length > 0) return allOrdersCache;
    try {
      const cached = sessionStorage.getItem('gm_cached_workspace_orders');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  // Close project switcher dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setSwitcherOpen(false);
      }
    };
    if (switcherOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [switcherOpen]);

  // ESC key listener for Brief Drawer and Modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (briefDrawerOpen) setBriefDrawerOpen(false);
        if (revisionModalOpen) setRevisionModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [briefDrawerOpen, revisionModalOpen]);

  // Fetch all user orders for project switcher
  const fetchAllOrders = useCallback(async () => {
    try {
      const res = await api.get('/api/orders/my-orders');
      const ordersList = res.data.data.orders || [];
      allOrdersCache = ordersList;
      setAllOrders(ordersList);
      try {
        sessionStorage.setItem('gm_cached_workspace_orders', JSON.stringify(ordersList));
      } catch (e) {}
      return ordersList;
    } catch (err) {
      console.error('Failed to fetch orders list:', err);
      return allOrdersCache || [];
    }
  }, []);

  // ── Data Fetching for Active Order ──────────────────────────────────────
  const fetchOrder = useCallback(async (targetId: string) => {
    if (!targetId) {
      setOrderLoading(false);
      return;
    }
    if (!orderDataCache.has(targetId)) {
      try {
        const cachedRaw = sessionStorage.getItem(`gm_cached_order_${targetId}`);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (parsed && parsed.order) {
            setOrder(parsed.order);
            setFinancial(parsed.financial);
            setProgress(parsed.progress);
            orderDataCache.set(targetId, parsed);
            setOrderLoading(false);
          }
        }
      } catch (e) {}
      if (!orderDataCache.has(targetId)) {
        setOrderLoading(true);
      }
    }
    setOrderError('');
    try {
      const res = await api.get(`/api/orders/${targetId}`);
      const freshOrder = res.data.data.order;
      const freshFinancial = res.data.data.financial;
      const freshProgress = res.data.data.progress;
      setOrder(freshOrder);
      setFinancial(freshFinancial);
      setProgress(freshProgress);
      const cacheObj = { order: freshOrder, financial: freshFinancial, progress: freshProgress };
      orderDataCache.set(targetId, cacheObj);
      try {
        sessionStorage.setItem(`gm_cached_order_${targetId}`, JSON.stringify(cacheObj));
      } catch (e) {}

      // Instantly hydrate bundled messages and activities from single response
      if (res.data.data.messages) {
        const freshMessages = res.data.data.messages;
        setMessages(freshMessages);
        messagesCache.set(targetId, freshMessages);
        setMessagesLoading(false);
      }
      if (res.data.data.activities) {
        const freshActivities = res.data.data.activities;
        setActivities(freshActivities);
        activitiesCache.set(targetId, freshActivities);
        setActivitiesLoading(false);
      }
    } catch (err: any) {
      if (!orderDataCache.has(targetId)) {
        setOrderError(err.response?.data?.message || 'Failed to load order');
      }
    } finally {
      setOrderLoading(false);
      setMessagesLoading(false);
      setActivitiesLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (targetId: string) => {
    if (!targetId) return;
    if (!messagesCache.has(targetId)) {
      setMessagesLoading(true);
    }
    setMessagesError('');
    try {
      const res = await api.get(`/api/messages/order/${targetId}`);
      const freshMessages = res.data.data.messages || [];
      setMessages(freshMessages);
      messagesCache.set(targetId, freshMessages);
    } catch (err: any) {
      if (!messagesCache.has(targetId)) {
        setMessagesError(err.response?.data?.message || 'Failed to load messages');
      }
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const fetchActivities = useCallback(async (targetId: string) => {
    if (!targetId) return;
    if (!activitiesCache.has(targetId)) {
      setActivitiesLoading(true);
    }
    setActivitiesError('');
    try {
      const res = await api.get(`/api/activities/order/${targetId}`);
      const freshActivities = res.data.data.activities || [];
      setActivities(freshActivities);
      activitiesCache.set(targetId, freshActivities);
    } catch (err: any) {
      if (!activitiesCache.has(targetId)) {
        setActivitiesError(err.response?.data?.message || 'Failed to load activities');
      }
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  // ── Initial Load for Multi-Project Switcher ──────────────────────────────
  useEffect(() => {
    if (!user) return;
    if (initialOrders && initialOrders.length > 0) {
      allOrdersCache = initialOrders;
      setAllOrders(initialOrders);
      return;
    }
    if (!allOrdersCache || allOrdersCache.length === 0) {
      fetchAllOrders();
    }
  }, [user, initialOrders, fetchAllOrders]);

  useEffect(() => {
    if (activeOrderId) {
      let cached = orderDataCache.get(activeOrderId);
      if (!cached) {
        try {
          const cachedRaw = sessionStorage.getItem(`gm_cached_order_${activeOrderId}`);
          if (cachedRaw) {
            cached = JSON.parse(cachedRaw);
            if (cached && cached.order) {
              orderDataCache.set(activeOrderId, cached);
            }
          }
        } catch (e) {}
      }

      if (cached) {
        setOrder(cached.order);
        setFinancial(cached.financial);
        setProgress(cached.progress);
        setOrderLoading(false);
      } else {
        setOrder(null);
        setOrderLoading(true);
      }

      if (messagesCache.has(activeOrderId)) {
        setMessages(messagesCache.get(activeOrderId)!);
        setMessagesLoading(false);
      } else {
        setMessages([]);
        setMessagesLoading(true);
      }

      if (activitiesCache.has(activeOrderId)) {
        setActivities(activitiesCache.get(activeOrderId)!);
        setActivitiesLoading(false);
      } else {
        setActivities([]);
        setActivitiesLoading(true);
      }

      // Single bundled API call hydrates order, financial, progress, messages, and activities in 1 round-trip!
      fetchOrder(activeOrderId);
    } else {
      setOrder(null);
      setMessages([]);
      setActivities([]);
      setOrderLoading(false);
    }
  }, [activeOrderId, fetchOrder]);

  // ── Socket.io Connection & User Room ─────────────────────────────────────
  useEffect(() => {
    const currentUserId = (user as any)?._id || (user as any)?.id;
    if (currentUserId) {
      connectSocket(currentUserId);
    }
  }, [user, connectSocket]);

  // ── Socket.io Real-time Chat & Updates ───────────────────────────────────
  useEffect(() => {
    if (!socket || !activeOrderId) return;

    const orderRoomId = activeOrderId;
    const convId = order?.conversation ? String(order.conversation) : '';

    const joinRooms = () => {
      socket.emit('joinOrder', orderRoomId);
      if (convId) {
        socket.emit('joinConversation', convId);
      }
    };

    joinRooms();
    socket.on('connect', joinRooms);

    const handleIncomingMessage = (msg: any) => {
      if (!msg) return;

      const msgOrderId = msg.orderId ? String(msg.orderId) : '';
      const msgConvId = msg.conversationId ? String(msg.conversationId) : '';
      const currentOrderId = String(activeOrderId);
      const currentConvId = convId;

      // Validate that this message belongs to the current workspace order or its conversation
      const isForCurrent =
        (msgOrderId && msgOrderId === currentOrderId) ||
        (currentConvId && msgConvId && msgConvId === currentConvId);

      if (!isForCurrent) return;

      const myUserId = String((user as any)?._id || (user as any)?.id || '');

      setMessages(prev => {
        // Prevent duplicate by _id
        if (prev.some(m => String(m._id) === String(msg._id))) return prev;

        // If this incoming message is from me, replace any matching pending optimistic message
        const isFromMe = String(msg.senderId) === myUserId;
        if (isFromMe) {
          const tempIdx = prev.findIndex(m =>
            String(m._id).startsWith('temp-') &&
            (m.content === msg.content || m.content === `📎 ${(msg.attachments?.[0]?.fileName || '')}`)
          );
          if (tempIdx !== -1) {
            const next = [...prev];
            next[tempIdx] = {
              _id: msg._id,
              orderId: currentOrderId,
              conversationId: msgConvId || currentConvId,
              senderId: String(msg.senderId),
              senderName: msg.senderName,
              content: msg.content,
              messageType: msg.messageType,
              attachments: msg.attachments,
              createdAt: msg.createdAt,
            };
            messagesCache.set(currentOrderId, next);
            return next;
          }
        }

        const formattedMsg: MessageData = {
          _id: msg._id,
          orderId: currentOrderId,
          conversationId: msgConvId || currentConvId,
          senderId: String(msg.senderId),
          senderName: msg.senderName,
          content: msg.content,
          messageType: msg.messageType,
          attachments: msg.attachments,
          createdAt: msg.createdAt,
        };

        const updated = [...prev, formattedMsg];
        messagesCache.set(currentOrderId, updated);
        return updated;
      });
    };

    const handleOrderUpdated = (data: any) => {
      console.log('Order updated via socket:', data);
      fetchOrder(activeOrderId);
      fetchActivities(activeOrderId);
    };

    const handleDeliverableSubmitted = (data: any) => {
      console.log('Deliverable submitted via socket:', data);
      toast.info('New deliverable submitted for review!');
      fetchOrder(activeOrderId);
      fetchActivities(activeOrderId);
    };

    const handleRevisionRequested = (data: any) => {
      console.log('Revision requested via socket:', data);
      toast.info('Revision requested by client.');
      fetchOrder(activeOrderId);
      fetchActivities(activeOrderId);
    };

    const handlePaymentReleased = (data: any) => {
      console.log('Payment released via socket:', data);
      toast.success('Payment has been released and order completed!');
      fetchOrder(activeOrderId);
      fetchActivities(activeOrderId);
    };

    socket.on('receiveMessage', handleIncomingMessage);
    socket.on('newMessage', handleIncomingMessage);
    socket.on('orderUpdated', handleOrderUpdated);
    socket.on('deliverableSubmitted', handleDeliverableSubmitted);
    socket.on('revisionRequested', handleRevisionRequested);
    socket.on('paymentReleased', handlePaymentReleased);

    return () => {
      socket.off('connect', joinRooms);
      socket.emit('leaveOrder', orderRoomId);
      if (convId) {
        socket.emit('leaveConversation', convId);
      }
      socket.off('receiveMessage', handleIncomingMessage);
      socket.off('newMessage', handleIncomingMessage);
      socket.off('orderUpdated', handleOrderUpdated);
      socket.off('deliverableSubmitted', handleDeliverableSubmitted);
      socket.off('revisionRequested', handleRevisionRequested);
      socket.off('paymentReleased', handlePaymentReleased);
    };
  }, [socket, activeOrderId, order?.conversation, user, fetchOrder, fetchActivities]);

  // Auto-scroll chat internally (only scrolls inside the chat messages div, never scrolls the window)
  useEffect(() => {
    const scrollToBottom = () => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    };
    scrollToBottom();
    const timer = setTimeout(scrollToBottom, 60);
    return () => clearTimeout(timer);
  }, [messages.length]);

  // ── Chat Input Change with Debounced Typing Indicator ────────────────────
  const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);

    const convId = order?.conversation ? String(order.conversation) : '';
    const myUserId = String((user as any)?._id || (user as any)?.id || '');
    if (!convId || !myUserId) return;

    emitTyping(convId, myUserId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(convId, myUserId);
    }, 2000);
  };

  // ── Chat Send (Single Source of Truth) ───────────────────────────────────
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !activeOrderId || sendingMessage) return;
    const content = chatInput.trim();
    setChatInput('');
    setSendingMessage(true);

    const myUserId = String((user as any)?._id || (user as any)?.id || '');
    const convId = order?.conversation ? String(order.conversation) : '';

    if (convId && myUserId) {
      emitStopTyping(convId, myUserId);
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: MessageData = {
      _id: tempId,
      orderId: activeOrderId,
      conversationId: convId,
      senderId: myUserId,
      senderName: user?.name,
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const res = await api.post(`/api/messages/order/${activeOrderId}`, { content });
      const savedMsg = res.data.data.message;

      setMessages(prev => {
        // If the socket already inserted savedMsg, remove the tempId to prevent duplicates
        if (prev.some(m => String(m._id) === String(savedMsg._id))) {
          const filtered = prev.filter(m => m._id !== tempId);
          messagesCache.set(activeOrderId, filtered);
          return filtered;
        }
        const updated = prev.map(m => m._id === tempId ? savedMsg : m);
        messagesCache.set(activeOrderId, updated);
        return updated;
      });
    } catch {
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setChatInput(content);
    } finally {
      setSendingMessage(false);
    }
  };

  // ── Chat Media Upload Handler ────────────────────────────────────────────
  const handleChatFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeOrderId) return;

    if (chatFileInputRef.current) chatFileInputRef.current.value = '';

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }

    setUploadingChatMedia(true);
    const isImage = file.type.startsWith('image/');
    const tempId = `temp-${Date.now()}`;
    const myUserId = String((user as any)?._id || (user as any)?.id || '');
    const convId = order?.conversation ? String(order.conversation) : '';

    const tempUrl = URL.createObjectURL(file);
    const optimisticMsg: MessageData = {
      _id: tempId,
      orderId: activeOrderId,
      conversationId: convId,
      senderId: myUserId,
      senderName: user?.name,
      content: isImage ? '📷 Image' : `📎 ${file.name}`,
      messageType: isImage ? 'image' : 'file',
      attachments: [{ url: tempUrl, fileName: file.name, fileSize: file.size, fileType: file.type }],
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await api.post('/api/uploads/chat-media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { url, fileName, fileSize, fileType } = uploadRes.data.data;

      const res = await api.post(`/api/messages/order/${activeOrderId}`, {
        content: isImage ? '📷 Image' : `📎 ${fileName}`,
        messageType: isImage ? 'image' : 'file',
        attachments: [{ url, fileName, fileSize, fileType }],
      });

      const savedMsg = res.data.data.message;
      setMessages(prev => {
        if (prev.some(m => String(m._id) === String(savedMsg._id))) {
          const filtered = prev.filter(m => m._id !== tempId);
          messagesCache.set(activeOrderId, filtered);
          return filtered;
        }
        const updated = prev.map(m => m._id === tempId ? savedMsg : m);
        messagesCache.set(activeOrderId, updated);
        return updated;
      });
    } catch {
      toast.error('Failed to upload and send file. Please try again.');
      setMessages(prev => prev.filter(m => m._id !== tempId));
    } finally {
      setUploadingChatMedia(false);
    }
  };

  // ── File & Link Utilities ────────────────────────────────────────────────
  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType?: string, fileName?: string) => {
    const type = (fileType || '').toLowerCase();
    const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';

    if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext)) {
      return <ImageIcon size={15} className="text-purple shrink-0" />;
    }
    if (type.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
      return <Video size={15} className="text-blue-600 shrink-0" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || type.includes('zip') || type.includes('compressed')) {
      return <FolderArchive size={15} className="text-amber-600 shrink-0" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext) || type.includes('spreadsheet') || type.includes('excel')) {
      return <FileSpreadsheet size={15} className="text-emerald-600 shrink-0" />;
    }
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'json', 'cpp', 'java'].includes(ext)) {
      return <FileCode size={15} className="text-purple shrink-0" />;
    }
    return <FileText size={15} className="text-ink/60 shrink-0" />;
  };

  const getLinkIcon = (title: string, url: string) => {
    const t = (title + ' ' + url).toLowerCase();
    if (t.includes('github') || t.includes('gitlab') || t.includes('bitbucket')) {
      return <FileCode size={14} className="text-purple shrink-0" />;
    }
    if (t.includes('figma')) {
      return <Layers size={14} className="text-purple shrink-0" />;
    }
    if (t.includes('loom') || t.includes('youtube') || t.includes('vimeo')) {
      return <Video size={14} className="text-blue-600 shrink-0" />;
    }
    if (t.includes('drive.google') || t.includes('dropbox') || t.includes('onedrive')) {
      return <FolderArchive size={14} className="text-amber-600 shrink-0" />;
    }
    return <Globe size={14} className="text-ink/60 shrink-0" />;
  };

  const getDeliverableFileUrl = (url: string, download = false, filename?: string) => {
    if (!url) return '';
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const params = new URLSearchParams();
    params.set('url', url);
    if (download) params.set('download', 'true');
    if (filename) params.set('filename', filename);
    return `${apiBase}/api/uploads/deliverable-file?${params.toString()}`;
  };

  const getDeliverableFiles = (deliv: any): Array<{ name: string; url: string; size?: number; fileType?: string }> => {
    if (!deliv) return [];
    if (deliv.fileDetails && deliv.fileDetails.length > 0) {
      return deliv.fileDetails;
    }
    if (deliv.attachments && deliv.attachments.length > 0) {
      return deliv.attachments.map((url: string, idx: number) => {
        const rawName = url.split('/').pop() || `Deliverable_${idx + 1}`;
        const name = rawName.includes('?') ? rawName.split('?')[0] : rawName;
        const ext = name.split('.').pop()?.toLowerCase();
        let fileType = 'application/octet-stream';
        if (ext === 'pdf') fileType = 'application/pdf';
        else if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext || '')) fileType = `image/${ext}`;
        else if (['mp4', 'webm', 'mov'].includes(ext || '')) fileType = `video/${ext}`;
        else if (['zip', 'rar', '7z'].includes(ext || '')) fileType = 'application/zip';
        return {
          name,
          url,
          fileType,
        };
      });
    }
    return [];
  };

  // ── Multi-File Upload Handler ─────────────────────────────────────────────
  const uploadSelectedFiles = async (fileList: File[]) => {
    if (!fileList || fileList.length === 0) return;

    // Check size limit: 50MB per file
    const oversized = fileList.filter(f => f.size > 50 * 1024 * 1024);
    if (oversized.length > 0) {
      toast.error(`Some files exceed 50MB: ${oversized.map(f => f.name).join(', ')}`);
      return;
    }

    setUploadingAttachment(true);
    const formData = new FormData();
    fileList.forEach(file => {
      formData.append('files', file);
    });

    try {
      const res = await api.post('/api/uploads/deliverables', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data?.data;
      const returnedFiles: DeliverableFileDetail[] = data?.files || [];

      if (returnedFiles.length > 0) {
        setDeliveryFiles(prev => [...prev, ...returnedFiles]);
        setDeliveryAttachments(prev => [...prev, ...returnedFiles.map(f => f.url)]);
        toast.success(`Attached ${returnedFiles.length} file${returnedFiles.length > 1 ? 's' : ''}`);
      } else if (data?.url || data?.fileUrl) {
        const singleUrl = data.url || data.fileUrl;
        const singleFileDetail: DeliverableFileDetail = {
          name: fileList[0].name,
          url: singleUrl,
          size: fileList[0].size,
          fileType: fileList[0].type,
        };
        setDeliveryFiles(prev => [...prev, singleFileDetail]);
        setDeliveryAttachments(prev => [...prev, singleUrl]);
        toast.success(`Attached ${fileList[0].name}`);
      }
    } catch {
      toast.error('Failed to upload file(s). Please try again.');
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadSelectedFiles(Array.from(files));
  };

  const handleRemoveFile = (index: number) => {
    setDeliveryFiles(prev => prev.filter((_, i) => i !== index));
    setDeliveryAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // ── Dynamic External Links ────────────────────────────────────────────────
  const handleAddLink = (presetTitle?: string) => {
    setDeliveryLinks(prev => [...prev, { title: presetTitle || '', url: '' }]);
  };

  const handleUpdateLink = (index: number, field: 'title' | 'url', value: string) => {
    setDeliveryLinks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveLink = (index: number) => {
    setDeliveryLinks(prev => prev.filter((_, i) => i !== index));
  };

  // ── Freelancer: Submit Deliverables ──────────────────────────────────────
  const handleSubmitDeliverables = async () => {
    if (!deliveryMessage.trim()) {
      toast.error('Please describe your completed deliverables.');
      return;
    }
    if (!activeOrderId) return;

    // Filter valid links
    const validLinks = deliveryLinks.filter(l => l.url.trim() && l.title.trim());

    setSubmittingDelivery(true);
    try {
      await api.post(`/api/orders/${activeOrderId}/deliverables`, {
        milestoneIndex: selectedMilestoneIdx,
        message: deliveryMessage.trim(),
        githubUrl: deliveryGithubUrl.trim() || undefined,
        liveUrl: deliveryLiveUrl.trim() || undefined,
        attachments: deliveryFiles.map(f => f.url).concat(deliveryAttachments.filter(a => !deliveryFiles.some(f => f.url === a))),
        links: validLinks,
        fileDetails: deliveryFiles,
      });

      const mTitle = order?.milestones?.[selectedMilestoneIdx]?.title;
      toast.success(mTitle ? `Deliverables for "${mTitle}" submitted successfully!` : 'Deliverables submitted successfully! Hirer notified.');
      setDeliveryMessage('');
      setDeliveryGithubUrl('');
      setDeliveryLiveUrl('');
      setDeliveryAttachments([]);
      setDeliveryFiles([]);
      setDeliveryLinks([]);
      await fetchOrder(activeOrderId);
      await fetchActivities(activeOrderId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit deliverables');
    } finally {
      setSubmittingDelivery(false);
    }
  };

  // ── Hirer: Request Revision ──────────────────────────────────────────────
  const handleRequestRevision = async () => {
    if (!revisionNotes.trim()) {
      toast.error('Please specify what revisions or changes are needed.');
      return;
    }
    if (!activeOrderId) return;

    setSubmittingRevision(true);
    try {
      await api.post(`/api/orders/${activeOrderId}/request-revision`, {
        message: revisionNotes.trim(),
      });

      toast.success('Revision requested. The creator has been notified with your feedback.');
      setRevisionModalOpen(false);
      setRevisionNotes('');
      await fetchOrder(activeOrderId);
      await fetchActivities(activeOrderId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to request revision');
    } finally {
      setSubmittingRevision(false);
    }
  };

  // ── Hirer: Approve Deliverables & Release Escrow ──────────────────────────
  const handleApproveAndRelease = () => {
    if (!activeOrderId) return;
    setApproveConfirmOpen(true);
  };

  const handleConfirmReleasePayment = async () => {
    if (!activeOrderId) return;

    setApprovingPayment(true);
    try {
      await api.post(`/api/orders/${activeOrderId}/approve-and-release`);
      toast.success('Escrow payment released successfully! Contract marked as completed.');
      setApproveConfirmOpen(false);

      // Redirect directly to write review of this completed gig for the freelancer
      navigate(`/dashboard?tab=Reviews %26 History&writeReview=${activeOrderId}`);
      if (onNavigateTab) {
        onNavigateTab('Reviews & History');
      }
    } catch (err: any) {
      setApproveConfirmOpen(false);
      const msg = err.response?.data?.message || 'Failed to release payment';
      if (msg.includes('Razorpay') || msg.includes('gateway') || msg.includes('escrow service')) {
        setRazorpayErrorMsg(msg);
        setRazorpayModalOpen(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setApprovingPayment(false);
    }
  };

  // ── Milestone Actions (With Sequential Locking) ──────────────────────────
  const handleMilestoneAction = async (idx: number, status: string) => {
    if (!activeOrderId) return;

    // Check locking on frontend
    if (idx > 0 && status === 'in_progress') {
      const prevMilestone = order?.milestones?.[idx - 1];
      if (prevMilestone?.status !== 'approved') {
        toast.error(`Milestone ${idx + 1} is locked until Milestone ${idx} is approved.`);
        return;
      }
    }

    const key = `${idx}-${status}`;
    setMilestoneActionLoading(key);
    try {
      await api.patch(`/api/orders/${activeOrderId}/milestones/${idx}`, { status });
      toast.success(`Milestone updated to ${status}`);
      await fetchOrder(activeOrderId);
      await fetchActivities(activeOrderId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update milestone');
    } finally {
      setMilestoneActionLoading(null);
    }
  };

  // ── Milestone Payment Release (Razorpay + Demo Fallback) ──────────────────
  const handleReleaseMilestonePayment = async (idx: number) => {
    if (!activeOrderId || !order) return;
    const m = order.milestones[idx];
    if (!m) return;

    setPayingMilestoneIndex(idx);
    setPayingMilestoneLoading(true);

    try {
      const res = await api.post('/api/payments/milestone/create-order', {
        orderId: activeOrderId,
        milestoneIndex: idx,
      });

      const data = res.data.data;

      if (data.mode === 'razorpay') {
        await openRazorpayModal({
          key: data.keyId,
          amount: data.amount,
          currency: data.currency || 'INR',
          name: 'GigMatch',
          description: `Release Payment: Milestone ${idx + 1} (${m.title})`,
          order_id: data.orderId,
          prefill: {
            name: user?.name,
            email: user?.email,
          },
          handler: async (response) => {
            try {
              const verifyRes = await api.post('/api/payments/milestone/verify-signature', {
                orderId: activeOrderId,
                milestoneIndex: idx,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              toast.success(`Milestone ${idx + 1} approved & payment released!`);
              await fetchOrder(activeOrderId);
              await fetchActivities(activeOrderId);

              if (verifyRes.data?.data?.isCompleted) {
                toast.success('All contract milestones completed! 🎉');
                navigate(`/dashboard?tab=Reviews %26 History&writeReview=${activeOrderId}`);
                if (onNavigateTab) onNavigateTab('Reviews & History');
              }
            } catch (vErr: any) {
              toast.error(vErr.response?.data?.message || 'Payment signature verification failed.');
            } finally {
              setPayingMilestoneLoading(false);
              setPayingMilestoneIndex(null);
            }
          },
          onDismiss: () => {
            toast.info('Payment was cancelled.');
            setPayingMilestoneLoading(false);
            setPayingMilestoneIndex(null);
          },
          onFailed: async (err) => {
            toast.error(err?.description || 'Razorpay payment failed.');
            await api.post('/api/payments/record-failure', {
              razorpay_order_id: data.orderId,
              reason: err?.description || 'Milestone payment failed',
            });
            setPayingMilestoneLoading(false);
            setPayingMilestoneIndex(null);
          },
        });
      } else {
        // Fallback: Demo Payment Modal
        setDemoPaymentDetails({
          orderId: activeOrderId,
          milestoneIndex: idx,
          milestoneTitle: m.title,
          gigTitle: order.gig?.title,
          totalAmount: data.totalAmount,
          platformCommission: data.platformCommission,
          freelancerEarnings: data.freelancerEarnings,
        });
        setDemoPaymentModalOpen(true);
        setPayingMilestoneLoading(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initiate milestone release');
      setPayingMilestoneLoading(false);
      setPayingMilestoneIndex(null);
    }
  };

  const handleConfirmMilestoneDemoPayment = async () => {
    if (!demoPaymentDetails || demoPaymentDetails.milestoneIndex === undefined || !activeOrderId) return;
    const idx = demoPaymentDetails.milestoneIndex;

    setPayingMilestoneLoading(true);
    try {
      const res = await api.post('/api/payments/milestone/demo-payment', {
        orderId: activeOrderId,
        milestoneIndex: idx,
      });

      toast.success(`Milestone ${idx + 1} approved & ₹${demoPaymentDetails.totalAmount.toLocaleString('en-IN')} released!`);
      setDemoPaymentModalOpen(false);
      setDemoPaymentDetails(null);
      await fetchOrder(activeOrderId);
      await fetchActivities(activeOrderId);

      if (res.data?.data?.isCompleted) {
        toast.success('All contract milestones completed! 🎉');
        navigate(`/dashboard?tab=Reviews %26 History&writeReview=${activeOrderId}`);
        if (onNavigateTab) onNavigateTab('Reviews & History');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to release demo payment');
    } finally {
      setPayingMilestoneLoading(false);
      setPayingMilestoneIndex(null);
    }
  };

  // ── Role and Counterparty Resolution ─────────────────────────────────────
  const myId = String((user as any)?._id || (user as any)?.id || '');
  const isClient = user?.role === 'client' || (order ? String(order.client?._id || order.client) === myId : false);
  const isFreelancer = user?.role === 'freelancer' || (order ? String(order.freelancer?._id || order.freelancer) === myId : false);

  const otherParty = order
    ? (isClient ? order.freelancer : order.client)
    : null;

  const otherPartyName = otherParty?.name || (isClient ? 'Assigned Creator' : 'Project Client');
  const otherPartyInitials = otherParty ? getInitials(otherParty.name) : (isClient ? 'CR' : 'CL');
  const otherPartyAvatar = otherParty?.avatar || null;
  const otherPartyAvatarBg = otherParty?.avatarColor || (isClient ? '#A3E635' : '#22D3EE');
  const isOtherOnline = otherParty?._id ? isUserOnline(String(otherParty._id)) : false;
  const isOtherTyping = order?.conversation ? isUserTyping(String(order.conversation)) : null;

  const orderStatus = statusDisplayMap[order?.status || 'active'] || statusDisplayMap.active;

  // Milestone counters
  const milestonesList = order?.milestones || [];
  const currentMilestoneIndex = milestonesList.length > 0
    ? milestonesList.findIndex((m: any) => m.status !== 'approved')
    : -1;
  const currentMilestoneLabel = milestonesList.length > 0
    ? `Sprint Milestone ${(currentMilestoneIndex >= 0 ? currentMilestoneIndex : milestonesList.length - 1) + 1} of ${milestonesList.length}`
    : 'Full Project Sprint';

  // Dynamic Escrow Status
  const getEscrowStage = () => {
    if (!order) return { stage: 1, label: 'Escrow Funded' };
    if (order.status === 'completed' || order.escrowStatus === 'released') {
      return { stage: 6, label: 'Completed' };
    }
    if (order.status === 'delivered') {
      return { stage: 3, label: 'Awaiting Review' };
    }
    if (order.status === 'revision_requested') {
      return { stage: 4, label: 'Revision Requested' };
    }
    return { stage: 2, label: 'Awaiting Delivery' };
  };
  const currentEscrowStage = getEscrowStage();

  // Latest Deliverable for Review Panel
  const latestDeliverable = order?.deliverables && order.deliverables.length > 0
    ? order.deliverables[order.deliverables.length - 1]
    : null;

  const latestRevisionRequest = order?.revisionRequests && order.revisionRequests.length > 0
    ? order.revisionRequests[order.revisionRequests.length - 1]
    : null;

  // ── Inline UI Helpers ─────────────────────────────────────────────────────
  const SectionLoading = () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={24} className="animate-spin text-purple" />
      <span className="ml-2 text-sm font-medium text-ink/50">Loading...</span>
    </div>
  );

  const SectionError = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div className="text-center py-8 px-4 rounded-2xl bg-coral/5 border border-coral/20">
      <AlertCircle size={24} className="text-coral mx-auto mb-2" />
      <p className="text-sm font-bold text-ink">{message}</p>
      <button onClick={onRetry} className="mt-3 btn-secondary !py-1.5 !px-3 !text-xs">
        Retry
      </button>
    </div>
  );

  const SectionEmpty = ({ message, icon: Icon = AlertCircle }: { message: string; icon?: any }) => (
    <div className="text-center py-8 px-4 rounded-2xl bg-soft/50 border border-border/60">
      <Icon size={24} className="text-ink/30 mx-auto mb-2" />
      <p className="text-xs font-semibold text-ink/50">{message}</p>
    </div>
  );

  // ── Empty / Error States for Entire Order View ───────────────────────────
  if (orderLoading && !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 size={40} className="animate-spin text-purple" />
        <h3 className="font-display font-bold text-xl text-ink">Loading Order Workspace...</h3>
        <p className="text-xs text-ink/50 font-medium">Synchronizing live channels, deliverables, and escrow status</p>
      </div>
    );
  }

  if (!activeOrderId || (!order && !orderLoading && !orderError)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-white rounded-[28px] border border-border shadow-xs space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-purple/10 flex items-center justify-center text-purple">
          <Briefcase size={32} />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Collaborative Workspace</h2>
          <p className="text-sm text-ink/60 max-w-md mt-1.5 leading-relaxed">
            {isFreelancer
              ? 'When a hirer accepts your pitch or starts a contract, your live workspace with milestones, chat, deliverables, and escrow payouts will activate here.'
              : 'Launch a project brief or hire talent from your proposals to collaborate with live milestone tracking, files, and escrow.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {isFreelancer ? (
            <>
              <button onClick={() => navigate('/gigs')} className="btn-primary !py-2.5 !px-5 !text-sm cursor-pointer">
                Browse Available Gigs
              </button>
              <button
                onClick={() => onNavigateTab ? onNavigateTab('Proposals') : navigate('/dashboard?tab=Proposals')}
                className="btn-secondary !py-2.5 !px-5 !text-sm cursor-pointer"
              >
                View Applications
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/post-gig')} className="btn-primary !py-2.5 !px-5 !text-sm cursor-pointer">
                Post a Project Brief
              </button>
              <button
                onClick={() => onNavigateTab ? onNavigateTab('Proposals') : navigate('/dashboard?tab=Proposals')}
                className="btn-secondary !py-2.5 !px-5 !text-sm cursor-pointer"
              >
                Review Proposals
              </button>
            </>
          )}
          <button
            onClick={() => onNavigateTab ? onNavigateTab('Orders') : navigate('/dashboard?tab=Orders')}
            className="btn-secondary !py-2.5 !px-5 !text-sm cursor-pointer"
          >
            All Orders
          </button>
        </div>
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-coral/10 flex items-center justify-center text-coral">
          <AlertCircle size={32} />
        </div>
        <h2 className="font-display text-2xl font-bold text-ink">Order Not Found</h2>
        <p className="text-sm text-ink/60 max-w-md">
          {orderError || 'You do not have an active contract selected, or this contract does not exist in your account.'}
        </p>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => onNavigateTab ? onNavigateTab('Orders') : navigate('/dashboard?tab=Orders')}
            className="btn-secondary !py-2.5 !px-5 !text-sm cursor-pointer"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      
      {/* ====================================================
          TOP PROJECT SWITCHER & HEADER BAR
          ==================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3">
          <span className="eyebrow text-purple">ACTIVE CONTRACT</span>
          
          {/* Multi-Project Switcher Dropdown */}
          <div className="relative" ref={switcherRef}>
            <button
              onClick={() => setSwitcherOpen(!switcherOpen)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-border/80 hover:border-purple/50 text-xs font-bold text-ink transition-all shadow-xs cursor-pointer"
              title="Switch between active workspace projects"
            >
              <Briefcase size={13} />
              <span className="truncate max-w-[150px] sm:max-w-[260px] md:max-w-[380px]">
                {order.gig?.title || 'Contract Workspace'}
              </span>
              <ChevronDown size={13} className={`transition-transform duration-200 shrink-0 ${switcherOpen ? 'rotate-180' : ''}`} />
            </button>

            {switcherOpen && (
              <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-border shadow-xl z-30 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-border/40 text-[11px] font-bold text-ink/40 uppercase tracking-wider">
                  Your Active Contracts ({allOrders.length})
                </div>
                <div className="max-h-64 overflow-y-auto py-1 space-y-1">
                  {allOrders.length === 0 ? (
                    <div className="p-3 text-center text-xs text-ink/40">No other contracts found</div>
                  ) : (
                    allOrders.map((o: any) => {
                      const isCurrent = o._id === order._id;
                      const partnerObj = isClient ? o.freelancer : o.client;
                      const partnerName = partnerObj?.name;
                      const partnerAvatar = partnerObj?.avatar;
                      const partnerAvatarBg = partnerObj?.avatarColor || (isClient ? '#A3E635' : '#22D3EE');
                      const st = statusDisplayMap[o.status] || { label: o.status, color: 'text-ink/60 bg-soft border-border' };

                      return (
                        <div
                          key={o._id}
                          onClick={() => {
                            setSwitcherOpen(false);
                            if (!isCurrent) {
                              if (onSelectOrder) {
                                onSelectOrder(o._id);
                              } else {
                                setSearchParams({ tab: 'Workspace', orderId: o._id });
                              }
                            }
                          }}
                          className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-start justify-between gap-3 ${
                            isCurrent
                              ? 'bg-purple/10 border border-purple/30'
                              : 'hover:bg-soft border border-transparent'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-clash font-bold text-xs text-ink shrink-0 overflow-hidden" style={{ backgroundColor: partnerAvatarBg }}>
                            {partnerAvatar ? (
                              <img src={partnerAvatar} alt={partnerName || 'User'} className="w-full h-full object-cover" />
                            ) : (
                              getInitials(partnerName || 'U')
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${st.color}`}>
                                {st.label}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold text-purple flex items-center gap-0.5">
                                  <Check size={11} /> Current
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-xs text-ink truncate">
                              {o.gig?.title || 'Contract Workspace'}
                            </h4>
                            <p className="text-[11px] text-ink/50 truncate mt-0.5">
                              {partnerName ? `${partnerName} · ` : ''}₹{Number(o.totalAmount || 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => setBriefDrawerOpen(true)}
            className="btn-secondary !py-2 !px-3.5 !text-xs inline-flex items-center gap-1.5"
            title="Open Project Brief Drawer"
          >
            <FileText size={13} className="text-purple" />
            <span>View Brief</span>
          </button>
          <button
            onClick={() => {
              const shareUrl = `${window.location.origin}/dashboard?tab=Workspace&orderId=${order._id}`;
              navigator.clipboard.writeText(shareUrl);
              toast.success('Workspace link copied to clipboard!');
            }}
            className="btn-secondary !py-2 !px-3.5 !text-xs inline-flex items-center gap-1.5"
            title="Copy direct link to this workspace"
          >
            <ExternalLink size={13} />
            <span>Share Channel</span>
          </button>
        </div>
      </div>

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
              {order.gig?.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-ink/70 pt-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-clash font-bold text-xs text-ink shadow-xs overflow-hidden shrink-0"
                  style={{ backgroundColor: otherPartyAvatarBg }}
                >
                  {otherPartyAvatar ? (
                    <img src={otherPartyAvatar} alt={otherPartyName} className="w-full h-full object-cover" />
                  ) : (
                    otherPartyInitials
                  )}
                </div>
                <span>Collaborator: <strong className="text-ink">{otherPartyName}</strong></span>
              </div>
              <span>·</span>
              <span>Started: <strong className="text-ink">{formatDate(order.createdAt)}</strong></span>
              {order.gig?.deadline && (
                <>
                  <span>·</span>
                  <span>Deadline: <strong className="text-ink">{formatDate(order.gig.deadline)}</strong></span>
                </>
              )}
            </div>
          </div>

          {/* Right Budget & Escrow Details */}
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
                onClick={() => setBriefDrawerOpen(true)}
                className="btn-secondary !py-2 !px-4 !text-xs flex items-center gap-1.5"
              >
                <FileText size={14} className="text-purple" />
                <span>View Full Brief</span>
              </button>
            </div>
          </div>
        </div>

        {/* Overall Sprint Progress Bar */}
        <div className="mt-6 pt-6 border-t border-border/50">
          <div className="flex items-center justify-between text-xs font-bold text-ink mb-2">
            <span>Overall Sprint Progress</span>
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
          2. MAIN WORKSPACE: 2-COLUMN LAYOUT
          Left (7 cols): Deliverables Workflow, History, Milestones
          Right (5 cols): Real-Time Order Chat & Activity Timeline
          ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN (7 COLS): WORKFLOW & DELIVERABLES */}
        <div className="lg:col-span-7 space-y-6">

          {/* A. ESCROW STATUS PIPELINE & LEDGER */}
          <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-5">
            <div>
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-2">
                  <span className="eyebrow text-purple">ESCROW PIPELINE</span>
                  <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    {currentEscrowStage.label}
                  </span>
                </div>
              </div>
              <p className="text-xs text-ink/50 font-medium">
                Real-time funds protection and payment lifecycle governed by smart escrow.
              </p>
            </div>

            {/* 6-Stage Visual Stepper */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { num: 1, label: 'Escrow Funded' },
                { num: 2, label: 'Awaiting Delivery' },
                { num: 3, label: 'Awaiting Review' },
                { num: 4, label: 'Revision Requested' },
                { num: 5, label: 'Payment Released' },
                { num: 6, label: 'Completed' },
              ].map((st) => {
                const isPast = currentEscrowStage.stage > st.num;
                const isCurrent = currentEscrowStage.stage === st.num;
                return (
                  <div
                    key={st.num}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-purple/10 border-purple ring-2 ring-purple/20'
                        : isPast
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                        : 'bg-soft/50 border-border/40 text-ink/40'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      {isPast ? (
                        <CheckCircle2 size={13} className="text-emerald-600" />
                      ) : isCurrent ? (
                        <span className="w-2 h-2 rounded-full bg-purple animate-pulse" />
                      ) : (
                        <span className="text-[10px] font-bold text-ink/30">#{st.num}</span>
                      )}
                    </div>
                    <span className={`text-[11px] font-bold block leading-tight ${isCurrent ? 'text-purple' : isPast ? 'text-emerald-800' : 'text-ink/60'}`}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Financial Ledger Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/40">
              <div className="bg-soft/70 p-3.5 rounded-2xl border border-border/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 block mb-1">Agreed Escrow</span>
                <span className="font-display font-extrabold text-xl text-ink leading-tight">{formatCurrency(financial.totalAmount)}</span>
              </div>
              <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">Released</span>
                <span className="font-display font-extrabold text-xl text-emerald-700 leading-tight">{formatCurrency(financial.paidAmount)}</span>
              </div>
              <div className="bg-purple/5 p-3.5 rounded-2xl border border-purple/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple block mb-1">Held in Escrow</span>
                <span className="font-display font-extrabold text-xl text-purple leading-tight">{formatCurrency(financial.remainingAmount)}</span>
              </div>
            </div>
          </section>

          {/* B0. COMPLETED ORDER REVIEW BANNER (When contract is completed and hirer can review) */}
          {isClient && order.status === 'completed' && (
            <section className="bg-gradient-to-r from-emerald-50 via-white to-purple-50/50 rounded-[28px] p-5 sm:p-6 border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100/70 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                  <Star size={22} className="fill-amber-400 text-amber-500" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-ink">
                    Contract Complete & Payment Released! 🎉
                  </h4>
                  <p className="text-xs text-ink/60 font-medium">
                    Share your experience and leave a rating & review for {otherPartyName}.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigate(`/dashboard?tab=Reviews %26 History&writeReview=${activeOrderId}`);
                  if (onNavigateTab) onNavigateTab('Reviews & History');
                }}
                className="btn-primary !py-2.5 !px-5 !text-xs font-bold inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <Star size={13} className="fill-white" />
                <span>Write Review for {otherPartyName}</span>
              </button>
            </section>
          )}

          {/* B. CLIENT REVIEW PANEL (When deliverables exist and awaiting review) */}
          {isClient && order.status === 'delivered' && (
            <section className="bg-gradient-to-br from-blue-50/80 via-white to-purple-50/50 rounded-[28px] p-6 sm:p-7 border-2 border-blue-200/80 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                  <h3 className="font-display font-extrabold text-lg text-ink">
                    Deliverables Ready for Review
                  </h3>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto">
                  Action Required
                </span>
              </div>

              {latestDeliverable && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between text-ink/60">
                    <span>Version #{latestDeliverable.version || order.deliverables.length} submitted by <strong className="text-ink">{otherPartyName}</strong></span>
                    <span>{formatDateTime(latestDeliverable.submittedAt)}</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-blue-100 text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-wrap shadow-2xs">
                    {latestDeliverable.message}
                  </div>

                  {/* Delivered Files */}
                  {(() => {
                    const files = getDeliverableFiles(latestDeliverable);
                    if (files.length === 0) return null;
                    return (
                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-ink/60 block">
                          Delivered Files ({files.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {files.map((f, fIdx) => {
                            const openUrl = getDeliverableFileUrl(f.url, false, f.name);
                            const downloadUrl = getDeliverableFileUrl(f.url, true, f.name);
                            return (
                              <div
                                key={fIdx}
                                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-border/80 hover:border-purple/60 text-xs font-semibold text-ink transition-all shadow-xs group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                                  {getFileIcon(f.fileType, f.name)}
                                  <div className="min-w-0">
                                    <span className="truncate block max-w-[160px] text-ink font-bold group-hover:text-purple transition-colors">
                                      {f.name}
                                    </span>
                                    {f.size ? (
                                      <span className="text-[10px] text-ink/40 font-mono block">
                                        {formatFileSize(f.size)}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-purple/70 font-semibold block uppercase">
                                        {f.fileType?.split('/')[1] || 'Deliverable'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <a
                                    href={openUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple/10 hover:bg-purple text-purple hover:text-white font-bold text-[11px] transition-all cursor-pointer"
                                    title="Open and preview file in browser"
                                  >
                                    <Eye size={13} />
                                    <span>Open</span>
                                  </a>
                                  <a
                                    href={downloadUrl}
                                    download={f.name}
                                    className="p-1.5 rounded-xl bg-soft hover:bg-border/70 text-ink/60 hover:text-ink transition-all cursor-pointer"
                                    title="Download file"
                                  >
                                    <Download size={13} />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* External Links & Resources */}
                  {((latestDeliverable.links && latestDeliverable.links.length > 0) || latestDeliverable.githubUrl || latestDeliverable.liveUrl) && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-ink/60 block">
                        Project Resources & External Deliverables
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {latestDeliverable.links?.map((link, lIdx) => (
                          <a
                            key={lIdx}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-blue-200 hover:border-blue-500 text-xs font-semibold text-blue-900 hover:bg-blue-50/50 transition-all shadow-xs"
                          >
                            {getLinkIcon(link.title, link.url)}
                            <span>{link.title}</span>
                            <ExternalLink size={12} className="text-blue-600/60" />
                          </a>
                        ))}

                        {latestDeliverable.githubUrl && (
                          <a
                            href={latestDeliverable.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ink text-white text-xs font-semibold hover:bg-ink/80 transition-colors"
                          >
                            <FileCode size={14} />
                            <span>GitHub Repository</span>
                            <ExternalLink size={12} />
                          </a>
                        )}

                        {latestDeliverable.liveUrl && (
                          <a
                            href={latestDeliverable.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                          >
                            <Globe size={14} />
                            <span>Live Demo URL</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions: Approve Delivery or Request Revision */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-blue-100">
                <button
                  onClick={() => setRevisionModalOpen(true)}
                  className="w-full sm:w-auto btn-secondary !py-2.5 !px-5 !text-xs font-bold text-amber-700 hover:bg-amber-50 hover:border-amber-300"
                >
                  <RefreshCw size={14} />
                  <span>Request Revision</span>
                </button>

                <button
                  onClick={() => {
                    const submittedIdx = order.milestones?.findIndex((m: any) => m.status === 'submitted');
                    if (submittedIdx !== -1 && submittedIdx !== undefined) {
                      handleReleaseMilestonePayment(submittedIdx);
                    } else {
                      handleApproveAndRelease();
                    }
                  }}
                  disabled={approvingPayment || payingMilestoneLoading}
                  className="w-full sm:w-auto btn-primary !py-2.5 !px-6 !text-xs font-bold"
                >
                  {approvingPayment || payingMilestoneLoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={16} />}
                  <span>
                    {(() => {
                      const submittedIdx = order.milestones?.findIndex((m: any) => m.status === 'submitted');
                      if (submittedIdx !== -1 && submittedIdx !== undefined && order.milestones[submittedIdx]) {
                        return `Approve Milestone ${submittedIdx + 1} & Release Payment (${formatCurrency(order.milestones[submittedIdx].amount)})`;
                      }
                      return `Approve Delivery & Release Payment (${formatCurrency(financial.remainingAmount || order.totalAmount)})`;
                    })()}
                  </span>
                </button>
              </div>
            </section>
          )}

          {/* C. FREELANCER SUBMISSION FORM (When active or revision_requested) */}
          {isFreelancer && (order.status === 'active' || order.status === 'revision_requested' || order.status === 'delivered') && (
            <section ref={deliverableFormRef} className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/50">
                <div>
                  <h3 className="font-display font-bold text-lg text-ink">
                    {order.status === 'revision_requested' ? 'Submit Revised Deliverables' : 'Submit Sprint Deliverables'}
                  </h3>
                  <p className="text-xs text-ink/50 font-medium">
                    Hand over your completed files, assets, and project resources for client review and milestone payment release.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-purple bg-purple/10 px-3 py-1 rounded-full shrink-0">
                  Version {order.deliverables ? order.deliverables.length + 1 : 1}
                </span>
              </div>

              {/* Milestone Selection for Deliverables */}
              {order.milestones && order.milestones.length > 0 && (
                <div className="bg-soft/70 p-3 rounded-2xl border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <Layers size={15} className="text-purple shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-ink block leading-tight">Target Milestone</span>
                      <span className="text-[11px] text-ink/50">Attach this deliverable submission to a specific contract sprint</span>
                    </div>
                  </div>
                  <select
                    value={selectedMilestoneIdx}
                    onChange={(e) => setSelectedMilestoneIdx(Number(e.target.value))}
                    className="text-xs font-bold bg-white border border-border/80 rounded-xl px-3 py-1.5 text-purple focus:outline-none focus:border-purple shadow-xs cursor-pointer self-start sm:self-auto"
                  >
                    {order.milestones.map((m: any, idx: number) => (
                      <option key={idx} value={idx}>
                        Milestone {idx + 1}: {m.title} ({formatCurrency(m.amount)}) {m.status === 'approved' ? '✓ Paid' : m.status === 'submitted' ? '⏳ Under Review' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Revision Request Feedback Notice if revision was requested */}
              {order.status === 'revision_requested' && (
                <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <RefreshCw size={13} className="text-amber-700" />
                    <span>Hirer Revision Feedback:</span>
                  </div>
                  <p className="text-amber-950 whitespace-pre-wrap font-medium leading-relaxed pl-5">
                    {latestRevisionRequest?.message || 'Please address the requested adjustments and upload your updated deliverables.'}
                  </p>
                </div>
              )}

              {/* Message / Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                  Deliverable Notes & Summary <span className="text-purple">*</span>
                </label>
                <textarea
                  rows={4}
                  value={deliveryMessage}
                  onChange={(e) => setDeliveryMessage(e.target.value)}
                  placeholder="Describe your completed work, key highlights, how to review or access assets, or how you addressed revision feedback..."
                  className="w-full bg-soft border border-border rounded-2xl p-4 text-xs sm:text-sm font-medium text-ink focus:outline-none focus:border-purple leading-relaxed transition-colors"
                />
              </div>

              {/* Flexible Multi-File Upload Zone */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Deliverable Files & Assets
                  </label>
                  <span className="text-[11px] text-ink/40 font-medium">Any format · up to 50MB each</span>
                </div>

                {/* Dropzone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingFiles(true); }}
                  onDragLeave={() => setIsDraggingFiles(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFiles(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      uploadSelectedFiles(Array.from(e.dataTransfer.files));
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                    isDraggingFiles
                      ? 'border-purple bg-purple/5 scale-[0.99]'
                      : 'border-border/80 hover:border-purple/50 bg-soft/40 hover:bg-soft/70'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-border/60 flex items-center justify-center text-purple">
                      {uploadingAttachment ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    </div>
                    <p className="text-xs font-semibold text-ink">
                      {uploadingAttachment ? 'Uploading files...' : 'Drop files here or click to browse'}
                    </p>
                    <p className="text-[11px] text-ink/40">
                      Supports designs (PNG, SVG, PSD, AI), documents (PDF, DOCX), video/audio (MP4, MP3), archives (ZIP) & code
                    </p>
                  </div>
                </div>

                {/* Uploaded File Cards */}
                {deliveryFiles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {deliveryFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-soft border border-border text-xs font-semibold text-ink"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {getFileIcon(file.fileType, file.name)}
                          <span className="truncate max-w-[160px] text-ink">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {file.size ? (
                            <span className="text-[10px] text-ink/40 font-mono">{formatFileSize(file.size)}</span>
                          ) : null}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }}
                            className="text-ink/40 hover:text-red-600 transition-colors cursor-pointer p-0.5"
                            title="Remove file"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Flexible External Links Section */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                      Project Links & External Deliverables
                    </label>
                    <p className="text-[11px] text-ink/40">
                      Link live websites, design boards, cloud drives, or repos
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddLink()}
                    className="btn-secondary !py-1.5 !px-3 !text-xs self-start sm:self-auto inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add Link</span>
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider mr-1">Quick Add:</span>
                  {[
                    { label: 'Figma', title: 'Figma Design' },
                    { label: 'Google Drive', title: 'Google Drive Folder' },
                    { label: 'Live Site', title: 'Live Preview' },
                    { label: 'GitHub', title: 'GitHub Repository' },
                    { label: 'Loom Walkthrough', title: 'Loom Video' },
                    { label: 'Notion', title: 'Documentation' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleAddLink(preset.title)}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-soft hover:bg-purple/10 text-ink/70 hover:text-purple border border-border/60 hover:border-purple/30 transition-all cursor-pointer"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>

                {/* Dynamic Link Inputs List */}
                {deliveryLinks.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {deliveryLinks.map((link, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-soft/60 p-2.5 rounded-xl border border-border">
                        <div className="w-1/3 min-w-[120px]">
                          <input
                            type="text"
                            value={link.title}
                            onChange={(e) => handleUpdateLink(idx, 'title', e.target.value)}
                            placeholder="Link Title (e.g. Figma)"
                            className="w-full bg-white border border-border rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink focus:outline-none focus:border-purple"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => handleUpdateLink(idx, 'url', e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-white border border-border rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink focus:outline-none focus:border-purple"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(idx)}
                          className="p-1.5 text-ink/40 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                          title="Remove link"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/40">
                <div className="text-xs text-ink/50 font-medium">
                  {deliveryFiles.length > 0 || deliveryLinks.filter(l => l.title && l.url).length > 0 ? (
                    <span>
                      Ready to submit: {deliveryFiles.length} file{deliveryFiles.length !== 1 ? 's' : ''} · {deliveryLinks.filter(l => l.title && l.url).length} link{deliveryLinks.filter(l => l.title && l.url).length !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span>Enter notes and attach your work above</span>
                  )}
                </div>

                <button
                  onClick={handleSubmitDeliverables}
                  disabled={submittingDelivery || !deliveryMessage.trim() || uploadingAttachment}
                  className="w-full sm:w-auto btn-primary !py-2.5 !px-6 !text-xs font-bold disabled:opacity-50"
                >
                  {submittingDelivery ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  <span>{order.status === 'revision_requested' ? 'Submit Revised Deliverables' : 'Submit Deliverables for Review'}</span>
                </button>
              </div>
            </section>
          )}

          {/* D. DELIVERY HISTORY (Versioned Records) */}
          <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-purple" />
                <h3 className="font-display font-bold text-lg text-ink">
                  Delivery History ({order.deliverables?.length || 0})
                </h3>
              </div>
            </div>

            {(!order.deliverables || order.deliverables.length === 0) ? (
              <div className="text-center py-8 px-4 rounded-2xl bg-soft/50 border border-border/60 text-xs text-ink/50">
                No deliverables submitted yet. Work is actively in progress.
              </div>
            ) : (
              <div className="space-y-4">
                {order.deliverables.map((deliv, idx) => {
                  const isLatest = idx === order.deliverables.length - 1;
                  const versionNum = deliv.version || (idx + 1);
                  let statusBadge = { label: 'Pending Review', color: 'bg-blue-100 text-blue-800 border-blue-200' };
                  if (deliv.status === 'approved' || (order.status === 'completed' && isLatest)) {
                    statusBadge = { label: 'Approved', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
                  } else if (deliv.status === 'revision_requested' || (!isLatest && order.deliverables.length > idx + 1)) {
                    statusBadge = { label: 'Revision Requested', color: 'bg-amber-100 text-amber-800 border-amber-200' };
                  }

                  const associatedRevision = order.revisionRequests?.find(
                    (r: any) => r.deliveryVersion === versionNum
                  ) || (order.revisionRequests && order.revisionRequests[idx]);

                  return (
                    <div
                      key={deliv._id || idx}
                      className={`rounded-2xl p-5 border transition-all ${
                        isLatest && order.status === 'delivered'
                          ? 'bg-blue-50/20 border-blue-300 ring-1 ring-blue-200 shadow-xs'
                          : 'bg-white border-border/70'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-extrabold text-sm text-ink">
                            Version {versionNum}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${statusBadge.color}`}>
                            {statusBadge.label}
                          </span>
                          {isLatest && (
                            <span className="text-[10px] font-bold text-purple bg-purple/10 px-2 py-0.5 rounded-full">
                              Latest
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-ink/50 font-medium">
                          {formatDateTime(deliv.submittedAt)}
                        </span>
                      </div>

                      {/* Description Notes */}
                      <div className="bg-soft/70 p-3.5 rounded-xl border border-border/50 text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-wrap mb-3">
                        {deliv.message}
                      </div>

                      {/* Delivered Files */}
                      {(() => {
                        const files = getDeliverableFiles(deliv);
                        if (files.length === 0) return null;
                        return (
                          <div className="mb-3 space-y-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-ink/50 block">Delivered Files:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {files.map((f, fIdx) => {
                                const openUrl = getDeliverableFileUrl(f.url, false, f.name);
                                const downloadUrl = getDeliverableFileUrl(f.url, true, f.name);
                                return (
                                  <div
                                    key={fIdx}
                                    className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-border/70 hover:border-purple text-xs font-semibold text-ink hover:text-purple transition-all shadow-xs group"
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                                      {getFileIcon(f.fileType, f.name)}
                                      <div className="min-w-0">
                                        <span className="max-w-[150px] truncate block font-bold text-ink group-hover:text-purple">
                                          {f.name}
                                        </span>
                                        {f.size && (
                                          <span className="text-[10px] text-ink/40 font-mono block">
                                            {formatFileSize(f.size)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <a
                                        href={openUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple/10 hover:bg-purple text-purple hover:text-white font-bold text-[10px] transition-all"
                                        title="Open file"
                                      >
                                        <Eye size={11} />
                                        <span>Open</span>
                                      </a>
                                      <a
                                        href={downloadUrl}
                                        download={f.name}
                                        className="p-1 rounded-lg bg-soft hover:bg-border/60 text-ink/60 hover:text-ink transition-all"
                                        title="Download file"
                                      >
                                        <Download size={11} />
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Links & Project Resources */}
                      {((deliv.links && deliv.links.length > 0) || deliv.githubUrl || deliv.liveUrl) && (
                        <div className="flex flex-wrap items-center gap-2">
                          {deliv.links?.map((link, lIdx) => (
                            <a
                              key={lIdx}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors"
                            >
                              {getLinkIcon(link.title, link.url)}
                              <span>{link.title}</span>
                              <ExternalLink size={12} className="text-blue-500" />
                            </a>
                          ))}

                          {deliv.githubUrl && (
                            <a
                              href={deliv.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-purple flex items-center gap-1.5 bg-purple/10 px-3 py-1.5 rounded-xl border border-purple/20 hover:bg-purple/20 transition-colors"
                            >
                              <FileCode size={14} />
                              <span>GitHub Repository</span>
                              <ExternalLink size={12} />
                            </a>
                          )}

                          {deliv.liveUrl && (
                            <a
                              href={deliv.liveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-blue-700 flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors"
                            >
                              <Globe size={14} />
                              <span>Live Demo</span>
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Revision feedback note if this version was requested changes */}
                      {associatedRevision && (
                        <div className="mt-3.5 pt-3.5 border-t border-amber-200 bg-amber-50/70 -mx-5 -mb-5 p-4 rounded-b-2xl flex items-start gap-2.5 text-xs text-amber-950">
                          <RefreshCw size={14} className="text-amber-700 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-amber-900">Client Revision Feedback</span>
                              <span className="text-[10px] text-amber-700/80">{formatDateTime(associatedRevision.requestedAt)}</span>
                            </div>
                            <p className="whitespace-pre-wrap text-amber-900 font-medium leading-relaxed">{associatedRevision.message}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* E. REVISION HISTORY (Full Thread) */}
          {order.revisionRequests && order.revisionRequests.length > 0 && (
            <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-4">
              <div className="flex items-center gap-2">
                <RefreshCw size={16} className="text-amber-600" />
                <h3 className="font-display font-bold text-lg text-ink">
                  Revision Request History ({order.revisionRequests.length})
                </h3>
              </div>

              <div className="space-y-3">
                {order.revisionRequests.map((rev, rIdx) => (
                  <div key={rIdx} className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900">
                        Revision #{rIdx + 1} {rev.deliveryVersion ? `(on Version ${rev.deliveryVersion})` : ''}
                      </span>
                      <span className="text-[11px] text-amber-700/70 font-medium">
                        {formatDateTime(rev.requestedAt)}
                      </span>
                    </div>
                    <p className="text-amber-950 whitespace-pre-wrap font-medium leading-relaxed">
                      {rev.message}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* F. MILESTONES & SPRINT PROGRESS (With Sequential Locking) */}
          <section className="bg-white rounded-[28px] p-6 sm:p-7 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-xl font-bold text-ink">
                  Milestone Timeline & Sprint Deliverables
                </h3>
                <p className="text-xs text-ink/50 font-medium">
                  Sequential milestone verification guarantees safe phased development.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/50 self-start sm:self-auto">
                <ShieldCheck size={14} />
                <span>Sequential Escrow</span>
              </div>
            </div>

            <div className="space-y-3">
              {milestonesList.map((m, idx) => {
                const isLocked = idx > 0 && milestonesList[idx - 1].status !== 'approved';
                const milestoneStatus = m.status;
                const isActionLoading = milestoneActionLoading?.startsWith(`${idx}-`);
                const isPayingThisMilestone = payingMilestoneLoading && payingMilestoneIndex === idx;

                // Deliverables associated with this milestone
                const mDeliverables = (order.deliverables || []).filter(
                  (d: any) => d.milestoneIndex === idx || (order.milestones?.length === 1 && d.milestoneIndex === undefined)
                );

                return (
                  <div
                    key={m._id || idx}
                    className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                      isLocked
                        ? 'bg-soft/40 border-border/40 opacity-75'
                        : milestoneStatus === 'approved'
                        ? 'bg-emerald-50/30 border-emerald-200'
                        : milestoneStatus === 'submitted'
                        ? 'bg-amber-50/30 border-amber-200/80 ring-1 ring-amber-200/50'
                        : milestoneStatus === 'in_progress'
                        ? 'bg-purple/5 border-purple/30 ring-1 ring-purple/20'
                        : 'bg-soft/60 border-border/60'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-clash font-bold text-xs shrink-0 mt-0.5 ${
                          isLocked
                            ? 'bg-ink/10 text-ink/40'
                            : milestoneStatus === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : milestoneStatus === 'submitted'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-purple/15 text-purple'
                        }`}>
                          {isLocked ? <Lock size={15} /> : milestoneStatus === 'approved' ? <Check size={16} /> : idx + 1}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-sm sm:text-base text-ink">{m.title}</h4>
                            {isLocked ? (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-ink/10 text-ink/50 border border-ink/10 flex items-center gap-1">
                                <Lock size={10} />
                                Locked Until Milestone {idx} Approval
                              </span>
                            ) : (
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                milestoneStatus === 'approved'
                                   ? 'bg-emerald-100 text-emerald-800'
                                   : milestoneStatus === 'in_progress'
                                   ? 'bg-purple/15 text-purple'
                                   : milestoneStatus === 'submitted'
                                   ? 'bg-amber-100 text-amber-800'
                                   : milestoneStatus === 'rejected'
                                   ? 'bg-rose-100 text-rose-800'
                                   : 'bg-blue-100 text-blue-700'
                               }`}>
                                 {milestoneStatus === 'in_progress' ? 'In Progress' : milestoneStatus === 'approved' ? 'Completed & Paid' : milestoneStatus === 'submitted' ? 'Under Review' : milestoneStatus === 'rejected' ? 'Revision Needed' : 'Available'}
                               </span>
                            )}
                          </div>

                          {m.description && (
                            <p className="text-xs text-ink/65 font-medium leading-relaxed">
                              {m.description}
                            </p>
                          )}

                          <div className="text-xs text-ink/50 font-medium">
                            {m.dueDate && <>Due: {formatDate(m.dueDate)} · </>}Allocated: <strong className="text-ink">{formatCurrency(m.amount)}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Milestone Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
                        {isLocked ? (
                          <span className="text-xs font-semibold text-ink/40 flex items-center gap-1">
                            <Lock size={12} />
                            Locked
                          </span>
                        ) : (
                          <>
                            {isFreelancer && milestoneStatus === 'pending' && (
                              <button
                                onClick={() => handleMilestoneAction(idx, 'in_progress')}
                                disabled={!!isActionLoading}
                                className="btn-primary !py-2 !px-4 !text-xs cursor-pointer"
                              >
                                {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Briefcase size={14} />}
                                <span>Start Work</span>
                              </button>
                            )}

                            {isFreelancer && (milestoneStatus === 'in_progress' || milestoneStatus === 'rejected') && (
                              <button
                                onClick={() => {
                                  setSelectedMilestoneIdx(idx);
                                  deliverableFormRef.current?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="btn-primary !py-2 !px-4 !text-xs cursor-pointer"
                              >
                                <Upload size={14} />
                                <span>Submit Deliverables</span>
                              </button>
                            )}

                            {isFreelancer && milestoneStatus === 'submitted' && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100/80 px-3 py-1.5 rounded-full border border-amber-200">
                                <Clock size={13} className="text-amber-700 animate-pulse" />
                                <span>Awaiting Client Review</span>
                              </span>
                            )}

                            {isClient && milestoneStatus === 'submitted' && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setRevisionModalOpen(true)}
                                  disabled={payingMilestoneLoading}
                                  className="btn-secondary !py-2 !px-3 !text-xs text-amber-700 hover:bg-amber-50 cursor-pointer"
                                >
                                  <RefreshCw size={13} />
                                  <span>Revision</span>
                                </button>
                                <button
                                  onClick={() => handleReleaseMilestonePayment(idx)}
                                  disabled={payingMilestoneLoading}
                                  className="btn-primary !py-2 !px-4 !text-xs cursor-pointer"
                                >
                                  {isPayingThisMilestone ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <ShieldCheck size={14} />
                                  )}
                                  <span>Approve & Release ({formatCurrency(m.amount)})</span>
                                </button>
                              </div>
                            )}

                            {milestoneStatus === 'approved' && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-200/60">
                                <CheckCircle2 size={14} />
                                <span>Approved & Paid</span>
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Attached Deliverables for this milestone */}
                    {mDeliverables.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/40 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink/50 block">
                          Sprint Deliverables Submitted ({mDeliverables.length})
                        </span>
                        {mDeliverables.map((del: any, dIdx: number) => {
                          const files = getDeliverableFiles(del);
                          return (
                            <div key={dIdx} className="bg-white/90 rounded-xl p-3 border border-border/60 text-xs space-y-2">
                              <div className="flex items-center justify-between text-ink/50 text-[11px]">
                                <span className="font-bold text-ink/70">Version #{del.version || dIdx + 1}</span>
                                <span>{formatDateTime(del.submittedAt)}</span>
                              </div>
                              {del.message && (
                                <p className="text-ink text-xs whitespace-pre-wrap leading-relaxed">{del.message}</p>
                              )}
                              {files.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {files.map((f, fIdx) => (
                                    <a
                                      key={fIdx}
                                      href={getDeliverableFileUrl(f.url, false, f.name)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-soft hover:bg-purple/10 text-ink hover:text-purple border border-border/60 text-[11px] font-semibold transition-all group/file"
                                    >
                                      {getFileIcon(f.fileType, f.name)}
                                      <span className="truncate max-w-[140px]">{f.name}</span>
                                      <Eye size={12} className="text-ink/40 group-hover/file:text-purple" />
                                    </a>
                                  ))}
                                </div>
                              )}
                              {(del.githubUrl || del.liveUrl) && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {del.githubUrl && (
                                    <a href={del.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-ink text-white text-[11px] font-semibold">
                                      <FileCode size={12} />
                                      <span>GitHub</span>
                                      <ExternalLink size={10} />
                                    </a>
                                  )}
                                  {del.liveUrl && (
                                    <a href={del.liveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-semibold">
                                      <Globe size={12} />
                                      <span>Live Demo</span>
                                      <ExternalLink size={10} />
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN (5 COLS): PRIMARY ORDER CHAT & REAL ACTIVITY LOG */}
        <div className="lg:col-span-5 space-y-6">

          {/* 1. ORDER CHAT (Primary Single Source of Truth) */}
          <section className="bg-white rounded-[28px] border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col h-[520px]">
            {/* Top Bar */}
            <div className="p-4 border-b border-border bg-paper/50 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-clash font-bold text-xs text-ink shrink-0 shadow-xs overflow-hidden"
                  style={{ backgroundColor: otherPartyAvatarBg }}
                >
                  {otherPartyAvatar ? (
                    <img src={otherPartyAvatar} alt={otherPartyName} className="w-full h-full object-cover" />
                  ) : (
                    otherPartyInitials
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-ink">{otherPartyName}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOtherOnline ? 'bg-emerald-500 animate-pulse' : 'bg-ink/20'
                      }`}
                      title={isOtherOnline ? 'Online' : 'Offline'}
                    />
                  </div>
                  <p className="text-[11px] text-ink/50">
                    {isClient ? 'Freelancer' : 'Hirer'} · {isOtherOnline ? 'Active now' : 'Offline'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-purple bg-purple/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Real-Time
              </span>
            </div>

            {/* Messages Stream */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-paper">
              <div className="text-center my-1">
                <span className="inline-block bg-white text-ink/40 text-[10px] font-semibold px-3 py-0.5 rounded-full border border-border">
                  Order Workspace Official Channel
                </span>
              </div>

              {messagesLoading ? (
                <SectionLoading />
              ) : messagesError ? (
                <SectionError message={messagesError} onRetry={() => fetchMessages(activeOrderId)} />
              ) : messages.length === 0 ? (
                <SectionEmpty message="No messages yet. Send a message to coordinate project details!" icon={MessageSquare} />
              ) : (
                messages.map((msg) => {
                  const isMe = String(msg.senderId) === myId;
                  const hasAttachments = Array.isArray(msg.attachments) && msg.attachments.length > 0;

                  return (
                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className="flex items-end gap-2 max-w-[85%]">
                        {!isMe && (
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center font-clash font-bold text-[10px] text-ink shrink-0 mb-0.5 overflow-hidden"
                            style={{ backgroundColor: otherPartyAvatarBg }}
                          >
                            {otherPartyAvatar ? (
                              <img src={otherPartyAvatar} alt={otherPartyName} className="w-full h-full object-cover" />
                            ) : (
                              otherPartyInitials
                            )}
                          </div>
                        )}
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                            isMe
                              ? 'gradient-primary text-white rounded-br-xs'
                              : 'bg-white text-ink border border-border rounded-bl-xs'
                          }`}
                        >
                          {/* Text content if present and not placeholder icon text */}
                          {msg.content && msg.content !== '📷 Image' && !msg.content.startsWith('📎 ') && (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}

                          {/* Render Attachments */}
                          {hasAttachments && (
                            <div className={`space-y-2 ${msg.content && msg.content !== '📷 Image' && !msg.content.startsWith('📎 ') ? 'mt-2' : ''}`}>
                              {msg.attachments!.map((att: any, attIdx: number) => {
                                const fileUrl = typeof att === 'string' ? att : att.url;
                                const fileName = typeof att === 'string' ? att.split('/').pop() : (att.fileName || 'Attachment');
                                const isImg = att?.fileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileUrl || '');

                                if (isImg && fileUrl) {
                                  return (
                                    <a
                                      key={attIdx}
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block rounded-xl overflow-hidden border border-white/20 hover:opacity-95 transition-opacity"
                                    >
                                      <img
                                        src={fileUrl}
                                        alt={fileName}
                                        className="max-w-full max-h-48 object-cover rounded-lg"
                                        loading="lazy"
                                      />
                                    </a>
                                  );
                                }

                                return (
                                  <a
                                    key={attIdx}
                                    href={fileUrl}
                                    download={fileName}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium border transition-colors ${
                                      isMe
                                        ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                                        : 'bg-soft hover:bg-paper text-ink border-border'
                                    }`}
                                  >
                                    <FileText size={16} className="shrink-0" />
                                    <span className="truncate max-w-[160px]" title={fileName}>
                                      {fileName}
                                    </span>
                                    <Download size={14} className="shrink-0 ml-auto opacity-70 hover:opacity-100" />
                                  </a>
                                );
                              })}
                            </div>
                          )}

                          {/* Fallback if no attachments parsed but message has placeholder text */}
                          {!hasAttachments && msg.content && (msg.content === '📷 Image' || msg.content.startsWith('📎 ')) && (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}

                          <span
                            className={`text-[9px] mt-1 block text-right font-medium ${
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
            </div>

            {/* Typing indicator */}
            {Boolean(isOtherTyping && String(isOtherTyping) !== myId) && (
              <div className="px-4 py-1.5 text-[11px] text-ink/50 bg-paper/80 border-t border-border/50 flex items-center gap-1.5 shrink-0">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>{otherPartyName} is typing...</span>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 border-t border-border bg-white shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="file"
                  ref={chatFileInputRef}
                  onChange={handleChatFileUpload}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.zip,.txt"
                />
                <button
                  type="button"
                  onClick={() => chatFileInputRef.current?.click()}
                  disabled={uploadingChatMedia || sendingMessage}
                  className="p-2 text-ink/40 hover:text-ink hover:bg-soft rounded-xl transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
                  title="Attach file or image"
                  aria-label="Attach file or image"
                >
                  {uploadingChatMedia ? (
                    <Loader2 size={16} className="animate-spin text-purple" />
                  ) : (
                    <Paperclip size={16} />
                  )}
                </button>
                <input
                  type="text"
                  value={chatInput}
                  onChange={handleChatInputChange}
                  placeholder={`Message ${otherPartyName}...`}
                  className="flex-1 bg-soft border border-border rounded-xl px-3.5 py-2 text-xs font-medium text-ink focus:outline-none focus:border-purple"
                />
                <button
                  type="submit"
                  disabled={sendingMessage || (!chatInput.trim() && !uploadingChatMedia)}
                  className="btn-primary !p-2.5 shrink-0 disabled:opacity-50 cursor-pointer"
                  aria-label="Send message"
                >
                  {sendingMessage ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </form>
            </div>
          </section>

          {/* 2. ACTIVITY TIMELINE (Real Database Events) */}
          <section className="bg-white rounded-[28px] p-6 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-ink">
                Project Activity Log
              </h3>
              <span className="text-[11px] font-semibold text-ink/40">
                {activities.length} Events
              </span>
            </div>

            {activitiesLoading ? (
              <SectionLoading />
            ) : activitiesError ? (
              <SectionError message={activitiesError} onRetry={() => fetchActivities(order._id)} />
            ) : activities.length === 0 ? (
              <SectionEmpty message="No activity events logged yet." icon={Clock} />
            ) : (
              <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/70">
                {activities.map((ev) => (
                  <div key={ev._id} className="relative group text-xs">
                    <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-purple ring-3 ring-purple/10" />
                    <div className="bg-soft/40 p-3 rounded-xl border border-border/40">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h4 className="font-bold text-ink text-xs">{ev.title}</h4>
                        <span className="text-[10px] text-ink/40">{formatDateTime(ev.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-ink/70 leading-relaxed">{ev.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 3. ESCROW ASSURANCE CARD */}
          <div className="bg-gradient-to-br from-purple/5 to-emerald-50/50 rounded-[28px] p-5 border border-purple/20 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>GigMatch Escrow Guaranteed</span>
            </div>
            <p className="text-[11px] text-ink/70 leading-relaxed font-medium">
              Funds remain safely held until the hirer approves final deliverables. All revisions, submissions, and timeline updates are permanently logged.
            </p>
          </div>

        </div>
      </div>

      {/* ====================================================
          RIGHT-SIDE DRAWER: VIEW BRIEF (Sheet Panel)
          ==================================================== */}
      {briefDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
            onClick={() => setBriefDrawerOpen(false)}
          />

          {/* Slide-over Drawer */}
          <aside
            className="relative z-10 w-full sm:w-[480px] lg:w-[540px] xl:w-[600px] h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out overflow-hidden"
            role="dialog"
            aria-label="Project Brief"
          >
            {/* Header */}
            <div className="p-6 border-b border-border bg-paper/60 flex items-center justify-between gap-4 shrink-0">
              <div>
                <span className="eyebrow text-purple">CONTRACT BRIEF</span>
                <h2 className="font-display text-xl font-bold text-ink truncate mt-0.5">
                  {order.gig?.title || 'Project Scope & Brief'}
                </h2>
              </div>
              <button
                onClick={() => setBriefDrawerOpen(false)}
                className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center text-ink/70 hover:text-ink hover:bg-soft transition-colors cursor-pointer"
                title="Close panel (ESC)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-soft p-3.5 rounded-2xl border border-border/50">
                  <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider block">Agreed Budget</span>
                  <span className="font-display font-bold text-base text-ink mt-0.5 block">{formatCurrency(order.totalAmount)}</span>
                </div>
                <div className="bg-soft p-3.5 rounded-2xl border border-border/50">
                  <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider block">Category</span>
                  <span className="font-bold text-xs text-ink mt-0.5 block truncate capitalize">{order.gig?.category || 'General'}</span>
                </div>
                <div className="bg-soft p-3.5 rounded-2xl border border-border/50 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider block">Target Deadline</span>
                  <span className="font-bold text-xs text-ink mt-0.5 block truncate">{order.gig?.deadline ? formatDate(order.gig.deadline) : 'Flexible'}</span>
                </div>
              </div>

              {/* Project Description */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-ink/60">Project Description & Scope</h4>
                <div className="bg-soft/60 p-4 rounded-2xl border border-border/60 text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-wrap">
                  {order.gig?.description || 'No detailed description provided.'}
                </div>
              </div>

              {/* Requirements / Tags */}
              {order.gig?.tags && order.gig.tags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-ink/60">Required Skills & Deliverables</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {order.gig.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple/10 text-purple border border-purple/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestones in Brief */}
              {order.milestones && order.milestones.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-ink/60">Contract Milestones ({order.milestones.length})</h4>
                  <div className="space-y-2">
                    {order.milestones.map((m, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-white border border-border flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-ink">Milestone {idx + 1}: {m.title}</div>
                          {m.description && <div className="text-[11px] text-ink/50 mt-0.5">{m.description}</div>}
                        </div>
                        <div className="text-right shrink-0 font-bold text-ink">
                          {formatCurrency(m.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accepted Proposal Details */}
              {order.proposal && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-ink/60">Accepted Proposal</h4>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      {order.proposal.estimatedDays ? `${order.proposal.estimatedDays} Days Delivery` : 'Accepted'}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-border space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink/50">Proposed Price:</span>
                      <span className="font-bold text-ink">{formatCurrency(order.proposal.proposedPrice || order.totalAmount)}</span>
                    </div>
                    {order.proposal.coverLetter && (
                      <div className="pt-2 border-t border-border/50">
                        <span className="text-[11px] font-bold text-ink/50 uppercase tracking-wider block mb-1">Proposal Cover Letter:</span>
                        <p className="text-xs text-ink/80 leading-relaxed whitespace-pre-wrap bg-soft/50 p-3 rounded-xl">
                          {order.proposal.coverLetter}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-paper/40 flex justify-end shrink-0">
              <button
                onClick={() => setBriefDrawerOpen(false)}
                className="btn-primary !py-2 !px-5 !text-xs cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ====================================================
          MODAL: REQUEST REVISION (Hirer Feedback)
          ==================================================== */}
      <Dialog open={revisionModalOpen} onOpenChange={setRevisionModalOpen}>
        <DialogContent className="max-w-xl bg-white rounded-[28px] p-6 sm:p-7 border border-border shadow-2xl">
          <div className="space-y-5">
            <DialogHeader>
              <span className="eyebrow text-amber-700">REQUEST REVISION</span>
              <DialogTitle className="font-display text-2xl font-bold text-ink mt-1">
                Request Changes on Deliverables
              </DialogTitle>
              <DialogDescription className="text-xs text-ink/60">
                Provide specific, actionable guidance for {otherPartyName} to update and resubmit.
              </DialogDescription>
            </DialogHeader>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-2">
                Revision Notes & Feedback
              </label>
              <textarea
                rows={4}
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="E.g. Please adjust the responsive layout on mobile screens, update font weights in the hero section..."
                className="w-full bg-soft border border-border rounded-2xl p-4 text-xs sm:text-sm font-medium text-ink focus:outline-none focus:border-purple leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setRevisionModalOpen(false)}
                className="btn-secondary !py-2 !px-4 !text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestRevision}
                disabled={submittingRevision || !revisionNotes.trim()}
                className="btn-primary !py-2 !px-5 !text-xs disabled:opacity-50 cursor-pointer"
              >
                {submittingRevision ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                <span>Send Revision Request</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ====================================================
          MODAL: SIMPLE CONFIRMATION FOR APPROVE & RELEASE
          ==================================================== */}
      <Dialog open={approveConfirmOpen} onOpenChange={setApproveConfirmOpen}>
        <DialogContent className="max-w-sm sm:max-w-md bg-white rounded-3xl p-6 border border-border shadow-2xl">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div className="space-y-1">
                <DialogTitle className="font-display text-lg font-bold text-ink">
                  Release Escrow Payment?
                </DialogTitle>
                <DialogDescription className="text-xs text-ink/60 leading-relaxed">
                  Approve deliverables and release <strong className="text-emerald-700 font-bold">{formatCurrency(order?.totalAmount || 0)}</strong> to <strong>{otherPartyName}</strong>? This will complete the order.
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => setApproveConfirmOpen(false)}
                disabled={approvingPayment}
                className="btn-secondary !py-2 !px-4 !text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReleasePayment}
                disabled={approvingPayment}
                className="btn-primary !py-2 !px-4 !text-xs font-bold cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5"
              >
                {approvingPayment ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Releasing...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Confirm & Release</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ====================================================
          MODAL: RAZORPAY ESCROW GATEWAY & DEMO FALLBACK
          ==================================================== */}
      <Dialog open={razorpayModalOpen} onOpenChange={setRazorpayModalOpen}>
        <DialogContent className="max-w-xl bg-white rounded-[28px] p-6 sm:p-7 border border-border shadow-2xl">
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-2 border border-amber-200/50">
              <AlertCircle size={32} className="text-amber-500" />
            </div>
            <DialogHeader>
              <div className="mb-1">
                <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Demo Payment Fallback
                </span>
              </div>
              <DialogTitle className="font-display text-2xl font-bold text-ink mt-1">
                Payment Gateway Configuration
              </DialogTitle>
              <DialogDescription className="text-sm text-ink/60 max-w-md mx-auto leading-relaxed">
                {razorpayErrorMsg || 'Razorpay credentials not configured in backend setup.'}
              </DialogDescription>
            </DialogHeader>

            {/* Commission & Escrow Breakdown */}
            {order && (
              <div className="bg-soft/70 p-4 rounded-2xl border border-border/50 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between text-ink/70">
                  <span>Contract Escrow Total:</span>
                  <span className="font-bold text-ink text-sm">{formatCurrency(order.totalAmount || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-ink/60">
                  <span>Platform Commission (25%):</span>
                  <span className="font-medium text-purple">{formatCurrency(Math.round((order.totalAmount || 0) * 0.25))}</span>
                </div>
                <div className="flex items-center justify-between text-ink/60">
                  <span>Freelancer Payout (75%):</span>
                  <span className="font-medium text-emerald-600">{formatCurrency((order.totalAmount || 0) - Math.round((order.totalAmount || 0) * 0.25))}</span>
                </div>
              </div>
            )}

            <div className="bg-soft p-5 rounded-2xl border border-border/50 text-left space-y-3">
              <h4 className="font-bold text-ink text-sm flex items-center gap-2">
                <Code size={16} className="text-purple" />
                Setup Guide
              </h4>
              <p className="text-xs text-ink/70">
                To enable live or test payments via Razorpay, configure your <code className="bg-white px-1.5 py-0.5 rounded border border-border">server/.env</code> file:
              </p>
              <pre className="text-[11px] bg-[#18181B] text-white p-3 rounded-xl overflow-x-auto font-mono">
                RAZORPAY_KEY_ID=your_test_key_here{'\n'}
                RAZORPAY_KEY_SECRET=your_test_secret_here
              </pre>
            </div>

            <div className="flex items-center justify-center pt-3">
              <button
                type="button"
                onClick={() => setRazorpayModalOpen(false)}
                className="btn-primary !py-2.5 !px-6 !text-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ====================================================
          MODAL: DEMO PAYMENT FOR MILESTONE RELEASE
          ==================================================== */}
      <DemoPaymentModal
        open={demoPaymentModalOpen}
        onOpenChange={setDemoPaymentModalOpen}
        details={demoPaymentDetails}
        onConfirm={handleConfirmMilestoneDemoPayment}
        loading={payingMilestoneLoading}
      />

    </div>
  );
}
