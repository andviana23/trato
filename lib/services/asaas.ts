export interface AsaasPayment {
  id: string;
  customer: string;
  customerName: string;
  customerEmail: string;
  customerDocument: string;
  value: number;
  netValue: number;
  originalValue: number;
  status: string;
  dueDate: string;
  paymentDate?: string;
  confirmedDate?: string;
  billingType: string;
  description?: string;
  subscription?: string;
  source: 'ASAAS_TRATO' | 'ASAAS_ANDREY' | 'EXTERNAL';
  nextDueDate?: string;
  lastPaymentDate?: string;
}

export interface AsaasFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  billingType?: string;
  customer?: string;
  limit?: number;
  offset?: number;
}

export interface AsaasRevenueData {
  total: number;
  bySource: {
    asaasTrato: number;
    asaasAndrey: number;
    external: number;
  };
  byMonth: { [key: string]: number };
  byStatus: {
    confirmed: number;
    pending: number;
    overdue: number;
  };
  payments: AsaasPayment[];
}

class AsaasService {
  private baseUrl = 'https://www.asaas.com/api/v3';

  async fetchPayments(account: 'trato' | 'andrey', filters: AsaasFilters = {}): Promise<AsaasPayment[]> {
    const apiKey = account === 'trato' 
      ? process.env.ASAAS_TRATO_API_KEY 
      : process.env.ASAAS_ANDREY_API_KEY;

    if (!apiKey) {
      console.error(`❌ API Key não configurada para ${account}`);
      return [];
    }

    // Filtros básicos
    const paramsBase = new URLSearchParams();
    if (filters.status) paramsBase.append('status', filters.status);
    if (filters.billingType) paramsBase.append('billingType', filters.billingType);
    if (filters.customer) paramsBase.append('customer', filters.customer);
    // limit e offset serão controlados na paginação
    // Filtros de data
    if (filters.startDate) paramsBase.append('dueDate[ge]', filters.startDate);
    if (filters.endDate) paramsBase.append('dueDate[le]', filters.endDate);

    let allPayments: any[] = [];
    let offset = 0;
    const limit = 300;
    let hasMore = true;

    try {
      while (hasMore) {
        const params = new URLSearchParams(paramsBase.toString());
        params.append('limit', limit.toString());
        params.append('offset', offset.toString());

        const response = await fetch(`${this.baseUrl}/payments?${params}`, {
          headers: {
            'access_token': apiKey,
            'Content-Type': 'application/json',
            'User-Agent': 'Barbearia-System/1.0'
          }
        });

        if (!response.ok) {
          throw new Error(`ASAAS API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('🔎 [DEBUG ASAAS] Resposta bruta da API:', JSON.stringify(data, null, 2));
        allPayments = allPayments.concat(data.data);
        hasMore = data.hasMore && data.data.length > 0;
        offset += limit;
      }

      // Processar pagamentos com dados do cliente
      const paymentsWithCustomers = await Promise.all(
        allPayments.map(async (payment: any) => {
          let customerData = null;
          if (payment.customer) {
            try {
              const customerResponse = await fetch(`${this.baseUrl}/customers/${payment.customer}`, {
                headers: {
                  'access_token': apiKey,
                  'Content-Type': 'application/json',
                  'User-Agent': 'Barbearia-System/1.0'
                }
              });
              if (customerResponse.ok) {
                customerData = await customerResponse.json();
              }
            } catch (error) {
              console.error(`Erro ao buscar cliente ${account}:`, error);
            }
          }

          const nextDueDate = this.calculateNextDueDate(payment.confirmedDate || payment.paymentDate);
          const status = this.calculatePaymentStatus(nextDueDate);

          return {
            id: payment.id,
            customer: payment.customer,
            customerName: customerData?.name || payment.customerName || 'Nome não disponível',
            customerEmail: customerData?.email || payment.customerEmail || 'Email não disponível',
            customerDocument: customerData?.cpfCnpj || '',
            value: payment.value,
            netValue: payment.netValue || payment.value,
            originalValue: payment.originalValue || payment.value,
            status: status,
            dueDate: payment.dueDate,
            paymentDate: payment.paymentDate,
            confirmedDate: payment.confirmedDate,
            billingType: payment.billingType,
            description: payment.description,
            subscription: payment.subscription,
            source: account === 'trato' ? 'ASAAS_TRATO' : 'ASAAS_ANDREY' as const,
            nextDueDate,
            lastPaymentDate: payment.confirmedDate || payment.paymentDate
          };
        })
      );

      return paymentsWithCustomers;
    } catch (error) {
      console.error(`Erro ao buscar pagamentos ${account}:`, error);
      return [];
    }
  }

  async getRevenueData(filters: AsaasFilters = {}): Promise<AsaasRevenueData> {
    try {
      // Buscar pagamentos de ambas as contas
      const [tratoPayments, andreyPayments] = await Promise.all([
        this.fetchPayments('trato', filters),
        this.fetchPayments('andrey', filters)
      ]);

      const allPayments = [...tratoPayments, ...andreyPayments];

      // Calcular totais por fonte
      const bySource = {
        asaasTrato: tratoPayments.reduce((sum, p) => sum + p.value, 0),
        asaasAndrey: andreyPayments.reduce((sum, p) => sum + p.value, 0),
        external: 0 // Será calculado separadamente
      };

      // Calcular totais por mês
      const byMonth: { [key: string]: number } = {};
      allPayments.forEach(payment => {
        const date = new Date(payment.lastPaymentDate || payment.paymentDate || payment.dueDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        byMonth[monthKey] = (byMonth[monthKey] || 0) + payment.value;
      });

      // Calcular totais por status
      const byStatus = {
        confirmed: allPayments.filter(p => p.status === 'ATIVO').reduce((sum, p) => sum + p.value, 0),
        pending: allPayments.filter(p => p.status === 'PENDENTE').reduce((sum, p) => sum + p.value, 0),
        overdue: allPayments.filter(p => p.status === 'ATRASADO').reduce((sum, p) => sum + p.value, 0)
      };

      return {
        total: bySource.asaasTrato + bySource.asaasAndrey + bySource.external,
        bySource,
        byMonth,
        byStatus,
        payments: allPayments
      };
    } catch (error) {
      console.error('Erro ao calcular dados de receita:', error);
      return {
        total: 0,
        bySource: { asaasTrato: 0, asaasAndrey: 0, external: 0 },
        byMonth: {},
        byStatus: { confirmed: 0, pending: 0, overdue: 0 },
        payments: []
      };
    }
  }

  async getMonthlyRevenue(year: number, month: number): Promise<AsaasRevenueData> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Último dia do mês

    return this.getRevenueData({
      startDate,
      endDate,
      status: 'CONFIRMED'
    });
  }

  async getYearlyRevenue(year: number): Promise<AsaasRevenueData> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    return this.getRevenueData({
      startDate,
      endDate,
      status: 'CONFIRMED'
    });
  }

  private calculateNextDueDate(lastPaymentDate: string): string {
    const lastPayment = new Date(lastPaymentDate);
    const nextDue = new Date(lastPayment);
    nextDue.setDate(nextDue.getDate() + 30);
    return nextDue.toISOString().split('T')[0];
  }

  private calculatePaymentStatus(nextDueDate: string): 'ATIVO' | 'ATRASADO' | 'PENDENTE' {
    const dueDate = new Date(nextDueDate);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 1) return 'ATRASADO';
    if (daysDiff < 0) return 'PENDENTE';
    return 'ATIVO';
  }
}

export const asaasService = new AsaasService(); 