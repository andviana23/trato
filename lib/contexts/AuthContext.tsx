"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';

interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'barbershop_owner' | 'professional' | 'client' | 'admin';
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: SignUpData) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  testSupabaseConnection: () => Promise<{ success: boolean; error?: string }>;
}

interface SignUpData {
  firstName: string;
  lastName: string;
  role: 'barbershop_owner' | 'professional' | 'client';
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Função de teste de conectividade
  const testSupabaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
    console.log('=== TESTE DE CONECTIVIDADE SUPABASE ===');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Key preview:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
    const supabase = createClient();
    try {
      // Teste 1: Get session
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      console.log('Session test:', { session, sessionError });
      // Teste 2: Get user
      const { data: user, error: userError } = await supabase.auth.getUser();
      console.log('User test:', { user, userError });
      toast({ title: 'Teste Supabase', description: 'Conexão OK!', status: 'success' });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Connection failed:', error);
      toast({ title: 'Erro Supabase', description: errorMessage, status: 'error' });
      return { success: false, error: errorMessage };
    }
  };

  // Buscar perfil do usuário
  const fetchProfile = async (userId: string) => {
    try {
      console.log('[Auth] Buscando perfil do usuário:', userId);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.error('[Auth] Erro ao buscar perfil:', error);
        return null;
      }
      console.log('[Auth] Perfil encontrado:', data);
      return data as Profile;
    } catch (error) {
      console.error('[Auth] Erro inesperado ao buscar perfil:', error);
      return null;
    }
  };

  // Inicializar sessão
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('[Auth] Iniciando verificação de sessão Supabase...');
        const supabase = createClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('[Auth] Sessão:', session, 'Erro:', error);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          console.log('[Auth] Perfil carregado:', profileData);
          setProfile(profileData);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('[Auth] Erro na inicialização:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Mudança de autenticação:', event, session);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        console.log('[Auth] Perfil atualizado após auth change:', profileData);
        setProfile(profileData);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Cadastro
  const signUp = async (email: string, password: string, userData: SignUpData) => {
    try {
      setLoading(true);
      const supabase = createClient();
      console.log('[Auth] Tentando cadastro:', { email, userData });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: userData.role,
            phone: userData.phone,
          },
        },
      });
      console.log('[Auth] Resposta do Supabase (signUp):', { data, error });
      if (error) {
        toast({ title: 'Erro no cadastro', description: error.message, status: 'error', duration: 5000 });
        return { success: false, error: error.message };
      }
      toast({ title: 'Verifique seu email', description: 'Enviamos um link de confirmação para seu email.', status: 'info', duration: 7000 });
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado no cadastro';
      console.error('[Auth] Erro inesperado no cadastro:', errorMessage);
      toast({ title: 'Erro no cadastro', description: errorMessage, status: 'error', duration: 5000 });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Login
  const signIn = async (email: string, password: string) => {
    console.log('🔑 Tentando login com:', { email });
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      console.log('📊 Resposta do Supabase:', { data, error, user: data?.user, session: data?.session });
      if (error) {
        console.error('❌ Erro específico:', error.message);
        toast({ title: 'Erro no login', description: error.message, status: 'error', duration: 5000 });
        return { success: false, error: error.message };
      }
      toast({ title: 'Login realizado com sucesso!', description: 'Bem-vindo de volta!', status: 'success', duration: 3000 });
      console.log('✅ Login bem-sucedido!');
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado no login';
      console.error('🚨 Erro capturado:', { message: errorMessage, details: error });
      toast({ title: 'Erro no login', description: errorMessage, status: 'error', duration: 5000 });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const signOut = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: 'Erro ao sair',
          description: error.message,
          status: 'error',
          duration: 5000,
        });
      } else {
        toast({
          title: 'Logout realizado',
          description: 'Até mais!',
          status: 'info',
          duration: 2000,
        });
      }
    } catch (error: unknown) {
      // Silencioso - não mostrar erro no console
      console.error('Erro silencioso no logout:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset de senha
  const resetPassword = async (email: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast({
          title: 'Erro ao enviar email',
          description: error.message,
          status: 'error',
          duration: 5000,
        });
        return { success: false, error: error.message };
      }

      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir a senha.',
        status: 'success',
        duration: 5000,
      });

      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado';
      toast({
        title: 'Erro ao enviar email',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Atualizar perfil
  const updateProfile = async (data: Partial<Profile>) => {
    try {
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) {
        toast({
          title: 'Erro ao atualizar perfil',
          description: error.message,
          status: 'error',
          duration: 5000,
        });
        return { success: false, error: error.message };
      }

      // Atualizar estado local
      if (profile) {
        setProfile({ ...profile, ...data });
      }

      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
        status: 'success',
        duration: 3000,
      });

      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado';
      toast({
        title: 'Erro ao atualizar perfil',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
      return { success: false, error: errorMessage };
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    testSupabaseConnection,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook para verificar permissões
export const usePermissions = () => {
  const { profile } = useAuth();
  
  const isOwner = profile?.role === 'barbershop_owner';
  const isProfessional = profile?.role === 'professional';
  const isClient = profile?.role === 'client';
  const isAdmin = profile?.role === 'admin';
  
  const canManageBarbershop = isOwner || isAdmin;
  const canManageProfessionals = isOwner || isAdmin;
  const canManageClients = isOwner || isProfessional || isAdmin;
  const canViewQueue = isOwner || isProfessional || isAdmin;
  const canManageSubscriptions = isOwner || isAdmin;
  
  return {
    isOwner,
    isProfessional,
    isClient,
    isAdmin,
    canManageBarbershop,
    canManageProfessionals,
    canManageClients,
    canViewQueue,
    canManageSubscriptions,
  };
};

// Hook para requerer autenticação
export const useRequireAuth = () => {
  const { user, loading } = useAuth();
  
  if (!loading && !user) {
    throw new Error('Autenticação requerida');
  }
  
  return { user, loading };
}; 