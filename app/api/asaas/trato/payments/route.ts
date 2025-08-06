import { NextResponse } from 'next/server';

export async function GET(req) {
  const apiKey = process.env.ASAAS_TRATO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'Chave ASAAS_TRATO_API_KEY não encontrada' }, { status: 400 });
  }

  // Pega os parâmetros de data da query string
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate'); // formato YYYY-MM-DD
  const endDate = searchParams.get('endDate');

  let url = 'https://www.asaas.com/api/v3/payments?status=CONFIRMED&limit=100';
  if (startDate) url += `&paymentDate[gte]=${startDate}`;
  if (endDate) url += `&paymentDate[lte]=${endDate}`;

  try {
    const res = await fetch(url, {
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    const payments = data.data || [];

    // Buscar dados completos do cliente para cada pagamento
    const lista = await Promise.all(payments.map(async (payment) => {
      console.log('🔴 Pagamento bruto recebido:', JSON.stringify(payment, null, 2));
      let customerName = payment.customerName || '';
      let customerEmail = payment.customerEmail || '';
      let customerId = payment.customer;
      let customerData = {};
      // Buscar dados completos do cliente
      if (customerId) {
        try {
          const customerRes = await fetch(`https://www.asaas.com/api/v3/customers/${customerId}`, {
            headers: {
              'access_token': apiKey,
              'Content-Type': 'application/json'
            }
          });
          customerData = await customerRes.json();
          customerName = customerData.name || customerName;
          customerEmail = customerData.email || customerEmail;
        } catch {}
      }
      // Data do pagamento
      const paymentDate = payment.paymentDate || payment.effectiveDate || payment.confirmedDate || payment.dueDate || '';
      // Próx. vencimento: 30 dias após paymentDate
      let nextDueDate = '';
      if (paymentDate) {
        const dt = new Date(paymentDate);
        dt.setDate(dt.getDate() + 30);
        nextDueDate = dt.toISOString().split('T')[0];
      }
      return {
        id: payment.subscription || payment.id,
        customerName: customerName || 'Não informado',
        customerEmail: customerEmail || 'Não informado',
        value: payment.value,
        status: payment.status,
        confirmationDate: paymentDate,
        paymentDate: paymentDate,
        nextDueDate: nextDueDate || 'Não informado',
        billingType: payment.billingType,
        description: payment.description || '',
        source: 'ASAAS_TRATO',
      };
    }));
    console.log('🔵 Lista final de pagantes confirmados:', lista);
    return NextResponse.json({ success: true, total: lista.length, payments: lista });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 