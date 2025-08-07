"use client";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, Button, Chip, Progress } from '@nextui-org/react';
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
const COLORS = ['#f59e42', '#6366f1', '#22c55e', '#e11d48'];
function exportToCSV(data, filename) {
    const csvRows = [];
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(','));
    for (const row of data) {
        const values = headers.map(h => { var _a; return JSON.stringify((_a = row[h]) !== null && _a !== void 0 ? _a : ''); });
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
export default function DashboardAssinaturas() {
    const [assinaturas, setAssinaturas] = useState([]);
    const { pagamentos } = usePagamentosAsaas({ dataInicio: dayjs().startOf('year').format('YYYY-MM-DD'), dataFim: dayjs().endOf('year').format('YYYY-MM-DD') });
    useEffect(() => { getAssinaturas().then(setAssinaturas); }, []);
    // Unir pagamentos do Asaas e assinaturas em dinheiro
    const todosPagamentos = [
        ...pagamentos.map(p => ({
            id: p.payment_id,
            nome: p.customer_name,
            valor: p.valor,
            status: p.status,
            data_pagamento: p.payment_date,
            tipo_pagamento: (p.billing_type || '').toUpperCase(),
            origem: 'asaas',
        })),
        ...assinaturas.map(a => ({
            id: a.id,
            nome: a.nome_cliente || '',
            valor: a.price,
            status: a.status,
            data_pagamento: a.created_at,
            tipo_pagamento: (a.forma_pagamento || '').toUpperCase(),
            origem: 'dinheiro',
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
        setFiltrosAplicados(Object.assign({}, filtros));
    }
    // Função para filtrar os dados
    function filtrarDados(pagamentos) {
        return pagamentos.filter(p => {
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
    const assinaturasAtivas = pagamentosMesVigente.filter(p => p.status === 'CONFIRMED' && (p.tipo_pagamento === 'CREDIT_CARD' || p.tipo_pagamento === 'PIX'));
    const faturamento = pagamentosMesVigente.filter(p => p.status === 'CONFIRMED').reduce((acc, p) => acc + Number(p.valor), 0);
    const inadimplentes = pagamentosMesVigente.filter(p => p.status !== 'CONFIRMED');
    const cancelados = pagamentosMesVigente.filter(p => p.status === 'CANCELLED');
    // Gráfico de faturamento mensal
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const faturamentoMensal = meses.map((mes, i) => {
        const mesNum = i + 1;
        const doMes = todosPagamentosFiltrados.filter(p => dayjs(p.data_pagamento).month() + 1 === mesNum && p.status === 'CONFIRMED');
        return {
            mes,
            Cartao: doMes.filter(p => p.tipo_pagamento === 'CREDIT_CARD').reduce((acc, p) => acc + Number(p.valor), 0),
            PIX: doMes.filter(p => p.tipo_pagamento === 'PIX').reduce((acc, p) => acc + Number(p.valor), 0),
            Dinheiro: doMes.filter(p => p.tipo_pagamento === 'DINHEIRO').reduce((acc, p) => acc + Number(p.valor), 0),
        };
    });
    // Gráfico de pizza por tipo de pagamento
    const tipos = ['CREDIT_CARD', 'PIX', 'DINHEIRO'];
    const pieData = tipos.map(tipo => ({
        name: tipo === 'CREDIT_CARD' ? 'Cartão' : tipo.charAt(0) + tipo.slice(1).toLowerCase(),
        value: todosPagamentosFiltrados.filter(p => p.tipo_pagamento === tipo && p.status === 'CONFIRMED').reduce((acc, p) => acc + Number(p.valor), 0)
    }));
    // Tabela analítica
    const tabelaDados = todosPagamentosFiltrados.map(p => ({
        Cliente: p.nome,
        Plano: p.plano,
        Valor: Number(p.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        Status: p.status,
        Data: dayjs(p.data_pagamento).tz('America/Sao_Paulo').format('DD/MM/YYYY'),
        Tipo: p.tipo_pagamento === 'CREDIT_CARD' ? 'Cartão' : p.tipo_pagamento === 'PIX' ? 'PIX' : p.tipo_pagamento === 'DINHEIRO' ? 'Dinheiro' : p.tipo_pagamento
    }));
    return (<DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10 font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1 flex items-center gap-2">
              <ChartBarIcon className="w-7 h-7 text-primary-500"/> Dashboard de Assinaturas
            </h1>
            <p className="text-default-500">Visão financeira e analítica das assinaturas</p>
          </div>
          <div className="flex gap-2">
            <Button color="primary" variant="flat">Atualizar Dados</Button>
            <Button color="success" onClick={() => exportToCSV(tabelaDados, 'assinaturas.csv')}>Exportar CSV</Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4 items-end bg-white rounded-xl shadow p-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Período</label>
            <input type="date" className="w-36 px-2 py-1 border rounded" value={filtros.dataInicio} onChange={e => setFiltros(f => (Object.assign(Object.assign({}, f), { dataInicio: e.target.value })))}/>
            <span className="mx-2 text-gray-500">até</span>
            <input type="date" className="w-36 px-2 py-1 border rounded" value={filtros.dataFim} onChange={e => setFiltros(f => (Object.assign(Object.assign({}, f), { dataFim: e.target.value })))}/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select className="px-3 py-2 rounded-lg border border-zinc-300 bg-white text-zinc-800 focus:outline-none" value={filtros.status} onChange={e => setFiltros(f => (Object.assign(Object.assign({}, f), { status: e.target.value })))}>
              <option value="">Todos</option>
              <option value="CONFIRMED">Confirmados</option>
              <option value="PENDING">Pendentes</option>
              <option value="CANCELLED">Cancelados</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Pagamento</label>
            <select className="px-3 py-2 rounded-lg border border-zinc-300 bg-white text-zinc-800 focus:outline-none" value={filtros.tipoPagamento} onChange={e => setFiltros(f => (Object.assign(Object.assign({}, f), { tipoPagamento: e.target.value })))}>
              <option value="">Todos</option>
              <option value="CREDIT_CARD">Cartão</option>
              <option value="PIX">PIX</option>
              <option value="DINHEIRO">Dinheiro</option>
            </select>
          </div>
          <Button color="primary" className="h-10" onClick={aplicarFiltros}>Filtrar</Button>
        </div>

        {/* Cards de KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white rounded-2xl shadow-md border-t-4 border-orange-500 flex flex-col items-center justify-center p-6 gap-2 animate-fade-in">
            <span className="text-xs text-gray-500 font-semibold">Assinaturas Ativas</span>
            <span className="text-3xl font-bold text-orange-600">{assinaturasAtivas.length}</span>
            <span className="text-xs text-gray-400">Total CONFIRMED</span>
          </Card>
          <Card className="bg-white rounded-2xl shadow-md border-t-4 border-purple-500 flex flex-col items-center justify-center p-6 gap-2 animate-fade-in">
            <span className="text-xs text-gray-500 font-semibold">Faturamento</span>
            <span className="text-3xl font-bold text-purple-600">R$ {faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            <Progress value={0} color="secondary" className="w-full mt-2"/>
          </Card>
          <Card className="bg-white rounded-2xl shadow-md border-t-4 border-green-500 flex flex-col items-center justify-center p-6 gap-2 animate-fade-in">
            <span className="text-xs text-gray-500 font-semibold">Inadimplentes</span>
            <span className="text-3xl font-bold text-green-600">{inadimplentes.length}</span>
            <span className="text-xs text-gray-400">Pagamentos atrasados</span>
          </Card>
          <Card className="bg-white rounded-2xl shadow-md border-t-4 border-blue-500 flex flex-col items-center justify-center p-6 gap-2 animate-fade-in">
            <span className="text-xs text-gray-500 font-semibold">Cancelamentos</span>
            <span className="text-3xl font-bold text-blue-600">{cancelados.length}</span>
            <span className="text-xs text-gray-400">Assinaturas canceladas</span>
          </Card>
        </div>

        {/* Gráfico de Faturamento Mensal */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8 min-h-[350px] flex flex-col items-center justify-center">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-5 h-5 text-primary-500"/> Faturamento Mensal
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={faturamentoMensal} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="mes"/>
              <YAxis tickFormatter={v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}/>
              <Tooltip formatter={v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}/>
              <Legend formatter={(value) => {
            if (value === 'Cartao')
                return <span style={{ color: '#f59e42' }}>Cartão</span>;
            if (value === 'PIX')
                return <span style={{ color: '#6366f1' }}>PIX</span>;
            if (value === 'Dinheiro')
                return <span style={{ color: '#22c55e' }}>Dinheiro</span>;
            return value;
        }}/>
              <Line type="monotone" dataKey="Cartao" stroke="#f59e42" strokeWidth={3} activeDot={{ r: 8 }}/>
              <Line type="monotone" dataKey="PIX" stroke="#6366f1" strokeWidth={3}/>
              <Line type="monotone" dataKey="Dinheiro" stroke="#22c55e" strokeWidth={3}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Pizza por Tipo de Pagamento */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8 min-h-[300px] flex flex-col items-center justify-center">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-primary-500"/> Distribuição por Tipo de Pagamento
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>
                {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>))}
              </Pie>
              <Tooltip formatter={v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}/>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela Analítica */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Tabela Analítica de Assinaturas</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead>
                <tr className="bg-gray-50 text-gray-800 font-bold">
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Plano</th>
                  <th className="px-4 py-3 text-left">Valor</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {tabelaDados.map((row, i) => (<tr key={i} className="border-b hover:bg-gray-50 transition-all">
                    <td className="px-4 py-2">{row.Cliente}</td>
                    <td className="px-4 py-2">{row.Plano}</td>
                    <td className="px-4 py-2 font-bold text-blue-700">{row.Valor}</td>
                    <td className="px-4 py-2"><Chip color={row.Status === 'CONFIRMED' ? 'success' : row.Status === 'PENDING' ? 'warning' : row.Status === 'CANCELLED' ? 'danger' : 'default'} size="sm">{row.Status}</Chip></td>
                    <td className="px-4 py-2">{row.Data}</td>
                    <td className="px-4 py-2">{row.Tipo}</td>
                    <td className="px-4 py-2 text-center"><Button size="sm" variant="light">Ver</Button></td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>);
}
