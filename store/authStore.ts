import { create } from 'zustand';
import { User, UserSettings, ThemeMode } from '@/types';

interface AuthState {
  user: User | null;
  settings: UserSettings | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSettings: (settings: UserSettings | null) => void;
  setIsAuthenticated: (value: boolean) => void;
  setIsLoading: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  settings: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user }),
  setSettings: (settings) => set({ settings }),
  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  setIsLoading: (value) => set({ isLoading: value }),
  logout: () => set({ user: null, settings: null, isAuthenticated: false }),
}));
