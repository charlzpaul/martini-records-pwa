// src/features/sync/store/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProfile {
  sub: string;
  name: string;
  email: string;
  picture: string;
}

interface AuthState {
  token: string | null;
  profile: UserProfile | null;
  isLoggedIn: boolean;
  setToken: (token: string) => void;
  setProfile: (profile: UserProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      profile: null,
      isLoggedIn: false,
      setToken: (token) => set({ token, isLoggedIn: !!token }),
      setProfile: (profile) => set({ profile }),
      logout: () => set({ token: null, profile: null, isLoggedIn: false }),
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({ token: state.token, profile: state.profile, isLoggedIn: state.isLoggedIn }),
    }
  )
);
