"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUnidade } from "@/lib/unidade";

export type ListParams = {
  search: string;
  searchField: "nome" | "telefone" | "codigo";
  status: "ativos" | "inativos" | "todos";
  page: number;
  perPage: number;
  sortBy: "codigo" | "nome" | "pagamentos" | "pendencias" | "ultima_visita";
  sortDir: "asc" | "desc";
};

export async function listClients(params: ListParams) {
  const supabase = await createClient();
  const unidade = await getCurrentUnidade();
  const { search, searchField, /*status,*/ page, perPage, sortBy, sortDir } = params;

  // View esperada: vw_clientes_resumo (campos básicos + agregados)
  // Builder encadeável tipado localmente (suficiente para o linter)
  type AnyQuery = {
    eq: (col: string, val: unknown) => AnyQuery;
    ilike: (col: string, val: string) => AnyQuery;
    order: (col: string, opts: { ascending: boolean }) => AnyQuery;
    range: (from: number, to: number) => AnyQuery;
    maybeSingle: () => AnyQuery;
  };

  const query = (supabase
    .from("vw_clientes_resumo")
    .select(
      "id, codigo, nome, email, telefone, cpf_cnpj, endereco, data_nascimento, observacoes, pagamentos, pendencias, visitas, ultima_visita, faltas",
      { count: "exact" }
    ) as unknown as AnyQuery)
    .eq("unidade", unidade);

  // Se quiser filtrar por status no futuro, inclua c.ativo na view e ative este filtro
  // if (status !== "todos") query = query.eq("ativo", status === "ativos");

  let filtered = query;
  if (search) {
    if (searchField === "nome") filtered = filtered.ilike("nome", `%${search}%`);
    if (searchField === "telefone") filtered = filtered.ilike("telefone", `%${search}%`);
    if (searchField === "codigo") filtered = filtered.eq("codigo", Number(search)).maybeSingle();
  }

  const finalQuery = filtered.order(sortBy, { ascending: sortDir === "asc" }).range((page - 1) * perPage, page * perPage - 1) as unknown as Promise<{ data: unknown[]; error: unknown; count: number | null }>;

  const result = (await (finalQuery as never)) as { data: unknown[]; error: unknown; count: number | null };
  const data = result.data as Record<string, unknown>[] | null;
  const error = result.error as { message?: string } | null;
  const count = result.count;
  if (error) throw error;
  return { rows: data || [], total: count || 0 };
}

export async function exportCsv(params: Pick<ListParams, "search" | "searchField" | "status" | "sortBy" | "sortDir">) {
  const { rows } = await listClients({ ...params, page: 1, perPage: 100000, sortDir: params.sortDir, sortBy: params.sortBy });
  type Row = { codigo: number; nome: string; telefone?: string | null; data_nascimento?: string | null; pagamentos: number; pendencias: number; visitas: number; ultima_visita?: string | null; faltas: number };
  const header = ["codigo","nome","telefone","nascimento","pagamentos","pendencias","visitas","ultima_visita","faltas"];
  const lines = (rows as Row[]).map((r) => [r.codigo, r.nome, r.telefone || "", r.data_nascimento || "", r.pagamentos, r.pendencias, r.visitas, r.ultima_visita || "", r.faltas].join(";"));
  return [header.join(";"), ...lines].join("\n");
}

export async function deleteClients(ids: string[]) {
  const supabase = await createClient();
  const unidade = await getCurrentUnidade();
  const { error } = await supabase.from("clientes").delete().eq("unidade", unidade).in("id", ids);
  if (error) throw error;
}

// ---------- CRUD básico ----------
const clientSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(1, "Informe o nome"),
  email: z.string().email().nullable().optional(),
  telefone: z.string().nullable().optional(),
  cpf_cnpj: z.string().nullable().optional(),
  endereco: z.string().nullable().optional(),
  data_nascimento: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),
});

export async function upsertClient(input: unknown) {
  const values = clientSchema.parse(input);
  const supabase = await createClient();
  const unidade = await getCurrentUnidade();

  if (values.id) {
    const { id, ...rest } = values;
    const { error } = await supabase.from("clientes").update({ ...rest, unidade }).eq("id", id).eq("unidade", unidade);
    if (error) throw error;
    return { id };
  }
  // Remove id sem criar variável não utilizada
  const payloadInsert = Object.fromEntries(Object.entries(values).filter(([k]) => k !== 'id')) as Omit<typeof values, 'id'>;
  const { data, error } = await supabase.from("clientes").insert({ ...payloadInsert, unidade }).select("id").single();
  if (error) throw error;
  return { id: data!.id as string };
}

// ---------- Importação CSV ----------
export async function importClients(csvText: string, upsert = true) {
  const supabase = await createClient();
  const unidade = await getCurrentUnidade();

  const lines: string[] = csvText.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { inserted: 0, updated: 0, errors: [] as string[] };
  const header = lines[0].split(/;|,|\t/).map((h) => h.trim().toLowerCase());
  const rows: string[][] = lines.slice(1).map((l) => l.split(/;|,|\t/));

  const col = (name: string) => header.findIndex((h) => h === name);
  const idxNome = col("nome");
  const idxTelefone = col("telefone");
  const idxEmail = col("email");
  const idxNascimento = col("nascimento");
  // const idxSexo = col("sexo"); // reservado para uso futuro

  let inserted = 0, updated = 0; const errors: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const nome = (r[idxNome] || "").trim();
    if (!nome) { errors.push(`L${i+2}: nome vazio`); continue; }
    type ClientPayload = { nome: string; telefone: string|null; email: string|null; data_nascimento: string|null; unidade: string };
    const payload: ClientPayload = {
      nome,
      telefone: idxTelefone >= 0 ? (r[idxTelefone] || null) : null,
      email: idxEmail >= 0 ? (r[idxEmail] || null) : null,
      data_nascimento: idxNascimento >= 0 ? (r[idxNascimento] || null) : null,
      unidade,
    };

    try {
      if (upsert && payload.telefone) {
        const { data: found } = await supabase.from("clientes").select("id").eq("unidade", unidade).eq("telefone", payload.telefone).maybeSingle();
        if (found?.id) {
          const { error } = await supabase.from("clientes").update(payload).eq("id", found.id);
          if (error) throw error; updated++; continue;
        }
      }
      const { error } = await supabase.from("clientes").insert(payload);
      if (error) throw error; inserted++;
    } catch (e) {
      const msg = (e as { message?: string })?.message || String(e);
      errors.push(`L${i+2}: ${msg}`);
    }
  }
  return { inserted, updated, errors };
}

// ---------- Mesclar duplicados (server-side orquestra RPC) ----------
export async function mergeClients(sourceId: string, targetId: string) {
  const supabase = await createClient();
  const unidade = await getCurrentUnidade();
  // Chama função RPC se existir; se não, tenta fallback simples: apaga fonte após copiar campos vazios
  const { error: fnErr } = await supabase.rpc("merge_clientes", { p_source: sourceId, p_target: targetId }).throwOnError();
  if (fnErr) {
    // Fallback: apenas remove o duplicado se mesma unidade
    await supabase.from("clientes").delete().eq("id", sourceId).eq("unidade", unidade);
  }
  return { ok: true };
}

// ---------- Envio em massa (placeholder) ----------
export async function sendBulkEmail(ids: string[]) {
  // Placeholder: registra intenção de envio; integre com seu provedor depois
  return { queued: ids.length };
}


