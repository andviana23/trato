import { createClient } from '../supabase/client';
// Criar uma nova assinatura
export async function criarAssinatura(assinatura) {
    const supabase = createClient();
    const { data, error } = await supabase.from('assinaturas').insert([assinatura]).select('*').single();
    if (error)
        throw error;
    return data;
}
// Buscar todas as assinaturas
export async function getAssinaturas() {
    const supabase = createClient();
    const { data, error } = await supabase.from('assinaturas').select('*').order('created_at', { ascending: false });
    if (error)
        throw error;
    return data;
}
// Atualizar status da assinatura
export async function updateAssinaturaStatus(id, status) {
    const supabase = createClient();
    const { error } = await supabase
        .from('assinaturas')
        .update({ status })
        .eq('id', id);
    if (error)
        throw error;
}
