import dayjs, { Dayjs } from "dayjs";
import { createClient } from "@/lib/supabase/client";

export type AgendaUnidade = "TRATO" | "BARBERBEER";

export interface Profissional {
  id: string;
  nome: string;
  avatar_url?: string;
  unidade_id?: string;
}

export interface Agendamento {
  id: string;
  profissional_id: string;
  cliente_id?: string | null;
  titulo?: string | null;
  data_inicio: string; // ISO
  data_fim: string; // ISO
  status: "pendente" | "confirmado" | "cancelado" | "concluido";
  unidade: string;
}

export interface Bloqueio {
  id: string;
  profissional_id: string;
  inicio: string;
  fim: string;
  motivo?: string | null;
}

export function getWeekRange(baseDate: Dayjs) {
  const start = baseDate.startOf("week");
  const end = baseDate.endOf("week");
  return { start: start.format("YYYY-MM-DD"), end: end.format("YYYY-MM-DD") };
}

export function mapUnidadeToTables(unidadeNome?: string) {
  // Usar tabela única de agendamentos
  return { ag: "agendamentos", bl: "bloqueios" };
}

function getUnidadeIdFromName(unidadeNome?: string): string | null {
  const name = (unidadeNome || '').toUpperCase();
  if (name.includes('BARBER') || name.includes('BBSC') || name.includes('BARBERBEER')) return '87884040-cafc-4625-857b-6e0402ede7d7';
  if (name.includes('TRATO') || name.includes('BARBADOS')) return '244c0543-7108-4892-9eac-48186ad1d5e7';
  return null;
}

export async function getProfissionaisByUnidade(unidadeNome?: string): Promise<Profissional[]> {
  const supabase = createClient();
  const query = supabase
    .from("profissionais")
    .select("id, nome, avatar_url, unidade_id, funcao")
    .eq("funcao", "barbeiro");
  const uid = getUnidadeIdFromName(unidadeNome);
  if (uid) query.eq("unidade_id", uid);
  const { data } = await query;
  return (data || []).map((p) => ({ id: p.id, nome: p.nome, avatar_url: p.avatar_url, unidade_id: p.unidade_id }));
}

export async function getClientesByUnidade(unidadeNome?: string): Promise<Array<{ id: string; nome: string; telefone?: string | null }>> {
  const supabase = createClient();
  const query = supabase
    .from("clientes")
    .select("id, nome, telefone");
  
  // Mapear nomes de unidade para valores do banco
  if (unidadeNome) {
    let unidadeDB = 'trato'; // valor padrão
    if (unidadeNome.toUpperCase().includes('TRATO') || unidadeNome.toUpperCase().includes('BARBADOS')) {
      unidadeDB = 'trato';
    } else if (unidadeNome.toUpperCase().includes('BARBER') || unidadeNome.toUpperCase().includes('BEER')) {
      unidadeDB = 'barberbeer';
    }

    query.eq("unidade", unidadeDB);
  }
  
  const { data } = await query;
  return (data || []).map((c) => ({ 
    id: c.id, 
    nome: c.nome, 
    telefone: c.telefone 
  }));
}

export async function getServicosByUnidade(unidadeNome?: string): Promise<Array<{ id: string; nome: string; tempo_minutos?: number | null }>> {
  const supabase = createClient();
  const query = supabase
    .from("servicos_avulsos")
    .select("id, nome, tempo_minutos");
  
  // Filtrar por unidade se especificada
  if (unidadeNome) {
    // Primeiro precisamos obter o ID da unidade
    const uid = getUnidadeIdFromName(unidadeNome);
    if (uid) {
      query.eq("unidade_id", uid);
    }
  }
  
  const { data } = await query;
  return (data || []).map((s) => ({ 
    id: s.id, 
    nome: s.nome, 
    tempo_minutos: s.tempo_minutos 
  }));
}

export async function getAgendamentosSemana(
  unidadeNome: string | undefined,
  inicioISO: string,
  fimISO: string
): Promise<Agendamento[]> {
  const tables = mapUnidadeToTables(unidadeNome);
  const supabase = createClient();
  const { data } = await supabase
    .from(tables.ag)
    .select("id, profissional_id, cliente_id, titulo, data_inicio, data_fim, status, unidade")
    .gte("data_inicio", `${inicioISO} 00:00:00`)
    .lte("data_fim", `${fimISO} 23:59:59`);
  return (data as any[])?.map((a) => ({
    id: a.id,
    profissional_id: a.profissional_id,
    cliente_id: a.cliente_id,
    titulo: a.titulo,
    data_inicio: a.data_inicio,
    data_fim: a.data_fim,
    status: a.status,
    unidade: a.unidade,
  })) || [];
}

export async function getBloqueiosSemana(
  unidadeNome: string | undefined,
  inicioISO: string,
  fimISO: string
): Promise<Bloqueio[]> {
  const tables = mapUnidadeToTables(unidadeNome);
  const supabase = createClient();
  const { data } = await supabase
    .from(tables.bl)
    .select("id, profissional_id, inicio, fim, motivo")
    .gte("inicio", `${inicioISO} 00:00:00`)
    .lte("fim", `${fimISO} 23:59:59`);
  return (data as any[])?.map((b) => ({ id: b.id, profissional_id: b.profissional_id, inicio: b.inicio, fim: b.fim, motivo: b.motivo })) || [];
}

// CRUD de agendamentos
export async function createAgendamento(unidadeNome: string | undefined, input: Omit<Agendamento, 'id'>) {
  const tables = mapUnidadeToTables(unidadeNome);
  const supabase = createClient();
  const { data, error } = await supabase.from(tables.ag).insert([input]).select('*').single();
  if (error) throw error;
  return data as Agendamento;
}

export async function updateAgendamento(unidadeNome: string | undefined, id: string, patch: Partial<Agendamento>) {
  const tables = mapUnidadeToTables(unidadeNome);
  const supabase = createClient();
  const { data, error } = await supabase.from(tables.ag).update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Agendamento;
}

export async function deleteAgendamento(unidadeNome: string | undefined, id: string) {
  const tables = mapUnidadeToTables(unidadeNome);
  const supabase = createClient();
  const { error } = await supabase.from(tables.ag).delete().eq('id', id);
  if (error) throw error;
}

// Dia específico
export async function getAgendamentosDia(
  unidadeNome: string | undefined,
  diaISO: string
): Promise<Agendamento[]> {
  const tables = mapUnidadeToTables(unidadeNome);
  const supabase = createClient();
  const start = `${diaISO} 00:00:00`;
  const end = `${diaISO} 23:59:59`;
  const { data, error } = await supabase
    .from(tables.ag)
    .select("id, profissional_id, cliente_id, titulo, data_inicio, data_fim, status, unidade")
    .gte("data_inicio", start)
    .lte("data_fim", end)
    .order("data_inicio", { ascending: true });
  if (error) throw error;
  return (data as any[])?.map((a) => ({
    id: a.id,
    profissional_id: a.profissional_id,
    cliente_id: a.cliente_id,
    titulo: a.titulo,
    data_inicio: a.data_inicio,
    data_fim: a.data_fim,
    status: a.status,
    unidade: a.unidade,
  })) || [];
}


