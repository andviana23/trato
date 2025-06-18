import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [API] external-payments chamada');
    console.log('🔍 [API] Variáveis de ambiente:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 8) + '...'
    });

    // Buscar pagamentos externos sem join
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('payment_method', 'externo')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    console.log('🔍 [API] Resultado Supabase:', { data, error });

    if (error) {
      console.error('Erro Supabase:', error);
      return NextResponse.json({ success: false, error: 'Erro Supabase', details: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.warn('Nenhum pagamento externo encontrado!');
      return NextResponse.json({ success: true, total: 0, payments: [] });
    }

    // Buscar dados do cliente manualmente para cada pagamento
    const paymentsWithClient = await Promise.all(data.map(async (payment) => {
      let customerName = 'Não informado';
      let customerEmail = 'Não informado';
      if (payment.client_id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('name, email')
          .eq('id', payment.client_id)
          .single();
        if (clientData) {
          customerName = clientData.name || 'Não informado';
          customerEmail = clientData.email || 'Não informado';
        }
      }
      return {
        ...payment,
        customerName,
        customerEmail,
        value: payment.price,
        status: calculateStatus(payment.current_period_end),
        daysOverdue: calculateDaysOverdue(payment.current_period_end)
      };
    }));

    const activePayments = paymentsWithClient.filter(p => p.status === 'ATIVO');

    return NextResponse.json({
      success: true,
      total: activePayments.length,
      payments: paymentsWithClient
    });

  } catch (error) {
    console.error('Erro External Payments:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar pagamentos externos', details: error?.message || error },
      { status: 500 }
    );
  }
}

function calculateStatus(periodEnd: string): 'ATIVO' | 'ATRASADO' {
  const end = new Date(periodEnd);
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff > 0 ? 'ATRASADO' : 'ATIVO';
}

function calculateDaysOverdue(periodEnd: string): number {
  const end = new Date(periodEnd);
  const today = new Date();
  return Math.floor((today.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
} 