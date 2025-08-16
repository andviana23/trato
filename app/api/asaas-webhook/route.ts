import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { financialRevenueQueue } from '@/lib/queue/financialJobs';

function add30Days(dateStr: string) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Filtrar apenas eventos de pagamento CONFIRMED
    if (
      body.event === 'PAYMENT_CONFIRMED' &&
      body.payment &&
      body.payment.status === 'CONFIRMED'
    ) {
      const payment = body.payment;
      
      // Criar payload para o job da fila
      const jobPayload = {
        event: body.event,
        payment: {
          id: payment.id,
          customer: payment.customer,
          subscription: payment.subscription,
          description: payment.description,
          value: payment.value,
          date: payment.date,
          nextDueDate: payment.nextDueDate || add30Days(payment.date || new Date().toISOString()),
          billingType: payment.billingType,
          invoiceUrl: payment.invoiceUrl,
          transactionReceiptUrl: payment.transactionReceiptUrl
        },
        timestamp: new Date().toISOString(),
        webhookId: body.id || `webhook_${Date.now()}`
      };

      // Adicionar job à fila de processamento financeiro
      await financialRevenueQueue.add('process-payment', jobPayload, {
        priority: 1, // Prioridade alta para pagamentos confirmados
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      });

      console.log(`✅ Job adicionado à fila para pagamento ${payment.id}`);
    }

    // Retornar sucesso imediatamente após adicionar à fila
    return NextResponse.json({ 
      received: true, 
      message: 'Webhook processado e adicionado à fila de processamento',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao processar webhook ASAAS:', error);
    
    // Retornar erro, mas não falhar completamente
    return NextResponse.json(
      { 
        received: false, 
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 