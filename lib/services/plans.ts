import { createClient } from "../supabase/client";

const supabase = createClient();

export async function getPlanos() {
  const { data, error } = await supabase.from("plans").select("*");
  if (error) throw error;
  return (data || []).map(plano => ({
    id: plano.id,
    nome: plano.nome,
    preco: Number(plano.preco),
    descricao: plano.descricao,
    categoria: plano.categoria
  }));
}

export async function criarPlano(plano: { nome: string; preco: number; descricao: string; categoria?: string }) {
  const { data, error } = await supabase.from("plans").insert([{
    nome: plano.nome,
    preco: plano.preco,
    descricao: plano.descricao,
    categoria: plano.categoria
  }]).select();
  if (error) throw new Error(error.message || 'Erro ao criar plano');
  return data?.[0];
} 