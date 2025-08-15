"use server";

import { createClient } from '@/lib/supabase/server';
import { getCurrentUnidade } from '@/lib/unidade';

export interface CreateAppointmentData {
  barbeiro_id: string;
  cliente_id?: string;
  start_at: string;
  end_at: string;
  servicos?: Array<{ id: string; nome: string; duracao_minutos?: number }>;
  observacoes?: string;
}

export interface UpdateAppointmentData {
  start_at?: string;
  end_at?: string;
  status?: string;
  servicos?: Array<{ id: string; nome: string; duracao_minutos?: number }>;
  observacoes?: string;
}

export async function createAppointment(data: CreateAppointmentData) {
  const supabase = await createClient();
  const unidade_id = await getCurrentUnidade();
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Não autorizado' };
  }
  
  // Criar agendamento
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      ...data,
      unidade_id,
      status: 'agendado'
    })
    .select()
    .single();
    
  if (error) {
    console.error('Erro ao criar agendamento:', error);
    return { error: error.message };
  }
  
  // Agendar notificações automaticamente
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/appointments/${appointment.id}/schedule-notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ channel: 'whatsapp' })
    });
    
    if (!response.ok) {
      console.error('Erro ao agendar notificações');
    }
  } catch (error) {
    console.error('Erro ao chamar API de notificações:', error);
  }
  
  return { data: appointment };
}

export async function updateAppointment(id: string, data: UpdateAppointmentData) {
  const supabase = await createClient();
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Não autorizado' };
  }
  
  // Atualizar agendamento
  const { data: appointment, error } = await supabase
    .from('appointments')
    .update(data)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Erro ao atualizar agendamento:', error);
    return { error: error.message };
  }
  
  // Reagendar notificações se o horário mudou
  if (data.start_at || data.end_at) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/appointments/${id}/schedule-notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channel: 'whatsapp' })
      });
      
      if (!response.ok) {
        console.error('Erro ao reagendar notificações');
      }
    } catch (error) {
      console.error('Erro ao chamar API de notificações:', error);
    }
  }
  
  return { data: appointment };
}

export async function cancelAppointment(id: string) {
  const supabase = await createClient();
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Não autorizado' };
  }
  
  // Cancelar agendamento
  const { data: appointment, error } = await supabase
    .from('appointments')
    .update({ status: 'cancelado' })
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Erro ao cancelar agendamento:', error);
    return { error: error.message };
  }
  
  // Cancelar notificações pendentes
  const { error: notifError } = await supabase
    .from('notifications_queue')
    .update({ status: 'cancelled' })
    .eq('appointment_id', id)
    .eq('status', 'pending');
    
  if (notifError) {
    console.error('Erro ao cancelar notificações:', notifError);
  }
  
  return { data: appointment };
}

export async function getAppointments(date: string) {
  const supabase = await createClient();
  const unidade_id = await getCurrentUnidade();
  
  // Buscar agendamentos do dia
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      *,
      barbeiro:professionals(id, name, avatar_url),
      cliente:auth.users(id, email)
    `)
    .eq('unidade_id', unidade_id)
    .gte('start_at', startOfDay.toISOString())
    .lte('start_at', endOfDay.toISOString())
    .order('start_at', { ascending: true });
    
  if (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return { error: error.message };
  }
  
  return { data: appointments };
}