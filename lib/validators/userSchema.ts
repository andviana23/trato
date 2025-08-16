import { z } from 'zod'

/**
 * Esquemas de Validação para Usuários
 * 
 * Este arquivo centraliza todas as validações relacionadas a usuários,
 * promovendo reutilização e consistência.
 */

// Validador para UUID
export const UUIDSchema = z.string().uuid('Deve ser um UUID válido')

// Validador para email
export const EmailSchema = z.string().email('Email deve ser válido')

// Validador para senha
export const PasswordSchema = z.string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número')

// Validador para nome
export const NameSchema = z.string()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome deve ter no máximo 100 caracteres')
  .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços')

// Validador para CPF
export const CPFSchema = z.string()
  .length(11, 'CPF deve ter 11 dígitos')
  .regex(/^\d+$/, 'CPF deve conter apenas números')

// Validador para telefone brasileiro
export const PhoneSchema = z.string()
  .min(10, 'Telefone deve ter pelo menos 10 dígitos')
  .max(15, 'Telefone deve ter no máximo 15 dígitos')
  .regex(/^[\d\s\(\)\-\+]+$/, 'Telefone deve conter apenas números, espaços, parênteses, hífens e +')

// Validador para status de usuário
export const UserStatusSchema = z.enum([
  'active',
  'inactive',
  'suspended',
  'pending'
], {
  errorMap: () => ({ message: 'Status deve ser um dos valores permitidos' })
})

// Validador para tipo de usuário
export const UserTypeSchema = z.enum([
  'admin',
  'manager',
  'professional',
  'receptionist',
  'client'
], {
  errorMap: () => ({ message: 'Tipo de usuário deve ser um dos valores permitidos' })
})

// Esquema para criação de usuário
export const CreateUserSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  password: PasswordSchema,
  userType: UserTypeSchema,
  phone: PhoneSchema.optional(),
  cpf: CPFSchema.optional(),
  unidadeId: UUIDSchema.optional(),
  professionalId: UUIDSchema.optional(),
  clientId: UUIDSchema.optional(),
  status: UserStatusSchema.default('pending'),
})

// Esquema para atualização de usuário
export const UpdateUserSchema = z.object({
  userId: UUIDSchema,
  name: NameSchema.optional(),
  email: EmailSchema.optional(),
  phone: PhoneSchema.optional(),
  cpf: CPFSchema.optional(),
  userType: UserTypeSchema.optional(),
  status: UserStatusSchema.optional(),
  unidadeId: UUIDSchema.optional(),
  professionalId: UUIDSchema.optional(),
  clientId: UUIDSchema.optional(),
})

// Esquema para alteração de senha
export const ChangePasswordSchema = z.object({
  userId: UUIDSchema,
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: PasswordSchema,
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Nova senha e confirmação devem ser iguais',
    path: ['confirmPassword']
  }
)

// Esquema para login
export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Senha é obrigatória'),
  rememberMe: z.boolean().default(false),
})

// Esquema para redefinição de senha
export const ResetPasswordSchema = z.object({
  email: EmailSchema,
})

// Esquema para busca de usuários
export const SearchUsersSchema = z.object({
  name: z.string().optional(),
  email: EmailSchema.optional(),
  userType: UserTypeSchema.optional(),
  status: UserStatusSchema.optional(),
  unidadeId: UUIDSchema.optional(),
  page: z.number().min(1, 'Página deve ser maior que 0').default(1),
  limit: z.number().min(1, 'Limite deve ser maior que 0').max(100, 'Limite máximo é 100').default(20),
  sortBy: z.enum(['name', 'email', 'createdAt', 'lastLogin']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// Esquema para perfil de usuário
export const UserProfileSchema = z.object({
  userId: UUIDSchema,
  bio: z.string().max(500, 'Biografia deve ter no máximo 500 caracteres').optional(),
  avatar: z.string().url('Avatar deve ser uma URL válida').optional(),
  preferences: z.record(z.unknown()).optional(),
})

// Tipos inferidos dos esquemas
export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>
export type SearchUsersInput = z.infer<typeof SearchUsersSchema>
export type UserProfileInput = z.infer<typeof UserProfileSchema>
export type UserStatus = z.infer<typeof UserStatusSchema>
export type UserType = z.infer<typeof UserTypeSchema>
