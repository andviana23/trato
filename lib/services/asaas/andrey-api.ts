export class AsaasAndrey {
  private apiKey: string;
  private baseUrl = 'https://www.asaas.com/api/v3';

  constructor() {
    this.apiKey = process.env.ASAAS_ANDREY_API_KEY!;
  }

  async getActiveCustomers() {
    const response = await fetch(`${this.baseUrl}/customers`, {
      headers: {
        'access_token': this.apiKey,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    return data.data.filter((customer: any) => this.isCustomerActive(customer));
  }

  private isCustomerActive(customer: any): boolean {
    const lastPayment = customer.subscriptions?.[0]?.nextDueDate;
    if (!lastPayment) return false;
    const dueDate = new Date(lastPayment);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 1;
  }
} 