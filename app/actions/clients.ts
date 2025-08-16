'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { ActionResult, ActionResultPaginated } from '@/lib/types/action';
import {
  createClientSchema,
  updateClientSchema,
  searchClientsSchema,
  deactivateClientSchema,
  reactivateClientSchema,
  type CreateClientInput,
  type UpdateClientInput,
  type SearchClientsInput,
  type DeactivateClientInput,
  type ReactivateClientInput,
} from '@/lib/validators';

// ============================================================================
// TIPOS DE DADOS
// ============================================================================

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone: string;
  cpf: string;
  birthDate?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  notes?: string;
  unidadeId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientWithDetails extends Client {
  unidade: {
    id: string;
    name: string;
  };
  statistics: {
    totalAppointments: number;
    totalSpent: number;
    lastVisit?: string;
    favoriteServices: string[];
  };
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Cria um novo cliente
 */
export async function createClient(
  input: CreateClientInput
): Promise<ActionResult<Client>> {
  try {
    // Validação com Zod
    const validation = createClientSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createSupabaseClient();

    // Verificar se o CPF já existe
    const { data: existingClient, error: checkError } = await supabase
      .from('clients')
      .select('id')
      .eq('cpf', validatedData.cpf)
      .eq('unidadeId', validatedData.unidadeId)
      .single();

    if (existingClient) {
      return {
        success: false,
        error: 'CPF já cadastrado para esta unidade'
      };
    }

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erro ao verificar CPF:', checkError);
      return {
        success: false,
        error: 'Erro interno ao verificar disponibilidade do CPF'
      };
    }

    // Verificar se o email já existe (se fornecido)
    if (validatedData.email) {
      const { data: existingEmail, error: emailCheckError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', validatedData.email)
        .eq('unidadeId', validatedData.unidadeId)
        .single();

      if (existingEmail) {
        return {
          success: false,
          error: 'Email já cadastrado para esta unidade'
        };
      }

      if (emailCheckError && emailCheckError.code !== 'PGRST116') {
        console.error('Erro ao verificar email:', emailCheckError);
        return {
          success: false,
          error: 'Erro interno ao verificar disponibilidade do email'
        };
      }
    }

    // Criar cliente
    const { data: client, error } = await supabase
      .from('clients')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar cliente:', error);
      return {
        success: false,
        error: 'Erro interno ao criar cliente'
      };
    }

    // Revalidar cache
    revalidatePath('/');
    revalidatePath('/clientes');
    revalidatePath(`/clientes/${validatedData.unidadeId}`);

    return {
      success: true,
      data: client as Client
    };
  } catch (error) {
    console.error('Erro inesperado ao criar cliente:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Atualiza um cliente existente
 */
export async function updateClient(
  input: UpdateClientInput
): Promise<ActionResult<Client>> {
  try {
    // Validação com Zod
    const validation = updateClientSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createSupabaseClient();

    // Verificar se o cliente existe
    const { data: existing, error: fetchError } = await supabase
      .from('clients')
      .select('id, unidadeId, cpf, email')
      .eq('id', validatedData.id)
      .single();

    if (fetchError || !existing) {
      return {
        success: false,
        error: 'Cliente não encontrado'
      };
    }

    // Verificar se o CPF já existe em outro cliente (se alterado)
    if (validatedData.cpf && validatedData.cpf !== existing.cpf) {
      const { data: existingCPF, error: cpfCheckError } = await supabase
        .from('clients')
        .select('id')
        .eq('cpf', validatedData.cpf)
        .eq('unidadeId', existing.unidadeId)
        .neq('id', validatedData.id)
        .single();

      if (existingCPF) {
        return {
          success: false,
          error: 'CPF já cadastrado para outro cliente nesta unidade'
        };
      }

      if (cpfCheckError && cpfCheckError.code !== 'PGRST116') {
        console.error('Erro ao verificar CPF:', cpfCheckError);
        return {
          success: false,
          error: 'Erro interno ao verificar disponibilidade do CPF'
        };
      }
    }

    // Verificar se o email já existe em outro cliente (se alterado)
    if (validatedData.email && validatedData.email !== existing.email) {
      const { data: existingEmail, error: emailCheckError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', validatedData.email)
        .eq('unidadeId', existing.unidadeId)
        .neq('id', validatedData.id)
        .single();

      if (existingEmail) {
        return {
          success: false,
          error: 'Email já cadastrado para outro cliente nesta unidade'
        };
      }

      if (emailCheckError && emailCheckError.code !== 'PGRST116') {
        console.error('Erro ao verificar email:', emailCheckError);
        return {
          success: false,
          error: 'Erro interno ao verificar disponibilidade do email'
        };
      }
    }

    // Atualizar cliente
    const { data: client, error } = await supabase
      .from('clients')
      .update({
        ...validatedData,
        updatedAt: new Date().toISOString()
      })
      .eq('id', validatedData.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar cliente:', error);
      return {
        success: false,
        error: 'Erro interno ao atualizar cliente'
      };
    }

    // Revalidar cache
    revalidatePath('/');
    revalidatePath('/clientes');
    revalidatePath(`/clientes/${existing.unidadeId}`);

    return {
      success: true,
      data: client as Client
    };
  } catch (error) {
    console.error('Erro inesperado ao atualizar cliente:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Busca clientes com filtros e paginação
 */
export async function searchClients(
  input: SearchClientsInput
): Promise<ActionResultPaginated<ClientWithDetails>> {
  try {
    // Validação com Zod
    const validation = searchClientsSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createSupabaseClient();

    let query = supabase
      .from('clients')
      .select(`
        *,
        unidade:unidades(id, name)
      `, { count: 'exact' })
      .eq('unidadeId', validatedData.unidadeId);

    // Aplicar filtros
    if (validatedData.name) {
      query = query.ilike('name', `%${validatedData.name}%`);
    }
    if (validatedData.email) {
      query = query.ilike('email', `%${validatedData.email}%`);
    }
    if (validatedData.phone) {
      query = query.ilike('phone', `%${validatedData.phone}%`);
    }
    if (validatedData.cpf) {
      query = query.eq('cpf', validatedData.cpf);
    }
    if (validatedData.isActive !== undefined) {
      query = query.eq('isActive', validatedData.isActive);
    }

    // Aplicar paginação
    const from = (validatedData.page - 1) * validatedData.limit;
    const to = from + validatedData.limit - 1;
    query = query.range(from, to);

    // Ordenar por nome
    query = query.order('name', { ascending: true });

    const { data: clients, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return {
        success: false,
        error: 'Erro interno ao buscar clientes'
      };
    }

    // Enriquecer com estatísticas
    const clientsWithStats = await Promise.all(
      (clients || []).map(async (client) => {
        const stats = await getClientStatistics(client.id, supabase);
        return {
          ...client,
          statistics: stats
        };
      })
    );

    return {
      success: true,
      data: {
        data: clientsWithStats as ClientWithDetails[],
        pagination: {
          page: validatedData.page,
          limit: validatedData.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / validatedData.limit),
        },
      },
    };
  } catch (error) {
    console.error('Erro inesperado ao buscar clientes:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Desativa um cliente
 */
export async function deactivateClient(
  input: DeactivateClientInput
): Promise<ActionResult<Client>> {
  try {
    // Validação com Zod
    const validation = deactivateClientSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createSupabaseClient();

    // Verificar se o cliente existe
    const { data: existing, error: fetchError } = await supabase
      .from('clients')
      .select('id, unidadeId, isActive')
      .eq('id', validatedData.id)
      .single();

    if (fetchError || !existing) {
      return {
        success: false,
        error: 'Cliente não encontrado'
      };
    }

    if (!existing.isActive) {
      return {
        success: false,
        error: 'Cliente já está desativado'
      };
    }

    // Desativar cliente
    const { data: client, error } = await supabase
      .from('clients')
      .update({
        isActive: false,
        notes: validatedData.reason,
        updatedAt: new Date().toISOString()
      })
      .eq('id', validatedData.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao desativar cliente:', error);
      return {
        success: false,
        error: 'Erro interno ao desativar cliente'
      };
    }

    // Revalidar cache
    revalidatePath('/');
    revalidatePath('/clientes');
    revalidatePath(`/clientes/${existing.unidadeId}`);

    return {
      success: true,
      data: client as Client
    };
  } catch (error) {
    console.error('Erro inesperado ao desativar cliente:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Reativa um cliente
 */
export async function reactivateClient(
  input: ReactivateClientInput
): Promise<ActionResult<Client>> {
  try {
    // Validação com Zod
    const validation = reactivateClientSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createSupabaseClient();

    // Verificar se o cliente existe
    const { data: existing, error: fetchError } = await supabase
      .from('clients')
      .select('id, unidadeId, isActive')
      .eq('id', validatedData.id)
      .single();

    if (fetchError || !existing) {
      return {
        success: false,
        error: 'Cliente não encontrado'
      };
    }

    if (existing.isActive) {
      return {
        success: false,
        error: 'Cliente já está ativo'
      };
    }

    // Reativar cliente
    const { data: client, error } = await supabase
      .from('clients')
      .update({
        isActive: true,
        updatedAt: new Date().toISOString()
      })
      .eq('id', validatedData.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao reativar cliente:', error);
      return {
        success: false,
        error: 'Erro interno ao reativar cliente'
      };
    }

    // Revalidar cache
    revalidatePath('/');
    revalidatePath('/clientes');
    revalidatePath(`/clientes/${existing.unidadeId}`);

    return {
      success: true,
      data: client as Client
    };
  } catch (error) {
    console.error('Erro inesperado ao reativar cliente:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Obtém um cliente por ID
 */
export async function getClient(
  id: string
): Promise<ActionResult<ClientWithDetails>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID do cliente é obrigatório'
      };
    }

    const supabase = await createSupabaseClient();

    const { data: client, error } = await supabase
      .from('clients')
      .select(`
        *,
        unidade:unidades(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Cliente não encontrado'
        };
      }
      console.error('Erro ao buscar cliente:', error);
      return {
        success: false,
        error: 'Erro interno ao buscar cliente'
      };
    }

    // Enriquecer com estatísticas
    const statistics = await getClientStatistics(id, supabase);
    const clientWithStats = {
      ...client,
      statistics
    };

    return {
      success: true,
      data: clientWithStats as ClientWithDetails
    };
  } catch (error) {
    console.error('Erro inesperado ao buscar cliente:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Obtém estatísticas de um cliente
 */
async function getClientStatistics(
  clientId: string,
  supabase: any
): Promise<ClientWithDetails['statistics']> {
  try {
    // Total de agendamentos
    const { count: totalAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('clientId', clientId);

    // Total gasto
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('appointmentId', (await supabase
        .from('appointments')
        .select('id')
        .eq('clientId', clientId)
      ).data?.map((apt: any) => apt.id) || []);

    const totalSpent = payments?.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0) || 0;

    // Última visita
    const { data: lastAppointment } = await supabase
      .from('appointments')
      .select('startTime')
      .eq('clientId', clientId)
      .eq('status', 'atendido')
      .order('startTime', { ascending: false })
      .limit(1)
      .single();

    // Serviços favoritos
    const { data: services } = await supabase
      .from('appointments')
      .select('service:services(name)')
      .eq('clientId', clientId)
      .eq('status', 'atendido');

    const serviceCounts: Record<string, number> = {};
    services?.forEach((apt: { service?: { name?: string } }) => {
      const serviceName = apt.service?.name || 'Serviço não especificado';
      serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
    });

    const favoriteServices = Object.entries(serviceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name]) => name);

    return {
      totalAppointments: totalAppointments || 0,
      totalSpent,
      lastVisit: lastAppointment?.startTime,
      favoriteServices
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas do cliente:', error);
    return {
      totalAppointments: 0,
      totalSpent: 0,
      favoriteServices: []
    };
  }
}

/**
 * Obtém histórico de agendamentos de um cliente
 */
export async function getClientHistory(
  clientId: string,
  page: number = 1,
  limit: number = 20
): Promise<ActionResultPaginated<{
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  professional: { id: string; name: string };
  service: { id: string; name: string; price: number };
  payments: { id: string; amount: number; method: string; status: string }[];
}>> {
  try {
    if (!clientId) {
      return {
        success: false,
        error: 'ID do cliente é obrigatório'
      };
    }

    const supabase = await createSupabaseClient();

    const { data: appointments, error, count } = await supabase
      .from('appointments')
      .select(`
        *,
        professional:professionals(id, name),
        service:services(id, name, price),
        payments(id, amount, method, status)
      `, { count: 'exact' })
      .eq('clientId', clientId)
      .order('startTime', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      return {
        success: false,
        error: 'Erro interno ao buscar histórico'
      };
    }

    return {
      success: true,
      data: {
        data: appointments || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    };
  } catch (error) {
    console.error('Erro inesperado ao buscar histórico:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}
