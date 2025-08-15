"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, Button, Input } from "@/components/ui/chakra-adapters";
import { CurrencyDollarIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useFaturamentoAssinatura, Lancamento } from './useFaturamentoAssinatura';

export default function FaturamentoAssinaturaPage() {
  // Mês de referência atual
  const UNIDADE = "BarberBeer";
  const mesAtual = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const { dados: lancamentos, loading, erro, adicionar, excluir } = useFaturamentoAssinatura(mesAtual, UNIDADE);
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));

  // Cálculo do faturamento total do mês
  const faturamentoTotal = lancamentos.reduce((acc, l) => acc + Number(l.valor), 0);
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
        <h1 className="text-2xl font-bold text-amber-700 dark:text-amber-400">
          Faturamento da Assinatura - BarberBeer
        </h1>
        <p className="text-amber-600 dark:text-amber-300">
          Gerencie o faturamento do mês e prepare a distribuição de comissões da unidade BarberBeer.
        </p>
      </div>

      {/* Cards de Faturamento e Comissão */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Card Faturamento Total */}
        <Card.Root className="shadow-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <Card.Header className="flex items-center gap-3">
            <CurrencyDollarIcon className="h-7 w-7 text-amber-500" />
            <span className="text-lg font-semibold text-amber-800 dark:text-amber-300">
              Faturamento Total do Mês
            </span>
          </Card.Header>
          <Card.Body>
            <span className="text-3xl font-bold text-amber-700 dark:text-amber-400">
              R$ {faturamentoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </Card.Body>
        </Card.Root>
        {/* Card Comissão */}
        <Card.Root className="shadow-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <Card.Header className="flex items-center gap-3">
            <CurrencyDollarIcon className="h-7 w-7 text-orange-500" />
            <span className="text-lg font-semibold text-orange-800 dark:text-orange-300">
              Comissão
            </span>
          </Card.Header>
          <Card.Body>
            <span className="text-3xl font-bold text-orange-700 dark:text-orange-400">
              R$ {comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </Card.Body>
        </Card.Root>
      </div>

      {/* Formulário de novo faturamento */}
      <form
        onSubmit={handleAdicionar}
        className="flex flex-col md:flex-row gap-4 items-stretch md:items-end mb-8"
      >
        <div className="flex-1">
          <div>
            <label className="block text-xs mb-1">Valor</label>
            <Input type="number" placeholder="0,00" value={valor} onChange={e=>setValor(e.target.value)} min={0} step={0.01} required />
          </div>
        </div>
        <div className="flex-1">
          <div>
            <label className="block text-xs mb-1">Descrição</label>
            <Input type="text" placeholder="Ex: Corte, Barba, etc." value={descricao} onChange={e=>setDescricao(e.target.value)} required />
          </div>
        </div>
        <div className="flex-1">
          <div>
            <label className="block text-xs mb-1">Data</label>
            <Input type="date" value={data} onChange={e=>setData(e.target.value)} required />
          </div>
        </div>
        <Button
          type="submit"
          color="warning"
          className="w-full md:w-auto font-bold"
          startContent={<PlusIcon className="w-5 h-5" />}
        >
          Adicionar Faturamento
        </Button>
      </form>

      {/* Lista de lançamentos do mês */}
      <Card.Root className="shadow border border-amber-200">
        <Card.Header className="bg-amber-50 dark:bg-amber-900">
          <span className="text-lg font-semibold text-amber-800 dark:text-amber-300">
            Lançamentos do Mês
          </span>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center text-amber-500">Carregando...</div>
          ) : erro ? (
            <div className="text-center text-red-500">{erro}</div>
          ) : lancamentos.length === 0 ? (
            <div className="text-center text-amber-500">Nenhum lançamento adicionado ainda.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-amber-200 dark:divide-amber-700">
                <thead className="bg-amber-100 dark:bg-amber-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-amber-700 uppercase">Data</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-amber-700 uppercase">Descrição</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-amber-700 uppercase">Valor (R$)</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-amber-700 uppercase"></th>
                  </tr>
                </thead>
                <tbody>
                  {lancamentos.map(l => (
                    <tr key={l.id} className="hover:bg-amber-50 dark:hover:bg-amber-900">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-amber-900 dark:text-amber-200">{new Date(l.data).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-amber-900 dark:text-amber-200">{l.descricao}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-semibold text-orange-800 dark:text-orange-300">{Number(l.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
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
        </Card.Body>
      </Card.Root>
    </>
  );
} 





