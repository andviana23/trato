import { createClient } from "../supabase/client";
import { Cliente } from "@/app/clientes/types";

const supabase = createClient();

export async function getClientes() {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("is_active", true);
    
    if (error) {
      throw error;
    }
    
    // Buscar todas as assinaturas ativas (asaas e externas)
    const { data: assinaturas } = await supabase
      .from("subscriptions")
      .select("client_id")
      .eq("status", "active");
    const clientesComAssinatura = new Set((assinaturas || []).map(a => a.client_id));
    
    // Mapear os dados do banco para a interface Cliente
    const clientesMapeados = data?.map(cliente => ({
      id: cliente.id,
      nome: cliente.name, // Corrigido: buscar 'name' do banco
      email: cliente.email || '',
      telefone: cliente.telefone,
      tipo: clientesComAssinatura.has(cliente.id) ? "assinante" : "avulso",
      cpf_cnpj: cliente.cpf_cnpj,
      endereco: cliente.endereco,
      data_nascimento: cliente.data_nascimento,
      observacoes: cliente.observacoes,
      created_at: cliente.created_at,
      updated_at: cliente.updated_at
    })) || [];
    
    return clientesMapeados;
  } catch (error) {
    throw error;
  }
}

export async function listarClientes(filtro: string = ""): Promise<Cliente[]> {
  let query = supabase
    .from("clients")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true }); // Corrigido para ordenar por 'name'

  if (filtro) {
    // Busca inteligente por múltiplos campos
    query = query.or(`name.ilike.%${filtro}%,telefone.ilike.%${filtro}%,cpf_cnpj.ilike.%${filtro}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Buscar todas as assinaturas ativas (asaas e externas)
  const { data: assinaturas } = await supabase
    .from("subscriptions")
    .select("client_id")
    .eq("status", "active");
  const clientesComAssinatura = new Set((assinaturas || []).map(a => a.client_id));

  // Mapear os dados do banco para a interface Cliente
  return (data as any[])?.map(cliente => ({
    id: cliente.id,
    nome: cliente.name, // Corrigido: buscar 'name' do banco
    email: cliente.email || '',
    telefone: cliente.telefone,
    tipo: clientesComAssinatura.has(cliente.id) ? "assinante" : "avulso",
    cpf_cnpj: cliente.cpf_cnpj,
    endereco: cliente.endereco,
    data_nascimento: cliente.data_nascimento,
    observacoes: cliente.observacoes,
    created_at: cliente.created_at,
    updated_at: cliente.updated_at
  })) || [];
}

export async function cadastrarCliente(cliente: Omit<Cliente, "id" | "created_at" | "updated_at" | "tipo">) {
  const clienteData = {
    name: cliente.nome,
    telefone: cliente.telefone,
    email: cliente.email || null,
    cpf_cnpj: cliente.cpf_cnpj || null,
    endereco: cliente.endereco || null,
    data_nascimento: cliente.data_nascimento || null,
    observacoes: cliente.observacoes || null,
    is_active: true,
    barbershop_id: "41abae7d-ac5f-410f-a2e8-9c027a25d60d",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from("clients").insert([clienteData]).select();
  if (error) throw error;
  return data?.[0];
}

export async function atualizarCliente(id: string, dados: Partial<Cliente>) {
  const dadosCorrigidos = {
    ...dados,
    updated_at: new Date().toISOString()
  };

  // Remove campos que não devem ser atualizados
  delete dadosCorrigidos.id;
  delete dadosCorrigidos.created_at;
  delete dadosCorrigidos.tipo;

  const { data, error } = await supabase.from("clients").update(dadosCorrigidos).eq("id", id).select();
  if (error) throw error;
  return data?.[0];
} 