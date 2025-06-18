import { NextRequest, NextResponse } from 'next/server';

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
    
    const params = new URLSearchParams({
      status: 'CONFIRMED',
      limit: '50',
      offset: '0'
    });

    const response = await fetch(`https://www.asaas.com/api/v3/payments?${params}`, {
      method: 'GET',
      headers: {
        'access_token': process.env.ASAAS_TRATO_API_KEY!,
        'Content-Type': 'application/json',
        'User-Agent': 'Barbearia-System/1.0'
      }
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ASAAS Error:', response.status, errorText);
      throw new Error(`ASAAS API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // BUSCAR DADOS COMPLETOS DO CLIENTE PARA CADA PAGAMENTO
    const paymentsWithCustomers = await Promise.all(
      data.data.map(async (payment: any) => {
        let customerData = null;
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
        const nextDueDate = calculateNextDueDate(payment.confirmedDate || payment.paymentDate);
        const status = calculatePaymentStatus(nextDueDate);
        return {
          id: payment.id,
          customerName: customerData?.name || payment.customerName || 'Nome não disponível',
          customerEmail: customerData?.email || payment.customerEmail || 'Email não disponível',
          customerDocument: customerData?.cpfCnpj || '',
          value: payment.value,
          lastPaymentDate: payment.confirmedDate || payment.paymentDate,
          nextDueDate: nextDueDate,
          status: status,
          billingType: payment.billingType,
          description: payment.description,
          originalPayment: payment, // Para debug
          source: 'ASAAS_TRATO'
        };
      })
    );

    // REMOVER DUPLICADOS baseado no ID do pagamento
    const uniquePayments = paymentsWithCustomers.filter((payment, index, self) => 
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