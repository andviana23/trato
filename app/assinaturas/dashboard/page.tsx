"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ChartBarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { useEffect, useState } from 'react';
import { getAssinaturas } from '@/lib/services/subscriptions';
import { usePagamentosAsaas } from '../assinantes/hooks/usePagamentosAsaas';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

// Paleta fixa para gráficos (hex) para garantir cores no Recharts
const FALLBACK_COLORS = ['#f59e0b', '#6366f1', '#22c55e', '#ef4444'] as const;

type Pagamento = {
  id: string;
  nome: string;
  valor: number;
  status: string;
  data_pagamento: string;
  tipo_pagamento: string;
  origem: string;
  plano?: string;
};

type LinhaTabela = {
  Cliente: string;
  Plano?: string;
  Valor: string;
  Status: string;
  Data: string;
  Tipo: string;
};

function exportToCSV<T extends Record<string, unknown>>(data: T[], filename: string) {
  const csvRows = [];
  const headers = Object.keys(data[0]);
  csvRows.push(headers.join(','));
  for (const row of data as Array<Record<string, unknown>>) {
    const values = headers.map((h) => JSON.stringify(row[h] ?? ''));
    csvRows.push(values.join(','));
  }
  const csv = csvRows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

type Assinatura = { id: string; nome_cliente?: string; price: number; status: string; created_at: string; forma_pagamento?: string; plano?: string };
export default function DashboardAssinaturas() {
  const COLORS: string[] = FALLBACK_COLORS as unknown as string[];
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const { pagamentos } = usePagamentosAsaas({ dataInicio: dayjs().startOf('year').format('YYYY-MM-DD'), dataFim: dayjs().endOf('year').format('YYYY-MM-DD') });
  useEffect(() => {
    getAssinaturas().then((res) => setAssinaturas(res as unknown as Assinatura[]));
  }, []);

  // Unir pagamentos do Asaas e assinaturas em dinheiro
  const todosPagamentos: Pagamento[] = [
    ...pagamentos.map(p => ({
      id: p.payment_id,
      nome: p.customer_name,
      valor: p.valor,
      status: p.status,
      data_pagamento: p.payment_date,
      tipo_pagamento: (p.billing_type || '').toUpperCase(),
      origem: 'asaas',
    })),
    ...assinaturas.map((a) => ({
      id: a.id,
      nome: a.nome_cliente || '',
      valor: a.price,
      status: a.status,
      data_pagamento: a.created_at,
      tipo_pagamento: (a.forma_pagamento || '').toUpperCase(),
      origem: ['DINHEIRO', 'PIX'].includes((a.forma_pagamento || '').toUpperCase()) ? (a.forma_pagamento || '').toLowerCase() : 'dinheiro',
    }))
  ];

  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    status: '',
    tipoPagamento: ''
  });
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtros);

  // Função para aplicar os filtros ao clicar no botão
  function aplicarFiltros() {
    setFiltrosAplicados({ ...filtros });
  }

  // Função para filtrar os dados
  function filtrarDados(pagamentos: Pagamento[]): Pagamento[] {
    return pagamentos.filter((p: Pagamento) => {
      const dataOk = (!filtrosAplicados.dataInicio || dayjs(p.data_pagamento).isSameOrAfter(filtrosAplicados.dataInicio)) &&
        (!filtrosAplicados.dataFim || dayjs(p.data_pagamento).isSameOrBefore(filtrosAplicados.dataFim));
      const statusOk = !filtrosAplicados.status || p.status === filtrosAplicados.status;
      const tipoOk = !filtrosAplicados.tipoPagamento || p.tipo_pagamento === filtrosAplicados.tipoPagamento;
      return dataOk && statusOk && tipoOk;
    });
  }

  const todosPagamentosFiltrados = filtrarDados(todosPagamentos);

  // Filtro para o mês vigente no fuso de São Paulo
  const inicioMes = dayjs().tz('America/Sao_Paulo').startOf('month');
  const fimMes = dayjs().tz('America/Sao_Paulo').endOf('month');
  const pagamentosMesVigente = todosPagamentosFiltrados.filter(p => {
    const data = dayjs(p.data_pagamento).tz('America/Sao_Paulo');
    return data.isSameOrAfter(inicioMes) && data.isSameOrBefore(fimMes);
  });

  // KPIs do mês vigente
  const assinaturasAtivas = pagamentosMesVigente.filter(
    (p: Pagamento) => p.status === 'CONFIRMED' && (p.tipo_pagamento === 'CREDIT_CARD' || p.tipo_pagamento === 'PIX' || p.tipo_pagamento === 'DINHEIRO')
  );
  const faturamento = pagamentosMesVigente
    .filter((p: Pagamento) => p.status === 'CONFIRMED')
    .reduce((acc: number, p: Pagamento) => acc + Number(p.valor), 0);
  const inadimplentes = pagamentosMesVigente.filter((p: Pagamento) => p.status !== 'CONFIRMED');
  const cancelados = pagamentosMesVigente.filter((p: Pagamento) => p.status === 'CANCELLED');

  // Gráfico de faturamento mensal
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const faturamentoMensal = meses.map((mes, i) => {
    const mesNum = i + 1;
    const doMes = todosPagamentosFiltrados.filter((p: Pagamento) => dayjs(p.data_pagamento).month() + 1 === mesNum && p.status === 'CONFIRMED');
    return {
      mes,
      Cartao: doMes.filter((p: Pagamento) => p.tipo_pagamento === 'CREDIT_CARD').reduce((acc: number, p: Pagamento) => acc + Number(p.valor), 0),
      PIX: doMes.filter((p: Pagamento) => p.tipo_pagamento === 'PIX').reduce((acc: number, p: Pagamento) => acc + Number(p.valor), 0),
      Dinheiro: doMes.filter((p: Pagamento) => p.tipo_pagamento === 'DINHEIRO').reduce((acc: number, p: Pagamento) => acc + Number(p.valor), 0),
    };
  });

  // Gráfico de pizza por tipo de pagamento
  const tipos = ['CREDIT_CARD', 'PIX', 'DINHEIRO'];
  const pieData: { name: string; value: number }[] = tipos.map((tipo) => ({
    name: tipo === 'CREDIT_CARD' ? 'Cartão' : tipo.charAt(0) + tipo.slice(1).toLowerCase(),
    value: todosPagamentosFiltrados.filter((p: Pagamento) => p.tipo_pagamento === tipo && p.status === 'CONFIRMED').reduce((acc: number, p: Pagamento) => acc + Number(p.valor), 0)
  }));

  // Tabela analítica
  const tabelaDados: LinhaTabela[] = todosPagamentosFiltrados.map((p: Pagamento) => ({
    Cliente: p.nome,
    Plano: p.plano,
    Valor: Number(p.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    Status: p.status,
    Data: dayjs(p.data_pagamento).tz('America/Sao_Paulo').format('DD/MM/YYYY'),
    Tipo: p.tipo_pagamento === 'CREDIT_CARD' ? 'Cartão' : p.tipo_pagamento === 'PIX' ? 'PIX' : p.tipo_pagamento === 'DINHEIRO' ? 'Dinheiro' : p.tipo_pagamento
  }));

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Assinaturas</h1>
          <p className="text-muted-foreground">Visão financeira e analítica das assinaturas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Atualizar Dados</Button>
          <Button onClick={() => exportToCSV(tabelaDados, 'assinaturas.csv')}>Exportar CSV</Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-card border rounded-lg p-4 mb-4">
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Período</p>
            <div className="flex items-center gap-2">
              <Input type="date" value={filtros.dataInicio} onChange={(e) => setFiltros((f) => ({ ...f, dataInicio: e.target.value }))} className="w-44" aria-label="Data inicial" />
              <span className="text-muted-foreground">até</span>
              <Input type="date" value={filtros.dataFim} onChange={(e) => setFiltros((f) => ({ ...f, dataFim: e.target.value }))} className="w-44" aria-label="Data final" />
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <Select value={filtros.status} onValueChange={(val)=>setFiltros((f)=>({ ...f, status: val }))}>
              <select className="hidden" />
            </Select>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tipo de Pagamento</p>
            <Select value={filtros.tipoPagamento} onValueChange={(val)=>setFiltros((f)=>({ ...f, tipoPagamento: val }))}>
              <select className="hidden" />
            </Select>
          </div>
          <Button onClick={aplicarFiltros}>Filtrar</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card border p-6 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Assinaturas Ativas</p>
          <p className="text-2xl font-bold text-orange-600">{assinaturasAtivas.length}</p>
          <p className="text-xs text-muted-foreground">Total CONFIRMED</p>
        </div>
        <div className="bg-card border p-6 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Faturamento</p>
          <p className="text-2xl font-bold text-purple-600">{faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div className="bg-card border p-6 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Inadimplentes</p>
          <p className="text-2xl font-bold text-green-600">{inadimplentes.length}</p>
        </div>
        <div className="bg-card border p-6 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Cancelamentos</p>
          <p className="text-2xl font-bold text-blue-600">{cancelados.length}</p>
        </div>
      </div>

        {/* Gráfico de Faturamento Mensal */}
        <Card className="mb-8">
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <ArrowTrendingUpIcon width={20} height={20} />
              <h2 className="text-lg font-semibold">Faturamento Mensal</h2>
            </div>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={faturamentoMensal} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                  <Tooltip formatter={v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                  <Legend formatter={(value) => {
                    if (value === 'Cartao') return <span style={{ color: '#f59e42' }}>Cartão</span>;
                    if (value === 'PIX') return <span style={{ color: '#6366f1' }}>PIX</span>;
                    if (value === 'Dinheiro') return <span style={{ color: '#22c55e' }}>Dinheiro</span>;
                    return value;
                  }} />
                  <Line type="monotone" dataKey="Cartao" stroke="#f59e42" strokeWidth={3} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="PIX" stroke="#6366f1" strokeWidth={3} />
                  <Line type="monotone" dataKey="Dinheiro" stroke="#22c55e" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza por Tipo de Pagamento (mais analítico) */}
        <Card className="mb-8">
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <ChartBarIcon width={20} height={20} />
              <h2 className="text-lg font-semibold">Distribuição por Tipo de Pagamento</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Donut com percentuais */}
              <div className="col-span-2 w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Tabela resumo com valores, percentuais e variação vs média */}
              <div className="border rounded-lg p-3">
                <h3 className="text-sm font-semibold mb-2">Resumo</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="text-left py-1">Tipo</th>
                      <th className="text-right py-1">Valor</th>
                      <th className="text-right py-1">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const total = pieData.reduce((acc, d) => acc + d.value, 0);
                      return pieData.map((d, i) => (
                        <tr key={d.name}>
                          <td className="py-1">
                            <span className="inline-block w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            {d.name}
                          </td>
                          <td className="py-1 text-right">{`R$ ${Number(d.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</td>
                          <td className="py-1 text-right">{total ? `${((d.value / total) * 100).toFixed(1)}%` : '0%'}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Tabela Analítica */}
      <div className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Tabela Analítica de Assinaturas</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tabelaDados.map((row: LinhaTabela, i: number) => (
                <TableRow key={i}>
                  <TableCell>{row.Cliente}</TableCell>
                  <TableCell>{row.Plano}</TableCell>
                  <TableCell>{row.Valor}</TableCell>
                  <TableCell>{row.Status}</TableCell>
                  <TableCell>{row.Data}</TableCell>
                  <TableCell>{row.Tipo}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="secondary" size="sm">Ver</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 
