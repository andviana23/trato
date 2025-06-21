"use client"

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card, CardBody, CardHeader, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Chip, Tooltip, Progress, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Badge
} from '@nextui-org/react';
import { ArrowPathIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, CheckCircleIcon, ExclamationTriangleIcon, PencilIcon, CalendarIcon, ChartBarIcon, BanknotesIcon, UserIcon, EnvelopeIcon, ClockIcon } from '@heroicons/react/24/outline';
import PeriodFilter from './components/PeriodFilter';
import RevenueTimeline from './components/RevenueTimeline';
import { toast } from 'sonner';
import { usePermissions } from '@/lib/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface DashboardData {
  month: number;
  year: number;
  revenue: {
    asaasTrato: number;
    asaasAndrey: number;
    external: number;
    total: number;
  };
  overdueCount: number;
  goal: {
    amount: number;
    description: string;
  };
  updatedAt: string;
  revenueTimeline?: {
    revenue?: number;
    paymentsCount?: number;
    customers?: string[];
    bySource?: {
      asaasTrato?: number;
      asaasAndrey?: number;
      external?: number;
    };
  }[];
}

interface ExternalPayment {
  id: string;
  customerName: string;
  customerEmail: string;
  value: number;
  status: 'ATIVO' | 'ATRASADO';
  nextDueDate: string;
  daysOverdue?: number;
  notes?: string;
}

export default function DashboardAssinaturas() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [externalPayments, setExternalPayments] = useState<ExternalPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [externalLoading, setExternalLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    period: 'month' as 'day' | 'month' | 'year',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate()
  });
  const [metaModalOpen, setMetaModalOpen] = useState(false);
  const [metaInput, setMetaInput] = useState<string>('');
  const [metaDesc, setMetaDesc] = useState<string>('');
  const [metaSaving, setMetaSaving] = useState(false);
  const metaInputRef = useRef<HTMLInputElement>(null);
  const { isAdmin, isOwner } = usePermissions();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        year: filters.year.toString(),
        month: filters.month.toString()
      });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`/api/dashboard/faturamento-mensal?${params}`, { signal: controller.signal });
      clearTimeout(timeout);
      const result = await response.json();
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Erro ao carregar dados');
        toast.error('Erro ao carregar dados do dashboard');
      }
    } catch {
      setError('Erro ao conectar com o servidor');
      toast.error('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchExternalPayments = useCallback(async () => {
    try {
      setExternalLoading(true);
      const response = await fetch('/api/external-payments');
      const result = await response.json();
      
      if (result.success) {
        const payments: ExternalPayment[] = (result.payments || []).map((p: any) => ({
          id: p.id,
          customerName: p.customerName || p.nome || 'Não informado',
          customerEmail: p.customerEmail || p.email || 'Não informado',
          value: p.value || p.price || 0,
          status: p.status || 'ATIVO',
          nextDueDate: p.nextDueDate || p.current_period_end || p.vencimento || '',
          daysOverdue: p.daysOverdue || 0,
          notes: p.notes || ''
        }));
        setExternalPayments(payments);
      } else {
        console.error('Erro ao carregar pagamentos externos:', result.error);
        toast.error('Erro ao carregar pagamentos externos');
      }
    } catch (error) {
      console.error('Erro ao buscar pagamentos externos:', error);
      toast.error('Erro de conexão com pagamentos externos');
    } finally {
      setExternalLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchExternalPayments();
  }, [fetchDashboardData, fetchExternalPayments]);

  const handleFilterChange = (newFilters: { period: 'day' | 'month' | 'year'; year: number; month?: number; day?: number }) => {
    setFilters({
      ...newFilters,
      month: newFilters.month || filters.month,
      day: newFilters.day || filters.day
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '--';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return '--';
    }
  };

  const openMetaModal = () => {
    setMetaInput(data?.goal?.amount?.toString() || '');
    setMetaDesc(data?.goal?.description || '');
    setMetaModalOpen(true);
    setTimeout(() => metaInputRef.current?.focus(), 100);
  };

  const handleSaveMeta = async () => {
    setMetaSaving(true);
    try {
      const amount = parseFloat(metaInput.replace(/[^0-9,\.]/g, '').replace(',', '.'));
      const desc = metaDesc;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch('/api/dashboard/metas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: filters.year,
          month: filters.month,
          goalAmount: amount,
          description: desc
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      const result = await res.json();
      if (result.success) {
        toast.success('Meta atualizada!');
        setMetaModalOpen(false);
        fetchDashboardData();
      } else {
        toast.error(result.error || 'Erro ao salvar meta');
      }
    } catch {
      toast.error('Erro ao salvar meta');
    } finally {
      setMetaSaving(false);
    }
  };

  // Cálculos para UI
  const meta = data?.goal?.amount || 0;
  const faturamento = (data?.revenue?.asaasTrato || 0) + (data?.revenue?.asaasAndrey || 0) + (data?.revenue?.external || 0);
  const percentMeta = meta ? Math.round((faturamento / meta) * 100) : 0;
  const overdue = data?.overdueCount || 0;

  // Faturamento de pagamentos externos (apenas valor total)
  const externalRevenue = data?.revenue?.external || 0;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1 flex items-center gap-2">
              <ChartBarIcon className="w-7 h-7 text-primary-500" /> Dashboard de Assinaturas
            </h1>
            <p className="text-default-500">
              Faturamento e metas de {filters.month.toString().padStart(2, '0')}/{filters.year}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              color="primary"
              variant="flat"
              startContent={<ArrowPathIcon className="w-4 h-4" />}
              onPress={fetchDashboardData}
              isLoading={loading}
            >
              Atualizar Dados
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-4">
          <PeriodFilter onFilterChange={handleFilterChange} currentFilters={filters} />
        </div>

        {/* Cards de Destaque */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-sm">
            <CardBody className="flex flex-col items-center justify-center text-center p-4 gap-2">
              <span className="text-xs text-default-500">Meta Mensal</span>
              <span className="text-2xl font-bold text-primary-600">{formatCurrency(meta)}</span>
              <Chip color={percentMeta >= 100 ? "success" : "warning"} variant="flat" className="mt-1">
                {percentMeta}% atingido
              </Chip>
              <Tooltip content={data?.goal?.description || "Sem descrição"}>
                <Button isIconOnly size="sm" variant="light" onPress={openMetaModal}>
                  <PencilIcon className="w-4 h-4" />
                </Button>
              </Tooltip>
            </CardBody>
          </Card>
          <Card className="shadow-sm">
            <CardBody className="flex flex-col items-center justify-center text-center p-4 gap-2">
              <span className="text-xs text-default-500">Faturamento Total</span>
              <span className="text-2xl font-bold text-success-600">{formatCurrency(faturamento)}</span>
              <Progress value={percentMeta} color={percentMeta >= 100 ? "success" : "warning"} className="w-full mt-2" />
              <span className="text-xs text-default-500">{percentMeta}% da meta</span>
            </CardBody>
          </Card>
          <Card className="shadow-sm">
            <CardBody className="flex flex-col items-center justify-center text-center p-4 gap-2">
              <span className="text-xs text-default-500">Inadimplentes</span>
              <span className="text-2xl font-bold text-danger-600 flex items-center gap-1">
                {overdue}
                {overdue > 0 ? <ExclamationTriangleIcon className="w-5 h-5 text-danger-500" /> : <CheckCircleIcon className="w-5 h-5 text-success-500" />}
              </span>
              <span className="text-xs text-default-500">Este mês</span>
            </CardBody>
          </Card>
        </div>

        {/* Detalhamento Mensal por Fonte */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary-500" /> Faturamento do Mês
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-md border-l-4 border-primary-500">
              <CardBody className="flex flex-col items-center justify-center text-center p-4 gap-2">
                <span className="text-xs text-default-500">ASAAS Trato</span>
                <span className="text-2xl font-bold text-primary-600">{formatCurrency(data?.revenue?.asaasTrato || 0)}</span>
                <Progress value={meta ? Math.round(((data?.revenue?.asaasTrato || 0) / meta) * 100) : 0} color="primary" className="w-full mt-2" />
              </CardBody>
            </Card>
            <Card className="shadow-md border-l-4 border-success-500">
              <CardBody className="flex flex-col items-center justify-center text-center p-4 gap-2">
                <span className="text-xs text-default-500">ASAAS Andrey</span>
                <span className="text-2xl font-bold text-success-600">{formatCurrency(data?.revenue?.asaasAndrey || 0)}</span>
                <Progress value={meta ? Math.round(((data?.revenue?.asaasAndrey || 0) / meta) * 100) : 0} color="success" className="w-full mt-2" />
              </CardBody>
            </Card>
            <Card className="shadow-md border-l-4 border-purple-500">
              <CardBody className="flex flex-col items-center justify-center text-center p-4 gap-2">
                <span className="text-xs text-default-500">Pagamentos Externos</span>
                <span className="text-2xl font-bold text-purple-600">{formatCurrency(externalRevenue)}</span>
                <Progress value={meta ? Math.round((externalRevenue / meta) * 100) : 0} color="secondary" className="w-full mt-2" />
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Gráfico de linha do tempo anual */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-5 h-5 text-primary-500" /> Evolução Anual
          </h2>
          <RevenueTimeline selectedYear={filters.year} />
        </div>

        {/* Modal de edição de meta */}
        <Modal isOpen={metaModalOpen} onOpenChange={setMetaModalOpen} placement="center">
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              Editar Meta Mensal
            </ModalHeader>
            <ModalBody>
              <Input
                ref={metaInputRef}
                label="Valor da Meta (R$)"
                type="number"
                min="0"
                step="0.01"
                value={metaInput}
                onValueChange={setMetaInput}
              />
              <Input
                label="Descrição"
                type="text"
                value={metaDesc}
                onValueChange={setMetaDesc}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={() => setMetaModalOpen(false)} disabled={metaSaving}>
                Cancelar
              </Button>
              <Button color="primary" onPress={handleSaveMeta} isLoading={metaSaving}>
                Salvar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </DashboardLayout>
  );
} 
