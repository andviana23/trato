"use client";

import { useState, useEffect } from 'react';

interface PaymentData {
  id: string;
  customerName: string;
  customerEmail: string;
  value: number;
  lastPaymentDate: string;
  nextDueDate: string;
  status: 'ATIVO' | 'ATRASADO';
  billingType: string;
  description?: string;
  source: 'ASAAS_TRATO' | 'ASAAS_ANDREY' | 'EXTERNAL';
}

interface MetricsData {
  asaasTrato: { active: number; loading: boolean; error?: string; total?: number };
  asaasAndrey: { active: number; loading: boolean; error?: string; total?: number };
  external: { active: number; loading: boolean; error?: string; total?: number };
}

export function useAssinantesData() {
  const [metrics, setMetrics] = useState<MetricsData>({
    asaasTrato: { active: 0, loading: true },
    asaasAndrey: { active: 0, loading: true },
    external: { active: 0, loading: true }
  });

  const [allPayments, setAllPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      console.log('🔄 Carregando dados de todas as fontes...');

      const [tratoResponse, andreyResponse, externalResponse] = await Promise.all([
        fetch('/api/asaas/trato/payments').catch(err => {
          console.error('Erro Trato:', err);
          return { ok: false, json: () => ({ success: false, error: err.message }) };
        }),
        fetch('/api/asaas/andrey/payments').catch(err => {
          console.error('Erro Andrey:', err);
          return { ok: false, json: () => ({ success: false, error: err.message }) };
        }),
        fetch('/api/external-payments').catch(err => {
          console.error('Erro External:', err);
          return { ok: false, json: () => ({ success: false, error: err.message }) };
        })
      ]);

      const tratoData = await tratoResponse.json();
      const andreyData = await andreyResponse.json();
      const externalData = await externalResponse.json();

      console.log('📊 Dados recebidos:', {
        trato: { success: tratoData.success, total: tratoData.total },
        andrey: { success: andreyData.success, total: andreyData.total },
        external: { success: externalData.success, total: externalData.total }
      });

      // Atualizar métricas
      setMetrics({
        asaasTrato: {
          active: tratoData.success ? tratoData.total : 0,
          loading: false,
          error: tratoData.success ? undefined : tratoData.error,
          total: tratoData.totalConfirmed
        },
        asaasAndrey: {
          active: andreyData.success ? andreyData.total : 0,
          loading: false,
          error: andreyData.success ? undefined : andreyData.error,
          total: andreyData.totalConfirmed
        },
        external: {
          active: externalData.success ? externalData.total : 0,
          loading: false,
          error: externalData.success ? undefined : externalData.error,
          total: externalData.payments?.length
        }
      });

      // Combinar todos os pagamentos
      const externalPayments: PaymentData[] = (externalData.payments || []).map((p: Record<string, unknown>) => {
        const customerName = typeof p.customerName === 'string' ? p.customerName : (typeof p.nome === 'string' ? p.nome : '');
        const customerEmail = typeof p.customerEmail === 'string' ? p.customerEmail : (typeof p.email === 'string' ? p.email : '');
        const nextDueDateRaw = typeof p.nextDueDate === 'string' ? p.nextDueDate : (typeof p.current_period_end === 'string' ? p.current_period_end : (typeof p.vencimento === 'string' ? p.vencimento : ''));
        const nextDueDate = nextDueDateRaw.split('T')[0];
        const status = typeof p.status === 'string' ? (p.status as 'ATIVO' | 'ATRASADO') : 'ATIVO';
        const billingType = typeof p.billingType === 'string' ? p.billingType : '';
        return {
          ...p,
          customerName,
          customerEmail,
          nextDueDate,
          status,
          billingType,
          source: 'EXTERNAL',
        } as PaymentData;
      });
      const combined: PaymentData[] = [
        ...(tratoData.payments || []).map((p: PaymentData) => ({
          ...p
        })),
        ...(andreyData.payments || []).map((p: PaymentData) => ({
          ...p
        })),
        ...externalPayments
      ];

      setAllPayments(combined);
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      
      setMetrics({
        asaasTrato: { active: 0, loading: false, error: 'Erro de conexão' },
        asaasAndrey: { active: 0, loading: false, error: 'Erro de conexão' },
        external: { active: 0, loading: false, error: 'Erro de conexão' }
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    metrics,
    allPayments,
    loading,
    refreshData: loadAllData
  };
} 