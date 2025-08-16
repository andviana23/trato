'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ActionResult, ActionResultPaginated, ActionResultStats } from '@/lib/types/action';
import {
  createPaymentSchema,
  updatePaymentSchema,
  processPaymentSchema,
  refundPaymentSchema,
  searchPaymentsSchema,
  paymentReportSchema,
  type CreatePaymentInput,
  type UpdatePaymentInput,
  type ProcessPaymentInput,
  type RefundPaymentInput,
  type SearchPaymentsInput,
  type PaymentReportInput,
} from '@/lib/validators';

// ============================================================================
// TIPOS DE DADOS
// ============================================================================

export interface Payment {
  id: string;
  appointmentId: string;
  amount: number;
  method: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'transferencia' | 'boleto';
  status: 'pendente' | 'processando' | 'aprovado' | 'rejeitado' | 'cancelado' | 'estornado';
  installments: number;
  notes?: string;
  unidadeId: string;
  processedBy: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentWithDetails extends Payment {
  appointment: {
    id: string;
    startTime: string;
    client: {
      id: string;
      name: string;
    };
    professional: {
      id: string;
      name: string;
    };
    service: {
      id: string;
      name: string;
      price: number;
    };
  };
  unidade: {
    id: string;
    name: string;
  };
  processor: {
    id: string;
    name: string;
  };
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Cria um novo pagamento
 */
export async function createPayment(
  input: CreatePaymentInput
): Promise<ActionResult<Payment>> {
  try {
    // Validação com Zod
    const validation = createPaymentSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Verificar se o agendamento existe
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, status, unidadeId')
      .eq('id', validatedData.appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return {
        success: false,
        error: 'Agendamento não encontrado'
      };
    }

    if (appointment.status === 'cancelado') {
      return {
        success: false,
        error: 'Não é possível criar pagamento para um agendamento cancelado'
      };
    }

    // Verificar se já existe pagamento para este agendamento
    const { data: existingPayment, error: paymentCheckError } = await supabase
      .from('payments')
      .select('id')
      .eq('appointmentId', validatedData.appointmentId)
      .eq('status', 'aprovado')
      .single();

    if (existingPayment) {
      return {
        success: false,
        error: 'Já existe um pagamento aprovado para este agendamento'
      };
    }

    if (paymentCheckError && paymentCheckError.code !== 'PGRST116') {
      console.error('Erro ao verificar pagamento existente:', paymentCheckError);
      return {
        success: false,
        error: 'Erro interno ao verificar pagamentos existentes'
      };
    }

    // Criar pagamento
    const { data: payment, error } = await supabase
      .from('payments')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar pagamento:', error);
      return {
        success: false,
        error: 'Erro interno ao criar pagamento'
      };
    }

    // Revalidar cache
    revalidatePath('/');
    revalidatePath('/pagamentos');
    revalidatePath(`/pagamentos/${validatedData.unidadeId}`);

    return {
      success: true,
      data: payment as Payment
    };
  } catch (error) {
    console.error('Erro inesperado ao criar pagamento:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Atualiza um pagamento existente
 */
export async function updatePayment(
  input: UpdatePaymentInput
): Promise<ActionResult<Payment>> {
  try {
    // Validação com Zod
    const validation = updatePaymentSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Verificar se o pagamento existe
    const { data: existing, error: fetchError } = await supabase
      .from('payments')
      .select('id, status, unidadeId')
      .eq('id', validatedData.id)
      .single();

    if (fetchError || !existing) {
      return {
        success: false,
        error: 'Pagamento não encontrado'
      };
    }

    if (existing.status === 'aprovado' || existing.status === 'estornado') {
      return {
        success: false,
        error: 'Não é possível alterar um pagamento já aprovado ou estornado'
      };
    }

    // Atualizar pagamento
    const { data: payment, error } = await supabase
      .from('payments')
      .update({
        ...validatedData,
        updatedAt: new Date().toISOString()
      })
      .eq('id', validatedData.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar pagamento:', error);
      return {
        success: false,
        error: 'Erro interno ao atualizar pagamento'
      };
    }

    // Revalidar cache
    revalidatePath('/');
    revalidatePath('/pagamentos');
    revalidatePath(`/pagamentos/${existing.unidadeId}`);

    return {
      success: true,
      data: payment as Payment
    };
  } catch (error) {
    console.error('Erro inesperado ao atualizar pagamento:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Processa um pagamento
 */
export async function processPayment(
  input: ProcessPaymentInput
): Promise<ActionResult<Payment>> {
  try {
    // Validação com Zod
    const validation = processPaymentSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Verificar se o pagamento existe
    const { data: existing, error: fetchError } = await supabase
      .from('payments')
      .select('id, status, unidadeId')
      .eq('id', validatedData.id)
      .single();

    if (fetchError || !existing) {
      return {
        success: false,
        error: 'Pagamento não encontrado'
      };
    }

    if (existing.status !== 'pendente' && existing.status !== 'processando') {
      return {
        success: false,
        error: 'Pagamento não pode ser processado no status atual'
      };
    }

    // Atualizar status do pagamento
    const { data: payment, error } = await supabase
      .from('payments')
      .update({
        status: validatedData.status,
        transactionId: validatedData.transactionId,
        notes: validatedData.notes,
        updatedAt: new Date().toISOString()
      })
      .eq('id', validatedData.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao processar pagamento:', error);
      return {
        success: false,
        error: 'Erro interno ao processar pagamento'
      };
    }

    // Revalidar cache
    revalidatePath('/');
    revalidatePath('/pagamentos');
    revalidatePath(`/pagamentos/${existing.unidadeId}`);

    return {
      success: true,
      data: payment as Payment
    };
  } catch (error) {
    console.error('Erro inesperado ao processar pagamento:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Estorna um pagamento
 */
export async function refundPayment(
  input: RefundPaymentInput
): Promise<ActionResult<Payment>> {
  try {
    // Validação com Zod
    const validation = refundPaymentSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Verificar se o pagamento existe
    const { data: existing, error: fetchError } = await supabase
      .from('payments')
      .select('id, status, amount, unidadeId')
      .eq('id', validatedData.id)
      .single();

    if (fetchError || !existing) {
      return {
        success: false,
        error: 'Pagamento não encontrado'
      };
    }

    if (existing.status !== 'aprovado') {
      return {
        success: false,
        error: 'Apenas pagamentos aprovados podem ser estornados'
      };
    }

    if (validatedData.amount > existing.amount) {
      return {
        success: false,
        error: 'Valor do estorno não pode ser maior que o valor do pagamento'
      };
    }

    // Atualizar status para estornado
    const { data: payment, error } = await supabase
      .from('payments')
      .update({
        status: 'estornado',
        notes: validatedData.reason,
        updatedAt: new Date().toISOString()
      })
      .eq('id', validatedData.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao estornar pagamento:', error);
      return {
        success: false,
        error: 'Erro interno ao estornar pagamento'
      };
    }

    // Revalidar cache
    revalidatePath('/');
    revalidatePath('/pagamentos');
    revalidatePath(`/pagamentos/${existing.unidadeId}`);

    return {
      success: true,
      data: payment as Payment
    };
  } catch (error) {
    console.error('Erro inesperado ao estornar pagamento:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Busca pagamentos com filtros e paginação
 */
export async function searchPayments(
  input: SearchPaymentsInput
): Promise<ActionResultPaginated<PaymentWithDetails>> {
  try {
    // Validação com Zod
    const validation = searchPaymentsSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    let query = supabase
      .from('payments')
      .select(`
        *,
        appointment:appointments(
          id,
          startTime,
          client:clients(id, name),
          professional:professionals(id, name),
          service:services(id, name, price)
        ),
        unidade:unidades(id, name),
        processor:profiles(id, name)
      `, { count: 'exact' })
      .eq('unidadeId', validatedData.unidadeId);

    // Aplicar filtros
    if (validatedData.appointmentId) {
      query = query.eq('appointmentId', validatedData.appointmentId);
    }
    if (validatedData.status) {
      query = query.eq('status', validatedData.status);
    }
    if (validatedData.method) {
      query = query.eq('method', validatedData.method);
    }
    if (validatedData.startDate) {
      query = query.gte('createdAt', validatedData.startDate);
    }
    if (validatedData.endDate) {
      query = query.lte('createdAt', validatedData.endDate);
    }
    if (validatedData.minAmount) {
      query = query.gte('amount', validatedData.minAmount);
    }
    if (validatedData.maxAmount) {
      query = query.lte('amount', validatedData.maxAmount);
    }

    // Aplicar paginação
    const from = (validatedData.page - 1) * validatedData.limit;
    const to = from + validatedData.limit - 1;
    query = query.range(from, to);

    // Ordenar por data de criação (mais recentes primeiro)
    query = query.order('createdAt', { ascending: false });

    const { data: payments, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar pagamentos:', error);
      return {
        success: false,
        error: 'Erro interno ao buscar pagamentos'
      };
    }

    return {
      success: true,
      data: {
        data: (payments || []) as PaymentWithDetails[],
        pagination: {
          page: validatedData.page,
          limit: validatedData.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / validatedData.limit),
        },
      },
    };
  } catch (error) {
    console.error('Erro inesperado ao buscar pagamentos:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Gera relatório de pagamentos
 */
export async function generatePaymentReport(
  input: PaymentReportInput
): Promise<ActionResultStats<{
  date: string;
  total: number;
  count: number;
  byMethod: Record<string, { total: number; count: number }>;
  byStatus: Record<string, { total: number; count: number }>;
}>> {
  try {
    // Validação com Zod
    const validation = paymentReportSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Buscar pagamentos no período
    const { data: payments, error } = await supabase
      .from('payments')
      .select('amount, method, status, createdAt')
      .eq('unidadeId', validatedData.unidadeId)
      .gte('createdAt', validatedData.startDate)
      .lte('createdAt', validatedData.endDate);

    if (error) {
      console.error('Erro ao buscar pagamentos para relatório:', error);
      return {
        success: false,
        error: 'Erro interno ao gerar relatório'
      };
    }

    // Processar dados para o relatório
    const reportData = processPaymentDataForReport(payments || [], validatedData.groupBy);

    return {
      success: true,
      data: {
        total: payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0,
        data: reportData,
        period: {
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
        },
      },
    };
  } catch (error) {
    console.error('Erro inesperado ao gerar relatório:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Obtém um pagamento por ID
 */
export async function getPayment(
  id: string
): Promise<ActionResult<PaymentWithDetails>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID do pagamento é obrigatório'
      };
    }

    const supabase = await createClient();

    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        appointment:appointments(
          id,
          startTime,
          client:clients(id, name),
          professional:professionals(id, name),
          service:services(id, name, price)
        ),
        unidade:unidades(id, name),
        processor:profiles(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Pagamento não encontrado'
        };
      }
      console.error('Erro ao buscar pagamento:', error);
      return {
        success: false,
        error: 'Erro interno ao buscar pagamento'
      };
    }

    return {
      success: true,
      data: payment as PaymentWithDetails
    };
  } catch (error) {
    console.error('Erro inesperado ao buscar pagamento:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Processa dados de pagamentos para o relatório
 */
function processPaymentDataForReport(
  payments: Array<{ amount: number; method: string; status: string; createdAt: string }>,
  groupBy: string
): Array<{
  date: string;
  total: number;
  count: number;
  byMethod: Record<string, { total: number; count: number }>;
  byStatus: Record<string, { total: number; count: number }>;
}> {
  const groupedData: Record<string, {
    total: number;
    count: number;
    byMethod: Record<string, { total: number; count: number }>;
    byStatus: Record<string, { total: number; count: number }>;
  }> = {};

  payments.forEach(payment => {
    let dateKey: string;
    
    switch (groupBy) {
      case 'day':
        dateKey = new Date(payment.createdAt).toISOString().split('T')[0];
        break;
      case 'week':
        const date = new Date(payment.createdAt);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        dateKey = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        dateKey = new Date(payment.createdAt).toISOString().slice(0, 7);
        break;
      default:
        dateKey = new Date(payment.createdAt).toISOString().split('T')[0];
    }

    if (!groupedData[dateKey]) {
      groupedData[dateKey] = {
        total: 0,
        count: 0,
        byMethod: {},
        byStatus: {}
      };
    }

    // Atualizar totais
    groupedData[dateKey].total += payment.amount;
    groupedData[dateKey].count += 1;

    // Atualizar por método
    if (!groupedData[dateKey].byMethod[payment.method]) {
      groupedData[dateKey].byMethod[payment.method] = { total: 0, count: 0 };
    }
    groupedData[dateKey].byMethod[payment.method].total += payment.amount;
    groupedData[dateKey].byMethod[payment.method].count += 1;

    // Atualizar por status
    if (!groupedData[dateKey].byStatus[payment.status]) {
      groupedData[dateKey].byStatus[payment.status] = { total: 0, count: 0 };
    }
    groupedData[dateKey].byStatus[payment.status].total += payment.amount;
    groupedData[dateKey].byStatus[payment.status].count += 1;
  });

  return Object.entries(groupedData).map(([date, data]) => ({
    date,
    ...data
  })).sort((a, b) => a.date.localeCompare(b.date));
}
