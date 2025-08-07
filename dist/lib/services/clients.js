import { createClient } from '../supabase/client';
// Busca todos os clientes
export async function getClientes() {
    const supabase = createClient();
    const { data, error } = await supabase.from('clientes').select('*').order('nome', { ascending: true });
    if (error)
        throw error;
    return data;
}
// Busca um cliente por ID
export async function getClienteById(id) {
    const supabase = createClient();
    const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single();
    if (error)
        throw error;
    return data;
}
// Função para cadastrar novo cliente
export async function cadastrarCliente(cliente) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('clientes')
        .insert([cliente])
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
