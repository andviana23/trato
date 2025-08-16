import { z } from 'zod';

// ============================================================================
// ESQUEMAS DE VALIDAÇÃO PARA AUTENTICAÇÃO
// ============================================================================

/**
 * Esquema para registro de usuário
 */
export const signUpSchema = z.object({
  email: z.string().email('Email deve ser válido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').max(100, 'Senha deve ter no máximo 100 caracteres'),
  confirmPassword: z.string().min(8, 'Confirmação de senha deve ter pelo menos 8 caracteres'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').max(15, 'Telefone deve ter no máximo 15 dígitos').optional(),
  unidadeId: z.string().uuid('ID da unidade deve ser um UUID válido'),
  role: z.enum(['admin', 'manager', 'professional', 'receptionist'], {
    errorMap: () => ({ message: 'Perfil deve ser um dos valores permitidos' })
  }).default('receptionist'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

/**
 * Esquema para login
 */
export const signInSchema = z.object({
  email: z.string().email('Email deve ser válido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

/**
 * Esquema para recuperação de senha
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Email deve ser válido'),
});

/**
 * Esquema para redefinição de senha
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').max(100, 'Senha deve ter no máximo 100 caracteres'),
  confirmPassword: z.string().min(8, 'Confirmação de senha deve ter pelo menos 8 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

/**
 * Esquema para alteração de senha
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres').max(100, 'Nova senha deve ter no máximo 100 caracteres'),
  confirmNewPassword: z.string().min(8, 'Confirmação de nova senha deve ter pelo menos 8 caracteres'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmNewPassword'],
});

/**
 * Esquema para atualização de perfil
 */
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').max(15, 'Telefone deve ter no máximo 15 dígitos').optional(),
  avatar: z.string().url('Avatar deve ser uma URL válida').optional(),
  bio: z.string().max(500, 'Biografia deve ter no máximo 500 caracteres').optional(),
});

/**
 * Esquema para verificação de email
 */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
});

/**
 * Esquema para reenvio de verificação de email
 */
export const resendVerificationSchema = z.object({
  email: z.string().email('Email deve ser válido'),
});

// ============================================================================
// TIPOS INFERIDOS DOS ESQUEMAS
// ============================================================================

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
