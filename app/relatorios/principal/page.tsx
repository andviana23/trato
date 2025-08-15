"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PeriodFilters from "../components/PeriodFilters";
import KPICard from "../components/KPICard";
import { getPrincipalData } from "../actions";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16"]; // azul, verde, etc

export default function RelatoriosPrincipalPage() {
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Awaited<ReturnType<typeof getPrincipalData>> | null>(null);

  const from = params.get('from')!;
  const to = params.get('to')!;

  useEffect(() => {
    let mounted = true;
    async function run() {
      setLoading(true);
      try {
        const res = await getPrincipalData({ from, to });
        if (mounted) setData(res);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (from && to) void run();
    return () => { mounted = false; };
  }, [from, to]);

  const totalForma = useMemo(() => (data?.porFormaPagamento.reduce((s, f) => s + f.valor, 0) || 0), [data]);

  return (
    <div className="space-y-4">
      {/* Cabeçalho e Tabs */}
      <div className="space-y-2">
        <div>
          <div className="text-xl font-bold">Relatórios</div>
          <div className="text-sm text-muted-foreground -mt-1">Estes são os seus relatórios</div>
        </div>
        <div className="rounded-md bg-muted/40 p-1 flex gap-1 text-xs font-bold uppercase tracking-wide">
          <a className="px-4 py-2 rounded bg-background border border-border" href="#" aria-current="page">Principal</a>
          <a className="px-4 py-2 rounded hover:bg-background/70 text-muted-foreground" href="/relatorios/agenda">Agenda</a>
          <a className="px-4 py-2 rounded hover:bg-background/70 text-muted-foreground" href="/relatorios/financeiro">Financeiro</a>
          <a className="px-4 py-2 rounded hover:bg-background/70 text-muted-foreground" href="/relatorios/avancados">Avançados</a>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <PeriodFilters />
        {loading && (<div className="text-sm text-muted-foreground">Carregando…</div>)}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <KPICard label="Faturamento" variant="primary" value={(data?.kpis.faturamento ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
        <KPICard label="Despesas" variant="danger" value={(data?.kpis.despesas ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
        <KPICard label="Agendamentos Online" variant="warning" value={String(data?.kpis.agendamentosOnline ?? 0)} />
        <KPICard label="Saldo" variant={(data?.kpis.saldo ?? 0) >= 0 ? 'success' : 'danger'} value={(data?.kpis.saldo ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
      </div>

      {/* Linha + Tabela Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border p-4 bg-card shadow-sm">
          <div className="text-sm font-semibold mb-2">Faturamento Projetado X Realizado</div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.linha || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: any) => Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                <Legend />
                <Line type="monotone" dataKey="projetado" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="realizado" stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg border p-4 bg-card shadow-sm">
          <div className="text-sm font-semibold mb-2">Agendamentos no período</div>
          <div className="overflow-x-auto max-h-[360px]">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-[1]">
                <tr className="bg-muted/70">
                  <th className="text-left p-2">Nome do status</th>
                  <th className="text-right p-2">Quantidade por status</th>
                  <th className="text-right p-2">Agendamentos em porcentagem</th>
                  <th className="text-right p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {(data?.agendamentosStatus || []).map((row) => (
                  <tr key={row.status} className="border-t odd:bg-muted/30">
                    <td className="p-2">{row.status}</td>
                    <td className="p-2 text-right">{row.quantidade}</td>
                    <td className="p-2 text-right">{row.percentual.toFixed(2)}%</td>
                    <td className="p-2 text-right">{row.total != null ? row.total.toLocaleString('pt-BR', { style:'currency', currency:'BRL' }) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pizza + Clientes em Atendimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border p-4 bg-card shadow-sm">
          <div className="text-sm font-semibold mb-2 flex items-center justify-between">
            <span>Faturamento por forma de pagamento</span>
            <a href={`data:text/csv;charset=utf-8,${encodeURIComponent((data?.porFormaPagamento||[]).map(r=>`${r.forma_pagamento};${r.valor}`).join('\n'))}`} download={`pagamentos_por_forma_${from}_${to}.csv`} className="text-xs underline text-muted-foreground hover:text-foreground">Exportar CSV</a>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.porFormaPagamento || []}
                  dataKey="valor"
                  nameKey="forma_pagamento"
                  innerRadius={60}
                  label={(entry: any) => Number(entry.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                >
                  {(data?.porFormaPagamento || []).map((entry, index) => (
                    <Cell key={`c-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => Number(v).toLocaleString('pt-BR', { style:'currency', currency:'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg border p-6 bg-card shadow-sm grid place-items-center">
          <div className="text-center max-w-xs">
            <img src="/empty.svg" alt="Sem resultados" className="w-24 h-24 mx-auto opacity-70" />
            <div className="font-semibold mt-2">Não encontramos =(</div>
            <div className="text-sm text-muted-foreground">A busca não retornou resultados.</div>
          </div>
        </div>
      </div>
    </div>
  );
}


