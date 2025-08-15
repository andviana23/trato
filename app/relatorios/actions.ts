"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUnidade } from "@/lib/unidade";
import { periodSchema, PrincipalPayload } from "./schemas";

type ReceitaRow = { id: string; unidade: string; data_competencia: string; valor: number; forma_pagamento: string; origem: string; status: string };
type DespesaRow = { id: string; unidade: string; data_competencia: string; valor: number; categoria: string; status: string };
type AgRow = { id: string; unidade: string; data: string; status: string; origem: string; total?: number };

export async function getPrincipalData(params: unknown): Promise<PrincipalPayload> {
  const { from, to } = periodSchema.parse(params);
  const supabase = await createClient();
  const unidade = await getCurrentUnidade();

  const [recRes, desRes, agRes] = await Promise.all([
    supabase
      .from("receitas")
      .select("id, unidade, data_competencia, valor, forma_pagamento, origem, status")
      .eq("unidade", unidade)
      .gte("data_competencia", from)
      .lte("data_competencia", to)
      .eq("status", "compensado"),
    supabase
      .from("despesas")
      .select("id, unidade, data_competencia, valor, categoria, status")
      .eq("unidade", unidade)
      .gte("data_competencia", from)
      .lte("data_competencia", to)
      .eq("status", "efetivado"),
    supabase
      .from("agendamentos")
      .select("id, unidade, data, status, origem")
      .eq("unidade", unidade)
      .gte("data", from)
      .lte("data", to),
  ]);

  const receitas = (recRes.data || []) as ReceitaRow[];
  const despesas = (desRes.data || []) as DespesaRow[];
  const ags = (agRes.data || []) as AgRow[];

  // Assinaturas (ASAAS + internas) – somadas ao faturamento total
  type Asaas = { valor?: number; status?: string; payment_date: string; billing_type?: string };
  let asaas: Asaas[] = [];
  {
    const r1 = await supabase
      .from('pagamentos_asaas')
      .select('valor, status, payment_date, billing_type, unidade')
      .eq('status', 'CONFIRMED')
      .gte('payment_date', from)
      .lte('payment_date', to)
      .eq('unidade', unidade);
    if (r1.error && (r1.error as { code?: string }).code === '42703') {
      const { data, error } = await supabase
        .from('pagamentos_asaas')
        .select('valor, status, payment_date, billing_type')
        .eq('status', 'CONFIRMED')
        .gte('payment_date', from)
        .lte('payment_date', to);
      if (!error) asaas = (data || []) as Asaas[];
    } else if (!r1.error) {
      asaas = (r1.data || []) as Asaas[];
    }
  }

  type AssRow = { price?: number; status?: string; created_at: string; forma_pagamento?: string };
  let assRows: AssRow[] = [];
  {
    const r1 = await supabase
      .from('assinaturas')
      .select('price, status, created_at, forma_pagamento, unidade')
      .eq('status', 'CONFIRMED')
      .gte('created_at', from)
      .lte('created_at', to)
      .eq('unidade', unidade);
    if (r1.error && (r1.error as { code?: string }).code === '42703') {
      const { data, error } = await supabase
        .from('assinaturas')
        .select('price, status, created_at, forma_pagamento')
        .eq('status', 'CONFIRMED')
        .gte('created_at', from)
        .lte('created_at', to);
      if (!error) assRows = (data || []) as AssRow[];
    } else if (!r1.error) {
      assRows = (r1.data || []) as AssRow[];
    }
  }

  const totalAssinaturas =
    asaas.reduce((s, p) => s + (p.status === 'CONFIRMED' ? Number(p.valor) || 0 : 0), 0) +
    assRows.reduce((s, a) => s + (String(a.status).toUpperCase() === 'CONFIRMED' ? Number(a.price) || 0 : 0), 0);

  const faturamento = receitas.reduce((s, r) => s + (Number(r.valor) || 0), 0) + totalAssinaturas;
  const totalDespesas = despesas.reduce((s, d) => s + (Number(d.valor) || 0), 0);
  const agOnline = ags.filter((a) => a.origem?.toLowerCase() === "online").length;

  // Série diária realizado
  const dayMap = new Map<string, { projetado: number; realizado: number }>();
  // Preenche todos os dias do período
  const start = new Date(from);
  const end = new Date(to);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, { projetado: 0, realizado: 0 });
  }
  // Realizado por dia
  for (const r of receitas) {
    const key = new Date(r.data_competencia).toISOString().slice(0, 10);
    const cur = dayMap.get(key);
    if (cur) cur.realizado += Number(r.valor) || 0;
  }
  // Realizado por dia — assinaturas (asaas + internas)
  for (const p of asaas) {
    const key = new Date(p.payment_date).toISOString().slice(0, 10);
    const cur = dayMap.get(key);
    if (cur) cur.realizado += Number(p.valor) || 0;
  }
  for (const a of assRows) {
    const key = new Date(a.created_at).toISOString().slice(0, 10);
    const cur = dayMap.get(key);
    if (cur) cur.realizado += Number(a.price) || 0;
  }

  // Projeção simples: distribui média diária do mês considerando dias úteis
  const days: string[] = Array.from(dayMap.keys());
  const businessDays = days.filter((iso) => {
    const wd = new Date(iso + "T00:00:00").getDay();
    return wd !== 0 && wd !== 6; // seg-sex
  });
  // Projeção desativada (zerada) até existir página de projeção/meta
  for (const iso of businessDays) {
    const cur = dayMap.get(iso);
    if (cur) cur.projetado = 0;
  }

  const linha = Array.from(dayMap.entries()).map(([date, v]) => ({ date, projetado: v.projetado, realizado: v.realizado }));

  // Agendamentos por status
  const totalAgs = ags.length || 1;
  const statusToCount = new Map<string, number>();
  for (const a of ags) statusToCount.set(a.status || "-", (statusToCount.get(a.status || "-") || 0) + 1);
  const agendamentosStatus = Array.from(statusToCount.entries()).map(([status, quantidade]) => ({ status, quantidade, percentual: (quantidade / totalAgs) * 100, total: undefined }));

  // Faturamento por forma de pagamento
  const formaMap = new Map<string, number>();
  for (const r of receitas) formaMap.set(r.forma_pagamento || "-", (formaMap.get(r.forma_pagamento || "-") || 0) + (Number(r.valor) || 0));
  // incluir assinaturas (ASAAS billing_type) e internas (forma_pagamento)
  for (const p of asaas) {
    const key = (p.billing_type || 'ASSINATURA').toString().toUpperCase();
    formaMap.set(key, (formaMap.get(key) || 0) + (Number(p.valor) || 0));
  }
  for (const a of assRows) {
    const key = (a.forma_pagamento || 'ASSINATURA').toString().toUpperCase();
    formaMap.set(key, (formaMap.get(key) || 0) + (Number(a.price) || 0));
  }
  const porFormaPagamento = Array.from(formaMap.entries()).map(([forma_pagamento, valor]) => ({ forma_pagamento, valor }));

  return {
    kpis: { faturamento, despesas: totalDespesas, agendamentosOnline: agOnline, saldo: faturamento - totalDespesas },
    linha,
    agendamentosStatus,
    porFormaPagamento,
    clientesEmAtendimento: [],
  };
}

// -------- Agenda --------
type AgendaRow = {
  id: string;
  unidade: string;
  data: string;
  status?: string;
  origem?: string;
  cliente?: string;
  responsavel?: string;
  horario?: string;
  profissional?: string;
  profissional_id?: string;
  servico?: string;
  valor?: number;
};

export type AgendaPayload = {
  futuros: Array<{ cliente?: string; responsavel?: string; horario?: string; data: string }>; 
  desempenhoProfissional: Array<{ nome: string; valor: number }>; // soma de valor se existir, senão contagem
  profissionaisMaisRequisitados: Array<{ nome: string; quantidade: number }>; 
  servicosTop: Array<{ nome: string; quantidade: number }>; 
  topClientes: Array<{ nome: string; comandos: number; totalServicos: number }>; 
  aniversariantes: Array<{ id: string; nome: string; data: string }>; // placeholder
};

export async function getAgendaData(params: unknown): Promise<AgendaPayload> {
  const { from, to } = periodSchema.parse(params);
  const supabase = await createClient();
  const unidade = await getCurrentUnidade();

  const selectVariants = [
    "id, unidade, data, status, origem, cliente, responsavel, horario, profissional, profissional_id, servico, valor",
    "id, unidade, data, status, origem, cliente, responsavel, horario, servico",
    "id, unidade, data, status, origem, cliente, responsavel, horario",
    "id, unidade, data, status, origem",
  ];

  let rows: AgendaRow[] = [];
  for (const cols of selectVariants) {
    const { data, error } = await supabase
      .from("agendamentos")
      .select(cols)
      .eq("unidade", unidade)
      .gte("data", from)
      .lte("data", to);
    type PgError = { code?: string };
    if (error && (error as PgError).code === "42703") continue; // coluna inexistente
    if (error) throw error;
    rows = (data ?? []) as unknown as AgendaRow[];
    break;
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const futuros = rows.filter(r => r.data >= todayIso).slice(0, 50).map(r => ({ cliente: r.cliente, responsavel: r.responsavel ?? r.profissional, horario: r.horario, data: r.data }));

  // Desempenho por profissional (soma valor se existir senão count)
  const profMapVal = new Map<string, number>();
  const profMapCnt = new Map<string, number>();
  for (const r of rows) {
    const nome = r.responsavel || r.profissional || "-";
    profMapCnt.set(nome, (profMapCnt.get(nome) || 0) + 1);
    if (typeof r.valor === "number") profMapVal.set(nome, (profMapVal.get(nome) || 0) + (r.valor || 0));
  }
  const desempenhoProfissional = Array.from((profMapVal.size > 0 ? profMapVal : profMapCnt).entries()).map(([nome, valor]) => ({ nome, valor }));

  // Profissionais mais requisitados (por quantidade)
  const profissionaisMaisRequisitados = Array.from(profMapCnt.entries()).map(([nome, quantidade]) => ({ nome, quantidade })).sort((a,b)=>b.quantidade-a.quantidade).slice(0, 10);

  // Serviços mais requisitados (Top 5)
  const servMap = new Map<string, number>();
  for (const r of rows) {
    const nome = r.servico || "-";
    servMap.set(nome, (servMap.get(nome) || 0) + 1);
  }
  const servicosTop = Array.from(servMap.entries()).map(([nome, quantidade]) => ({ nome, quantidade })).sort((a,b)=>b.quantidade-a.quantidade).slice(0, 5);

  // Top clientes frequentes
  const cliMapCnt = new Map<string, number>();
  const cliMapVal = new Map<string, number>();
  for (const r of rows) {
    const nome = r.cliente || "-";
    cliMapCnt.set(nome, (cliMapCnt.get(nome) || 0) + 1);
    if (typeof r.valor === "number") cliMapVal.set(nome, (cliMapVal.get(nome) || 0) + (r.valor || 0));
  }
  const topClientes = Array.from(cliMapCnt.entries())
    .map(([nome, comandos]) => ({ nome, comandos, totalServicos: cliMapVal.get(nome) || comandos }))
    .sort((a,b)=>b.comandos-a.comandos).slice(0, 10);

  return {
    futuros,
    desempenhoProfissional,
    profissionaisMaisRequisitados,
    servicosTop,
    topClientes,
    aniversariantes: [],
  };
}

// -------- Financeiro --------
export type FinanceiroPayload = {
  kpis: { comissaoAcumulada: number; totalSangrias: number; comandasAbertas: number; comandasFechadas: number };
  servicosRealizados: Array<{ cliente: string; servico: string; total: number }>; // tabela
  quantPorProfissional: Array<{ nome: string; quantidade: number }>; // bar chart
  receitasPorOrigem: Array<{ origem: 'assinaturas' | 'avulsos' | 'produtos'; valor: number }>;
};

export async function getFinanceiroData(params: unknown): Promise<FinanceiroPayload> {
  const { from, to } = periodSchema.parse(params);
  const supabase = await createClient();
  const unidade = await getCurrentUnidade();

  // Baseamos em receitas/despesas + agendamentos
  const [recRes, desRes, agRes] = await Promise.all([
    supabase.from('receitas').select('valor, origem, status, data_competencia').eq('unidade', unidade).gte('data_competencia', from).lte('data_competencia', to),
    supabase.from('despesas').select('valor, categoria, status, data_competencia').eq('unidade', unidade).gte('data_competencia', from).lte('data_competencia', to),
    supabase.from('agendamentos').select('status, cliente, responsavel, profissional, servico, valor, data').eq('unidade', unidade).gte('data', from).lte('data', to)
  ]);

  const receitas = (recRes.data || []) as { valor?: number; origem?: string; status?: string; data_competencia: string }[];
  const despesas = (desRes.data || []) as { valor?: number; categoria?: string; status?: string; data_competencia: string }[];
  const ags = (agRes.data || []) as AgendaRow[];

  const comandasAbertas = ags.filter(a => (a.status || '').toLowerCase() === 'aberta').length;
  const comandasFechadas = ags.filter(a => (a.status || '').toLowerCase() === 'fechada' || (a.status || '').toLowerCase() === 'paga').length;

  // Comissao acumulada (exemplo: 40% das receitas de serviços no período)
  const receitasServicos = receitas.filter(r => (r.origem || '').toLowerCase() === 'servico');
  const totalReceitasServicos = receitasServicos.reduce((s, r) => s + (Number(r.valor) || 0), 0);
  const comissaoAcumulada = totalReceitasServicos * 0.4;

  // Total de sangrias (usamos despesas com categoria 'sangria' como proxy)
  type Desp = { valor?: number; categoria?: string };
  const totalSangrias = (despesas as Desp[])
    .filter((d) => (d.categoria || '').toLowerCase() === 'sangria')
    .reduce((sum, d) => sum + (Number(d.valor) || 0), 0);

  // Tabela de serviços realizados (cliente, serviço, total) — a partir de agendamentos com valor
  const servicosRealizados = ags
    .filter((a) => typeof (a as unknown as { valor?: number }).valor === 'number')
    .map((a) => {
      const v = (a as unknown as { valor?: number }).valor ?? 0;
      return { cliente: a.cliente || '-', servico: a.servico || '-', total: Number(v) || 0 };
    });

  // Quantidade por profissional
  const profCnt = new Map<string, number>();
  for (const a of ags) {
    const nome = a.responsavel || a.profissional || '-';
    profCnt.set(nome, (profCnt.get(nome) || 0) + 1);
  }
  const quantPorProfissional = Array.from(profCnt.entries()).map(([nome, quantidade]) => ({ nome, quantidade }));

  // Receitas por origem
  // Assinaturas: pagamentos_asaas CONFIRMED + tabela assinaturas CONFIRMED no período
  type Asaas = { valor?: number; status?: string; payment_date: string };
  let asaas: Asaas[] = [];
  {
    // tenta com coluna unidade (se existir)
    const q1 = supabase
      .from('pagamentos_asaas')
      .select('valor, status, payment_date, unidade')
      .eq('status', 'CONFIRMED')
      .gte('payment_date', from)
      .lte('payment_date', to)
      .eq('unidade', unidade);
    const r1 = await q1;
    if (r1.error && (r1.error as { code?: string }).code === '42703') {
      const { data, error } = await supabase
        .from('pagamentos_asaas')
        .select('valor, status, payment_date')
        .eq('status', 'CONFIRMED')
        .gte('payment_date', from)
        .lte('payment_date', to);
      if (!error) asaas = (data || []) as Asaas[];
    } else if (!r1.error) {
      asaas = (r1.data || []) as Asaas[];
    }
  }

  type AssRow = { price?: number; status?: string; created_at: string };
  let assRows: AssRow[] = [];
  {
    const r1 = await supabase
      .from('assinaturas')
      .select('price, status, created_at, unidade')
      .eq('status', 'CONFIRMED')
      .gte('created_at', from)
      .lte('created_at', to)
      .eq('unidade', unidade);
    if (r1.error && (r1.error as { code?: string }).code === '42703') {
      const { data, error } = await supabase
        .from('assinaturas')
        .select('price, status, created_at')
        .eq('status', 'CONFIRMED')
        .gte('created_at', from)
        .lte('created_at', to);
      if (!error) assRows = (data || []) as AssRow[];
    } else if (!r1.error) {
      assRows = (r1.data || []) as AssRow[];
    }
  }

  const totalAssinaturas =
    asaas.reduce((s, p) => s + (p.status === 'CONFIRMED' ? Number(p.valor) || 0 : 0), 0) +
    assRows.reduce((s, a) => s + (String(a.status).toUpperCase() === 'CONFIRMED' ? Number(a.price) || 0 : 0), 0);

  const totalProdutos = receitas
    .filter(r => (r.origem || '').toLowerCase() === 'produto')
    .reduce((s, r) => s + (Number(r.valor) || 0), 0);

  const receitasPorOrigem: FinanceiroPayload['receitasPorOrigem'] = [
    { origem: 'assinaturas', valor: totalAssinaturas },
    { origem: 'avulsos', valor: totalReceitasServicos },
    { origem: 'produtos', valor: totalProdutos },
  ];

  return {
    kpis: { comissaoAcumulada, totalSangrias, comandasAbertas, comandasFechadas },
    servicosRealizados,
    quantPorProfissional,
    receitasPorOrigem,
  };
}


