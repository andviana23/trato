"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from "next/navigation";
// Removido: import { exec } from 'child_process';

interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'barbershop_owner' | 'professional' | 'client' | 'admin' | 'recepcionista';
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
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Função para buscar o perfil do usuário
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log('[Auth] Buscando perfil para usuário:', userId);
      const supabase = createClient();
      
      // Primeiro, buscar na tabela profissionais
      const { data: profissionalData, error: profissionalError } = await supabase
        .from('profissionais')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('[Auth] Dados do profissional:', { profissionalData, profissionalError });

      if (profissionalData) {
        // Se encontrou na tabela profissionais, usar esses dados
        return {
          id: userId,
          email: profissionalData.email || '',
          name: profissionalData.nome || '',
          role: profissionalData.funcao || 'client',
          phone: profissionalData.telefone,
          avatar_url: profissionalData.avatar_url,
          is_active: profissionalData.is_active
        };
      }

      // Se não encontrou em nenhuma tabela, verificar user_metadata
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[Auth] Dados do user_metadata:', user?.user_metadata);

      if (user?.user_metadata) {
        return {
          id: userId,
          email: user.email || '',
          name: user.user_metadata.full_name || '',
          role: user.user_metadata.role || user.user_metadata.funcao || 'client',
          phone: user.user_metadata.telefone,
          avatar_url: undefined,
          is_active: true
        };
      }

      // Se não encontrou nenhum perfil, criar um perfil básico
      return {
        id: userId,
        email: user?.email || '',
        name: '',
        role: 'client',
        is_active: true
      };
    } catch (error) {
      console.error('[Auth] Erro ao buscar perfil:', error);
      return null;
    }
  };

  // Inicialização e monitoramento do estado de autenticação
  useEffect(() => {
    if (isInitialized) return;

    console.log('[Auth] Iniciando monitoramento de autenticação');
    const supabase = createClient();

    // Verificar usuário atual
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log('[Auth] Usuário atual:', { user, error });

        if (error) {
          console.error('[Auth] Erro ao verificar usuário:', error);
          setLoading(false);
          return;
        }

        if (user) {
          setUser(user);
          const profileData = await fetchProfile(user.id);
          console.log('[Auth] Perfil carregado:', profileData);
          setProfile(profileData);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('[Auth] Erro inesperado ao verificar usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    // Verificar usuário inicial
    checkUser();
    setIsInitialized(true);

    // Monitorar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Mudança de autenticação:', { event, session });
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        router.push('/auth/login');
        return;
      }

      if (session?.user) {
        setUser(session.user);
        const profileData = await fetchProfile(session.user.id);
        console.log('[Auth] Perfil atualizado após auth change:', profileData);
        setProfile(profileData);
      }
      
      setLoading(false);
    });

    return () => {
      console.log('[Auth] Limpando monitoramento de autenticação');
      subscription.unsubscribe();
    };
  }, [router, isInitialized]);

  // Login
  const signIn = async (email: string, password: string) => {
    console.log('[Auth] Tentando login:', { email });
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[Auth] Erro no login:', error);
        toast.error('Erro ao fazer login: ' + error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        const profileData = await fetchProfile(data.user.id);
        console.log('[Auth] Perfil carregado no login:', profileData);
        
        if (!profileData) {
          console.error('[Auth] Perfil não encontrado após login');
          toast.error('Erro ao carregar perfil do usuário');
          await supabase.auth.signOut();
          return { success: false, error: 'Perfil não encontrado' };
        }

        setProfile(profileData);
        setUser(data.user);
        setSession(data.session);
        // Removido: chamada dos scripts via exec
        console.log('[Auth] Login bem sucedido:', { user: data.user, profile: profileData });
        router.push('/dashboard');
        return { success: true };
      }

      return { success: false, error: 'Usuário não encontrado' };
    } catch (error) {
      console.error('[Auth] Erro inesperado no login:', error);
      toast.error('Erro inesperado ao fazer login');
      return { success: false, error: 'Erro inesperado ao fazer login' };
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
  
  console.log('[Permissions] Verificando permissões para perfil:', profile);
  
  // Verificar se profile existe
  if (!profile) {
    console.log('[Permissions] Perfil não encontrado, retornando permissões padrão');
    return {
      isOwner: false,
      isProfessional: false,
      isClient: false,
      isAdmin: false,
      isRecepcionista: false,
      canManageBarbershop: false,
      canManageProfessionals: false,
      canManageClients: false,
      canViewQueue: false,
      canManageSubscriptions: false,
      canViewSubscriptions: false,
    };
  }
  
  const role = profile.role?.toLowerCase();
  console.log('[Permissions] Role do usuário:', role);
  
  const isOwner = role === 'barbershop_owner';
  const isProfessional = role === 'professional';
  const isClient = role === 'client';
  const isAdmin = role === 'admin' || role === 'administrador';
  const isRecepcionista = role === 'recepcionista';
  
  const permissions = {
    isOwner,
    isProfessional,
    isClient,
    isAdmin,
    isRecepcionista,
    canManageBarbershop: isOwner || isAdmin,
    canManageProfessionals: isOwner || isAdmin,
    canManageClients: isOwner || isProfessional || isAdmin || isRecepcionista,
    canViewQueue: isOwner || isProfessional || isAdmin || isRecepcionista,
    canManageSubscriptions: isOwner || isAdmin,
    canViewSubscriptions: isOwner || isAdmin || isRecepcionista,
  };
  
  console.log('[Permissions] Permissões calculadas:', permissions);
  return permissions;
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
