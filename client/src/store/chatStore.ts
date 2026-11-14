import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface ChatState {
  socket: Socket | null;
  onlineUsers: Set<string>;
  typingUsers: Map<string, string>; // conversationId -> typing userId
  connectSocket: (userId?: string) => Socket;
  disconnectSocket: () => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  emitTyping: (conversationId: string, userId: string) => void;
  emitStopTyping: (conversationId: string, userId: string) => void;
  isUserOnline: (userId: string) => boolean;
  isUserTyping: (conversationId: string) => string | null;
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  onlineUsers: new Set<string>(),
  typingUsers: new Map<string, string>(),

  connectSocket: (userId?: string) => {
    const existing = get().socket;
    if (existing?.connected) {
      if (userId) {
        existing.emit('joinUser', userId);
        // Request initial online users list
        existing.emit('getOnlineUsers');
      }
      return existing;
    }

    if (existing) {
      existing.disconnect();
    }

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      withCredentials: true,
      auth: userId ? { userId } : undefined,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      if (userId) {
        socket.emit('joinUser', userId);
        socket.emit('getOnlineUsers');
        console.log('Socket room joined:', userId);
      }
    });

    // Online status tracking
    socket.on('userOnline', ({ userId: onlineId }: { userId: string }) => {
      set((state) => {
        const next = new Set(state.onlineUsers);
        next.add(onlineId);
        return { onlineUsers: next };
      });
    });

    socket.on('userOffline', ({ userId: offlineId }: { userId: string }) => {
      set((state) => {
        const next = new Set(state.onlineUsers);
        next.delete(offlineId);
        return { onlineUsers: next };
      });
    });

    socket.on('onlineUsersList', (userIds: string[]) => {
      set({ onlineUsers: new Set(userIds) });
    });

    // Typing indicators
    socket.on('userTyping', ({ conversationId, userId: typingId }: { conversationId: string; userId: string }) => {
      set((state) => {
        const next = new Map(state.typingUsers);
        next.set(conversationId, typingId);
        return { typingUsers: next };
      });
      // Auto-clear typing after 3 seconds (in case stopTyping is missed)
      setTimeout(() => {
        set((state) => {
          const next = new Map(state.typingUsers);
          if (next.get(conversationId) === typingId) {
            next.delete(conversationId);
          }
          return { typingUsers: next };
        });
      }, 3000);
    });

    socket.on('userStopTyping', ({ conversationId }: { conversationId: string }) => {
      set((state) => {
        const next = new Map(state.typingUsers);
        next.delete(conversationId);
        return { typingUsers: next };
      });
    });

    // Auto-reconnect handling
    socket.on('reconnect', () => {
      console.log('Socket reconnected');
      if (userId) {
        socket.emit('joinUser', userId);
        socket.emit('getOnlineUsers');
      }
    });

    set({ socket });
    return socket;
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, onlineUsers: new Set(), typingUsers: new Map() });
    }
  },

  joinConversation: (conversationId: string) => {
    const { socket } = get();
    if (socket?.connected && conversationId) {
      socket.emit('joinConversation', conversationId);
    }
  },

  leaveConversation: (conversationId: string) => {
    const { socket } = get();
    if (socket?.connected && conversationId) {
      socket.emit('leaveConversation', conversationId);
    }
  },

  emitTyping: (conversationId: string, userId: string) => {
    const { socket } = get();
    if (socket?.connected && conversationId && userId) {
      socket.emit('typing', { conversationId, userId });
    }
  },

  emitStopTyping: (conversationId: string, userId: string) => {
    const { socket } = get();
    if (socket?.connected && conversationId && userId) {
      socket.emit('stopTyping', { conversationId, userId });
    }
  },

  isUserOnline: (userId: string) => {
    return get().onlineUsers.has(userId);
  },

  isUserTyping: (conversationId: string) => {
    return get().typingUsers.get(conversationId) || null;
  },
}));
