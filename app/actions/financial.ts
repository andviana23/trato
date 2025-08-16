'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit';
import type { PaymentWebhookData } from '@/lib/queue/financialJobs';
import type { 
  LancamentoContabilInsert, 
  ContaContabil,
  NovoLancamentoContabil 
} from '@/lib/types/financial';

// ============================================================================
// TIPOS DE DADOS
// ============================================================================

export interface AutomaticRevenueResult {
  id: string;
  payment_id: string;
  customer_id: string;
  value: number;
  description: string;
  lancamento_id: string;
  created_at: string;
}

export interface RevenueProcessingError {
  code: string;
  message: string;
  details?: any;
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Processa receita automática a partir de webhook de pagamento ASAAS
 * Esta função é chamada pelo worker da fila BullMQ
 */
export async function processAutomaticRevenue(
  paymentData: PaymentWebhookData
): Promise<{ success: true; data: AutomaticRevenueResult } | { success: false; error: string }> {
  try {
    console.log(`🔄 Processando receita automática para pagamento ${paymentData.payment.id}`);
    
    const supabase = await createClient();
    
    // 1. Verificar se a receita já foi processada (evitar duplicatas)
    const { data: existingRevenue, error: checkError } = await supabase
      .from('receitas_automaticas')
      .select('id')
      .eq('payment_id', paymentData.payment.id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = não encontrado
      console.error('❌ Erro ao verificar receita existente:', checkError);
      return { success: false, error: 'Erro ao verificar receita existente' };
    }
    
    if (existingRevenue) {
      console.log(`⚠️ Receita já processada para pagamento ${paymentData.payment.id}`);
      return { success: false, error: 'Receita já processada para este pagamento' };
    }
    
    // 2. Buscar conta contábil padrão para receitas
    const { data: contaReceita, error: contaError } = await supabase
      .from('contas_contabeis')
      .select('id, codigo, nome')
      .eq('codigo', '4.1.1.1') // Código padrão para "RECEITA DE SERVIÇOS"
      .eq('ativo', true)
      .single();
    
    if (contaError || !contaReceita) {
      console.error('❌ Conta contábil padrão não encontrada:', contaError);
      return { success: false, error: 'Conta contábil padrão não encontrada' };
    }
    
    // 3. Buscar conta contábil para caixa/bancos
    const { data: contaCaixa, error: caixaError } = await supabase
      .from('contas_contabeis')
      .select('id, codigo, nome')
      .eq('codigo', '1.1.1.1') // Código padrão para "CAIXA"
      .eq('ativo', true)
      .single();
    
    if (caixaError || !contaCaixa) {
      console.error('❌ Conta contábil de caixa não encontrada:', caixaError);
      return { success: false, error: 'Conta contábil de caixa não encontrada' };
    }
    
    // 4. Buscar cliente pelo customer ID do ASAAS
    const { data: cliente, error: clienteError } = await supabase
      .from('clients')
      .select('id, nome, asaas_customer_id')
      .eq('asaas_customer_id', paymentData.payment.customer)
      .single();
    
    if (clienteError && clienteError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar cliente:', clienteError);
      return { success: false, error: 'Erro ao buscar cliente' };
    }
    
    // 5. Criar lançamento contábil
    const lancamentoData: LancamentoContabilInsert = {
      data_lancamento: paymentData.payment.date,
      data_competencia: paymentData.payment.date,
      numero_documento: `ASAAS-${paymentData.payment.id}`,
      historico: `Receita automática: ${paymentData.payment.description}`,
      valor: paymentData.payment.value / 100, // ASAAS envia em centavos
      tipo_lancamento: 'credito',
      conta_debito_id: contaCaixa.id, // Débito em caixa
      conta_credito_id: contaReceita.id, // Crédito em receita
      unidade_id: 'trato', // Unidade padrão
      cliente_id: cliente?.id,
      status: 'confirmado',
      created_by: 'system', // Sistema automático
    };
    
    const { data: lancamento, error: lancamentoError } = await supabase
      .from('lancamentos_contabeis')
      .insert(lancamentoData)
      .select('id')
      .single();
    
    if (lancamentoError || !lancamento) {
      console.error('❌ Erro ao criar lançamento contábil:', lancamentoError);
      return { success: false, error: 'Erro ao criar lançamento contábil' };
    }
    
    // 6. Criar registro de receita automática
    const receitaData = {
      payment_id: paymentData.payment.id,
      customer_id: paymentData.payment.customer,
      subscription_id: paymentData.payment.subscription,
      value: paymentData.payment.value / 100,
      description: paymentData.payment.description,
      billing_type: paymentData.payment.billingType,
      invoice_url: paymentData.payment.invoiceUrl,
      transaction_receipt_url: paymentData.payment.transactionReceiptUrl,
      lancamento_id: lancamento.id,
      unidade_id: 'trato',
      status: 'processado',
      webhook_data: paymentData,
      created_at: new Date().toISOString(),
    };
    
    const { data: receita, error: receitaError } = await supabase
      .from('receitas_automaticas')
      .insert(receitaData)
      .select('id, payment_id, customer_id, value, description, lancamento_id, created_at')
      .single();
    
    if (receitaError || !receita) {
      console.error('❌ Erro ao criar registro de receita:', receitaError);
      
      // Tentar reverter o lançamento contábil
      await supabase
        .from('lancamentos_contabeis')
        .delete()
        .eq('id', lancamento.id);
      
      return { success: false, error: 'Erro ao criar registro de receita' };
    }
    
    // 7. Log de auditoria
    try {
      await logAuditEvent(
        {
          userId: 'system',
          userEmail: 'system@trato.com',
          userRole: 'system',
          ipAddress: '127.0.0.1',
          userAgent: 'ASAAS Webhook Processor',
          sessionId: paymentData.webhookId,
        },
        'FINANCIAL_REVENUE_CREATED',
        'FINANCIAL',
        {
          paymentId: paymentData.payment.id,
          customerId: paymentData.payment.customer,
          value: paymentData.payment.value / 100,
          description: paymentData.payment.description,
          lancamentoId: lancamento.id,
          receitaId: receita.id,
        }
      );
    } catch (auditError) {
      console.warn('⚠️ Erro ao registrar log de auditoria:', auditError);
      // Não falhar o processo por erro de auditoria
    }
    
    // 8. Revalidar cache
    revalidatePath('/relatorios/financeiro');
    revalidatePath('/dashboard');
    
    console.log(`✅ Receita automática processada com sucesso: ${receita.id}`);
    
    const result: AutomaticRevenueResult = {
      id: receita.id,
      payment_id: receita.payment_id,
      customer_id: receita.customer_id,
      value: receita.value,
      description: receita.description,
      lancamento_id: receita.lancamento_id,
      created_at: receita.created_at,
    };
    
    return { success: true, data: result };
    
  } catch (error) {
    console.error('❌ Erro inesperado ao processar receita automática:', error);
    
    // Log de auditoria de erro
    try {
      await logAuditEvent(
        {
          userId: 'system',
          userEmail: 'system@trato.com',
          userRole: 'system',
          ipAddress: '127.0.0.1',
          userAgent: 'ASAAS Webhook Processor',
          sessionId: paymentData.webhookId,
        },
        'FINANCIAL_REVENUE_PROCESSING_ERROR',
        'FINANCIAL',
        {
          paymentId: paymentData.payment.id,
          customerId: paymentData.payment.customer,
          value: paymentData.payment.value,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        }
      );
    } catch (auditError) {
      console.error('❌ Erro ao registrar log de auditoria de erro:', auditError);
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro inesperado ao processar receita' 
    };
  }
}

/**
 * Busca receitas automáticas processadas
 */
export async function getAutomaticRevenues(
  filters: {
    payment_id?: string;
    customer_id?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    unidade_id?: string;
  } = {},
  page: number = 1,
  limit: number = 20
): Promise<{ success: true; data: AutomaticRevenueResult[]; total: number } | { success: false; error: string }> {
  try {
    const supabase = await createClient();
    
    let query = supabase
      .from('receitas_automaticas')
      .select('id, payment_id, customer_id, value, description, lancamento_id, created_at, status', { count: 'exact' });
    
    // Aplicar filtros
    if (filters.payment_id) {
      query = query.eq('payment_id', filters.payment_id);
    }
    
    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    
    if (filters.unidade_id) {
      query = query.eq('unidade_id', filters.unidade_id);
    }
    
    // Paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    
    // Ordenação
    query = query.order('created_at', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('❌ Erro ao buscar receitas automáticas:', error);
      return { success: false, error: 'Erro ao buscar receitas automáticas' };
    }
    
    const results: AutomaticRevenueResult[] = data.map(item => ({
      id: item.id,
      payment_id: item.payment_id,
      customer_id: item.customer_id,
      value: item.value,
      description: item.description,
      lancamento_id: item.lancamento_id,
      created_at: item.created_at,
    }));
    
    return { 
      success: true, 
      data: results, 
      total: count || 0 
    };
    
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar receitas automáticas:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro inesperado ao buscar receitas' 
    };
  }
}

/**
 * Reprocessa um lote de receitas automáticas
 * Útil para correções ou reprocessamento em massa
 */
export async function recalculateAutomaticRevenues(
  filters: {
    payment_id?: string;
    customer_id?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
  } = {}
): Promise<{ success: true; data: { processed: number; errors: number } } | { success: false; error: string }> {
  try {
    console.log('🔄 Iniciando reprocessamento de receitas automáticas');
    
    const supabase = await createClient();
    
    // Buscar receitas para reprocessar
    let query = supabase
      .from('receitas_automaticas')
      .select('id, payment_id, customer_id, value, description, lancamento_id, webhook_data, status');
    
    // Aplicar filtros
    if (filters.payment_id) {
      query = query.eq('payment_id', filters.payment_id);
    }
    
    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    
    const { data: receitas, error } = await query;
    
    if (error) {
      console.error('❌ Erro ao buscar receitas para reprocessar:', error);
      return { success: false, error: 'Erro ao buscar receitas para reprocessar' };
    }
    
    if (!receitas || receitas.length === 0) {
      return { success: true, data: { processed: 0, errors: 0 } };
    }
    
    let processed = 0;
    let errors = 0;
    
    // Reprocessar cada receita
    for (const receita of receitas) {
      try {
        if (receita.webhook_data) {
          // Reprocessar usando dados do webhook
          const result = await processAutomaticRevenue(receita.webhook_data);
          
          if (result.success) {
            // Atualizar status
            await supabase
              .from('receitas_automaticas')
              .update({ 
                status: 'reprocessado',
                updated_at: new Date().toISOString()
              })
              .eq('id', receita.id);
            
            processed++;
            console.log(`✅ Receita ${receita.id} reprocessada com sucesso`);
          } else {
            errors++;
            console.error(`❌ Erro ao reprocessar receita ${receita.id}:`, result.error);
          }
        } else {
          errors++;
          console.error(`❌ Receita ${receita.id} sem dados do webhook`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Erro ao reprocessar receita ${receita.id}:`, error);
      }
    }
    
    console.log(`✅ Reprocessamento concluído: ${processed} processadas, ${errors} erros`);
    
    return { 
      success: true, 
      data: { processed, errors } 
    };
    
  } catch (error) {
    console.error('❌ Erro inesperado ao reprocessar receitas:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro inesperado ao reprocessar receitas' 
    };
  }
}

/**
 * Obtém estatísticas das receitas automáticas
 */
export async function getAutomaticRevenueStats(
  unidade_id: string = 'trato'
): Promise<{ success: true; data: any } | { success: false; error: string }> {
  try {
    const supabase = await createClient();
    
    // Total de receitas processadas
    const { count: total, error: totalError } = await supabase
      .from('receitas_automaticas')
      .select('*', { count: 'exact', head: true })
      .eq('unidade_id', unidade_id);
    
    if (totalError) {
      console.error('❌ Erro ao contar receitas:', totalError);
      return { success: false, error: 'Erro ao contar receitas' };
    }
    
    // Valor total processado
    const { data: valorData, error: valorError } = await supabase
      .from('receitas_automaticas')
      .select('value')
      .eq('unidade_id', unidade_id)
      .eq('status', 'processado');
    
    if (valorError) {
      console.error('❌ Erro ao calcular valor total:', valorError);
      return { success: false, error: 'Erro ao calcular valor total' };
    }
    
    const valorTotal = valorData?.reduce((sum, item) => sum + (item.value || 0), 0) || 0;
    
    // Receitas por status
    const { data: statusData, error: statusError } = await supabase
      .from('receitas_automaticas')
      .select('status')
      .eq('unidade_id', unidade_id);
    
    if (statusError) {
      console.error('❌ Erro ao buscar status:', statusError);
      return { success: false, error: 'Erro ao buscar status' };
    }
    
    const statusCounts = statusData?.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    // Receitas por período (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count: recentCount, error: recentError } = await supabase
      .from('receitas_automaticas')
      .select('*', { count: 'exact', head: true })
      .eq('unidade_id', unidade_id)
      .gte('created_at', thirtyDaysAgo.toISOString());
    
    if (recentError) {
      console.error('❌ Erro ao contar receitas recentes:', recentError);
      return { success: false, error: 'Erro ao contar receitas recentes' };
    }
    
    const stats = {
      total: total || 0,
      valor_total: valorTotal,
      por_status: statusCounts,
      ultimos_30_dias: recentCount || 0,
      unidade_id,
      timestamp: new Date().toISOString(),
    };
    
    return { success: true, data: stats };
    
  } catch (error) {
    console.error('❌ Erro inesperado ao obter estatísticas:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro inesperado ao obter estatísticas' 
    };
  }
}
