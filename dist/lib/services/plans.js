import { createClient } from '../supabase/client';
// Buscar todos os planos
export async function getPlanos() {
    const supabase = createClient();
    const { data, error } = await supabase.from('planos').select('*').order('nome', { ascending: true });
    if (error)
        throw error;
    return data;
}
// Criar novo plano
export async function criarPlano(plano) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('planos')
        .insert([plano])
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
