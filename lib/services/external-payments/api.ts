import { createClient } from '@/lib/supabase/client';
import { ExternalPayment } from './types';

export class ExternalPaymentsService {
  async getExternalCustomers(): Promise<ExternalPayment[]> {
    const supabase = createClient();
    const { data } = await supabase
      .from('external_payments')
      .select('*');

    return (
      data?.map((payment) => ({
        ...payment,
        status: this.calculateStatus(payment.lastPaymentDate),
      })) || []
    );
  }

  private calculateStatus(lastPaymentDate: string): 'ATIVO' | 'ATRASADO' {
    const lastPayment = new Date(lastPaymentDate);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24));
    // Atrasado após 30 dias do último pagamento
    return daysDiff > 30 ? 'ATRASADO' : 'ATIVO';
  }
} 