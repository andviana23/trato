export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  status: 'ACTIVE' | 'INACTIVE';
  subscriptions: AsaasSubscription[];
  createdDate: string;
}

export interface AsaasSubscription {
  id: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  nextDueDate: string;
  value: number;
  cycle: 'MONTHLY' | 'YEARLY';
  plan: string;
} 