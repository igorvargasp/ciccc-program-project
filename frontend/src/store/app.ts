import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface AppState {
  theme: Theme;
  lang: string;
  token: string | null;
  // Actions
  setTheme: (theme: Theme) => void;
  setLang: (lang: string) => void;
  setToken: (token: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      lang: 'en',
      token: null,

      setTheme: (theme) => set({ theme }),

      setLang: (lang) => set({ lang }),

      setToken: (token) => {
        if (token) {
          localStorage.setItem('sfh-token', token);
        } else {
          localStorage.removeItem('sfh-token');
        }
        set({ token });
      },
    }),
    {
      name: 'sfh-app',
      // Only persist UI preferences, not the token (token lives in localStorage separately)
      partialize: (s) => ({ theme: s.theme, lang: s.lang }),
    },
  ),
);

/** True when the user has a stored auth token. */
export const useIsAuthed = () => useAppStore((s) => !!s.token);
