// ============================================================================
// VALIDATORS CENTRALIZADOS
// ============================================================================

// Re-exportação de todos os validadores para uso centralizado
export * from './appointments';
export * from './auth';
export * from './clients';
export * from './payments';
export * from './queue';
export * from './metas';

// ============================================================================
// VALIDATORS COMUNS
// ============================================================================

import { z } from 'zod';

// Validador para UUID
export const UUIDSchema = z.string().uuid('ID deve ser um UUID válido');

// Validador para email
export const EmailSchema = z.string().email('Email inválido');

// Validador para telefone brasileiro
export const PhoneSchema = z.string()
  .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX');

// Validador para CPF
export const CPFSchema = z.string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato XXX.XXX.XXX-XX');

// Validador para data
export const DateSchema = z.string().datetime('Data deve estar no formato ISO');

// Validador para valor monetário
export const MoneySchema = z.number()
  .positive('Valor deve ser positivo')
  .min(0.01, 'Valor deve ser maior que zero');

// Validador para porcentagem
export const PercentageSchema = z.number()
  .min(0, 'Porcentagem deve ser maior ou igual a 0')
  .max(100, 'Porcentagem deve ser menor ou igual a 100');

// Validador para paginação
export const PaginationSchema = z.object({
  page: z.number().min(1, 'Página deve ser maior que 0').default(1),
  limit: z.number().min(1, 'Limite deve ser maior que 0').max(100, 'Limite máximo é 100').default(20),
});

// Validador para filtros de data
export const DateRangeSchema = z.object({
  startDate: DateSchema,
  endDate: DateSchema,
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: 'Data inicial deve ser menor ou igual à data final',
    path: ['endDate'],
  }
);

// Validador para busca
export const SearchSchema = z.object({
  query: z.string().min(1, 'Termo de busca é obrigatório'),
  fields: z.array(z.string()).optional(),
  exact: z.boolean().default(false),
});

// Validador para ordenação
export const SortSchema = z.object({
  field: z.string().min(1, 'Campo de ordenação é obrigatório'),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

// Validador para filtros
export const FilterSchema = z.object({
  field: z.string().min(1, 'Campo do filtro é obrigatório'),
  operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'like', 'in', 'not_in']),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number()]))]),
});

// Validador para endereço
export const AddressSchema = z.object({
  street: z.string().min(1, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  zipCode: z.string().regex(/^\d{5}-\d{3}$/, 'CEP deve estar no formato XXXXX-XXX'),
});

// Validador para horário
export const TimeSchema = z.string()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário deve estar no formato HH:MM');

// Validador para duração em minutos
export const DurationSchema = z.number()
  .int('Duração deve ser um número inteiro')
  .min(1, 'Duração deve ser maior que 0')
  .max(1440, 'Duração máxima é 24 horas (1440 minutos)');

// Validador para status de agendamento
export const AppointmentStatusSchema = z.enum([
  'agendado',
  'confirmado',
  'em_andamento',
  'atendido',
  'cancelado',
  'no_show'
]);

// Validador para método de pagamento
export const PaymentMethodSchema = z.enum([
  'pix',
  'credit_card',
  'debit_card',
  'cash',
  'transfer',
  'check'
]);

// Validador para status de pagamento
export const PaymentStatusSchema = z.enum([
  'pending',
  'completed',
  'failed',
  'refunded',
  'cancelled'
]);

// Validador para prioridade da fila
export const QueuePrioritySchema = z.enum([
  'low',
  'normal',
  'high',
  'urgent'
]);

// Validador para função do profissional
export const ProfessionalRoleSchema = z.enum([
  'barbeiro',
  'cabeleireiro',
  'manicure',
  'pedicure',
  'esteticista',
  'receptionist',
  'admin'
]);

// Validador para tipo de cliente
export const ClientTypeSchema = z.enum([
  'regular',
  'vip',
  'new',
  'inactive'
]);

// Validador para fonte de cliente
export const ClientSourceSchema = z.enum([
  'walkin',
  'online',
  'indication',
  'social',
  'advertising'
]);

// Validador para unidade
export const UnidadeSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1, 'Nome da unidade é obrigatório'),
  slug: z.string().min(1, 'Slug da unidade é obrigatório'),
  address: AddressSchema,
  phone: PhoneSchema,
  email: EmailSchema.optional(),
  active: z.boolean().default(true),
});

// Validador para profissional
export const ProfessionalSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: EmailSchema,
  phone: PhoneSchema,
  specialty: z.string().min(1, 'Especialidade é obrigatória'),
  role: ProfessionalRoleSchema,
  unidadeId: UUIDSchema,
  active: z.boolean().default(true),
  commissionRate: PercentageSchema.default(0),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve ser um código hexadecimal válido').optional(),
});

// Validador para serviço
export const ServiceSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1, 'Nome do serviço é obrigatório'),
  description: z.string().optional(),
  duration: DurationSchema,
  price: MoneySchema,
  category: z.string().min(1, 'Categoria é obrigatória'),
  active: z.boolean().default(true),
  unidadeId: UUIDSchema,
});

// Validador para agendamento
export const AppointmentSchema = z.object({
  id: UUIDSchema,
  clientId: UUIDSchema,
  professionalId: UUIDSchema,
  serviceId: UUIDSchema,
  startTime: DateSchema,
  endTime: DateSchema,
  status: AppointmentStatusSchema.default('agendado'),
  notes: z.string().optional(),
  unidadeId: UUIDSchema,
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

// Validador para cliente
export const ClientSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: EmailSchema.optional(),
  phone: PhoneSchema,
  cpf: CPFSchema,
  birthDate: DateSchema.optional(),
  address: AddressSchema.optional(),
  notes: z.string().optional(),
  type: ClientTypeSchema.default('new'),
  source: ClientSourceSchema.default('walkin'),
  unidadeId: UUIDSchema,
  active: z.boolean().default(true),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

// Validador para pagamento
export const PaymentSchema = z.object({
  id: UUIDSchema,
  appointmentId: UUIDSchema,
  clientId: UUIDSchema,
  amount: MoneySchema,
  method: PaymentMethodSchema,
  status: PaymentStatusSchema.default('pending'),
  installments: z.number().int().min(1).max(12).default(1),
  notes: z.string().optional(),
  unidadeId: UUIDSchema,
  transactionId: z.string().optional(),
  processedAt: DateSchema.optional(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

// Validador para item da fila
export const QueueItemSchema = z.object({
  id: UUIDSchema,
  clientId: UUIDSchema,
  serviceId: UUIDSchema,
  priority: QueuePrioritySchema.default('normal'),
  estimatedWaitTime: DurationSchema,
  actualWaitTime: DurationSchema.optional(),
  notes: z.string().optional(),
  unidadeId: UUIDSchema,
  source: ClientSourceSchema.default('walkin'),
  status: z.enum(['waiting', 'called', 'in_service', 'completed', 'cancelled']).default('waiting'),
  position: z.number().int().min(1, 'Posição deve ser maior que 0'),
  assignedProfessionalId: UUIDSchema.optional(),
  estimatedStartTime: DateSchema.optional(),
  actualStartTime: DateSchema.optional(),
  completedAt: DateSchema.optional(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

// Validador para meta
export const MetaSchema = z.object({
  id: UUIDSchema,
  professionalId: UUIDSchema,
  unidadeId: UUIDSchema,
  month: z.number().int().min(1).max(12, 'Mês deve estar entre 1 e 12'),
  year: z.number().int().min(2020).max(2030, 'Ano deve estar entre 2020 e 2030'),
  targetRevenue: MoneySchema,
  targetAppointments: z.number().int().min(1, 'Meta de agendamentos deve ser maior que 0'),
  commissionRate: PercentageSchema,
  bonusThreshold: MoneySchema,
  bonusAmount: MoneySchema,
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

// Validador para comissão
export const CommissionSchema = z.object({
  id: UUIDSchema,
  professionalId: UUIDSchema,
  unidadeId: UUIDSchema,
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2030),
  baseRevenue: MoneySchema,
  commissionRate: PercentageSchema,
  commissionAmount: MoneySchema,
  bonusAmount: MoneySchema,
  totalAmount: MoneySchema,
  status: z.enum(['pending', 'paid', 'cancelled']).default('pending'),
  paidAt: DateSchema.optional(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

// ============================================================================
// FUNÇÕES UTILITÁRIAS PARA VALIDAÇÃO
// ============================================================================

/**
 * Valida e sanitiza dados de entrada
 */
export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { success: false, error: firstError.message };
    }
    return { success: false, error: 'Erro de validação desconhecido' };
  }
}

/**
 * Valida dados parciais (para updates)
 */
export function validatePartial<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: Partial<T> } | { success: false; error: string } {
  try {
    const validatedData = schema.partial().parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { success: false, error: firstError.message };
    }
    return { success: false, error: 'Erro de validação desconhecido' };
  }
}

/**
 * Valida array de dados
 */
export function validateArray<T>(schema: z.ZodSchema<T>, data: unknown[]): { success: true; data: T[] } | { success: false; error: string } {
  try {
    const validatedData = z.array(schema).parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { success: false, error: firstError.message };
    }
    return { success: false, error: 'Erro de validação desconhecido' };
  }
}

/**
 * Valida dados com transformação
 */
export function validateWithTransform<T, U>(
  schema: z.ZodSchema<T>,
  transform: (data: T) => U,
  data: unknown
): { success: true; data: U } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data);
    const transformedData = transform(validatedData);
    return { success: true, data: transformedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { success: false, error: firstError.message };
    }
    return { success: false, error: 'Erro de validação desconhecido' };
  }
}
