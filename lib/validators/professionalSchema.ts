import { z } from 'zod'

/**
 * Esquemas de Validação para Profissionais
 * 
 * Este arquivo centraliza todas as validações relacionadas a profissionais,
 * promovendo reutilização e consistência.
 */

// Validador para UUID
export const UUIDSchema = z.string().uuid('Deve ser um UUID válido')

// Validador para email
export const EmailSchema = z.string().email('Email deve ser válido')

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

// Validador para CEP
export const CEPSchema = z.string()
  .length(8, 'CEP deve ter 8 dígitos')
  .regex(/^\d+$/, 'CEP deve conter apenas números')

// Validador para data de nascimento
export const BirthDateSchema = z.string().datetime('Data de nascimento deve estar no formato ISO')

// Validador para status de profissional
export const ProfessionalStatusSchema = z.enum([
  'active',
  'inactive',
  'suspended',
  'pending',
  'on_leave'
], {
  errorMap: () => ({ message: 'Status deve ser um dos valores permitidos' })
})

// Validador para especialidade
export const SpecialtySchema = z.enum([
  'general_practitioner',
  'cardiologist',
  'dermatologist',
  'endocrinologist',
  'gastroenterologist',
  'gynecologist',
  'neurologist',
  'oncologist',
  'ophthalmologist',
  'orthopedist',
  'pediatrician',
  'psychiatrist',
  'pulmonologist',
  'urologist',
  'other'
], {
  errorMap: () => ({ message: 'Especialidade deve ser uma das permitidas' })
})

// Validador para tipo de contrato
export const ContractTypeSchema = z.enum([
  'employee',
  'contractor',
  'partner',
  'intern'
], {
  errorMap: () => ({ message: 'Tipo de contrato deve ser um dos permitidos' })
})

// Esquema para endereço
export const AddressSchema = z.object({
  street: z.string().min(1, 'Rua é obrigatória').max(200, 'Rua deve ter no máximo 200 caracteres'),
  number: z.string().min(1, 'Número é obrigatório').max(20, 'Número deve ter no máximo 20 caracteres'),
  complement: z.string().max(100, 'Complemento deve ter no máximo 100 caracteres').optional(),
  neighborhood: z.string().min(1, 'Bairro é obrigatório').max(100, 'Bairro deve ter no máximo 100 caracteres'),
  city: z.string().min(1, 'Cidade é obrigatória').max(100, 'Cidade deve ter no máximo 100 caracteres'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres').regex(/^[A-Z]{2}$/, 'Estado deve ser a sigla em maiúsculas'),
  cep: CEPSchema,
})

// Esquema para formação acadêmica
export const EducationSchema = z.object({
  degree: z.string().min(1, 'Grau é obrigatório').max(100, 'Grau deve ter no máximo 100 caracteres'),
  institution: z.string().min(1, 'Instituição é obrigatória').max(200, 'Instituição deve ter no máximo 200 caracteres'),
  year: z.number().min(1900, 'Ano deve ser maior que 1900').max(new Date().getFullYear() + 1, 'Ano não pode ser no futuro'),
  specialty: z.string().max(100, 'Especialidade deve ter no máximo 100 caracteres').optional(),
})

// Esquema para registro profissional
export const ProfessionalLicenseSchema = z.object({
  number: z.string().min(1, 'Número do registro é obrigatório').max(50, 'Número deve ter no máximo 50 caracteres'),
  issuingBody: z.string().min(1, 'Órgão emissor é obrigatório').max(100, 'Órgão emissor deve ter no máximo 100 caracteres'),
  issueDate: z.string().datetime('Data de emissão deve estar no formato ISO'),
  expiryDate: z.string().datetime('Data de validade deve estar no formato ISO').optional(),
  state: z.string().length(2, 'Estado deve ter 2 caracteres').regex(/^[A-Z]{2}$/, 'Estado deve ser a sigla em maiúsculas'),
})

// Esquema para horário de trabalho
export const WorkScheduleSchema = z.object({
  dayOfWeek: z.number().min(0, 'Dia da semana deve ser entre 0 e 6').max(6, 'Dia da semana deve ser entre 0 e 6'),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário de início deve estar no formato HH:MM'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário de fim deve estar no formato HH:MM'),
  isAvailable: z.boolean().default(true),
}).refine(
  (data) => {
    const start = new Date(`2000-01-01T${data.startTime}:00`)
    const end = new Date(`2000-01-01T${data.endTime}:00`)
    return start < end
  },
  {
    message: 'Horário de fim deve ser posterior ao horário de início',
    path: ['endTime']
  }
)

// Esquema para criação de profissional
export const CreateProfessionalSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  phone: PhoneSchema,
  cpf: CPFSchema,
  birthDate: BirthDateSchema.optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: AddressSchema.optional(),
  specialties: z.array(SpecialtySchema).min(1, 'Pelo menos uma especialidade é obrigatória'),
  contractType: ContractTypeSchema,
  status: ProfessionalStatusSchema.default('pending'),
  unidadeId: UUIDSchema.optional(),
  education: z.array(EducationSchema).optional(),
  licenses: z.array(ProfessionalLicenseSchema).optional(),
  workSchedule: z.array(WorkScheduleSchema).optional(),
  hourlyRate: z.number().positive('Taxa horária deve ser positiva').optional(),
  commissionRate: z.number().min(0, 'Taxa de comissão deve ser maior ou igual a 0').max(1, 'Taxa de comissão deve ser menor ou igual a 1').optional(),
  notes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional(),
})

// Esquema para atualização de profissional
export const UpdateProfessionalSchema = z.object({
  professionalId: UUIDSchema,
  name: NameSchema.optional(),
  email: EmailSchema.optional(),
  phone: PhoneSchema.optional(),
  address: AddressSchema.optional(),
  specialties: z.array(SpecialtySchema).optional(),
  contractType: ContractTypeSchema.optional(),
  status: ProfessionalStatusSchema.optional(),
  unidadeId: UUIDSchema.optional(),
  education: z.array(EducationSchema).optional(),
  licenses: z.array(ProfessionalLicenseSchema).optional(),
  workSchedule: z.array(WorkScheduleSchema).optional(),
  hourlyRate: z.number().positive('Taxa horária deve ser positiva').optional(),
  commissionRate: z.number().min(0, 'Taxa de comissão deve ser maior ou igual a 0').max(1, 'Taxa de comissão deve ser menor ou igual a 1').optional(),
  notes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional(),
})

// Esquema para busca de profissionais
export const SearchProfessionalsSchema = z.object({
  name: z.string().optional(),
  email: EmailSchema.optional(),
  phone: PhoneSchema.optional(),
  cpf: CPFSchema.optional(),
  specialties: z.array(SpecialtySchema).optional(),
  contractType: ContractTypeSchema.optional(),
  status: ProfessionalStatusSchema.optional(),
  unidadeId: UUIDSchema.optional(),
  startDate: z.string().datetime('Data de início deve estar no formato ISO').optional(),
  endDate: z.string().datetime('Data de fim deve estar no formato ISO').optional(),
  page: z.number().min(1, 'Página deve ser maior que 0').default(1),
  limit: z.number().min(1, 'Limite deve ser maior que 0').max(100, 'Limite máximo é 100').default(20),
  sortBy: z.enum(['name', 'email', 'specialties', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// Tipos inferidos dos esquemas
export type CreateProfessionalInput = z.infer<typeof CreateProfessionalSchema>
export type UpdateProfessionalInput = z.infer<typeof UpdateProfessionalSchema>
export type SearchProfessionalsInput = z.infer<typeof SearchProfessionalsSchema>
export type EducationInput = z.infer<typeof EducationSchema>
export type ProfessionalLicenseInput = z.infer<typeof ProfessionalLicenseSchema>
export type WorkScheduleInput = z.infer<typeof WorkScheduleSchema>
export type AddressInput = z.infer<typeof AddressSchema>
export type ProfessionalStatus = z.infer<typeof ProfessionalStatusSchema>
export type Specialty = z.infer<typeof SpecialtySchema>
export type ContractType = z.infer<typeof ContractTypeSchema>
