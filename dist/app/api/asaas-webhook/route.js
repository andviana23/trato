import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
function add30Days(dateStr) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
}
export async function POST(req) {
    const body = await req.json();
    // Filtrar apenas eventos de pagamento CONFIRMED
    if (body.event === 'PAYMENT_CONFIRMED' &&
        body.payment &&
        body.payment.status === 'CONFIRMED') {
        const payment = body.payment;
        const customerId = payment.customer;
        const subscriptionId = payment.subscription;
        const description = payment.description;
        const value = payment.value;
        const nextDueDate = payment.nextDueDate || add30Days(payment.date || new Date().toISOString());
        const supabase = createClient();
        // Buscar assinante pelo customer ou subscription
        const { data: assinante, error } = await supabase
            .from('assinantes')
            .select('*')
            .or(`asaas_customer_id.eq.${customerId},asaas_subscription_id.eq.${subscriptionId}`)
            .single();
        if (assinante) {
            // Atualizar status e dados do assinante
            await supabase
                .from('assinantes')
                .update({
                status: 'ATIVO',
                descricao: description,
                valor: value,
                proxima_cobranca: nextDueDate
            })
                .eq('id', assinante.id);
        }
    }
    // Ignorar outros eventos
    return NextResponse.json({ received: true });
}
