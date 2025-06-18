import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// Definir tipo para pagamentos ASAAS
interface AsaasPayment {
  id: string;
  customer: string;
  customerName?: string;
  customerEmail?: string;
  value: number;
  confirmedDate?: string;
  paymentDate?: string;
  subscription?: string;
  billingType: string;
  description?: string;
  // outros campos relevantes se necessário
}

export async function GET(request: NextRequest) {
  console.log('🔑 API Key preview:', process.env.ASAAS_TRATO_API_KEY?.substring(0, 20) + '...');
  
  if (!process.env.ASAAS_TRATO_API_KEY) {
    console.error('❌ ASAAS_TRATO_API_KEY não configurada');
    return NextResponse.json(
      { success: false, error: 'ASAAS_TRATO_API_KEY não configurada' },
      { status: 500 }
    );
  }

  try {
    console.log('🔄 Buscando pagamentos ASAAS Trato...');
    
    // Paginação: buscar todas as páginas
    let allPayments: AsaasPayment[] = [];
    let offset = 0;
    let hasMore = true;
    const limit = 300;
    while (hasMore) {
      const params = new URLSearchParams({
        status: 'CONFIRMED',
        limit: String(limit),
        offset: String(offset)
      });
      const response = await fetch(`https://www.asaas.com/api/v3/payments?${params}`, {
        method: 'GET',
        headers: {
          'access_token': process.env.ASAAS_TRATO_API_KEY!,
          'Content-Type': 'application/json',
          'User-Agent': 'Barbearia-System/1.0'
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ASAAS API Error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      console.log(`Página offset ${offset}: trouxe ${data.data.length} pagamentos (totalCount: ${data.totalCount})`);
      allPayments = allPayments.concat(data.data as AsaasPayment[]);
      console.log(`Total acumulado até agora: ${allPayments.length}`);
      if (!data.data || data.data.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    // BUSCAR DADOS COMPLETOS DO CLIENTE E ASSINATURA PARA CADA PAGAMENTO
    const paymentsWithDetails = await Promise.all(
      allPayments.map(async (payment: AsaasPayment) => {
        let customerData = null;
        let subscriptionData = null;
        // Buscar dados do cliente se tiver ID
        if (payment.customer) {
          try {
            const customerResponse = await fetch(`https://www.asaas.com/api/v3/customers/${payment.customer}`, {
              headers: {
                'access_token': process.env.ASAAS_TRATO_API_KEY!,
                'Content-Type': 'application/json',
                'User-Agent': 'Barbearia-System/1.0'
              }
            });
            if (customerResponse.ok) {
              customerData = await customerResponse.json();
            }
          } catch (error) {
            console.error('Erro ao buscar cliente:', payment.customer, error);
          }
        }
        // Buscar dados da assinatura se houver
        if (payment.subscription) {
          try {
            const subscriptionResponse = await fetch(`https://www.asaas.com/api/v3/subscriptions/${payment.subscription}`, {
              headers: {
                'access_token': process.env.ASAAS_TRATO_API_KEY!,
                'Content-Type': 'application/json',
                'User-Agent': 'Barbearia-System/1.0'
              }
            });
            if (subscriptionResponse.ok) {
              subscriptionData = await subscriptionResponse.json();
            }
          } catch (error) {
            console.error('Erro ao buscar assinatura:', payment.subscription, error);
          }
        }
        const nextDueDate = calculateNextDueDate(payment.confirmedDate || payment.paymentDate);
        const status = calculatePaymentStatus(nextDueDate);

        // Consultar status local no Supabase
        let statusLocal = null;
        if (payment.subscription) {
          try {
            const { data: localData, error: localError } = await supabase
              .from('subscriptions')
              .select('status')
              .eq('asaas_subscription_id', payment.subscription)
              .maybeSingle();
            if (!localError && localData && localData.status) {
              statusLocal = localData.status;
            }
          } catch (e) {
            console.error('Erro ao consultar status local Supabase:', e);
          }
        }

        // Se status local for CANCELADA, sobrescrever
        let statusFinal = statusLocal && statusLocal.toUpperCase() === 'CANCELADA' ? 'CANCELADA' : (subscriptionData?.status || status);
        // Padronizar status para português
        if (statusFinal === 'ACTIVE') statusFinal = 'ATIVO';
        if (statusFinal === 'OVERDUE') statusFinal = 'ATRASADO';
        if (statusFinal === 'INACTIVE') statusFinal = 'INATIVO';

        return {
          id: payment.id,
          customerName: customerData?.name || payment.customerName || 'Nome não disponível',
          customerEmail: customerData?.email || payment.customerEmail || 'Email não disponível',
          customerDocument: customerData?.cpfCnpj || '',
          value: payment.value,
          lastPaymentDate: payment.confirmedDate || payment.paymentDate,
          nextDueDate: nextDueDate,
          status: statusFinal,
          billingType: payment.billingType,
          description: payment.description,
          originalPayment: payment, // Para debug
          source: 'ASAAS_TRATO',
          // Novos campos para integração ASAAS
          asaas_subscription_id: payment.subscription || subscriptionData?.id || null,
          asaas_customer_id: payment.customer || customerData?.id || null,
          plan_name: subscriptionData?.description || payment.description || null,
          plan_value: subscriptionData?.value || payment.value || null,
          plan_status: subscriptionData?.status || null,
          plan_cycle: subscriptionData?.cycle || null,
          plan_created_at: subscriptionData?.dateCreated || null,
          plan_next_due_date: subscriptionData?.nextDueDate || null
        };
      })
    );

    // REMOVER DUPLICADOS baseado no ID do pagamento
    const uniquePayments = paymentsWithDetails.filter((payment, index, self) => 
      index === self.findIndex(p => p.id === payment.id)
    );

    const activePayments = uniquePayments.filter(p => p.status === 'ATIVO');

    console.log('📊 Pagamentos processados:', {
      total: uniquePayments.length,
      ativos: activePayments.length,
      exemplos: uniquePayments.slice(0, 3).map(p => ({
        id: p.id,
        nome: p.customerName,
        email: p.customerEmail
      }))
    });
    console.log('🐛 DEBUG - Primeiros 3 pagamentos:', 
      uniquePayments.slice(0, 3).map(p => ({
        id: p.id,
        customerName: p.customerName,
        customerEmail: p.customerEmail,
        value: p.value,
        source: p.source
      }))
    );

    return NextResponse.json({
      success: true,
      total: activePayments.length,
      totalConfirmed: uniquePayments.length,
      payments: uniquePayments
    });

  } catch (error: any) {
    console.error('💥 Erro ASAAS Trato:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar pagamentos ASAAS Trato',
        details: error.message
      },
      { status: 500 }
    );
  }
}

function calculateNextDueDate(lastPaymentDate: string): string {
  const lastPayment = new Date(lastPaymentDate);
  const nextDue = new Date(lastPayment);
  // Adicionar 30 dias (ciclo mensal padrão)
  nextDue.setDate(nextDue.getDate() + 30);
  return nextDue.toISOString().split('T')[0]; // Formato YYYY-MM-DD
}

function calculatePaymentStatus(nextDueDate: string): 'ATIVO' | 'ATRASADO' {
  const dueDate = new Date(nextDueDate);
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  // Atrasado se passou mais de 1 dia do vencimento
  return daysDiff > 1 ? 'ATRASADO' : 'ATIVO';
} 