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
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>;
  resendConfirmation: (email: string) => Promise<{ success: boolean; error?: string }>;
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
        const isNotConfirmed = error.message.toLowerCase().includes('email not confirmed');
        const isBadCredentials = error.message.toLowerCase().includes('invalid login credentials');
        return {
          success: false,
          needsConfirmation: isNotConfirmed,
          error: isNotConfirmed
            ? 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada (ou pasta de spam) e clique no link de ativação.'
            : isBadCredentials
            ? 'E-mail ou senha incorretos. Verifique suas credenciais.'
            : error.message,
        };
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

      const needsConfirmation = !data.session;

      set({
        session: data.session,
        user: data.user,
        loading: false,
        guestMode: false,
        error: null,
      });

      return { success: true, needsConfirmation };
    } catch (err: any) {
      const msg = err.message || 'Erro ao cadastrar conta';
      set({ loading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  resendConfirmation: async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao reenviar confirmação' };
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
