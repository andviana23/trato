import { createClient } from '../supabase/client';
import type { Cliente } from '../../app/clientes/types';

// Busca todos os clientes
export async function getClientes(): Promise<Cliente[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('clientes').select('*').order('nome', { ascending: true });
  if (error) throw error;
  return data as Cliente[];
}

// Busca um cliente por ID
export async function getClienteById(id: string): Promise<Cliente | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Cliente;
}

// Função para cadastrar novo cliente
export async function cadastrarCliente(cliente: Omit<Cliente, 'id'>): Promise<Cliente> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clientes')
    .insert([cliente])
    .select()
    .single();
  if (error) throw error;
  return data as Cliente;
} 