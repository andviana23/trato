import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('external_payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calcular status baseado na data do último pagamento
    const paymentsWithStatus = data.map(payment => ({
      ...payment,
      status: calculateStatus(payment.last_payment_date),
      daysOverdue: calculateDaysOverdue(payment.last_payment_date)
    }));

    const activePayments = paymentsWithStatus.filter(p => p.status === 'ATIVO');

    return NextResponse.json({
      success: true,
      total: activePayments.length,
      payments: paymentsWithStatus
    });

  } catch (error) {
    console.error('Erro External Payments:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar pagamentos externos' },
      { status: 500 }
    );
  }
}

function calculateStatus(lastPaymentDate: string): 'ATIVO' | 'ATRASADO' {
  const lastPayment = new Date(lastPaymentDate);
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff > 30 ? 'ATRASADO' : 'ATIVO';
}

function calculateDaysOverdue(lastPaymentDate: string): number {
  const lastPayment = new Date(lastPaymentDate);
  const today = new Date();
  return Math.floor((today.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24));
} 