'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ActionResult, ActionResultPaginated } from '@/lib/types/action';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  searchAppointmentsSchema,
  cancelAppointmentSchema,
  confirmAppointmentSchema,
  startAppointmentSchema,
  finishAppointmentSchema,
  rescheduleAppointmentSchema,
  blockTimeSlotSchema,
  checkConflictsSchema,
  type CreateAppointmentInput,
  type UpdateAppointmentInput,
  type SearchAppointmentsInput,
  type CancelAppointmentInput,
  type ConfirmAppointmentInput,
  type StartAppointmentInput,
  type FinishAppointmentInput,
  type RescheduleAppointmentInput,
  type BlockTimeSlotInput,
  type CheckConflictsInput,
} from '@/lib/validators';
import { createGoogleCalendarEvent, updateGoogleCalendarEvent, deleteGoogleCalendarEvent } from './calendar-sync';

// ============================================================================
// TIPOS DE DADOS
// ============================================================================

export interface Appointment {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: 'agendado' | 'confirmado' | 'em-andamento' | 'atendido' | 'cancelado' | 'faltou';
  notes?: string;
  unidadeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentWithDetails extends Appointment {
  client: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  professional: {
    id: string;
    name: string;
    avatar?: string;
  };
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
  unidade: {
    id: string;
    name: string;
  };
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Cria um novo agendamento
 */
export async function createAppointment(
  input: CreateAppointmentInput,
  userId?: string
): Promise<ActionResult<Appointment>> {
  try {
    // Validação com Zod
    const validation = createAppointmentSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Verificar conflitos de horário
    const { data: conflicts, error: conflictError } = await supabase
      .from('appointments')
      .select('id, startTime, endTime')
      .eq('professionalId', validatedData.professionalId)
      .neq('status', 'cancelado')
      .or(`startTime.lt.${validatedData.endTime},endTime.gt.${validatedData.startTime}`);

    if (conflictError) {
      console.error('Erro ao verificar conflitos:', conflictError);
      return {
        success: false,
        error: 'Erro interno ao verificar disponibilidade'
      };
    }

    if (conflicts && conflicts.length > 0) {
      return {
        success: false,
        error: 'Horário não disponível para este profissional'
      };
    }

    // Criar agendamento
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar agendamento:', error);
      return {
        success: false,
        error: 'Erro interno ao criar agendamento'
      };
    }

    // Revalidar cache
    revalidatePath('/');
    revalidatePath('/agenda');
    revalidatePath(`/agenda/${validatedData.unidadeId}`);

    // Sincronizar com Google Calendar (se configurado)
    try {
      if (userId) {
        await createGoogleCalendarEvent({
          appointmentId: appointment.id,
          title: `Agendamento - ${appointment.client?.name || 'Cliente'}`,
          description: `Novo agendamento criado`,
          startTime: appointment.startTime,
          endTime: appointment.endTime
        }, userId);
      }
    } catch (calendarError) {
      console.warn('Erro ao sincronizar com Google Calendar:', calendarError);
      // Não falhar o agendamento se a sincronização falhar
    }

    return {
      success: true,
      data: appointment as Appointment
    };
  } catch (error) {
    console.error('Erro inesperado ao criar agendamento:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Atualiza um agendamento existente
 */
export async function updateAppointment(
  input: UpdateAppointmentInput,
  userId?: string
): Promise<ActionResult<Appointment>> {
  try {
    // Validação com Zod
    const validation = updateAppointmentSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Verificar se o agendamento existe
    const { data: existing, error: fetchError } = await supabase
      .from('appointments')
      .select('id, status')
      .eq('id', validatedData.id)
      .single();

    if (fetchError || !existing) {
      return {
        success: false,
        error: 'Agendamento não encontrado'
      };
    }

    if (existing.status === 'atendido' || existing.status === 'cancelado') {
      return {
        success: false,
        error: 'Não é possível alterar um agendamento já finalizado ou cancelado'
      };
    }

    // Atualizar agendamento
    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({
        ...validatedData,
        updatedAt: new Date().toISOString()
      })
      .eq('id', validatedData.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar agendamento:', error);
      return {
        success: false,
        error: 'Erro interno ao atualizar agendamento'
      };
    }

    // Revalidar cache
    revalidatePath('/');
    revalidatePath('/agenda');
    revalidatePath(`/agenda/${appointment.unidadeId}`);

    // Sincronizar com Google Calendar (se configurado)
    try {
      if (userId) {
        await updateGoogleCalendarEvent(appointment.id, userId);
      }
    } catch (calendarError) {
      console.warn('Erro ao sincronizar com Google Calendar:', calendarError);
      // Não falhar a atualização se a sincronização falhar
    }

    return {
      success: true,
      data: appointment as Appointment
    };
  } catch (error) {
    console.error('Erro inesperado ao atualizar agendamento:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Busca agendamentos com filtros e paginação
 */
export async function searchAppointments(
  input: SearchAppointmentsInput
): Promise<ActionResultPaginated<AppointmentWithDetails>> {
  try {
    // Validação com Zod
    const validation = searchAppointmentsSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    let query = supabase
      .from('appointments')
      .select(`
        *,
        client:clients(id, name, phone, email),
        professional:professionals(id, name, avatar),
        service:services(id, name, price, duration),
        unidade:unidades(id, name)
      `, { count: 'exact' })
      .eq('unidadeId', validatedData.unidadeId);

    // Aplicar filtros
    if (validatedData.professionalId) {
      query = query.eq('professionalId', validatedData.professionalId);
    }
    if (validatedData.clientId) {
      query = query.eq('clientId', validatedData.clientId);
    }
    if (validatedData.status) {
      query = query.eq('status', validatedData.status);
    }
    if (validatedData.startDate) {
      query = query.gte('startTime', validatedData.startDate);
    }
    if (validatedData.endDate) {
      query = query.lte('startTime', validatedData.endDate);
    }

    // Aplicar paginação
    const from = (validatedData.page - 1) * validatedData.limit;
    const to = from + validatedData.limit - 1;
    query = query.range(from, to);

    // Ordenar por data de início
    query = query.order('startTime', { ascending: true });

    const { data: appointments, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar agendamentos:', error);
      return {
        success: false,
        error: 'Erro interno ao buscar agendamentos'
      };
    }

    return {
      success: true,
      data: {
        data: (appointments || []) as AppointmentWithDetails[],
        pagination: {
          page: validatedData.page,
          limit: validatedData.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / validatedData.limit),
        },
      },
    };
  } catch (error) {
    console.error('Erro inesperado ao buscar agendamentos:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Cancela um agendamento
 */
export async function cancelAppointment(
  input: CancelAppointmentInput,
  userId?: string
): Promise<ActionResult<Appointment>> {
  try {
    // Validação com Zod
    const validation = cancelAppointmentSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Atualizar status para cancelado
    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({
        status: 'cancelado',
        notes: validatedData.reason,
        updatedAt: new Date().toISOString()
      })
      .eq('id', validatedData.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao cancelar agendamento:', error);
      return {
        success: false,
        error: 'Erro interno ao cancelar agendamento'
      };
    }

    // Revalidar cache
    revalidatePath('/');
    revalidatePath('/agenda');

    // Sincronizar com Google Calendar (se configurado)
    try {
      if (userId) {
        await deleteGoogleCalendarEvent(appointment.id, userId);
      }
    } catch (calendarError) {
      console.warn('Erro ao sincronizar com Google Calendar:', calendarError);
      // Não falhar o cancelamento se a sincronização falhar
    }

    return {
      success: true,
      data: appointment as Appointment
    };
  } catch (error) {
    console.error('Erro inesperado ao cancelar agendamento:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Confirma um agendamento
 */
export async function confirmAppointment(
  input: ConfirmAppointmentInput
): Promise<ActionResult<Appointment>> {
  try {
    // Validação com Zod
    const validation = confirmAppointmentSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Atualizar status para confirmado
    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({
        status: 'confirmado',
        updatedAt: new Date().toISOString()
      })
      .eq('id', validatedData.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao confirmar agendamento:', error);
      return {
        success: false,
        error: 'Erro interno ao confirmar agendamento'
      };
    }

    // Revalidar cache
    revalidatePath('/');
    revalidatePath('/agenda');

    return {
      success: true,
      data: appointment as Appointment
    };
  } catch (error) {
    console.error('Erro inesperado ao confirmar agendamento:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Inicia um agendamento
 */
export async function startAppointment(
  input: StartAppointmentInput
): Promise<ActionResult<Appointment>> {
  try {
    // Validação com Zod
    const validation = startAppointmentSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Atualizar status para em-andamento
    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({
        status: 'em-andamento',
        startTime: validatedData.startTime,
        updatedAt: new Date().toISOString()
      })
      .eq('id', validatedData.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao iniciar agendamento:', error);
      return {
        success: false,
        error: 'Erro interno ao iniciar agendamento'
      };
    }

    // Revalidar cache
    revalidatePath('/');
    revalidatePath('/agenda');

    return {
      success: true,
      data: appointment as Appointment
    };
  } catch (error) {
    console.error('Erro inesperado ao iniciar agendamento:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Finaliza um agendamento
 */
export async function finishAppointment(
  input: FinishAppointmentInput
): Promise<ActionResult<Appointment>> {
  try {
    // Validação com Zod
    const validation = finishAppointmentSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Atualizar status para atendido
    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({
        status: 'atendido',
        endTime: validatedData.endTime,
        notes: validatedData.notes,
        updatedAt: new Date().toISOString()
      })
      .eq('id', validatedData.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao finalizar agendamento:', error);
      return {
        success: false,
        error: 'Erro interno ao finalizar agendamento'
      };
    }

    // Revalidar cache
    revalidatePath('/');
    revalidatePath('/agenda');

    return {
      success: true,
      data: appointment as Appointment
    };
  } catch (error) {
    console.error('Erro inesperado ao finalizar agendamento:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Reagenda um agendamento
 */
export async function rescheduleAppointment(
  input: RescheduleAppointmentInput
): Promise<ActionResult<Appointment>> {
  try {
    // Validação com Zod
    const validation = rescheduleAppointmentSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Verificar se o agendamento existe
    const { data: existing, error: fetchError } = await supabase
      .from('appointments')
      .select('id, professionalId, status')
      .eq('id', validatedData.id)
      .single();

    if (fetchError || !existing) {
      return {
        success: false,
        error: 'Agendamento não encontrado'
      };
    }

    if (existing.status === 'atendido' || existing.status === 'cancelado') {
      return {
        success: false,
        error: 'Não é possível reagendar um agendamento já finalizado ou cancelado'
      };
    }

    // Verificar conflitos de horário
    const { data: conflicts, error: conflictError } = await supabase
      .from('appointments')
      .select('id, startTime, endTime')
      .eq('professionalId', existing.professionalId)
      .neq('status', 'cancelado')
      .neq('id', validatedData.id)
      .or(`startTime.lt.${validatedData.newEndTime},endTime.gt.${validatedData.newStartTime}`);

    if (conflictError) {
      console.error('Erro ao verificar conflitos:', conflictError);
      return {
        success: false,
        error: 'Erro interno ao verificar disponibilidade'
      };
    }

    if (conflicts && conflicts.length > 0) {
      return {
        success: false,
        error: 'Novo horário não disponível para este profissional'
      };
    }

    // Atualizar agendamento
    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({
        startTime: validatedData.newStartTime,
        endTime: validatedData.newEndTime,
        notes: validatedData.reason,
        updatedAt: new Date().toISOString()
      })
      .eq('id', validatedData.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao reagendar:', error);
      return {
        success: false,
        error: 'Erro interno ao reagendar'
      };
    }

    // Revalidar cache
    revalidatePath('/');
    revalidatePath('/agenda');

    return {
      success: true,
      data: appointment as Appointment
    };
  } catch (error) {
    console.error('Erro inesperado ao reagendar:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Bloqueia um horário para evitar agendamentos futuros
 */
export async function blockTimeSlot(
  input: BlockTimeSlotInput
): Promise<ActionResult<{ id: string; message: string }>> {
  try {
    // Validação com Zod
    const validation = blockTimeSlotSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Verificar se já existe bloqueio para este horário
    const { data: existingBlock, error: checkError } = await supabase
      .from('time_blocks')
      .select('id')
      .eq('unidadeId', validatedData.unidadeId)
      .eq('startTime', validatedData.startTime)
      .eq('endTime', validatedData.endTime)
      .eq('isActive', true)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erro ao verificar bloqueios existentes:', checkError);
      return {
        success: false,
        error: 'Erro interno ao verificar disponibilidade'
      };
    }

    if (existingBlock) {
      return {
        success: false,
        error: 'Já existe um bloqueio para este horário'
      };
    }

    // Criar bloqueio de horário
    const { data: timeBlock, error } = await supabase
      .from('time_blocks')
      .insert([{
        unidadeId: validatedData.unidadeId,
        professionalId: validatedData.professionalId,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        reason: validatedData.reason,
        blockedBy: validatedData.blockedBy,
        isRecurring: validatedData.isRecurring,
        recurringDays: validatedData.recurringDays,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select('id')
      .single();

    if (error) {
      console.error('Erro ao criar bloqueio de horário:', error);
      return {
        success: false,
        error: 'Erro interno ao criar bloqueio de horário'
      };
    }

    // Revalidar cache
    revalidatePath('/');
    revalidatePath('/agenda');
    revalidatePath(`/agenda/${validatedData.unidadeId}`);

    return {
      success: true,
      data: {
        id: timeBlock.id,
        message: 'Horário bloqueado com sucesso'
      }
    };
  } catch (error) {
    console.error('Erro inesperado ao bloquear horário:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Verifica se um novo agendamento ou bloqueio de horário se sobrepõe a um evento existente
 */
export async function checkConflicts(
  input: CheckConflictsInput
): Promise<ActionResult<{ isAvailable: boolean; conflicts?: Array<Record<string, unknown>> }>> {
  try {
    // Validação com Zod
    const validation = checkConflictsSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Construir query base para verificar conflitos
    let query = supabase
      .from('appointments')
      .select('id, startTime, endTime, status, client:clients(name)')
      .eq('unidadeId', validatedData.unidadeId)
      .neq('status', 'cancelado')
      .or(`startTime.lt.${validatedData.endTime},endTime.gt.${validatedData.startTime}`);

    // Se especificado um profissional, verificar apenas para ele
    if (validatedData.professionalId) {
      query = query.eq('professionalId', validatedData.professionalId);
    }

    // Excluir agendamento específico se fornecido (para casos de edição)
    if (validatedData.excludeAppointmentId) {
      query = query.neq('id', validatedData.excludeAppointmentId);
    }

    // Verificar conflitos em agendamentos
    const { data: appointmentConflicts, error: appointmentError } = await query;

    if (appointmentError) {
      console.error('Erro ao verificar conflitos em agendamentos:', appointmentError);
      return {
        success: false,
        error: 'Erro interno ao verificar disponibilidade'
      };
    }

    // Verificar conflitos em bloqueios de horário
    let blockQuery = supabase
      .from('time_blocks')
      .select('id, startTime, endTime, reason, professional:professionals(name)')
      .eq('unidadeId', validatedData.unidadeId)
      .eq('isActive', true)
      .or(`startTime.lt.${validatedData.endTime},endTime.gt.${validatedData.startTime}`);

    if (validatedData.professionalId) {
      blockQuery = blockQuery.eq('professionalId', validatedData.professionalId);
    }

    const { data: blockConflicts, error: blockError } = await blockQuery;

    if (blockError) {
      console.error('Erro ao verificar conflitos em bloqueios:', blockError);
      return {
        success: false,
        error: 'Erro interno ao verificar disponibilidade'
      };
    }

    // Consolidar todos os conflitos
    const allConflicts = [
      ...(appointmentConflicts || []).map(conflict => ({
        type: 'agendamento',
        id: conflict.id,
        startTime: conflict.startTime,
        endTime: conflict.endTime,
        status: conflict.status,
        clientName: 'Cliente'
      })),
      ...(blockConflicts || []).map(conflict => ({
        type: 'bloqueio',
        id: conflict.id,
        startTime: conflict.startTime,
        endTime: conflict.endTime,
        reason: conflict.reason,
        professionalName: 'Profissional'
      }))
    ];

    if (allConflicts.length > 0) {
      return {
        success: true,
        data: {
          isAvailable: false,
          conflicts: allConflicts
        }
      };
    }

    return {
      success: true,
      data: {
        isAvailable: true
      }
    };
  } catch (error) {
    console.error('Erro inesperado ao verificar conflitos:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Obtém um agendamento por ID
 */
export async function getAppointment(
  id: string
): Promise<ActionResult<AppointmentWithDetails>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID do agendamento é obrigatório'
      };
    }

    const supabase = await createClient();

    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:clients(id, name, phone, email),
        professional:professionals(id, name, avatar),
        service:services(id, name, price, duration),
        unidade:unidades(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Agendamento não encontrado'
        };
      }
      console.error('Erro ao buscar agendamento:', error);
      return {
        success: false,
        error: 'Erro interno ao buscar agendamento'
      };
    }

    return {
      success: true,
      data: appointment as AppointmentWithDetails
    };
  } catch (error) {
    console.error('Erro inesperado ao buscar agendamento:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}
