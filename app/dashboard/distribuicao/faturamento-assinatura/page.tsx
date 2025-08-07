"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, Button, Input } from "@nextui-org/react";
import { CurrencyDollarIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useFaturamentoAssinatura, Lancamento } from './useFaturamentoAssinatura';
import { usePagamentosAsaas } from '@/app/assinaturas/assinantes/hooks/usePagamentosAsaas';
import { getAssinaturas } from '@/lib/services/subscriptions';
import dayjs from 'dayjs';
import { useEffect } from 'react';

export default function FaturamentoAssinaturaPage() {
  // Mês de referência atual
  const UNIDADE = "Trato de Barbados";
  const mesAtual = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const { dados: lancamentos, loading, erro, adicionar, excluir } = useFaturamentoAssinatura(mesAtual, UNIDADE);
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [assinaturas, setAssinaturas] = useState<any[]>([]);
  const { pagamentos } = usePagamentosAsaas({ dataInicio: dayjs().startOf('month').format('YYYY-MM-DD'), dataFim: dayjs().endOf('month').format('YYYY-MM-DD') });
  useEffect(() => { getAssinaturas().then(setAssinaturas); }, []);

  // Faturamento igual ao dashboard
  const pagamentosConfirmados = [
    ...pagamentos.map(p => ({
      valor: p.valor,
      status: p.status,
      tipo_pagamento: (p.billing_type || '').toUpperCase(),
      data_pagamento: p.payment_date
    })),
    ...assinaturas.map(a => ({
      valor: a.price,
      status: a.status,
      tipo_pagamento: (a.forma_pagamento || '').toUpperCase(),
      data_pagamento: a.created_at
    }))
  ].filter(p => p.status === 'CONFIRMED');

  const faturamentoTotal = pagamentosConfirmados.reduce((acc, p) => acc + Number(p.valor), 0);
  const comissao = faturamentoTotal * 0.4;

  const handleAdicionar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valor || !data) return;
    await adicionar({ valor: Number(valor), descricao, data });
    setValor("");
    setDescricao("");
    setData(new Date().toISOString().slice(0, 10));
  };

  const handleExcluir = async (id: string) => {
    await excluir(id);
  };

  return (
    <>
      {/* Título */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Faturamento da Assinatura - Trato de Barbados
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie o faturamento do mês e prepare a distribuição de comissões.
        </p>
      </div>

      {/* Cards de Faturamento e Comissão */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Card Faturamento Total */}
        <Card className="shadow-lg">
          <CardHeader className="flex items-center gap-3">
            <CurrencyDollarIcon className="h-7 w-7 text-green-600" />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Faturamento Total do Mês
            </span>
          </CardHeader>
          <CardBody>
            <span className="text-3xl font-bold text-green-700 dark:text-green-400">
              R$ {faturamentoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </CardBody>
        </Card>
        {/* Card Comissão */}
        <Card className="shadow-lg">
          <CardHeader className="flex items-center gap-3">
            <CurrencyDollarIcon className="h-7 w-7 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Comissão
            </span>
          </CardHeader>
          <CardBody>
            <span className="text-3xl font-bold text-blue-700 dark:text-blue-400">
              R$ {comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </CardBody>
        </Card>
      </div>

      {/* Formulário de novo faturamento */}
      <form
        onSubmit={handleAdicionar}
        className="flex flex-col md:flex-row gap-4 items-stretch md:items-end mb-8"
      >
        <div className="flex-1">
          <Input
            type="number"
            label="Valor"
            placeholder="0,00"
            value={valor}
            onChange={e => setValor(e.target.value)}
            min={0}
            step={0.01}
            required
            startContent={<CurrencyDollarIcon className="w-5 h-5 text-gray-400" />}
          />
        </div>
        <div className="flex-1">
          <Input
            type="text"
            label="Descrição"
            placeholder="Ex: Corte, Barba, etc."
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            required
          />
        </div>
        <div className="flex-1">
          <Input
            type="date"
            label="Data"
            value={data}
            onChange={e => setData(e.target.value)}
            required
          />
        </div>
        <Button
          type="submit"
          color="primary"
          className="w-full md:w-auto"
          startContent={<PlusIcon className="w-5 h-5" />}
        >
          Adicionar Faturamento
        </Button>
      </form>

      {/* Lista de lançamentos do mês */}
      <Card className="shadow">
        <CardHeader>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            Lançamentos do Mês
          </span>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center text-gray-500">Carregando...</div>
          ) : erro ? (
            <div className="text-center text-red-500">{erro}</div>
          ) : lancamentos.length === 0 ? (
            <div className="text-center text-gray-500">Nenhum lançamento adicionado ainda.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor (R$)</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase"></th>
                  </tr>
                </thead>
                <tbody>
                  {lancamentos.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{new Date(l.data).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{l.descricao}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-white">{Number(l.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => handleExcluir(l.id)}
                          className="inline-flex items-center justify-center p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                          title="Excluir"
                        >
                          <TrashIcon className="w-5 h-5 text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
} 