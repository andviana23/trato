import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch('https://www.asaas.com/api/v3/customers', {
      method: 'GET',
      headers: {
        'access_token': process.env.ASAAS_TRATO_API_KEY!,
        'Content-Type': 'application/json',
        'User-Agent': 'Sistema Barbearia v1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`ASAAS API Error: ${response.status}`);
    }

    const data = await response.json();

    // Filtrar apenas clientes ativos (em dia com pagamento)
    const activeCustomers = data.data.filter((customer: any) => {
      return isCustomerActive(customer);
    });

    return NextResponse.json({
      success: true,
      total: activeCustomers.length,
      customers: activeCustomers
    });

  } catch (error) {
    console.error('Erro ASAAS Trato:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar clientes ASAAS Trato' },
      { status: 500 }
    );
  }
}

function isCustomerActive(customer: any): boolean {
  const subscription = customer.subscriptions?.[0];
  if (!subscription) return false;

  const nextDueDate = new Date(subscription.nextDueDate);
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - nextDueDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff <= 1;
} 