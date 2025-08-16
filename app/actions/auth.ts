'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ActionResult } from '@/lib/types/action';
import {
  signUpSchema,
  signInSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  type SignUpInput,
  type SignInInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type ChangePasswordInput,
  type UpdateProfileInput,
  type VerifyEmailInput,
  type ResendVerificationInput,
} from '@/lib/validators';

// ============================================================================
// TIPOS DE DADOS
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  role: 'admin' | 'manager' | 'professional' | 'receptionist';
  unidadeId: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  unidade: {
    id: string;
    name: string;
    address?: string;
  };
}

export interface AuthResult {
  user: User;
  session: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  };
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Registra um novo usuário
 */
export async function signUp(
  input: SignUpInput
): Promise<ActionResult<AuthResult>> {
  try {
    // Validação com Zod
    const validation = signUpSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Verificar se o email já existe
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', validatedData.email)
      .single();

    if (existingUser) {
      return {
        success: false,
        error: 'Email já está em uso'
      };
    }

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erro ao verificar email:', checkError);
      return {
        success: false,
        error: 'Erro interno ao verificar disponibilidade do email'
      };
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          name: validatedData.name,
          phone: validatedData.phone,
          role: validatedData.role,
          unidadeId: validatedData.unidadeId,
        }
      }
    });

    if (authError) {
      console.error('Erro ao criar usuário:', authError);
      return {
        success: false,
        error: 'Erro interno ao criar conta'
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Falha ao criar usuário'
      };
    }

    // Criar perfil na tabela profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: authData.user.id,
        email: validatedData.email,
        name: validatedData.name,
        phone: validatedData.phone,
        role: validatedData.role,
        unidadeId: validatedData.unidadeId,
        emailVerified: false,
        isActive: true,
      }])
      .select()
      .single();

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError);
      // Tentar limpar o usuário criado
      await supabase.auth.admin.deleteUser(authData.user.id);
      return {
        success: false,
        error: 'Erro interno ao criar perfil'
      };
    }

    // Revalidar cache
    revalidatePath('/');

    return {
      success: true,
      data: {
        user: profile as User,
        session: {
          accessToken: authData.session?.access_token || '',
          refreshToken: authData.session?.refresh_token || '',
          expiresAt: authData.session?.expires_at?.toString() || '',
        }
      }
    };
  } catch (error) {
    console.error('Erro inesperado ao registrar usuário:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Autentica um usuário
 */
export async function signIn(
  input: SignInInput
): Promise<ActionResult<AuthResult>> {
  try {
    // Validação com Zod
    const validation = signInSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Fazer login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (authError) {
      console.error('Erro no login:', authError);
      return {
        success: false,
        error: 'Email ou senha incorretos'
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Falha na autenticação'
      };
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        unidade:unidades(id, name, address)
      `)
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError);
      return {
        success: false,
        error: 'Erro interno ao buscar perfil do usuário'
      };
    }

    if (!profile.isActive) {
      return {
        success: false,
        error: 'Conta desativada. Entre em contato com o administrador.'
      };
    }

    // Revalidar cache
    revalidatePath('/');

    return {
      success: true,
      data: {
        user: profile as UserProfile,
        session: {
          accessToken: authData.session?.access_token || '',
          refreshToken: authData.session?.refresh_token || '',
          expiresAt: authData.session?.expires_at?.toString() || '',
        }
      }
    };
  } catch (error) {
    console.error('Erro inesperado no login:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Faz logout do usuário
 */
export async function signOut(): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Erro no logout:', error);
      return {
        success: false,
        error: 'Erro interno ao fazer logout'
      };
    }

    // Revalidar cache
    revalidatePath('/');

    return {
      success: true
    };
  } catch (error) {
    console.error('Erro inesperado no logout:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Solicita recuperação de senha
 */
export async function forgotPassword(
  input: ForgotPasswordInput
): Promise<ActionResult<void>> {
  try {
    // Validação com Zod
    const validation = forgotPasswordSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Enviar email de recuperação
    const { error } = await supabase.auth.resetPasswordForEmail(validatedData.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    });

    if (error) {
      console.error('Erro ao enviar email de recuperação:', error);
      return {
        success: false,
        error: 'Erro interno ao enviar email de recuperação'
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Erro inesperado ao solicitar recuperação:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Redefine a senha do usuário
 */
export async function resetPassword(
  input: ResetPasswordInput
): Promise<ActionResult<void>> {
  try {
    // Validação com Zod
    const validation = resetPasswordSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Redefinir senha
    const { error } = await supabase.auth.updateUser({
      password: validatedData.password
    });

    if (error) {
      console.error('Erro ao redefinir senha:', error);
      return {
        success: false,
        error: 'Erro interno ao redefinir senha'
      };
    }

    // Revalidar cache
    revalidatePath('/');

    return {
      success: true
    };
  } catch (error) {
    console.error('Erro inesperado ao redefinir senha:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Altera a senha do usuário logado
 */
export async function changePassword(
  input: ChangePasswordInput
): Promise<ActionResult<void>> {
  try {
    // Validação com Zod
    const validation = changePasswordSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Verificar senha atual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: 'Usuário não autenticado'
      };
    }

    // Alterar senha
    const { error } = await supabase.auth.updateUser({
      password: validatedData.newPassword
    });

    if (error) {
      console.error('Erro ao alterar senha:', error);
      return {
        success: false,
        error: 'Erro interno ao alterar senha'
      };
    }

    // Revalidar cache
    revalidatePath('/');

    return {
      success: true
    };
  } catch (error) {
    console.error('Erro inesperado ao alterar senha:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Atualiza o perfil do usuário
 */
export async function updateProfile(
  input: UpdateProfileInput
): Promise<ActionResult<UserProfile>> {
  try {
    // Validação com Zod
    const validation = updateProfileSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: 'Usuário não autenticado'
      };
    }

    // Atualizar perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        ...validatedData,
        updatedAt: new Date().toISOString()
      })
      .eq('id', user.id)
      .select(`
        *,
        unidade:unidades(id, name, address)
      `)
      .single();

    if (profileError) {
      console.error('Erro ao atualizar perfil:', profileError);
      return {
        success: false,
        error: 'Erro interno ao atualizar perfil'
      };
    }

    // Revalidar cache
    revalidatePath('/');
    revalidatePath('/profile');

    return {
      success: true,
      data: profile as UserProfile
    };
  } catch (error) {
    console.error('Erro inesperado ao atualizar perfil:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Verifica o email do usuário
 */
export async function verifyEmail(
  input: VerifyEmailInput
): Promise<ActionResult<void>> {
  try {
    // Validação com Zod
    const validation = verifyEmailSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Verificar email
    const { error } = await supabase.auth.verifyOtp({
      token_hash: validatedData.token,
      type: 'email'
    });

    if (error) {
      console.error('Erro ao verificar email:', error);
      return {
        success: false,
        error: 'Token de verificação inválido ou expirado'
      };
    }

    // Revalidar cache
    revalidatePath('/');

    return {
      success: true
    };
  } catch (error) {
    console.error('Erro inesperado ao verificar email:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Reenvia email de verificação
 */
export async function resendVerification(
  input: ResendVerificationInput
): Promise<ActionResult<void>> {
  try {
    // Validação com Zod
    const validation = resendVerificationSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Reenviar email de verificação
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: validatedData.email,
    });

    if (error) {
      console.error('Erro ao reenviar verificação:', error);
      return {
        success: false,
        error: 'Erro interno ao reenviar email de verificação'
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Erro inesperado ao reenviar verificação:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Obtém o usuário atual
 */
export async function getCurrentUser(): Promise<ActionResult<UserProfile>> {
  try {
    const supabase = await createClient();

    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: 'Usuário não autenticado'
      };
    }

    // Buscar perfil completo
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        unidade:unidades(id, name, address)
      `)
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError);
      return {
        success: false,
        error: 'Erro interno ao buscar perfil'
      };
    }

    if (!profile.isActive) {
      return {
        success: false,
        error: 'Conta desativada'
      };
    }

    return {
      success: true,
      data: profile as UserProfile
    };
  } catch (error) {
    console.error('Erro inesperado ao buscar usuário atual:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Verifica se o usuário tem permissão específica
 */
export async function checkPermission(
  permission: string,
  resourceId?: string
): Promise<ActionResult<boolean>> {
  try {
    const supabase = await createClient();

    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: 'Usuário não autenticado'
      };
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, unidadeId')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError);
      return {
        success: false,
        error: 'Erro interno ao verificar permissões'
      };
    }

    // Verificar permissões baseadas no papel
    let hasPermission = false;

    switch (permission) {
      case 'admin':
        hasPermission = profile.role === 'admin';
        break;
      case 'manage_users':
        hasPermission = ['admin', 'manager'].includes(profile.role);
        break;
      case 'manage_appointments':
        hasPermission = ['admin', 'manager', 'receptionist'].includes(profile.role);
        break;
      case 'view_reports':
        hasPermission = ['admin', 'manager'].includes(profile.role);
        break;
      default:
        hasPermission = false;
    }

    return {
      success: true,
      data: hasPermission
    };
  } catch (error) {
    console.error('Erro inesperado ao verificar permissão:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}
