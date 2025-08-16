'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ActionResult, ActionResultPaginated } from '@/lib/types/action';
import {
  addToQueueSchema,
  updateQueuePositionSchema,
  callNextFromQueueSchema,
  removeFromQueueSchema,
  searchQueueSchema,
  type AddToQueueInput,
  type UpdateQueuePositionInput,
  type CallNextFromQueueInput,
  type RemoveFromQueueInput,
  type SearchQueueInput,
} from '@/lib/validators';

// ============================================================================
// TIPOS DE DADOS
// ============================================================================

export interface QueueItem {
  id: string;
  clientId: string;
  serviceId: string;
  priority: 'normal' | 'prioritaria' | 'urgente';
  estimatedWaitTime?: number;
  actualWaitTime?: number;
  notes?: string;
  unidadeId: string;
  status: 'aguardando' | 'chamado' | 'em_atendimento' | 'finalizado' | 'cancelado';
  position: number;
  assignedProfessionalId?: string;
  estimatedStartTime?: string;
  actualStartTime?: string;
  completedAt?: string;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueueItemWithDetails extends QueueItem {
  client: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
  professional?: {
    id: string;
    name: string;
    specialty: string;
  };
}

export interface QueueStats {
  totalWaiting: number;
  averageWaitTime: number;
  priorityBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  estimatedCompletionTime: string;
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Adiciona um novo cliente à fila de atendimento
 */
export async function addToQueue(
  input: AddToQueueInput
): Promise<ActionResult<QueueItem>> {
  try {
    // Validação com Zod
    const validation = addToQueueSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Verificar se cliente já está na fila
    const { data: existingItem, error: checkError } = await supabase
      .from('queue')
      .select('id')
      .eq('clientId', validatedData.clientId)
      .eq('unidadeId', validatedData.unidadeId)
      .in('status', ['aguardando', 'chamado', 'em_atendimento'])
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erro ao verificar cliente na fila:', checkError);
      return {
        success: false,
        error: 'Erro interno ao verificar cliente na fila'
      };
    }

    if (existingItem) {
      return {
        success: false,
        error: 'Cliente já está na fila de atendimento'
      };
    }

    // Obter próxima posição na fila
    const { data: lastPosition, error: positionError } = await supabase
      .from('queue')
      .select('position')
      .eq('unidadeId', validatedData.unidadeId)
      .in('status', ['aguardando', 'chamado', 'em_atendimento'])
      .order('position', { ascending: false })
      .limit(1)
      .single();

    if (positionError && positionError.code !== 'PGRST116') {
      console.error('Erro ao obter posição na fila:', positionError);
      return {
        success: false,
        error: 'Erro interno ao obter posição na fila'
      };
    }

    const nextPosition = (lastPosition?.position || 0) + 1;

    // Criar item da fila
    const { data: queueItem, error } = await supabase
      .from('queue')
      .insert([{
        ...validatedData,
        position: nextPosition,
        status: 'aguardando',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar à fila:', error);
      return {
        success: false,
        error: 'Erro interno ao adicionar cliente à fila'
      };
    }

    // Revalidar cache
    revalidatePath('/queue');
    revalidatePath('/dashboard/fila');
    revalidatePath(`/dashboard/fila/${validatedData.unidadeId}`);

    return {
      success: true,
      data: queueItem as QueueItem
    };
  } catch (error) {
    console.error('Erro inesperado ao adicionar à fila:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Marca o próximo cliente da fila como "em atendimento"
 */
export async function attendNext(
  input: CallNextFromQueueInput
): Promise<ActionResult<QueueItem>> {
  try {
    // Validação com Zod
    const validation = callNextFromQueueSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Buscar próximo item da fila
    let query = supabase
      .from('queue')
      .select('*')
      .eq('unidadeId', validatedData.unidadeId)
      .eq('status', 'aguardando')
      .order('priority', { ascending: false }) // Prioridade alta primeiro
      .order('position', { ascending: true })  // Depois por posição
      .limit(1);

    // Se especificado um profissional, verificar apenas para ele
    if (validatedData.professionalId) {
      query = query.eq('assignedProfessionalId', validatedData.professionalId);
    }

    const { data: nextItem, error: fetchError } = await query.single();

    if (fetchError || !nextItem) {
      return {
        success: false,
        error: 'Nenhum cliente na fila de espera'
      };
    }

    // Atualizar status para 'em_atendimento'
    const { data: updatedItem, error: updateError } = await supabase
      .from('queue')
      .update({
        status: 'em_atendimento',
        actualStartTime: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', nextItem.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao marcar cliente como em atendimento:', updateError);
      return {
        success: false,
        error: 'Erro interno ao atualizar status da fila'
      };
    }

    // Revalidar cache
    revalidatePath('/queue');
    revalidatePath('/dashboard/fila');
    revalidatePath(`/dashboard/fila/${validatedData.unidadeId}`);

    return {
      success: true,
      data: updatedItem as QueueItem
    };
  } catch (error) {
    console.error('Erro inesperado ao atender próximo cliente:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Move um cliente para o final da fila, ou seja, "passar a vez"
 */
export async function passaTurn(
  queueId: string
): Promise<ActionResult<QueueItem>> {
  try {
    if (!queueId) {
      return {
        success: false,
        error: 'ID da posição na fila é obrigatório'
      };
    }

    const supabase = await createClient();

    // Verificar se o item da fila existe
    const { data: queueItem, error: fetchError } = await supabase
      .from('queue')
      .select('*')
      .eq('id', queueId)
      .single();

    if (fetchError || !queueItem) {
      return {
        success: false,
        error: 'Posição na fila não encontrada'
      };
    }

    if (queueItem.status !== 'aguardando') {
      return {
        success: false,
        error: 'Apenas clientes aguardando podem passar a vez'
      };
    }

    // Obter última posição da fila
    const { data: lastPosition, error: positionError } = await supabase
      .from('queue')
      .select('position')
      .eq('unidadeId', queueItem.unidadeId)
      .in('status', ['aguardando', 'chamado', 'em_atendimento'])
      .order('position', { ascending: false })
      .limit(1)
      .single();

    if (positionError && positionError.code !== 'PGRST116') {
      console.error('Erro ao obter última posição:', positionError);
      return {
        success: false,
        error: 'Erro interno ao obter posição na fila'
      };
    }

    const newPosition = (lastPosition?.position || 0) + 1;

    // Atualizar posição para o final da fila
    const { data: updatedItem, error: updateError } = await supabase
      .from('queue')
      .update({
        position: newPosition,
        updatedAt: new Date().toISOString()
      })
      .eq('id', queueId)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao passar a vez:', updateError);
      return {
        success: false,
        error: 'Erro interno ao atualizar posição na fila'
      };
    }

    // Reorganizar posições da fila
    await reorganizeQueue(queueItem.unidadeId);

    // Revalidar cache
    revalidatePath('/queue');
    revalidatePath('/dashboard/fila');
    revalidatePath(`/dashboard/fila/${queueItem.unidadeId}`);

    return {
      success: true,
      data: updatedItem as QueueItem
    };
  } catch (error) {
    console.error('Erro inesperado ao passar a vez:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Reorganiza a fila inteira, manualmente ou com base em uma nova ordem de prioridade
 */
export async function reorganizeQueue(
  unidadeId: string,
  newOrder?: string[]
): Promise<ActionResult<{ message: string; reorganized: number }>> {
  try {
    if (!unidadeId) {
      return {
        success: false,
        error: 'ID da unidade é obrigatório'
      };
    }

    const supabase = await createClient();

    if (newOrder && newOrder.length > 0) {
      // Reorganização manual com nova ordem especificada
      let reorganized = 0;

      for (let i = 0; i < newOrder.length; i++) {
        const { error } = await supabase
          .from('queue')
          .update({
            position: i + 1,
            updatedAt: new Date().toISOString()
          })
          .eq('id', newOrder[i])
          .eq('unidadeId', unidadeId);

        if (!error) {
          reorganized++;
        }
      }

      // Revalidar cache
      revalidatePath('/queue');
      revalidatePath('/dashboard/fila');
      revalidatePath(`/dashboard/fila/${unidadeId}`);

      return {
        success: true,
        data: {
          message: `Fila reorganizada manualmente. ${reorganized} posições atualizadas.`,
          reorganized
        }
      };
    } else {
      // Reorganização automática baseada em prioridade e ordem de chegada
      const { data: activeItems, error: fetchError } = await supabase
        .from('queue')
        .select('id')
        .eq('unidadeId', unidadeId)
        .in('status', ['aguardando', 'chamado', 'em_atendimento'])
        .order('priority', { ascending: false }) // Prioridade alta primeiro
        .order('createdAt', { ascending: true }); // Depois por ordem de chegada

      if (fetchError) {
        console.error('Erro ao buscar itens ativos da fila:', fetchError);
        return {
          success: false,
          error: 'Erro interno ao buscar itens da fila'
        };
      }

      if (!activeItems || activeItems.length === 0) {
        return {
          success: true,
          data: {
            message: 'Nenhum item ativo na fila para reorganizar',
            reorganized: 0
          }
        };
      }

      // Atualizar posições
      let reorganized = 0;
      for (let i = 0; i < activeItems.length; i++) {
        const { error } = await supabase
          .from('queue')
          .update({
            position: i + 1,
            updatedAt: new Date().toISOString()
          })
          .eq('id', activeItems[i].id);

        if (!error) {
          reorganized++;
        }
      }

      // Revalidar cache
      revalidatePath('/queue');
      revalidatePath('/dashboard/fila');
      revalidatePath(`/dashboard/fila/${unidadeId}`);

      return {
        success: true,
        data: {
          message: `Fila reorganizada automaticamente. ${reorganized} posições atualizadas.`,
          reorganized
        }
      };
    }
  } catch (error) {
    console.error('Erro inesperado ao reorganizar fila:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Obtém a lista completa de clientes na fila, ordenada corretamente para exibição no frontend
 */
export async function getQueueStatus(
  unidadeId: string
): Promise<ActionResult<QueueItemWithDetails[]>> {
  try {
    if (!unidadeId) {
      return {
        success: false,
        error: 'ID da unidade é obrigatório'
      };
    }

    const supabase = await createClient();

    // Buscar todos os itens ativos da fila com detalhes
    const { data: queueItems, error } = await supabase
      .from('queue')
      .select(`
        *,
        client:clients(id, name, phone, email),
        service:services(id, name, duration, price),
        professional:professionals(id, name, specialty)
      `)
      .eq('unidadeId', unidadeId)
      .in('status', ['aguardando', 'chamado', 'em_atendimento'])
      .order('priority', { ascending: false }) // Prioridade alta primeiro
      .order('position', { ascending: true })  // Depois por posição na fila
      .order('createdAt', { ascending: true }); // Por último, ordem de chegada

    if (error) {
      console.error('Erro ao buscar status da fila:', error);
      return {
        success: false,
        error: 'Erro interno ao buscar status da fila'
      };
    }

    return {
      success: true,
      data: (queueItems || []) as QueueItemWithDetails[]
    };
  } catch (error) {
    console.error('Erro inesperado ao obter status da fila:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Busca itens da fila com filtros e paginação
 */
export async function searchQueue(
  input: SearchQueueInput
): Promise<ActionResultPaginated<QueueItemWithDetails>> {
  try {
    // Validação com Zod
    const validation = searchQueueSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    let query = supabase
      .from('queue')
      .select(`
        *,
        client:clients(id, name, phone, email),
        service:services(id, name, duration, price),
        professional:professionals(id, name, specialty)
      `, { count: 'exact' })
      .eq('unidadeId', validatedData.unidadeId);

    // Aplicar filtros
    if (validatedData.clientId) {
      query = query.eq('clientId', validatedData.clientId);
    }
    if (validatedData.priority) {
      query = query.eq('priority', validatedData.priority);
    }
    if (validatedData.status) {
      query = query.eq('status', validatedData.status);
    }

    // Aplicar paginação
    const from = (validatedData.page - 1) * validatedData.limit;
    const to = from + validatedData.limit - 1;
    query = query.range(from, to);

    // Ordenar por prioridade, posição e data de criação
    query = query.order('priority', { ascending: false });
    query = query.order('position', { ascending: true });
    query = query.order('createdAt', { ascending: true });

    const { data: queueItems, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar fila:', error);
      return {
        success: false,
        error: 'Erro interno ao buscar fila'
      };
    }

    return {
      success: true,
      data: {
        data: (queueItems || []) as QueueItemWithDetails[],
        pagination: {
          page: validatedData.page,
          limit: validatedData.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / validatedData.limit),
        },
      },
    };
  } catch (error) {
    console.error('Erro inesperado ao buscar fila:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Remove cliente da fila
 */
export async function removeFromQueue(
  input: RemoveFromQueueInput
): Promise<ActionResult<QueueItem>> {
  try {
    // Validação com Zod
    const validation = removeFromQueueSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Verificar se o item da fila existe
    const { data: queueItem, error: fetchError } = await supabase
      .from('queue')
      .select('*')
      .eq('id', validatedData.id)
      .single();

    if (fetchError || !queueItem) {
      return {
        success: false,
        error: 'Posição na fila não encontrada'
      };
    }

    // Atualizar status para 'cancelado'
    const { data: updatedItem, error: updateError } = await supabase
      .from('queue')
      .update({
        status: 'cancelado',
        notes: validatedData.notes || `Removido: ${validatedData.reason}`,
        updatedAt: new Date().toISOString()
      })
      .eq('id', validatedData.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao remover da fila:', updateError);
      return {
        success: false,
        error: 'Erro interno ao remover da fila'
      };
    }

    // Reorganizar posições da fila
    await reorganizeQueue(queueItem.unidadeId);

    // Revalidar cache
    revalidatePath('/queue');
    revalidatePath('/dashboard/fila');
    revalidatePath(`/dashboard/fila/${queueItem.unidadeId}`);

    return {
      success: true,
      data: updatedItem as QueueItem
    };
  } catch (error) {
    console.error('Erro inesperado ao remover da fila:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Obtém estatísticas da fila
 */
export async function getQueueStats(
  unidadeId: string
): Promise<ActionResult<QueueStats>> {
  try {
    if (!unidadeId) {
      return {
        success: false,
        error: 'ID da unidade é obrigatório'
      };
    }

    const supabase = await createClient();

    // Itens aguardando
    const { data: waitingItems, error: waitingError } = await supabase
      .from('queue')
      .select('priority, estimatedWaitTime, createdAt')
      .eq('unidadeId', unidadeId)
      .in('status', ['aguardando', 'chamado']);

    if (waitingError) {
      console.error('Erro ao buscar itens aguardando:', waitingError);
      return {
        success: false,
        error: 'Erro interno ao buscar estatísticas da fila'
      };
    }

    if (!waitingItems || waitingItems.length === 0) {
      return {
        success: true,
        data: {
          totalWaiting: 0,
          averageWaitTime: 0,
          priorityBreakdown: { normal: 0, prioritaria: 0, urgente: 0 },
          statusBreakdown: { aguardando: 0, chamado: 0, em_atendimento: 0, finalizado: 0, cancelado: 0 },
          estimatedCompletionTime: new Date().toISOString(),
        }
      };
    }

    const totalWaiting = waitingItems.length;
    const averageWaitTime = waitingItems.reduce((sum, item) => sum + (item.estimatedWaitTime || 0), 0) / totalWaiting;

    // Breakdown por prioridade
    const priorityBreakdown = waitingItems.reduce((acc, item) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Breakdown por status
    const { data: statusBreakdown, error: statusError } = await supabase
      .from('queue')
      .select('status')
      .eq('unidadeId', unidadeId);

    if (statusError) {
      console.error('Erro ao buscar breakdown por status:', statusError);
      return {
        success: false,
        error: 'Erro interno ao buscar estatísticas por status'
      };
    }

    const statusStats = statusBreakdown?.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Tempo estimado de conclusão
    const estimatedCompletionTime = new Date(Date.now() + (averageWaitTime * 60 * 1000)).toISOString();

    const stats: QueueStats = {
      totalWaiting,
      averageWaitTime,
      priorityBreakdown,
      statusBreakdown: statusStats,
      estimatedCompletionTime,
    };

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Erro inesperado ao obter estatísticas da fila:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}
