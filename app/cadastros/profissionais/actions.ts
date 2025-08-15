"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUnidade, getCurrentUnidadeId } from "@/lib/unidade";

export type Profissional = {
  id?: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  data_nascimento?: string | null;
  funcao: "barbeiro" | "recepcionista" | "gerente";
};

export async function listProfessionals(): Promise<Profissional[]> {
  const supabase = await createClient();
  const unidade = await getCurrentUnidade();
  const unidadeId = await getCurrentUnidadeId();
  // Resolve ids de unidade por nome (fallback quando não existir tb.unidade_id)
  const ids: string[] = [];
  if (unidadeId) ids.push(unidadeId);
  const nomeLike = unidade === "trato" ? "%trato%" : "%barber%";
  const { data: uniRows } = await supabase
    .from("unidades")
    .select("id, nome")
    .ilike("nome", nomeLike)
    .limit(1);
  if (uniRows && uniRows.length > 0) ids.push(uniRows[0].id as string);

  const { data, error } = await supabase
    .from("profissionais")
    .select("id, nome, email, telefone, data_nascimento, funcao, unidade, unidade_id")
    .or(ids.length > 0 ? `unidade.eq.${unidade},unidade_id.in.(${ids.join(',')})` : `unidade.eq.${unidade}`)
    .order("funcao", { ascending: true })
    .order("nome", { ascending: true });
  if (error) throw error;
  return (data as Profissional[]) || [];
}

export async function upsertProfessional(input: Profissional): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const unidade = await getCurrentUnidade();
  const unidadeId = await getCurrentUnidadeId();
  if (input.id) {
    const { id, ...rest } = input;
    const { error } = await supabase
      .from("profissionais")
      .update({ ...rest, unidade, unidade_id: unidadeId })
      .eq("id", id);
    if (error) throw error;
    return { ok: true };
  }
  const { error } = await supabase.from("profissionais").insert({ ...input, unidade, unidade_id: unidadeId });
  if (error) throw error;
  return { ok: true };
}

export async function deleteProfessional(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const unidade = await getCurrentUnidade();
  const unidadeId = await getCurrentUnidadeId();
  // Execução em duas etapas para evitar tipagens complexas
  // Fallback sem tipagem estrita
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dq: any = supabase.from("profissionais").delete().eq("id", id);
  if (unidadeId) dq = dq.or(`unidade.eq.${unidade},unidade_id.eq.${unidadeId}`);
  else dq = dq.eq("unidade", unidade);
  const { error } = await dq;
  if (error) throw error;
  return { ok: true };
}


