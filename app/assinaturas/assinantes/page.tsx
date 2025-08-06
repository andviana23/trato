"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { usePagamentosAsaas } from "./hooks/usePagamentosAsaas";
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
import CadastrarAssinanteModal from "./components/CadastrarAssinanteModal";
import { getAssinaturas, updateAssinaturaStatus } from "@/lib/services/subscriptions";
import type { Assinatura } from '@/lib/services/subscriptions';
import type { PagamentoAsaas } from './hooks/usePagamentosAsaas';
import { useMemo } from 'react';

// Tipo para unificação dos dados
interface AssinanteUnificado {
  id: string;
  nome: string;
  plano: string;
  valor: number;
  status: string;
  data_pagamento: string;
  proximo_vencimento: string;
  tipo_pagamento: string;
  origem: 'asaas' | 'dinheiro';
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

  useEffect(() => {
    getAssinaturas().then((assinaturas: Assinatura[]) => setAssinaturas(assinaturas));
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
    ...assinaturas.map((a: Assinatura) => ({
      id: a.id,
      nome: a.cliente_id, // Ajuste conforme necessário se quiser buscar nome do cliente
      plano: a.plano_id,  // Ajuste conforme necessário se quiser buscar nome do plano
      valor: a.valor,
      status: a.status,
      data_pagamento: a.created_at,
      proximo_vencimento: a.data_vencimento,
      tipo_pagamento: 'DINHEIRO',
      origem: 'dinheiro' as const,
    }))
  ], [pagamentos, assinaturas]);

  const [busca, setBusca] = useState("");

  useEffect(() => {
    let assinantesFiltrados = todosAssinantes;
    if (busca) {
      assinantesFiltrados = assinantesFiltrados.filter(assinante =>
        assinante.nome?.toLowerCase().includes(busca.toLowerCase())
      );
    }
    if (periodo.dataInicio || periodo.dataFim) {
      assinantesFiltrados = assinantesFiltrados.filter(assinante => {
        const dataPagamento = assinante.data_pagamento;
        if (!dataPagamento) return false;
        const data = dayjs(dataPagamento);
        const inicio = periodo.dataInicio ? dayjs(periodo.dataInicio) : null;
        const fim = periodo.dataFim ? dayjs(periodo.dataFim) : null;
        if (inicio && fim) return data.isSameOrAfter(inicio) && data.isSameOrBefore(fim);
        if (inicio) return data.isSameOrAfter(inicio);
        if (fim) return data.isSameOrBefore(fim);
        return true;
      });
    }
  }, [todosAssinantes, busca, periodo]);

  // Use todosAssinantes para exibir na tabela, cards e KPIs
  // Exemplo de filtro para tabela:
  const assinantesFiltrados = todosAssinantes.filter(a => {
    const nomeOk = a.nome.toLowerCase().includes(busca.toLowerCase());
    const dataOk = (!periodo.dataInicio || dayjs(a.data_pagamento).isSameOrAfter(dayjs(periodo.dataInicio))) &&
                   (!periodo.dataFim || dayjs(a.data_pagamento).isSameOrBefore(dayjs(periodo.dataFim)));
    return nomeOk && dataOk;
  });

  // Card ASAAS Trato: status CONFIRMED e billing_type CREDIT_CARD ou PIX
  const asaasTratoAtivos = assinantesFiltrados.filter(a => a.origem === 'asaas' && a.tipo_pagamento === 'CREDIT_CARD' || a.tipo_pagamento === 'PIX');

  // Remover referência a todosAssinantes
  // Se necessário, remova o card de Pagamentos Externos ou ajuste para usar pagamentosFiltrados
  const pagamentosExternos = assinantesFiltrados.filter(
    a => a.origem === 'dinheiro' && (a.status === 'AGUARDANDO_PAGAMENTO' || a.status === 'CONFIRMED')
  );

  // Cards de métricas e layout
  async function handleSyncPagamentos() {
    if (isSyncing) {
      alert('Já existe uma sincronização em andamento. Aguarde!');
      return;
    }
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync-asaas', { method: 'POST' });
      const data = await res.json();
      if (res.status === 401) {
        alert('Chave de API do Asaas inválida ou permissão insuficiente.');
      } else if (data.success) {
        alert('Dados atualizados com sucesso!');
        window.location.reload();
      } else {
        alert('Erro ao atualizar: ' + (data.error || 'Erro desconhecido.'));
      }
    } catch (e) {
      alert('Erro ao sincronizar pagamentos.');
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10 font-sans">
        {/* Header e botões de ação */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1 flex items-center gap-2">
              <span className="inline-block bg-orange-100 p-2 rounded-full"><svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2h5m4-4v4m0 0v-4m0 4h4m-4 0H7" /></svg></span>
              Assinantes
            </h1>
            <p className="text-default-500">Gerencie todos os assinantes ativos e históricos do sistema</p>
          </div>
          <div className="flex gap-2">
            <button
              className={`bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-200 transition-all flex items-center gap-2 ${isSyncing ? 'opacity-60 cursor-not-allowed' : ''}`}
              onClick={handleSyncPagamentos}
              disabled={isSyncing}
            >
              {isSyncing && (
                <svg className="animate-spin w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
              )}
              Atualizar Dados
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-green-700 transition-all" onClick={() => setModalAberto(true)}>Novo Assinante</button>
          </div>
        </div>
        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-md border-t-4 border-orange-500 flex flex-col items-center justify-center p-6 gap-2 animate-fade-in">
            <span className="text-xs text-gray-500 font-semibold">ASAAS Trato</span>
            <span className="text-3xl font-bold text-orange-600">{asaasTratoAtivos.length}</span>
            <svg className="w-10 h-10 text-orange-400 mt-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
          </div>
          <div className="bg-white rounded-2xl shadow-md border-t-4 border-purple-500 flex flex-col items-center justify-center p-6 gap-2 animate-fade-in">
            <span className="text-xs text-gray-500 font-semibold">Pagamentos Externos</span>
            <span className="text-3xl font-bold text-purple-600">{pagamentosExternos.length}</span>
            <svg className="w-10 h-10 text-purple-400 mt-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2z" /></svg>
          </div>
          <div className="bg-white rounded-2xl shadow-md border-t-4 border-green-500 flex flex-col items-center justify-center p-6 gap-2 animate-fade-in">
            <span className="text-xs text-gray-500 font-semibold">Clientes Ativos</span>
            <span className="text-3xl font-bold text-green-600">{assinantesFiltrados.length}</span>
            <svg className="w-10 h-10 text-green-400 mt-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2h5" /></svg>
          </div>
          <div className="bg-white rounded-2xl shadow-md border-t-4 border-blue-500 flex flex-col items-center justify-center p-6 gap-2 animate-fade-in">
            <span className="text-xs text-gray-500 font-semibold">Total de Assinantes</span>
            <span className="text-3xl font-bold text-blue-600">{assinantesFiltrados.length}</span>
            <svg className="w-10 h-10 text-blue-400 mt-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
          </div>
        </div>
        {/* Barra de Filtros */}
        <div className="flex flex-wrap gap-4 items-end bg-white rounded-xl shadow p-4 mb-4">
          <input
            type="text"
            placeholder="Buscar por nome do cliente"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-64 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Período de pagamento</label>
            <input
              type="date"
              value={periodo.dataInicio}
              onChange={e => setPeriodo(p => ({ ...p, dataInicio: e.target.value }))}
              className="w-36 px-2 py-1 border rounded"
            />
            <span className="text-gray-500">até</span>
            <input
              type="date"
              value={periodo.dataFim}
              onChange={e => setPeriodo(p => ({ ...p, dataFim: e.target.value }))}
              className="w-36 px-2 py-1 border rounded"
            />
          </div>
          <button className="bg-red-100 text-red-600 font-semibold px-4 py-2 rounded-lg hover:bg-red-200 transition-all">Limpar</button>
        </div>
        {/* Tabela de pagamentos_asaas */}
        <div className="overflow-x-auto rounded-xl shadow bg-white animate-fade-in">
          <table className="min-w-full text-sm text-gray-700">
            <thead>
              <tr className="bg-gray-50 text-gray-800 font-bold">
                <th className="px-4 py-3 text-left">Nome do Cliente</th>
                <th className="px-4 py-3 text-left">Plano</th>
                <th className="px-4 py-3 text-left">Valor</th>
                <th className="px-4 py-3 text-left">Status do Pagamento</th>
                <th className="px-4 py-3 text-left">Data do Pagamento</th>
                <th className="px-4 py-3 text-left">Próx. Vencimento</th>
                <th className="px-4 py-3 text-left">Tipo de Pagamento</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loadingAtivos ? (
                <tr><td colSpan={8} className="text-center py-8">Carregando...</td></tr>
              ) : assinantesFiltrados.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">Nenhum assinante encontrado.</td></tr>
              ) : (
                assinantesFiltrados.map(a => (
                  <tr key={a.id} className="border-b hover:bg-gray-50 transition-all">
                    <td className="px-4 py-2">{a.nome}</td>
                    <td className="px-4 py-2">{a.plano}</td>
                    <td className="px-4 py-2 font-bold text-blue-700">R$ {Number(a.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${a.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : a.status === 'AGUARDANDO_PAGAMENTO' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span>
                    </td>
                    <td className="px-4 py-2">{dayjs(a.data_pagamento).format('DD/MM/YYYY')}</td>
                    <td className="px-4 py-2">{dayjs(a.proximo_vencimento).format('DD/MM/YYYY')}</td>
                    <td className="px-4 py-2">{a.tipo_pagamento === 'CREDIT_CARD' ? 'Cartão' : a.tipo_pagamento === 'PIX' ? 'PIX' : a.tipo_pagamento === 'DINHEIRO' ? 'Dinheiro' : a.tipo_pagamento}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        className="bg-gray-100 hover:bg-gray-200 rounded p-2 transition-all"
                        title={a.origem === 'dinheiro' && a.status === 'AGUARDANDO_PAGAMENTO' ? 'Confirmar pagamento' : 'Ver detalhes'}
                        onClick={() => {
                          if (a.origem === 'dinheiro' && a.status === 'AGUARDANDO_PAGAMENTO') {
                            setModalConfirmar({ open: true, assinatura: a });
                          } else {
                            // ...ação padrão...
                          }
                        }}
                      >
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405M19 13V7a2 2 0 00-2-2h-4.586a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 008.586 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2v-5z" /></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <CadastrarAssinanteModal open={modalAberto} onClose={() => setModalAberto(false)} />
        {/* Modal de confirmação de pagamento */}
        {modalConfirmar.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-2 animate-fade-in">
              <h2 className="text-xl font-bold mb-4">Confirmar pagamento</h2>
              <p className="mb-4">Deseja confirmar o pagamento do cliente <b>{modalConfirmar.assinatura?.nome}</b>?</p>
              <div className="flex gap-4 justify-end">
                <button className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium" onClick={() => setModalConfirmar({ open: false, assinatura: null })}>Cancelar</button>
                <button className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-all" onClick={async () => {
                  await updateAssinaturaStatus(modalConfirmar.assinatura.id, 'CONFIRMED');
                  setModalConfirmar({ open: false, assinatura: null });
                  window.location.reload();
                }}>Confirmar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 
