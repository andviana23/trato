import { z } from 'zod'

/**
 * Esquemas de Validação para Pagamentos
 * 
 * Este arquivo centraliza todas as validações relacionadas a pagamentos,
 * promovendo reutilização e consistência.
 */

// Validador para UUID
export const UUIDSchema = z.string().uuid('Deve ser um UUID válido')

// Validador para valor monetário
export const CurrencySchema = z.number()
  .positive('Valor deve ser positivo')
  .min(0.01, 'Valor deve ser maior que zero')

// Validador para data ISO
export const DateISOSchema = z.string().datetime('Data deve estar no formato ISO')

// Validador para status de pagamento
export const PaymentStatusSchema = z.enum([
  'pending',
  'confirmed',
  'received',
  'failed',
  'refunded',
  'cancelled'
], {
  errorMap: () => ({ message: 'Status de pagamento deve ser um dos valores permitidos' })
})

// Validador para tipo de pagamento
export const PaymentTypeSchema = z.enum([
  'credit_card',
  'debit_card',
  'pix',
  'bank_slip',
  'transfer',
  'cash'
], {
  errorMap: () => ({ message: 'Tipo de pagamento deve ser um dos valores permitidos' })
})

// Validador para tipo de cobrança
export const BillingTypeSchema = z.enum([
  'CREDIT_CARD',
  'BANK_SLIP',
  'PIX',
  'TRANSFER'
], {
  errorMap: () => ({ message: 'Tipo de cobrança deve ser um dos valores permitidos' })
})

// Esquema para webhook ASAAS
export const AsaasWebhookSchema = z.object({
  event: z.string().min(1, 'Evento é obrigatório'),
  payment: z.object({
    id: z.string().min(1, 'ID do pagamento é obrigatório'),
    status: z.string().min(1, 'Status é obrigatório'),
    value: CurrencySchema,
    dueDate: z.string().optional(),
    customer: z.string().optional(),
    subscription: z.string().nullable().optional(),
  }).optional(),
  subscription: z.object({
    id: z.string().min(1, 'ID da assinatura é obrigatório'),
    status: z.string().min(1, 'Status é obrigatório'),
    value: CurrencySchema,
    customer: z.string().min(1, 'Cliente é obrigatório'),
    billingType: BillingTypeSchema,
  }).optional(),
})

// Esquema para criação de pagamento
export const createPaymentSchema = z.object({
  appointmentId: UUIDSchema,
  amount: CurrencySchema,
  paymentType: PaymentTypeSchema,
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  dueDate: DateISOSchema.optional(),
  installments: z.number().min(1, 'Parcelas deve ser maior que 0').max(12, 'Parcelas deve ser menor ou igual a 12').default(1),
  customerId: UUIDSchema.optional(),
  professionalId: UUIDSchema.optional(),
  unidadeId: UUIDSchema.optional(),
})

// Esquema para atualização de pagamento
export const updatePaymentSchema = z.object({
  paymentId: UUIDSchema,
  status: PaymentStatusSchema.optional(),
  amount: CurrencySchema.optional(),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  dueDate: DateISOSchema.optional(),
  installments: z.number().min(1, 'Parcelas deve ser maior que 0').max(12, 'Parcelas deve ser menor ou igual a 12').optional(),
})

// Esquema para processamento de pagamento
export const processPaymentSchema = z.object({
  paymentId: UUIDSchema,
  transactionId: z.string().min(1, 'ID da transação é obrigatório'),
  status: PaymentStatusSchema,
  processedBy: UUIDSchema,
})

// Esquema para busca de pagamentos
export const searchPaymentsSchema = z.object({
  appointmentId: UUIDSchema.optional(),
  customerId: UUIDSchema.optional(),
  professionalId: UUIDSchema.optional(),
  unidadeId: UUIDSchema.optional(),
  status: PaymentStatusSchema.optional(),
  paymentType: PaymentTypeSchema.optional(),
  startDate: DateISOSchema.optional(),
  endDate: DateISOSchema.optional(),
  minAmount: CurrencySchema.optional(),
  maxAmount: CurrencySchema.optional(),
  page: z.number().min(1, 'Página deve ser maior que 0').default(1),
  limit: z.number().min(1, 'Limite deve ser maior que 0').max(100, 'Limite máximo é 100').default(20),
  sortBy: z.enum(['createdAt', 'dueDate', 'amount', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Esquema para reembolso
export const refundPaymentSchema = z.object({
  paymentId: UUIDSchema,
  amount: CurrencySchema.optional(), // Se não informado, reembolsa o valor total
  reason: z.string().min(1, 'Motivo do reembolso é obrigatório').max(200, 'Motivo deve ter no máximo 200 caracteres'),
  refundedBy: UUIDSchema.optional(),
})

// Esquema para relatório de pagamentos
export const paymentReportSchema = z.object({
  unidadeId: UUIDSchema.optional(),
  startDate: DateISOSchema.optional(),
  endDate: DateISOSchema.optional(),
  status: PaymentStatusSchema.optional(),
  paymentType: PaymentTypeSchema.optional(),
  groupBy: z.enum(['day', 'week', 'month', 'professional', 'service']).default('day'),
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
})

// Esquema para assinatura
export const subscriptionSchema = z.object({
  customerId: UUIDSchema,
  serviceId: UUIDSchema,
  amount: CurrencySchema,
  billingType: BillingTypeSchema,
  frequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']).default('monthly'),
  startDate: DateISOSchema,
  endDate: DateISOSchema.optional(),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  unidadeId: UUIDSchema.optional(),
})

// Tipos inferidos dos esquemas
export type AsaasWebhookInput = z.infer<typeof AsaasWebhookSchema>
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>
export type SearchPaymentsInput = z.infer<typeof searchPaymentsSchema>
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>
export type PaymentReportInput = z.infer<typeof paymentReportSchema>
export type SubscriptionInput = z.infer<typeof subscriptionSchema>
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>
export type PaymentType = z.infer<typeof PaymentTypeSchema>
export type BillingType = z.infer<typeof BillingTypeSchema>
