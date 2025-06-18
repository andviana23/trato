"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from "next/navigation";

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
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
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
  const router = useRouter();

  // Função para buscar o perfil do usuário
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const supabase = createClient();
      const { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[Auth] Erro ao buscar perfil:', error);
        // Se erro de autenticação, forçar logout
        if (status === 401 || status === 403) {
          await signOut();
          toast.error('Sessão expirada. Faça login novamente.');
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
        return null;
      }

      return data;
    } catch (error) {
      console.error('[Auth] Erro inesperado ao buscar perfil:', error);
      return null;
    }
  };

  // Inicialização e monitoramento do estado de autenticação
  useEffect(() => {
    console.log('[Auth] Iniciando monitoramento de autenticação');
    const supabase = createClient();

    // Verificar sessão atual
    const checkSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        console.log('[Auth] Sessão atual:', { session: currentSession, error });

        if (error) {
          console.error('[Auth] Erro ao verificar sessão:', error);
          setLoading(false);
          // Se erro de autenticação, forçar logout
          if (error.status === 401 || error.status === 403) {
            await signOut();
            toast.error('Sessão expirada. Faça login novamente.');
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login';
            }
          }
          return;
        }

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          const profileData = await fetchProfile(currentSession.user.id);
          console.log('[Auth] Perfil carregado:', profileData);
          setProfile(profileData);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('[Auth] Erro inesperado ao verificar sessão:', error);
        // Forçar logout em erro inesperado
        await signOut();
        toast.error('Sessão expirada. Faça login novamente.');
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      } finally {
        setLoading(false);
      }
    };

    // Verificar sessão inicial
    checkSession();

    // Monitorar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Mudança de autenticação:', { event, session });
      
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

    return () => {
      console.log('[Auth] Limpando monitoramento de autenticação');
      subscription.unsubscribe();
    };
  }, []);

  // Login
  const signIn = async (email: string, password: string) => {
    console.log('[Auth] Tentando login:', { email });
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      
      console.log('[Auth] Resposta do login:', { data, error });
      
      if (error) {
        console.error('[Auth] Erro no login:', error);
        toast.error('Erro no login', {
          description: error.message
        });
        return { success: false, error: error.message };
      }

      toast.success('Login realizado com sucesso!');
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado no login';
      console.error('[Auth] Erro inesperado no login:', error);
      toast.error('Erro no login', {
        description: errorMessage
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const signOut = async () => {
    console.log('[Auth] signOut chamado');
    try {
      setLoading(true);
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[Auth] Erro ao fazer logout:', error);
        toast.error('Erro ao sair', {
          description: error.message
        });
      } else {
        console.log('[Auth] Logout realizado com sucesso');
        toast.success('Logout realizado');
        setUser(null);
        setProfile(null);
        setSession(null);
        window.location.assign('/auth/login');
      }
    } catch (error) {
      console.error('[Auth] Erro inesperado ao fazer logout:', error);
      toast.error('Erro ao sair');
    } finally {
      setLoading(false);
    }
  };

  // Cadastro
  const signUp = async (email: string, password: string, userData: SignUpData) => {
    console.log('[Auth] Tentando cadastro:', { email, userData });
    try {
      setLoading(true);
      const supabase = createClient();
      
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
      
      console.log('[Auth] Resposta do cadastro:', { data, error });

      if (error) {
        console.error('[Auth] Erro no cadastro:', error);
        toast.error('Erro no cadastro', {
          description: error.message
        });
        return { success: false, error: error.message };
      }

      toast.success('Cadastro realizado!', {
        description: 'Verifique seu email para confirmar a conta.'
      });
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado no cadastro';
      console.error('[Auth] Erro inesperado no cadastro:', error);
      toast.error('Erro no cadastro', {
        description: errorMessage
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Reset de senha
  const resetPassword = async (email: string) => {
    console.log('[Auth] Tentando reset de senha:', { email });
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      
      console.log('[Auth] Resposta do reset de senha:', { error });

      if (error) {
        console.error('[Auth] Erro no reset de senha:', error);
        toast.error('Erro ao resetar senha', {
          description: error.message
        });
        return { success: false, error: error.message };
      }

      toast.success('Email enviado!', {
        description: 'Verifique sua caixa de entrada para redefinir sua senha.'
      });
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao resetar senha';
      console.error('[Auth] Erro inesperado ao resetar senha:', error);
      toast.error('Erro ao resetar senha', {
        description: errorMessage
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Atualizar perfil
  const updateProfile = async (data: Partial<Profile>) => {
    console.log('[Auth] Tentando atualizar perfil:', data);
    try {
      if (!user) {
        console.error('[Auth] Tentativa de atualizar perfil sem usuário autenticado');
        return { success: false, error: 'Usuário não autenticado' };
      }

      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) {
        console.error('[Auth] Erro ao atualizar perfil:', error);
        toast.error('Erro ao atualizar perfil', {
          description: error.message
        });
        return { success: false, error: error.message };
      }

      // Atualizar estado local
      if (profile) {
        const updatedProfile = { ...profile, ...data };
        console.log('[Auth] Perfil atualizado:', updatedProfile);
        setProfile(updatedProfile);
      }

      toast.success('Perfil atualizado!');
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao atualizar perfil';
      console.error('[Auth] Erro inesperado ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil', {
        description: errorMessage
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook para verificar permissões
export const usePermissions = () => {
  const { profile } = useAuth();
  
  // Verificar se profile existe
  if (!profile) {
    return {
      isOwner: false,
      isProfessional: false,
      isClient: false,
      isAdmin: false,
      canManageBarbershop: false,
      canManageProfessionals: false,
      canManageClients: false,
      canViewQueue: false,
      canManageSubscriptions: false,
    };
  }
  
  const isOwner = profile.role === 'barbershop_owner';
  const isProfessional = profile.role === 'professional';
  const isClient = profile.role === 'client';
  const isAdmin = profile.role === 'admin';
  
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
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      console.log('Sem sessão ativa. Redirecionando...');
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  if (loading) {
    console.log('Aguardando Supabase retornar sessão...');
    return null;
  }

  if (!user) {
    console.log('Usuário não autenticado');
    return null;
  }

  return { user, loading };
}; 