import { createClient } from '../supabase/client';

export type Plano = {
  id: string;
  nome: string;
  valor: number;
  descricao?: string;
  created_at: string;
  updated_at: string;
};

// Buscar todos os planos
export async function getPlanos(): Promise<Plano[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('planos').select('*').order('nome', { ascending: true });
  if (error) throw error;
  return data as Plano[];
}

// Criar novo plano
export async function criarPlano(plano: Omit<Plano, 'id' | 'created_at' | 'updated_at'>): Promise<Plano> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('planos')
    .insert([plano])
    .select()
    .single();
  if (error) throw error;
  return data as Plano;
} 