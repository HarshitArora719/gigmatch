import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface ChatState {
  socket: Socket | null;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,

  connectSocket: () => {
    const existing = get().socket;
    if (existing?.connected) return;

    if (existing) {
      existing.disconnect();
    }

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      withCredentials: true,
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
