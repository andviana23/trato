import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Buscando pagamentos ASAAS Andrey...');
    
    const params = new URLSearchParams({
      status: 'CONFIRMED',
      limit: '300',
      offset: '0'
    });

    const response = await fetch(`https://www.asaas.com/api/v3/payments?${params}`, {
      method: 'GET',
      headers: {
        'access_token': process.env.ASAAS_ANDREY_API_KEY!,
        'Content-Type': 'application/json',
        'User-Agent': 'Barbearia-System/1.0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ASAAS API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // BUSCAR DADOS COMPLETOS DO CLIENTE PARA CADA PAGAMENTO (IGUAL AO TRATO)
    const paymentsWithCustomers = await Promise.all(
      data.data.map(async (payment: any) => {
        let customerData = null;
        // Buscar dados do cliente se tiver ID
        if (payment.customer) {
          try {
            const customerResponse = await fetch(`https://www.asaas.com/api/v3/customers/${payment.customer}`, {
              headers: {
                'access_token': process.env.ASAAS_ANDREY_API_KEY!,
                'Content-Type': 'application/json',
                'User-Agent': 'Barbearia-System/1.0'
              }
            });
            if (customerResponse.ok) {
              customerData = await customerResponse.json();
              console.log('✅ Cliente ANDREY encontrado:', customerData.name);
            } else {
              console.log('❌ Cliente ANDREY não encontrado:', payment.customer);
            }
          } catch (error) {
            console.error('Erro ao buscar cliente ANDREY:', payment.customer, error);
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
          source: 'ASAAS_ANDREY'
        };
      })
    );

    // REMOVER DUPLICADOS baseado no ID do pagamento
    const uniquePayments = paymentsWithCustomers.filter((payment, index, self) => 
      index === self.findIndex(p => p.id === payment.id)
    );

    const activePayments = uniquePayments.filter(p => p.status === 'ATIVO');

    console.log('📊 ASAAS Andrey - Pagamentos processados:', {
      total: uniquePayments.length,
      ativos: activePayments.length,
      exemplos: uniquePayments.slice(0, 3).map(p => ({
        id: p.id,
        nome: p.customerName,
        email: p.customerEmail
      }))
    });

    return NextResponse.json({
      success: true,
      total: activePayments.length,
      totalConfirmed: uniquePayments.length,
      payments: uniquePayments
    });

  } catch (error: any) {
    console.error('💥 Erro ASAAS Andrey:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar pagamentos ASAAS Andrey',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

function calculateNextDueDate(lastPaymentDate: string): string {
  const lastPayment = new Date(lastPaymentDate);
  const nextDue = new Date(lastPayment);
  nextDue.setDate(nextDue.getDate() + 30);
  return nextDue.toISOString().split('T')[0];
}

function calculatePaymentStatus(nextDueDate: string): 'ATIVO' | 'ATRASADO' {
  const dueDate = new Date(nextDueDate);
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff > 1 ? 'ATRASADO' : 'ATIVO';
} 