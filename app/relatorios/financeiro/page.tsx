"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PeriodFilters from "../components/PeriodFilters";
import KPICard from "../components/KPICard";
import { getFinanceiroData } from "../actions";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16"];

export default function RelatoriosFinanceiroPage() {
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Awaited<ReturnType<typeof getFinanceiroData>> | null>(null);
  const from = params.get('from')!;
  const to = params.get('to')!;

  useEffect(() => {
    let mounted = true;
    async function run() {
      setLoading(true);
      try {
        const res = await getFinanceiroData({ from, to });
        if (mounted) setData(res);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (from && to) void run();
    return () => { mounted = false; };
  }, [from, to]);

  return (
    <div className="space-y-4">
      {/* Cabeçalho e Tabs */}
      <div className="space-y-2">
        <div>
          <div className="text-xl font-bold">Relatórios</div>
          <div className="text-sm text-muted-foreground -mt-1">Estes são os seus relatórios</div>
        </div>
        <div className="rounded-md bg-muted/40 p-1 flex gap-1 text-xs font-bold uppercase tracking-wide">
          <a className="px-4 py-2 rounded hover:bg-background/70 text-muted-foreground" href="/relatorios/principal">Principal</a>
          <a className="px-4 py-2 rounded hover:bg-background/70 text-muted-foreground" href="/relatorios/agenda">Agenda</a>
          <a className="px-4 py-2 rounded bg-background border border-border" href="#" aria-current="page">Financeiro</a>
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
        <KPICard label="Comissão acumulada" variant="primary" value={(data?.kpis.comissaoAcumulada ?? 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' })} />
        <KPICard label="Total de sangrias" variant="danger" value={(data?.kpis.totalSangrias ?? 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' })} />
        <KPICard label="Comandas abertas" variant="warning" value={String(data?.kpis.comandasAbertas ?? 0)} />
        <KPICard label="Comandas fechadas" variant="success" value={String(data?.kpis.comandasFechadas ?? 0)} />
      </div>

      {/* Serviços realizados (tabela) + Quantidade por profissional (gráfico) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card">
          <div className="text-sm font-semibold p-3 border-b">Serviços realizados (Comandas)</div>
          <div className="overflow-x-auto max-h-[300px]">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-muted/70">
                <tr>
                  <th className="p-2 text-left">Cliente</th>
                  <th className="p-2 text-left">Serviço</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(data?.servicosRealizados || []).map((r, i) => (
                  <tr key={i} className="border-t odd:bg-muted/30">
                    <td className="p-2">{r.cliente}</td>
                    <td className="p-2">{r.servico}</td>
                    <td className="p-2 text-right">{r.total.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })}</td>
                  </tr>
                ))}
                {(!data || (data?.servicosRealizados?.length ?? 0) === 0) && (
                  <tr><td className="p-4 text-center text-muted-foreground" colSpan={3}>Sem dados no período.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="text-sm font-semibold mb-2">Quantidade de serviços realizados por profissional</div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.quantPorProfissional || []} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="nome" type="category" width={90} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: any) => Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                <Bar dataKey="quantidade" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Receitas por origem */}
      <div className="rounded-lg border bg-card p-3">
        <div className="text-sm font-semibold mb-2">Receitas por origem</div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data?.receitasPorOrigem || []}
                dataKey="valor"
                nameKey="origem"
                innerRadius={60}
                label={(entry: any) => Number(entry.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              >
                {(data?.receitasPorOrigem || []).map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
              </Pie>
                <Tooltip formatter={(v: any) => Number(v).toLocaleString('pt-BR', { style:'currency', currency:'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}


