import { useCallback, useEffect, useRef, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, MessageSquare } from 'lucide-react';

interface ChatProps {
  orderId: string;
  receiverId?: string;
}

interface ChatMessage {
  _id: string;
  orderId: string;
  senderId: string;
  content: string;
  createdAt: string;
  pending?: boolean;
}

function getCurrentUserId(user: { id?: string; _id?: string } | null | undefined): string {
  if (!user) return '';
  return String(user.id ?? user._id ?? '');
}

function normalizeMessage(raw: Record<string, unknown>): ChatMessage {
  const sender = raw.sender;
  let senderId = raw.senderId;

  if (!senderId) {
    if (sender && typeof sender === 'object' && sender !== null && '_id' in sender) {
      senderId = (sender as { _id: string })._id;
    } else if (sender) {
      senderId = sender;
    }
  }

  return {
    _id: String(raw._id ?? raw.tempId),
    orderId: String(raw.orderId ?? raw.order),
    senderId: String(senderId ?? ''),
    content: String(raw.content ?? ''),
    createdAt: String(raw.createdAt ?? raw.timestamp ?? new Date().toISOString()),
    pending: Boolean(raw.pending),
  };
}

export default function Chat({ orderId, receiverId }: ChatProps) {
  const user = useAuthStore((state) => state.user);
  const connectSocket = useChatStore((state) => state.connectSocket);
  const socket = useChatStore((state) => state.socket);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const orderIdRef = useRef(orderId);
  orderIdRef.current = orderId;

  useEffect(() => { connectSocket(); }, [connectSocket]);

  useEffect(() => {
    let cancelled = false;
    const loadMessages = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/messages/order/${orderId}`);
        if (!cancelled) {
          setMessages((res.data.data.messages || []).map((m: Record<string, unknown>) => normalizeMessage(m)));
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadMessages();
    return () => { cancelled = true; };
  }, [orderId]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('joinOrder', orderId);

    const handleReceive = (raw: Record<string, unknown>) => {
      if (String(raw.orderId ?? raw.order) !== orderIdRef.current) return;
      const incoming = normalizeMessage(raw);
      setMessages((prev) => prev.some((m) => m._id === incoming._id) ? prev : [...prev, incoming]);
    };

    socket.on('receiveMessage', handleReceive);
    return () => { socket.off('receiveMessage', handleReceive); };
  }, [orderId, socket]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    const content = newMessage.trim();
    if (!content || !user || !receiverId) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic = normalizeMessage({
      tempId, orderId, senderId: getCurrentUserId(user), content,
      createdAt: new Date().toISOString(), pending: true,
    });

    setMessages((prev) => [...prev, optimistic]);
    setNewMessage('');

    try {
      const res = await api.post('/api/messages', { orderId, content, receiverId });
      const saved = normalizeMessage(res.data.data.message);
      setMessages((prev) => {
        const filtered = prev.filter((m) => m._id !== saved._id);
        return filtered.map((m) => (m._id === tempId ? saved : m));
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    }
  }, [newMessage, user, receiverId, orderId]);

  return (
    <div className="flex h-[420px] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3">
        <MessageSquare size={16} className="text-[var(--accent-teal)]" />
        <span className="font-display text-sm font-semibold">Order Chat</span>
      </div>

      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto space-y-3 p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="loading-spinner" />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--text-muted)]">No messages yet. Say hello!</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === getCurrentUserId(user);
            return (
              <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                    isMe ? 'chat-bubble-me' : 'chat-bubble-them'
                  } ${msg.pending ? 'opacity-70' : ''}`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={`mt-1 text-[10px] opacity-60 ${isMe ? 'text-[#080c10]' : ''}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {/* End of messages */}
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)] p-3">
        {!receiverId ? (
          <p className="text-center text-xs text-[var(--text-muted)]">Chat partner unavailable.</p>
        ) : (
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleSend(); }
              }}
            />
            <Button size="icon" onClick={handleSend} disabled={!newMessage.trim()} aria-label="Send message">
              <Send size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
