"use client";
import { useState, useEffect } from 'react';
export function useAssinantesData() {
    const [metrics, setMetrics] = useState({
        asaasTrato: { active: 0, loading: true },
        external: { active: 0, loading: true }
    });
    const [allPayments, setAllPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        loadAllData();
    }, []);
    // Remover qualquer limitação de exibição
    const loadAllData = async () => {
        try {
            console.log('🔄 Carregando dados de todas as fontes...');
            const [tratoResponse, externalResponse] = await Promise.all([
                fetch('/api/asaas/trato/payments').catch(err => {
                    console.error('Erro Trato:', err);
                    return { ok: false, json: () => ({ success: false, error: err.message }) };
                }),
                fetch('/api/external-payments').catch(err => {
                    console.error('Erro External:', err);
                    return { ok: false, json: () => ({ success: false, error: err.message }) };
                })
            ]);
            const tratoData = await tratoResponse.json();
            const externalData = await externalResponse.json();
            console.log('📊 Dados brutos recebidos de /api/asaas/trato/payments:', tratoData);
            console.log('📊 Dados brutos recebidos de /api/external-payments:', externalData);
            // Combinar todos os pagamentos
            const externalPayments = (externalData.payments || []).map((p) => {
                const customerName = typeof p.customerName === 'string' ? p.customerName : (typeof p.nome === 'string' ? p.nome : '');
                const customerEmail = typeof p.customerEmail === 'string' ? p.customerEmail : (typeof p.email === 'string' ? p.email : '');
                const nextDueDateRaw = typeof p.nextDueDate === 'string' ? p.nextDueDate : (typeof p.current_period_end === 'string' ? p.current_period_end : (typeof p.vencimento === 'string' ? p.vencimento : ''));
                const nextDueDate = nextDueDateRaw.split('T')[0];
                const status = typeof p.status === 'string' ? p.status : 'ATIVO';
                const billingType = typeof p.billingType === 'string' ? p.billingType : '';
                return Object.assign(Object.assign({}, p), { customerName,
                    customerEmail,
                    nextDueDate,
                    status,
                    billingType, source: 'EXTERNAL' });
            });
            const combined = [
                ...(tratoData.payments || []).map((p) => (Object.assign({}, p))),
                ...externalPayments
            ];
            console.log('🔗 Lista combinada de pagamentos:', combined);
            // Filtrar pagamentos confirmados no mês vigente
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const pagamentosConfirmadosNoMes = combined.filter(payment => {
                const paymentDate = new Date(payment.lastPaymentDate);
                return payment.status === 'ATIVO' && paymentDate >= startOfMonth && paymentDate <= endOfMonth;
            });
            // Atualizar métricas com o total de pagamentos confirmados no mês
            setMetrics({
                asaasTrato: {
                    active: tratoData.success ? tratoData.total : 0,
                    loading: false,
                    error: tratoData.success ? undefined : tratoData.error,
                    total: pagamentosConfirmadosNoMes.filter(p => p.source === 'ASAAS_TRATO').length
                },
                external: {
                    active: externalData.success ? externalData.total : 0,
                    loading: false,
                    error: externalData.success ? undefined : externalData.error,
                    total: pagamentosConfirmadosNoMes.filter(p => p.source === 'EXTERNAL').length
                }
            });
            const filterActiveSubscribers = (payments) => {
                const activeSubscribers = payments.filter(payment => payment.status === 'ATIVO');
                const uniqueSubscribers = activeSubscribers.reduce((acc, current) => {
                    const duplicate = acc.find(subscriber => subscriber.customerName === current.customerName ||
                        subscriber.customerEmail === current.customerEmail ||
                        subscriber.id === current.id);
                    if (!duplicate) {
                        acc.push(current);
                    }
                    else if (current.source === 'ASAAS_TRATO') {
                        // Priorizar Asaas Trato
                        const index = acc.indexOf(duplicate);
                        acc[index] = current;
                    }
                    return acc;
                }, []);
                return uniqueSubscribers;
            };
            // Após combinar todos os pagamentos
            const activeSubscribers = filterActiveSubscribers(combined);
            console.log('✅ Assinantes ativos após filtro e deduplicação:', activeSubscribers);
            setAllPayments(activeSubscribers);
        }
        catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            setMetrics({
                asaasTrato: { active: 0, loading: false, error: 'Erro de conexão' },
                external: { active: 0, loading: false, error: 'Erro de conexão' }
            });
        }
        finally {
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
