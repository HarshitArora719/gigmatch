import { create } from 'zustand';
import api from '../lib/axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'freelancer';
  avatar?: string;
  avatarColor?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  updateUser: (fields: Partial<User>) => void;
  isAuthModalOpen: boolean;
  authModalView: 'login' | 'register';
  setAuthModal: (open: boolean, view?: 'login' | 'register') => void;
}

const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem('gm_user');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

const initialUser = getStoredUser();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  isLoading: false,
  isInitialized: !!initialUser,
  isAuthModalOpen: false,
  authModalView: 'login',

  setAuthModal: (open, view) => 
    set((state) => ({ 
      isAuthModalOpen: open, 
      authModalView: view || state.authModalView 
    })),

  updateUser: (fields) =>
    set((state) => {
      const updated = state.user ? { ...state.user, ...fields } : null;
      if (updated) {
        try { localStorage.setItem('gm_user', JSON.stringify(updated)); } catch {}
      }
      return { user: updated };
    }),

  fetchMe: async () => {
    try {
      const res = await api.get('/api/users/me');
      const u = res.data.data.user;
      const userData: User = {
        id: String(u.id ?? u._id),
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar || '',
        avatarColor: u.avatarColor || '#22D3EE',
      };
      try { localStorage.setItem('gm_user', JSON.stringify(userData)); } catch {}
      set({
        user: userData,
        isInitialized: true,
      });
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('gm_token');
        localStorage.removeItem('gm_user');
        set({ user: null, isInitialized: true });
      } else {
        set({ isInitialized: true });
      }
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { user, token } = res.data.data;
      if (token) {
        localStorage.setItem('gm_token', token);
      }
      const userData: User = {
        id: String(user.id ?? user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        avatarColor: user.avatarColor || '#22D3EE',
      };
      try { localStorage.setItem('gm_user', JSON.stringify(userData)); } catch {}
      set({
        user: userData,
        isLoading: false,
        isInitialized: true,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (name, email, password, role) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/api/auth/register', { name, email, password, role });
      const { user, token } = res.data.data;
      if (token) {
        localStorage.setItem('gm_token', token);
      }
      const userData: User = {
        id: String(user.id ?? user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        avatarColor: user.avatarColor || '#22D3EE',
      };
      try { localStorage.setItem('gm_user', JSON.stringify(userData)); } catch {}
      set({
        user: userData,
        isLoading: false,
        isInitialized: true,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('gm_token');
      localStorage.removeItem('gm_user');
      set({ user: null });
    }
  }
}));