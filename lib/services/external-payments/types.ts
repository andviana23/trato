export interface ExternalPayment {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  plan: string;
  lastPaymentDate: string;
  status: 'ATIVO' | 'ATRASADO';
  notes?: string;
} 