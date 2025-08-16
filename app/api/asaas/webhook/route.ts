import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// ============================================================================
// CONFIGURAÇÕES DE SEGURANÇA
// ============================================================================

const ASAAS_WEBHOOK_SECRET = process.env.ASAAS_WEBHOOK_SECRET;
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

if (!ASAAS_WEBHOOK_SECRET) {
  throw new Error('ASAAS_WEBHOOK_SECRET não configurado');
}

if (!ASAAS_API_KEY) {
  throw new Error('ASAAS_API_KEY não configurada');
}

// ============================================================================
// TIPOS DE EVENTOS ASAAS
// ============================================================================

type AsaasEventType = 
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DELETED'
  | 'PAYMENT_RESTORED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_RECEIVED_CASHBACK'
  | 'PAYMENT_ANTICIPATED'
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_UPDATED'
  | 'SUBSCRIPTION_DELETED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'SUBSCRIPTION_ACTIVATED'
  | 'SUBSCRIPTION_INACTIVATED'
  | 'SUBSCRIPTION_OVERDUE'
  | 'SUBSCRIPTION_ANTICIPATED';

interface AsaasWebhookPayload {
  event: AsaasEventType;
  payment?: {
    id: string;
    customer: string;
    subscription?: string;
    installment?: string;
    paymentLink?: string;
    value: number;
    netValue: number;
    originalValue?: number;
    interestValue?: number;
    description?: string;
    billingType: string;
    status: string;
    dueDate: string;
    originalDueDate?: string;
    paymentDate?: string;
    clientPaymentDate?: string;
    installmentNumber?: number;
    invoiceUrl?: string;
    bankSlipUrl?: string;
    transactionReceiptUrl?: string;
    discount?: {
      value: number;
      dueDateLimitDays: number;
      type: string;
    };
    interest?: {
      value: number;
    };
    fine?: {
      value: number;
    };
    postalService?: boolean;
    split?: Array<{
      walletId: string;
      fixedValue: number;
      percentualValue: number;
      totalValue: number;
    }>;
  };
  subscription?: {
    id: string;
    customer: string;
    value: number;
    nextDueDate: string;
    cycle: string;
    description?: string;
    status: string;
  };
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    mobilePhone?: string;
    address?: string;
    addressNumber?: string;
    complement?: string;
    province?: string;
    postalCode?: string;
    cpfCnpj?: string;
    personType?: string;
    companyName?: string;
    city?: string;
    state?: string;
    country?: string;
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    phoneCallEnabled?: boolean;
    observations?: string;
    foreign?: boolean;
    additionalEmails?: string;
    municipalInscription?: string;
    stateInscription?: string;
    observations?: string;
  };
}

// ============================================================================
// VALIDAÇÃO DE ASSINATURA
// ============================================================================

/**
 * Valida a assinatura do webhook do ASAAS
 * @param payload - Corpo da requisição
 * @param signature - Assinatura recebida no header
 * @returns true se a assinatura for válida
 */
function validateAsaasSignature(payload: string, signature: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', ASAAS_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Erro ao validar assinatura ASAAS:', error);
    return false;
  }
}

// ============================================================================
// LOGS DE AUDITORIA
// ============================================================================

/**
 * Registra evento de webhook para auditoria
 */
async function logWebhookEvent(
  event: AsaasEventType,
  payload: AsaasWebhookPayload,
  isValid: boolean,
  error?: string
) {
  try {
    const supabase = await createClient();
    
    await supabase
      .from('webhook_logs')
      .insert({
        provider: 'asaas',
        event: event,
        payload: payload,
        isValid: isValid,
        error: error,
        receivedAt: new Date().toISOString(),
        processedAt: new Date().toISOString()
      });
  } catch (error) {
    console.error('Erro ao registrar log de webhook:', error);
  }
}

// ============================================================================
// PROCESSAMENTO DE EVENTOS
// ============================================================================

/**
 * Processa eventos de pagamento recebidos
 */
async function processPaymentEvent(event: AsaasEventType, payload: AsaasWebhookPayload) {
  try {
    const supabase = await createClient();
    
    if (!payload.payment) {
      throw new Error('Payload de pagamento não encontrado');
    }

    const payment = payload.payment;
    
    // Buscar agendamento relacionado ao pagamento
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('asaasPaymentId', payment.id)
      .single();

    if (appointmentError && appointmentError.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar agendamento: ${appointmentError.message}`);
    }

    if (!appointment) {
      console.warn(`Agendamento não encontrado para pagamento ASAAS: ${payment.id}`);
      return;
    }

    // Atualizar status do pagamento no agendamento
    let paymentStatus = 'pending';
    let paymentDate = null;
    let notes = `Evento ASAAS: ${event}`;

    switch (event) {
      case 'PAYMENT_RECEIVED':
        paymentStatus = 'received';
        paymentDate = payment.paymentDate || payment.clientPaymentDate;
        notes = `Pagamento recebido via ${payment.billingType}`;
        break;
        
      case 'PAYMENT_CONFIRMED':
        paymentStatus = 'confirmed';
        paymentDate = payment.paymentDate || payment.clientPaymentDate;
        notes = 'Pagamento confirmado';
        break;
        
      case 'PAYMENT_OVERDUE':
        paymentStatus = 'overdue';
        notes = 'Pagamento em atraso';
        break;
        
      case 'PAYMENT_REFUNDED':
        paymentStatus = 'refunded';
        notes = 'Pagamento estornado';
        break;
        
      case 'PAYMENT_DELETED':
        paymentStatus = 'cancelled';
        notes = 'Pagamento cancelado';
        break;
        
      default:
        paymentStatus = 'pending';
        notes = `Status atualizado: ${event}`;
    }

    // Atualizar agendamento
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        paymentStatus: paymentStatus,
        paymentDate: paymentDate,
        paymentValue: payment.value / 100, // ASAAS envia em centavos
        paymentNotes: notes,
        updatedAt: new Date().toISOString()
      })
      .eq('id', appointment.id);

    if (updateError) {
      throw new Error(`Erro ao atualizar agendamento: ${updateError.message}`);
    }

    // Se o pagamento foi confirmado, atualizar status do agendamento
    if (event === 'PAYMENT_CONFIRMED' && appointment.status === 'pendente') {
      const { error: statusError } = await supabase
        .from('appointments')
        .update({
          status: 'confirmado',
          updatedAt: new Date().toISOString()
        })
        .eq('id', appointment.id);

      if (statusError) {
        console.error('Erro ao atualizar status do agendamento:', statusError);
      }
    }

    console.log(`Evento de pagamento processado: ${event} para agendamento ${appointment.id}`);
    
  } catch (error) {
    console.error('Erro ao processar evento de pagamento:', error);
    throw error;
  }
}

/**
 * Processa eventos de assinatura
 */
async function processSubscriptionEvent(event: AsaasEventType, payload: AsaasWebhookPayload) {
  try {
    const supabase = await createClient();
    
    if (!payload.subscription) {
      throw new Error('Payload de assinatura não encontrado');
    }

    const subscription = payload.subscription;
    
    // Buscar assinatura relacionada
    const { data: existingSubscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('asaasSubscriptionId', subscription.id)
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar assinatura: ${subscriptionError.message}`);
    }

    if (!existingSubscription) {
      console.warn(`Assinatura não encontrada: ${subscription.id}`);
      return;
    }

    // Atualizar status da assinatura
    let status = 'active';
    let notes = `Evento ASAAS: ${event}`;

    switch (event) {
      case 'SUBSCRIPTION_ACTIVATED':
        status = 'active';
        notes = 'Assinatura ativada';
        break;
        
      case 'SUBSCRIPTION_CANCELLED':
        status = 'cancelled';
        notes = 'Assinatura cancelada';
        break;
        
      case 'SUBSCRIPTION_INACTIVATED':
        status = 'inactive';
        notes = 'Assinatura inativada';
        break;
        
      case 'SUBSCRIPTION_OVERDUE':
        status = 'overdue';
        notes = 'Assinatura em atraso';
        break;
        
      default:
        status = existingSubscription.status;
        notes = `Status atualizado: ${event}`;
    }

    // Atualizar assinatura
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: status,
        nextDueDate: subscription.nextDueDate,
        notes: notes,
        updatedAt: new Date().toISOString()
      })
      .eq('id', existingSubscription.id);

    if (updateError) {
      throw new Error(`Erro ao atualizar assinatura: ${updateError.message}`);
    }

    console.log(`Evento de assinatura processado: ${event} para assinatura ${existingSubscription.id}`);
    
  } catch (error) {
    console.error('Erro ao processar evento de assinatura:', error);
    throw error;
  }
}

// ============================================================================
// ROTA PRINCIPAL DO WEBHOOK
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Obter corpo da requisição
    const body = await request.text();
    const signature = request.headers.get('asaas-access-token');

    if (!signature) {
      console.error('Assinatura ASAAS não fornecida');
      await logWebhookEvent('UNKNOWN' as AsaasEventType, {} as AsaasWebhookPayload, false, 'Assinatura não fornecida');
      return NextResponse.json(
        { error: 'Assinatura não fornecida' },
        { status: 401 }
      );
    }

    // Validar assinatura
    const isValidSignature = validateAsaasSignature(body, signature);
    
    if (!isValidSignature) {
      console.error('Assinatura ASAAS inválida');
      await logWebhookEvent('UNKNOWN' as AsaasEventType, {} as AsaasWebhookPayload, false, 'Assinatura inválida');
      return NextResponse.json(
        { error: 'Assinatura inválida' },
        { status: 401 }
      );
    }

    // Parse do payload
    let payload: AsaasWebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      console.error('Erro ao fazer parse do payload:', error);
      await logWebhookEvent('UNKNOWN' as AsaasEventType, {} as AsaasWebhookPayload, false, 'Payload inválido');
      return NextResponse.json(
        { error: 'Payload inválido' },
        { status: 400 }
      );
    }

    // Registrar evento para auditoria
    await logWebhookEvent(payload.event, payload, true);

    // Processar evento baseado no tipo
    try {
      if (payload.event.startsWith('PAYMENT_')) {
        await processPaymentEvent(payload.event, payload);
      } else if (payload.event.startsWith('SUBSCRIPTION_')) {
        await processSubscriptionEvent(payload.event, payload);
      } else {
        console.log(`Evento não processado: ${payload.event}`);
      }
    } catch (processError) {
      console.error(`Erro ao processar evento ${payload.event}:`, processError);
      await logWebhookEvent(payload.event, payload, false, `Erro de processamento: ${processError}`);
      
      // Retornar erro 500 para que o ASAAS reenvie o webhook
      return NextResponse.json(
        { error: 'Erro interno ao processar evento' },
        { status: 500 }
      );
    }

    // Retornar sucesso
    return NextResponse.json({ success: true, message: 'Webhook processado com sucesso' });

  } catch (error) {
    console.error('Erro geral no webhook ASAAS:', error);
    
    // Registrar erro para auditoria
    await logWebhookEvent('UNKNOWN' as AsaasEventType, {} as AsaasWebhookPayload, false, `Erro geral: ${error}`);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ============================================================================
// ROTA GET PARA VERIFICAÇÃO DE SAÚDE
// ============================================================================

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    provider: 'asaas',
    timestamp: new Date().toISOString(),
    message: 'Webhook ASAAS funcionando corretamente'
  });
}
