"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PeriodFilters from "../components/PeriodFilters";
import { getAgendaData } from "../actions";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16"];

export default function RelatoriosAgendaPage() {
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Awaited<ReturnType<typeof getAgendaData>> | null>(null);
  const from = params.get('from')!;
  const to = params.get('to')!;

  useEffect(() => {
    let mounted = true;
    async function run() {
      setLoading(true);
      try {
        const res = await getAgendaData({ from, to });
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
          <a className="px-4 py-2 rounded bg-background border border-border" href="#" aria-current="page">Agenda</a>
          <a className="px-4 py-2 rounded hover:bg-background/70 text-muted-foreground" href="/relatorios/financeiro">Financeiro</a>
          <a className="px-4 py-2 rounded hover:bg-background/70 text-muted-foreground" href="/relatorios/avancados">Avançados</a>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <PeriodFilters />
        {loading && (<div className="text-sm text-muted-foreground">Carregando…</div>)}
      </div>

      {/* Lista de agendamentos futuros + desempenho por profissional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card">
          <div className="text-sm font-semibold p-3 border-b">Lista dos Agendamentos futuros</div>
          <div className="overflow-auto max-h-[300px]">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-muted/70">
                <tr>
                  <th className="p-2 text-left">Cliente</th>
                  <th className="p-2 text-left">Responsável</th>
                  <th className="p-2 text-left">Horário</th>
                  <th className="p-2 text-left">Data</th>
                </tr>
              </thead>
              <tbody>
                {(data?.futuros || []).map((r, i) => (
                  <tr key={i} className="border-t odd:bg-muted/30">
                    <td className="p-2">{r.cliente ?? '-'}</td>
                    <td className="p-2">{r.responsavel ?? '-'}</td>
                    <td className="p-2">{r.horario ?? '-'}</td>
                    <td className="p-2">{r.data}</td>
                  </tr>
                ))}
                {(!data || (data?.futuros?.length ?? 0) === 0) && (
                  <tr><td className="p-4 text-center text-muted-foreground" colSpan={4}>Sem agendamentos futuros.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="text-sm font-semibold mb-2">Desempenho por profissional</div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.desempenhoProfissional || []} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="valor" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Profissionais mais requisitados + Serviços mais requisitados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-3">
          <div className="text-sm font-semibold mb-2">Profissionais mais requisitados</div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.profissionaisMaisRequisitados || []} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="nome" type="category" width={90} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="text-sm font-semibold mb-2 flex items-center justify-between">
            <span>Serviços mais requisitados em Agendamentos (Top 5)</span>
            <a href={`data:text/csv;charset=utf-8,${encodeURIComponent((data?.servicosTop||[]).map(r=>`${r.nome};${r.quantidade}`).join('\n'))}`} download={`servicos_top_${from}_${to}.csv`} className="text-xs underline text-muted-foreground hover:text-foreground">Exportar CSV</a>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.servicosTop || []} dataKey="quantidade" nameKey="nome" label innerRadius={50}>
                  {(data?.servicosTop || []).map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top clientes frequentes + Aniversariantes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card">
          <div className="text-sm font-semibold p-3 border-b">Top Clientes frequentes</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/70">
                <tr>
                  <th className="p-2 text-left">Cliente</th>
                  <th className="p-2 text-left">Número de comandos</th>
                  <th className="p-2 text-left">Total Serviços</th>
                </tr>
              </thead>
              <tbody>
                {(data?.topClientes || []).map((r, i) => (
                  <tr key={i} className="border-t odd:bg-muted/30">
                    <td className="p-2">{r.nome}</td>
                    <td className="p-2">{r.comandos}</td>
                    <td className="p-2">{r.totalServicos.toLocaleString('pt-BR', { style:'currency', currency: 'BRL' })}</td>
                  </tr>
                ))}
                {(!data || (data?.topClientes?.length ?? 0) === 0) && (
                  <tr><td className="p-4 text-center text-muted-foreground" colSpan={3}>Sem dados no período.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 grid place-items-center">
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


