'use server';

import { createClient } from '@/lib/supabase/server';
import { ActionResult } from '@/lib/types/action';
import { z } from 'zod';

// ============================================================================
// CONFIGURAÇÕES DO GOOGLE CALENDAR
// ============================================================================

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  throw new Error('Configurações do Google Calendar não encontradas');
}

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

const CalendarEventSchema = z.object({
  appointmentId: z.string().uuid('ID do agendamento deve ser um UUID válido'),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  startTime: z.string().datetime('Data e hora de início deve ser válida'),
  endTime: z.string().datetime('Data e hora de fim deve ser válida'),
  location: z.string().optional(),
  attendees: z.array(z.string().email('E-mail inválido')).optional(),
  reminders: z.array(z.object({
    method: z.enum(['email', 'popup']),
    minutes: z.number().min(0, 'Minutos deve ser >= 0')
  })).optional(),
});

export type CalendarEventInput = z.infer<typeof CalendarEventSchema>;

// ============================================================================
// TIPOS DE DADOS
// ============================================================================

interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  colorId?: string;
  transparency?: 'opaque' | 'transparent';
}

interface GoogleAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Obtém tokens de autenticação do Google
 */
async function getGoogleAuthTokens(userId: string): Promise<GoogleAuthTokens | null> {
  try {
    const supabase = await createClient();
    
    const { data: tokens, error } = await supabase
      .from('google_auth_tokens')
      .select('*')
      .eq('userId', userId)
      .eq('isActive', true)
      .single();

    if (error || !tokens) {
      return null;
    }

    // Verificar se o token expirou
    if (tokens.expiresAt && new Date(tokens.expiresAt) <= new Date()) {
      // Tentar renovar o token
      if (tokens.refreshToken) {
        const refreshedTokens = await refreshGoogleToken(tokens.refreshToken);
        if (refreshedTokens) {
          // Atualizar tokens no banco
          await supabase
            .from('google_auth_tokens')
            .update({
              accessToken: refreshedTokens.access_token,
              expiresAt: new Date(Date.now() + refreshedTokens.expires_in * 1000).toISOString(),
              updatedAt: new Date().toISOString()
            })
            .eq('id', tokens.id);

          return refreshedTokens;
        }
      }
      return null;
    }

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: Math.floor((new Date(tokens.expiresAt).getTime() - Date.now()) / 1000),
      token_type: tokens.tokenType,
      scope: tokens.scope
    };
  } catch (error) {
    console.error('Erro ao obter tokens do Google:', error);
    return null;
  }
}

/**
 * Renova token de acesso do Google
 */
async function refreshGoogleToken(refreshToken: string): Promise<GoogleAuthTokens | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao renovar token: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao renovar token do Google:', error);
    return null;
  }
}

/**
 * Obtém dados do agendamento para sincronização
 */
async function getAppointmentForSync(appointmentId: string) {
  try {
    const supabase = await createClient();
    
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:clients(name, email, phone),
        service:services(name, duration, price),
        professional:professionals(name, specialty, email),
        unidade:unidades(name, address)
      `)
      .eq('id', appointmentId)
      .single();

    if (error || !appointment) {
      throw new Error('Agendamento não encontrado');
    }

    return appointment;
  } catch (error) {
    console.error('Erro ao obter dados do agendamento:', error);
    throw error;
  }
}

/**
 * Converte agendamento para evento do Google Calendar
 */
function convertToGoogleCalendarEvent(
  appointment: any,
  title?: string,
  description?: string
): GoogleCalendarEvent {
  const startTime = new Date(appointment.startTime);
  const endTime = new Date(appointment.endTime);
  
  // Definir fuso horário (Brasil)
  const timeZone = 'America/Sao_Paulo';
  
  // Preparar lista de participantes
  const attendees = [];
  if (appointment.client?.email) {
    attendees.push({
      email: appointment.client.email,
      displayName: appointment.client.name,
      responseStatus: 'accepted'
    });
  }
  if (appointment.professional?.email) {
    attendees.push({
      email: appointment.professional.email,
      displayName: appointment.professional.name,
      responseStatus: 'accepted'
    });
  }

  return {
    summary: title || `${appointment.service?.name} - ${appointment.client?.name}`,
    description: description || `Agendamento: ${appointment.service?.name}\nCliente: ${appointment.client?.name}\nProfissional: ${appointment.professional?.name}\nUnidade: ${appointment.unidade?.name}\nObservações: ${appointment.notes || 'Nenhuma'}`,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: timeZone
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: timeZone
    },
    location: appointment.unidade?.address || appointment.unidade?.name,
    attendees: attendees.length > 0 ? attendees : undefined,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 15 },
        { method: 'email', minutes: 60 }
      ]
    },
    colorId: '1', // Cor azul para agendamentos
    transparency: 'opaque'
  };
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Cria evento no Google Calendar
 */
export async function createGoogleCalendarEvent(
  input: CalendarEventInput,
  userId: string
): Promise<ActionResult<{ eventId: string; htmlLink: string }>> {
  try {
    // Validação com Zod
    const validation = CalendarEventSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;

    // Obter tokens de autenticação
    const tokens = await getGoogleAuthTokens(userId);
    if (!tokens) {
      return {
        success: false,
        error: 'Usuário não autenticado no Google Calendar'
      };
    }

    // Obter dados do agendamento
    const appointment = await getAppointmentForSync(validatedData.appointmentId);

    // Converter para evento do Google Calendar
    const calendarEvent = convertToGoogleCalendarEvent(
      appointment,
      validatedData.title,
      validatedData.description
    );

    // Criar evento no Google Calendar
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${GOOGLE_CALENDAR_ID}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(calendarEvent),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro ao criar evento no Google Calendar: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();

    // Atualizar agendamento com ID do evento do Google
    const supabase = await createClient();
    await supabase
      .from('appointments')
      .update({
        googleCalendarEventId: result.id,
        googleCalendarLink: result.htmlLink,
        updatedAt: new Date().toISOString()
      })
      .eq('id', validatedData.appointmentId);

    return {
      success: true,
      data: {
        eventId: result.id,
        htmlLink: result.htmlLink
      }
    };

  } catch (error) {
    console.error('Erro ao criar evento no Google Calendar:', error);
    return {
      success: false,
      error: `Erro ao criar evento no Google Calendar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

/**
 * Atualiza evento no Google Calendar
 */
export async function updateGoogleCalendarEvent(
  appointmentId: string,
  userId: string
): Promise<ActionResult<{ eventId: string; htmlLink: string }>> {
  try {
    // Obter tokens de autenticação
    const tokens = await getGoogleAuthTokens(userId);
    if (!tokens) {
      return {
        success: false,
        error: 'Usuário não autenticado no Google Calendar'
      };
    }

    // Obter dados do agendamento
    const appointment = await getAppointmentForSync(appointmentId);

    if (!appointment.googleCalendarEventId) {
      // Se não existe evento no Google, criar um novo
      return await createGoogleCalendarEvent({
        appointmentId: appointmentId,
        title: `${appointment.service?.name} - ${appointment.client?.name}`,
        description: `Agendamento atualizado`,
        startTime: appointment.startTime,
        endTime: appointment.endTime
      }, userId);
    }

    // Converter para evento do Google Calendar
    const calendarEvent = convertToGoogleCalendarEvent(appointment);

    // Atualizar evento no Google Calendar
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${GOOGLE_CALENDAR_ID}/events/${appointment.googleCalendarEventId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(calendarEvent),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro ao atualizar evento no Google Calendar: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();

    return {
      success: true,
      data: {
        eventId: result.id,
        htmlLink: result.htmlLink
      }
    };

  } catch (error) {
    console.error('Erro ao atualizar evento no Google Calendar:', error);
    return {
      success: false,
      error: `Erro ao atualizar evento no Google Calendar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

/**
 * Remove evento do Google Calendar
 */
export async function deleteGoogleCalendarEvent(
  appointmentId: string,
  userId: string
): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    // Obter tokens de autenticação
    const tokens = await getGoogleAuthTokens(userId);
    if (!tokens) {
      return {
        success: false,
        error: 'Usuário não autenticado no Google Calendar'
      };
    }

    // Obter dados do agendamento
    const appointment = await getAppointmentForSync(appointmentId);

    if (!appointment.googleCalendarEventId) {
      return {
        success: true,
        data: { deleted: true } // Já não existe no Google
      };
    }

    // Remover evento do Google Calendar
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${GOOGLE_CALENDAR_ID}/events/${appointment.googleCalendarEventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const errorData = await response.json();
      throw new Error(`Erro ao remover evento do Google Calendar: ${errorData.error?.message || response.statusText}`);
    }

    // Limpar referências no agendamento
    const supabase = await createClient();
    await supabase
      .from('appointments')
      .update({
        googleCalendarEventId: null,
        googleCalendarLink: null,
        updatedAt: new Date().toISOString()
      })
      .eq('id', appointmentId);

    return {
      success: true,
      data: { deleted: true }
    };

  } catch (error) {
    console.error('Erro ao remover evento do Google Calendar:', error);
    return {
      success: false,
      error: `Erro ao remover evento do Google Calendar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

/**
 * Sincroniza todos os agendamentos com Google Calendar
 */
export async function syncAllAppointmentsWithGoogle(
  userId: string,
  unidadeId?: string
): Promise<ActionResult<{ synced: number; errors: number; details: string[] }>> {
  try {
    // Obter tokens de autenticação
    const tokens = await getGoogleAuthTokens(userId);
    if (!tokens) {
      return {
        success: false,
        error: 'Usuário não autenticado no Google Calendar'
      };
    }

    const supabase = await createClient();
    
    // Buscar agendamentos para sincronizar
    let query = supabase
      .from('appointments')
      .select(`
        *,
        client:clients(name, email),
        service:services(name),
        professional:professionals(name, email),
        unidade:unidades(name, address)
      `)
      .in('status', ['agendado', 'confirmado'])
      .gte('startTime', new Date().toISOString());

    if (unidadeId) {
      query = query.eq('unidadeId', unidadeId);
    }

    const { data: appointments, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar agendamentos: ${error.message}`);
    }

    if (!appointments || appointments.length === 0) {
      return {
        success: true,
        data: {
          synced: 0,
          errors: 0,
          details: ['Nenhum agendamento para sincronizar']
        }
      };
    }

    let synced = 0;
    let errors = 0;
    const details: string[] = [];

    // Sincronizar cada agendamento
    for (const appointment of appointments) {
      try {
        if (appointment.googleCalendarEventId) {
          // Atualizar evento existente
          const result = await updateGoogleCalendarEvent(appointment.id, userId);
          if (result.success) {
            synced++;
            details.push(`✅ Atualizado: ${appointment.client?.name} - ${appointment.service?.name}`);
          } else {
            errors++;
            details.push(`❌ Erro ao atualizar: ${appointment.client?.name} - ${result.error}`);
          }
        } else {
          // Criar novo evento
          const result = await createGoogleCalendarEvent({
            appointmentId: appointment.id,
            title: `${appointment.service?.name} - ${appointment.client?.name}`,
            description: `Agendamento sincronizado`,
            startTime: appointment.startTime,
            endTime: appointment.endTime
          }, userId);
          
          if (result.success) {
            synced++;
            details.push(`✅ Criado: ${appointment.client?.name} - ${appointment.service?.name}`);
          } else {
            errors++;
            details.push(`❌ Erro ao criar: ${appointment.client?.name} - ${result.error}`);
          }
        }
      } catch (error) {
        errors++;
        details.push(`❌ Erro: ${appointment.client?.name} - ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    return {
      success: true,
      data: {
        synced,
        errors,
        details
      }
    };

  } catch (error) {
    console.error('Erro ao sincronizar agendamentos com Google Calendar:', error);
    return {
      success: false,
      error: `Erro ao sincronizar agendamentos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

/**
 * Obtém status de autenticação do Google Calendar
 */
export async function getGoogleCalendarAuthStatus(
  userId: string
): Promise<ActionResult<{ isAuthenticated: boolean; expiresAt?: string; calendarId: string }>> {
  try {
    const tokens = await getGoogleAuthTokens(userId);
    
    if (!tokens) {
      return {
        success: true,
        data: {
          isAuthenticated: false,
          calendarId: GOOGLE_CALENDAR_ID
        }
      };
    }

    const supabase = await createClient();
    const { data: tokenData } = await supabase
      .from('google_auth_tokens')
      .select('expiresAt')
      .eq('userId', userId)
      .eq('isActive', true)
      .single();

    return {
      success: true,
      data: {
        isAuthenticated: true,
        expiresAt: tokenData?.expiresAt,
        calendarId: GOOGLE_CALENDAR_ID
      }
    };

  } catch (error) {
    console.error('Erro ao verificar status de autenticação:', error);
    return {
      success: false,
      error: `Erro ao verificar autenticação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}
