import { createClient } from '../supabase/client';

export type Assinatura = {
  id: string;
  cliente_id: string;
  plano_id: string;
  status: string;
  data_inicio: string;
  data_vencimento: string;
  valor: number;
  created_at: string;
  updated_at: string;
};

// Criar uma nova assinatura
export async function criarAssinatura(assinatura: Omit<Assinatura, 'id' | 'created_at' | 'updated_at'>): Promise<Assinatura> {
  const supabase = createClient();
  const { data, error } = await supabase.from('assinaturas').insert([assinatura]).select('*').single();
  if (error) throw error;
  return data as Assinatura;
}

// Buscar todas as assinaturas
export async function getAssinaturas(): Promise<Assinatura[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('assinaturas').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Assinatura[];
}

// Atualizar status da assinatura
export async function updateAssinaturaStatus(id: string, status: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('assinaturas')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
} 