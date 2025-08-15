"use client";

import React, { useState, useEffect } from "react";
import { usePagamentosAsaas } from "./hooks/usePagamentosAsaas";
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
import CadastrarAssinanteModal from "./components/CadastrarAssinanteModal";
import { getAssinaturas, updateAssinaturaStatus, deletarAssinatura } from "@/lib/services/subscriptions";
import type { PagamentoAsaas } from './hooks/usePagamentosAsaas';
import { useMemo } from 'react';
import { getPlanos } from '@/lib/services/plans';
import { getClientes } from '@/lib/services/clients';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppToast as useDesignToast } from "@/hooks/useAppToast";

// Tipo para unificação dos dados
export type AssinanteUnificado = {
  id: string;
  nome: string;
  plano: string;
  valor: number;
  status: string;
  data_pagamento: string;
  proximo_vencimento: string;
  tipo_pagamento: string;
  origem: "asaas" | "dinheiro" | "pix";
  forma_pagamento?: string;
  data_cadastro?: string; // <-- ADICIONADO
};

// Ajustar tipo Assinatura para incluir campos opcionais:
export interface Assinatura {
  id: string;
  cliente_id: string;
  plano_id: string;
  valor: number;
  status: string;
  created_at: string;
  data_vencimento: string;
  nome_cliente?: string;
  nome_plano?: string;
  price?: number;
  forma_pagamento?: string;
  data_cadastro?: string; // <-- ADICIONADO
}

export default function AssinantesPage() {
  // Período padrão: mês atual
  const [periodo, setPeriodo] = useState({
    dataInicio: dayjs().startOf('month').format('YYYY-MM-DD'),
    dataFim: dayjs().endOf('month').format('YYYY-MM-DD')
  });
  const { pagamentos, loading: loadingAtivos } = usePagamentosAsaas(periodo);
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalConfirmar, setModalConfirmar] = useState<{ open: boolean, assinatura: AssinanteUnificado | null }>({ open: false, assinatura: null });
  // Adicione o estado para controlar o assinante em edição
  const [assinanteEditando, setAssinanteEditando] = useState<AssinanteUnificado | null>(null);

  // Move fetchAssinaturasComNomes here
  async function fetchAssinaturasComNomes() {
    const assinaturas = await getAssinaturas();
    const clientes = await getClientes();
    const planos = await getPlanos();
    // Monta assinaturas com nome do cliente e do plano
    const assinaturasComNomes = assinaturas.map(a => {
      const cliente = (clientes as { id: string; nome: string }[]).find((c) => c.id === a.cliente_id);
      const plano = planos.find(p => p.id === a.plano_id);
      return {
        ...a,
        nome_cliente: cliente ? cliente.nome : a.cliente_id,
        nome_plano: plano ? plano.nome : a.plano_id,
        valor: a.valor,
        status: a.status,
      };
    });
    setAssinaturas(assinaturasComNomes);
  }

  useEffect(() => {
    fetchAssinaturasComNomes();
  }, []);

  // Unir pagamentos_asaas e assinaturas (dinheiro) - agora com useMemo
  const todosAssinantes: AssinanteUnificado[] = useMemo(() => [
    ...pagamentos.map((p: PagamentoAsaas) => ({
      id: p.payment_id,
      nome: p.customer_name,
      plano: p.plano,
      valor: p.valor,
      status: p.status,
      data_pagamento: p.payment_date,
      proximo_vencimento: p.next_due_date,
      tipo_pagamento: (p.billing_type || '').toUpperCase(),
      origem: 'asaas' as const,
    })),
    ...assinaturas.map((a: Assinatura) => {
      const origem: 'dinheiro' | 'pix' = a.forma_pagamento?.toLowerCase?.() === 'pix' ? 'pix' : 'dinheiro';
      return {
        id: a.id,
        nome: a.nome_cliente ?? a.cliente_id ?? '',
        plano: a.nome_plano ?? a.plano_id ?? '',
        valor: a.price ?? a.valor ?? 0,
        status: a.status ?? '',
        data_pagamento: a.data_cadastro ?? '',
        proximo_vencimento: a.data_vencimento ?? '',
        tipo_pagamento: a.forma_pagamento?.toUpperCase?.() || 'DINHEIRO',
        origem,
        forma_pagamento: a.forma_pagamento ?? undefined,
        data_cadastro: a.data_cadastro ?? '', // <-- ADICIONADO
      };
    })
  ], [pagamentos, assinaturas]);

  const [busca, setBusca] = useState("");

  // efeito legado removido (lógica consolidada em assinantesFiltrados)

  // Use todosAssinantes para exibir na tabela, cards e KPIs
  // Exemplo de filtro para tabela:
  const assinantesFiltrados = todosAssinantes.filter((a) => {
    const nomeOk = a.nome.toLowerCase().includes(busca.toLowerCase());
    const dataOk = (!periodo.dataInicio || dayjs(a.data_pagamento).isSameOrAfter(dayjs(periodo.dataInicio))) &&
                   (!periodo.dataFim || dayjs(a.data_pagamento).isSameOrBefore(dayjs(periodo.dataFim)));
    return nomeOk && dataOk;
  });

  // Card ASAAS Trato: status CONFIRMED e tipo de pagamento Cartão/PIX
  const asaasTratoAtivos = assinantesFiltrados.filter(a => a.origem === 'asaas' && a.status === 'CONFIRMED' && (a.tipo_pagamento === 'CREDIT_CARD' || a.tipo_pagamento === 'PIX'));

  // Remover referência a todosAssinantes
  // Se necessário, remova o card de Pagamentos Externos ou ajuste para usar pagamentosFiltrados
  const pagamentosExternos = assinantesFiltrados.filter(
    a => (a.origem === 'dinheiro' || a.origem === 'pix') && (a.status === 'AGUARDANDO_PAGAMENTO' || a.status === 'CONFIRMED')
  );

  // Clientes Ativos: todos com status CONFIRMED independentemente da origem
  const clientesAtivos = assinantesFiltrados.filter(a => a.status === 'CONFIRMED');

  // Cards de métricas e layout
  const toast = useDesignToast();
  const cardBg = 'bg-card';
  const cardBorder = 'border-border';
  const muted = 'text-muted-foreground';

  async function handleSyncPagamentos() {
    if (isSyncing) {
      alert('Já existe uma sincronização em andamento. Aguarde!');
      return;
    }
    setIsSyncing(true);
    try {
      // Chama ambas as rotas de atualização
      const res1 = await fetch('/api/sync-pagamentos-asaas', { method: 'POST' });
      const res2 = await fetch('/api/atualizar-assinaturas', { method: 'POST' });
      const data1 = await res1.json();
      const data2 = await res2.json();
      if ((res1.status === 401 || res2.status === 401)) {
        toast.error({ title: 'Chave de API inválida ou permissão insuficiente.' });
      } else if ((data1.success || data2.success)) {
        toast.success({ title: 'Dados atualizados com sucesso!' });
        window.location.reload();
      } else {
        toast.error({ title: 'Erro ao atualizar', description: String(data1.error || data2.error || 'Erro desconhecido.') });
      }
    } catch {
      toast.error({ title: 'Erro ao sincronizar pagamentos.' });
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="container mx-auto max-w-7xl py-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Assinantes</h1>
          <p className="text-sm text-muted-foreground">Gerencie todos os assinantes ativos e históricos do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSyncPagamentos} disabled={isSyncing} aria-label="Atualizar dados">
            {isSyncing ? "Sincronizando..." : "Atualizar Dados"}
          </Button>
          <Button onClick={() => setModalAberto(true)} aria-label="Novo Assinante">Novo Assinante</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[{label:'ASAAS Trato', value: asaasTratoAtivos.length, color:'text-orange-500'},
          {label:'Pagamentos Externos', value: pagamentosExternos.length, color:'text-purple-500'},
          {label:'Clientes Ativos', value: clientesAtivos.length, color:'text-green-500'}].map((kpi, i)=> (
          <Card key={i} className="border border-border rounded-xl shadow-sm">
            <CardContent className="text-center py-6">
              <div className={`text-[11px] font-semibold ${muted}`}>{kpi.label}</div>
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="border border-border rounded-lg mb-4 shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Input className="w-[260px]" placeholder="Buscar por nome do cliente" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar assinante" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] ${muted}`}>Período de pagamento</span>
            <Input type="date" value={periodo.dataInicio} onChange={(e) => setPeriodo((p) => ({ ...p, dataInicio: e.target.value }))} className="w-36" />
            <span className="text-gray-600">até</span>
            <Input type="date" value={periodo.dataFim} onChange={(e) => setPeriodo((p) => ({ ...p, dataFim: e.target.value }))} className="w-36" />
          </div>
          <Button variant="secondary" aria-label="Limpar filtros" onClick={() => {
            setBusca("");
            setPeriodo({
              dataInicio: dayjs().startOf('month').format('YYYY-MM-DD'),
              dataFim: dayjs().endOf('month').format('YYYY-MM-DD')
            });
          }}>Limpar</Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Cliente</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status do Pagamento</TableHead>
              <TableHead>Data do Pagamento</TableHead>
              <TableHead>Próx. Vencimento</TableHead>
              <TableHead>Tipo de Pagamento</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingAtivos ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">Carregando...</TableCell>
              </TableRow>
            ) : assinantesFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum assinante encontrado.</TableCell>
              </TableRow>
            ) : (
              assinantesFiltrados.map((a) => {
                const statusPalette = a.status === 'CONFIRMED' ? 'green' : a.status === 'AGUARDANDO_PAGAMENTO' ? 'yellow' : 'red';
                const tipo = a.tipo_pagamento === 'CREDIT_CARD' ? 'Cartão' : a.tipo_pagamento === 'PIX' ? 'PIX' : a.tipo_pagamento === 'DINHEIRO' ? 'Dinheiro' : a.tipo_pagamento;
                return (
                  <TableRow key={a.id}>
                    <TableCell>{a.nome}</TableCell>
                    <TableCell>{a.plano}</TableCell>
                    <TableCell>{Number(a.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusPalette === 'green' ? 'bg-green-100 text-green-800' : statusPalette === 'yellow' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{a.status}</span>
                    </TableCell>
                    <TableCell>{dayjs(a.data_pagamento).format('DD/MM/YYYY')}</TableCell>
                    <TableCell>{dayjs(a.proximo_vencimento).format('DD/MM/YYYY')}</TableCell>
                    <TableCell>{tipo}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="outline" size="sm" onClick={() => setAssinanteEditando(a)} aria-label="Editar assinante">
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <CadastrarAssinanteModal open={modalAberto} onClose={() => setModalAberto(false)} />
      {/* Modal de confirmação de pagamento */}
      {modalConfirmar.open && (
        <Dialog open onOpenChange={() => setModalConfirmar({ open: false, assinatura: null })}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar pagamento</DialogTitle>
            </DialogHeader>
            <div className="mb-4 text-sm">Deseja confirmar o pagamento do cliente <b>{modalConfirmar.assinatura?.nome}</b>?</div>
            <DialogFooter className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setModalConfirmar({ open: false, assinatura: null })}>Cancelar</Button>
              <Button variant="destructive" onClick={async () => {
                  if (modalConfirmar.assinatura?.id) {
                    await deletarAssinatura(modalConfirmar.assinatura.id);
                  }
                  setModalConfirmar({ open: false, assinatura: null });
                  window.location.reload();
                }}>Cancelar assinatura</Button>
              <Button onClick={async () => {
                  if (modalConfirmar.assinatura?.id) {
                    await updateAssinaturaStatus(modalConfirmar.assinatura.id, 'CONFIRMED');
                  }
                  setModalConfirmar({ open: false, assinatura: null });
                  window.location.reload();
                }}>Confirmar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* Modal de edição/ação do assinante */}
      {assinanteEditando && (
        <Dialog open onOpenChange={() => setAssinanteEditando(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                  {assinanteEditando.tipo_pagamento === 'DINHEIRO' || assinanteEditando.tipo_pagamento === 'PIX' ? 'Confirmar pagamento' : 'Editar Assinante'}
              </DialogTitle>
            </DialogHeader>
            <div className="mb-4 text-sm space-y-1">
              <div><b>Nome:</b> {assinanteEditando.nome}</div>
              <div><b>Plano:</b> {assinanteEditando.plano}</div>
              <div><b>Valor:</b> {Number(assinanteEditando.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              <div><b>Status:</b> {assinanteEditando.status}</div>
              <div><b>Vencimento:</b> {dayjs(assinanteEditando.proximo_vencimento).format('DD/MM/YYYY')}</div>
              <div><b>Tipo de Pagamento:</b> {assinanteEditando.tipo_pagamento === 'CREDIT_CARD' ? 'Cartão' : assinanteEditando.tipo_pagamento === 'PIX' ? 'PIX' : assinanteEditando.tipo_pagamento === 'DINHEIRO' ? 'Dinheiro' : assinanteEditando.tipo_pagamento}</div>
            </div>
            <DialogFooter className="grid gap-3">
                {assinanteEditando.tipo_pagamento === 'DINHEIRO' || assinanteEditando.tipo_pagamento === 'PIX' ? (
                  <Button onClick={async () => {
                    await updateAssinaturaStatus(assinanteEditando.id, 'CONFIRMED');
                    setAssinanteEditando(null);
                    window.location.reload();
                  }}>Confirmar Pagamento</Button>
                ) : null}
                <Button variant="destructive" onClick={async () => {
                  if (window.confirm('Tem certeza que deseja cancelar esta assinatura? Ela será removida do sistema e do Supabase na data de vencimento.')) {
                    const hoje = new Date();
                    const vencimento = new Date(assinanteEditando.proximo_vencimento);
                    if (vencimento <= hoje) {
                      await fetch(`/api/assinantes/${assinanteEditando.id}`, { method: 'DELETE' });
                      setAssinanteEditando(null);
                      window.location.reload();
                    } else {
                      alert('A assinatura só será cancelada na data de vencimento.');
                      setAssinanteEditando(null);
                    }
                  }
                }}>Cancelar Assinatura</Button>
                <Button variant="secondary" onClick={() => setAssinanteEditando(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 
