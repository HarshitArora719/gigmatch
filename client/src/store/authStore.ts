import { create } from 'zustand';
import api from '../lib/axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'freelancer';
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  isAuthModalOpen: boolean;
  authModalView: 'login' | 'register';
  setAuthModal: (open: boolean, view?: 'login' | 'register') => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthModalOpen: false,
  authModalView: 'login',

  setAuthModal: (open, view) => 
    set((state) => ({ 
      isAuthModalOpen: open, 
      authModalView: view || state.authModalView 
    })),

  fetchMe: async () => {
    try {
      const res = await api.get('/api/users/me');
      const u = res.data.data.user;
      set({
        user: {
          id: String(u.id ?? u._id),
          name: u.name,
          email: u.email,
          role: u.role,
        },
      });
    } catch (error) {
      set({ user: null });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    const res = await api.post('/api/auth/login', { email, password });
    set({ user: res.data.data.user });
    set({ isLoading: false });
  },

  register: async (name, email, password, role) => {
    set({ isLoading: true });
    const res = await api.post('/api/auth/register', { name, email, password, role });
    set({ user: res.data.data.user });
    set({ isLoading: false });
  },

  logout: async () => {
    await api.post('/api/auth/logout');
    set({ user: null });
  }
}));