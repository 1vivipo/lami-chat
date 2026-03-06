import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode } from '@/types';

interface ThemeState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  loadTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = '@lami_chat_theme';

export const useThemeStore = create<ThemeState>((set) => ({
  themeMode: 'system',
  setThemeMode: async (mode) => {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    set({ themeMode: mode });
  },
  loadTheme: async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (savedTheme) {
        set({ themeMode: savedTheme });
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  },
}));
