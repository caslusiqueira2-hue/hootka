import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useQuizStore } from '@/stores/quizStore';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  guestMode: boolean;
  error: string | null;

  initAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  guestMode: false,
  error: null,

  initAuth: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({
        session,
        user: session?.user ?? null,
        loading: false,
      });

      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
          loading: false,
          guestMode: false,
        });
        try {
          useQuizStore.getState().loadQuizzes();
        } catch {}
      });
    } catch (err: any) {
      console.error('Error initializing auth:', err);
      set({ loading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        set({ loading: false, error: error.message });
        return { success: false, error: error.message };
      }

      set({
        session: data.session,
        user: data.user,
        loading: false,
        guestMode: false,
        error: null,
      });
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Erro ao realizar login';
      set({ loading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  signUp: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        set({ loading: false, error: error.message });
        return { success: false, error: error.message };
      }

      set({
        session: data.session,
        user: data.user,
        loading: false,
        guestMode: false,
        error: null,
      });
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Erro ao cadastrar conta';
      set({ loading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error(err);
    }
    set({
      user: null,
      session: null,
      guestMode: false,
      error: null,
    });
    try {
      useQuizStore.getState().loadQuizzes();
    } catch {}
  },

  continueAsGuest: () => {
    set({ guestMode: true, loading: false, error: null });
    try {
      useQuizStore.getState().loadQuizzes();
    } catch {}
  },
}));
