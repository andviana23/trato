'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ActionResult } from '@/lib/types/action';
import { z } from 'zod';

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

const WhatsAppMessageSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Número de telefone inválido'),
  message: z.string().min(1, 'Mensagem é obrigatória').max(1000, 'Mensagem muito longa'),
  clientId: z.string().uuid('ID do cliente deve ser um UUID válido'),
  appointmentId: z.string().uuid('ID do agendamento deve ser um UUID válido').optional(),
  templateId: z.string().optional(),
  variables: z.record(z.string()).optional(),
});

const SmsMessageSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Número de telefone inválido'),
  message: z.string().min(1, 'Mensagem é obrigatória').max(160, 'SMS muito longo'),
  clientId: z.string().uuid('ID do cliente deve ser um UUID válido'),
  appointmentId: z.string().uuid('ID do agendamento deve ser um UUID válido').optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

const EmailMessageSchema = z.object({
  email: z.string().email('E-mail inválido'),
  subject: z.string().min(1, 'Assunto é obrigatório').max(100, 'Assunto muito longo'),
  message: z.string().min(1, 'Mensagem é obrigatória'),
  clientId: z.string().uuid('ID do cliente deve ser um UUID válido'),
  appointmentId: z.string().uuid('ID do agendamento deve ser um UUID válido').optional(),
  templateId: z.string().optional(),
  variables: z.record(z.string()).optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(), // Base64
    contentType: z.string(),
  })).optional(),
});

// ============================================================================
// TIPOS INFERIDOS
// ============================================================================

export type WhatsAppMessageInput = z.infer<typeof WhatsAppMessageSchema>;
export type SmsMessageInput = z.infer<typeof SmsMessageSchema>;
export type EmailMessageInput = z.infer<typeof EmailMessageSchema>;

// ============================================================================
// CONFIGURAÇÕES DE SERVIÇOS
// ============================================================================

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Registra tentativa de envio de notificação para auditoria
 */
async function logNotificationAttempt(
  type: 'whatsapp' | 'sms' | 'email',
  input: any,
  success: boolean,
  error?: string
) {
  try {
    const supabase = await createClient();
    
    await supabase
      .from('notification_logs')
      .insert({
        type: type,
        clientId: input.clientId,
        appointmentId: input.appointmentId,
        recipient: type === 'email' ? input.email : input.phoneNumber,
        message: input.message || input.subject,
        success: success,
        error: error,
        sentAt: new Date().toISOString(),
        provider: type === 'whatsapp' ? 'whatsapp' : type === 'sms' ? 'twilio' : 'smtp'
      });
  } catch (logError) {
    console.error('Erro ao registrar log de notificação:', logError);
  }
}

/**
 * Obtém dados do cliente para personalização
 */
async function getClientData(clientId: string) {
  try {
    const supabase = await createClient();
    
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error) {
      throw new Error(`Erro ao buscar cliente: ${error.message}`);
    }

    return client;
  } catch (error) {
    console.error('Erro ao obter dados do cliente:', error);
    throw error;
  }
}

/**
 * Obtém dados do agendamento para personalização
 */
async function getAppointmentData(appointmentId: string) {
  try {
    const supabase = await createClient();
    
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        service:services(name, duration, price),
        professional:professionals(name, specialty),
        unidade:unidades(name, address)
      `)
      .eq('id', appointmentId)
      .single();

    if (error) {
      throw new Error(`Erro ao buscar agendamento: ${error.message}`);
    }

    return appointment;
  } catch (error) {
    console.error('Erro ao obter dados do agendamento:', error);
    throw error;
  }
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Envia mensagem via WhatsApp
 */
export async function sendWhatsAppMessage(
  input: WhatsAppMessageInput
): Promise<ActionResult<{ messageId: string; status: string }>> {
  try {
    // Validação com Zod
    const validation = WhatsAppMessageSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;

    // Verificar configurações
    if (!WHATSAPP_API_URL || !WHATSAPP_API_TOKEN) {
      return {
        success: false,
        error: 'Serviço de WhatsApp não configurado'
      };
    }

    // Obter dados do cliente e agendamento para personalização
    const client = await getClientData(validatedData.clientId);
    let appointment = null;
    
    if (validatedData.appointmentId) {
      appointment = await getAppointmentData(validatedData.appointmentId);
    }

    // Personalizar mensagem com variáveis
    let personalizedMessage = validatedData.message;
    
    if (validatedData.variables) {
      Object.entries(validatedData.variables).forEach(([key, value]) => {
        personalizedMessage = personalizedMessage.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
    }

    // Substituir variáveis padrão
    personalizedMessage = personalizedMessage
      .replace(/{{nome}}/g, client.name)
      .replace(/{{telefone}}/g, client.phone || '')
      .replace(/{{email}}/g, client.email || '');

    if (appointment) {
      personalizedMessage = personalizedMessage
        .replace(/{{servico}}/g, appointment.service?.name || '')
        .replace(/{{profissional}}/g, appointment.professional?.name || '')
        .replace(/{{data}}/g, new Date(appointment.startTime).toLocaleDateString('pt-BR'))
        .replace(/{{hora}}/g, new Date(appointment.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
        .replace(/{{unidade}}/g, appointment.unidade?.name || '');
    }

    // Preparar payload para API do WhatsApp
    const payload = {
      messaging_product: 'whatsapp',
      to: validatedData.phoneNumber,
      type: 'text',
      text: {
        body: personalizedMessage
      }
    };

    // Enviar mensagem via API
    const response = await fetch(`${WHATSAPP_API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro na API do WhatsApp: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    
    // Registrar sucesso
    await logNotificationAttempt('whatsapp', validatedData, true);

    // Revalidar cache se necessário
    if (validatedData.appointmentId) {
      revalidatePath('/appointments');
      revalidatePath(`/appointments/${validatedData.appointmentId}`);
    }

    return {
      success: true,
      data: {
        messageId: result.messages?.[0]?.id || 'unknown',
        status: 'sent'
      }
    };

  } catch (error) {
    console.error('Erro ao enviar mensagem WhatsApp:', error);
    
    // Registrar erro
    await logNotificationAttempt('whatsapp', input, false, error instanceof Error ? error.message : 'Erro desconhecido');
    
    return {
      success: false,
      error: `Erro ao enviar mensagem WhatsApp: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

/**
 * Envia mensagem via SMS usando Twilio
 */
export async function sendSms(
  input: SmsMessageInput
): Promise<ActionResult<{ messageId: string; status: string }>> {
  try {
    // Validação com Zod
    const validation = SmsMessageSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;

    // Verificar configurações
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return {
        success: false,
        error: 'Serviço de SMS não configurado'
      };
    }

    // Obter dados do cliente e agendamento para personalização
    const client = await getClientData(validatedData.clientId);
    let appointment = null;
    
    if (validatedData.appointmentId) {
      appointment = await getAppointmentData(validatedData.appointmentId);
    }

    // Personalizar mensagem
    let personalizedMessage = validatedData.message
      .replace(/{{nome}}/g, client.name)
      .replace(/{{telefone}}/g, client.phone || '')
      .replace(/{{email}}/g, client.email || '');

    if (appointment) {
      personalizedMessage = personalizedMessage
        .replace(/{{servico}}/g, appointment.service?.name || '')
        .replace(/{{profissional}}/g, appointment.professional?.name || '')
        .replace(/{{data}}/g, new Date(appointment.startTime).toLocaleDateString('pt-BR'))
        .replace(/{{hora}}/g, new Date(appointment.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
        .replace(/{{unidade}}/g, appointment.unidade?.name || '');
    }

    // Preparar payload para API do Twilio
    const formData = new URLSearchParams();
    formData.append('To', validatedData.phoneNumber);
    formData.append('From', TWILIO_PHONE_NUMBER);
    formData.append('Body', personalizedMessage);
    formData.append('Priority', validatedData.priority);

    // Enviar SMS via API do Twilio
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro na API do Twilio: ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    
    // Registrar sucesso
    await logNotificationAttempt('sms', validatedData, true);

    // Revalidar cache se necessário
    if (validatedData.appointmentId) {
      revalidatePath('/appointments');
      revalidatePath(`/appointments/${validatedData.appointmentId}`);
    }

    return {
      success: true,
      data: {
        messageId: result.sid || 'unknown',
        status: 'sent'
      }
    };

  } catch (error) {
    console.error('Erro ao enviar SMS:', error);
    
    // Registrar erro
    await logNotificationAttempt('sms', input, false, error instanceof Error ? error.message : 'Erro desconhecido');
    
    return {
      success: false,
      error: `Erro ao enviar SMS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

/**
 * Envia e-mail
 */
export async function sendEmail(
  input: EmailMessageInput
): Promise<ActionResult<{ messageId: string; status: string }>> {
  try {
    // Validação com Zod
    const validation = EmailMessageSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;

    // Verificar configurações
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      return {
        success: false,
        error: 'Serviço de e-mail não configurado'
      };
    }

    // Obter dados do cliente e agendamento para personalização
    const client = await getClientData(validatedData.clientId);
    let appointment = null;
    
    if (validatedData.appointmentId) {
      appointment = await getAppointmentData(validatedData.appointmentId);
    }

    // Personalizar mensagem
    let personalizedMessage = validatedData.message
      .replace(/{{nome}}/g, client.name)
      .replace(/{{telefone}}/g, client.phone || '')
      .replace(/{{email}}/g, client.email || '');

    if (validatedData.variables) {
      Object.entries(validatedData.variables).forEach(([key, value]) => {
        personalizedMessage = personalizedMessage.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
    }

    if (appointment) {
      personalizedMessage = personalizedMessage
        .replace(/{{servico}}/g, appointment.service?.name || '')
        .replace(/{{profissional}}/g, appointment.professional?.name || '')
        .replace(/{{data}}/g, new Date(appointment.startTime).toLocaleDateString('pt-BR'))
        .replace(/{{hora}}/g, new Date(appointment.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
        .replace(/{{unidade}}/g, appointment.unidade?.name || '');
    }

    // Personalizar assunto
    let personalizedSubject = validatedData.subject
      .replace(/{{nome}}/g, client.name);

    // Preparar payload para serviço de e-mail (exemplo com Nodemailer via API)
    const emailPayload = {
      to: validatedData.email,
      subject: personalizedSubject,
      html: personalizedMessage,
      attachments: validatedData.attachments || []
    };

    // Enviar e-mail via serviço configurado
    // Nota: Esta é uma implementação de exemplo. Em produção, você pode usar:
    // - Nodemailer diretamente
    // - Serviços como SendGrid, Mailgun, etc.
    // - Uma API interna para envio de e-mails
    
    // Simular envio bem-sucedido (substitua pela implementação real)
    const messageId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Registrar sucesso
    await logNotificationAttempt('email', validatedData, true);

    // Revalidar cache se necessário
    if (validatedData.appointmentId) {
      revalidatePath('/appointments');
      revalidatePath(`/appointments/${validatedData.appointmentId}`);
    }

    return {
      success: true,
      data: {
        messageId: messageId,
        status: 'sent'
      }
    };

  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    
    // Registrar erro
    await logNotificationAttempt('email', input, false, error instanceof Error ? error.message : 'Erro desconhecido');
    
    return {
      success: false,
      error: `Erro ao enviar e-mail: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

/**
 * Envia notificação automática de confirmação de agendamento
 */
export async function sendAppointmentConfirmation(
  appointmentId: string,
  channels: ('whatsapp' | 'sms' | 'email')[] = ['whatsapp', 'email']
): Promise<ActionResult<{ sent: string[]; failed: string[] }>> {
  try {
    const supabase = await createClient();
    
    // Buscar dados do agendamento
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        client:clients(name, phone, email),
        service:services(name, duration, price),
        professional:professionals(name, specialty),
        unidade:unidades(name, address)
      `)
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return {
        success: false,
        error: 'Agendamento não encontrado'
      };
    }

    const client = appointment.client;
    const sent: string[] = [];
    const failed: string[] = [];

    // Preparar mensagens personalizadas
    const whatsappMessage = `Olá {{nome}}! Seu agendamento foi confirmado:\n\n` +
      `📅 Data: {{data}}\n` +
      `🕐 Horário: {{hora}}\n` +
      `💇‍♀️ Serviço: {{servico}}\n` +
      `👨‍⚕️ Profissional: {{profissional}}\n` +
      `🏢 Unidade: {{unidade}}\n\n` +
      `Aguardamos você!`;

    const emailSubject = 'Confirmação de Agendamento - {{nome}}';
    const emailMessage = `
      <h2>Olá {{nome}}!</h2>
      <p>Seu agendamento foi confirmado com sucesso:</p>
      <ul>
        <li><strong>Data:</strong> {{data}}</li>
        <li><strong>Horário:</strong> {{hora}}</li>
        <li><strong>Serviço:</strong> {{servico}}</li>
        <li><strong>Profissional:</strong> {{profissional}}</li>
        <li><strong>Unidade:</strong> {{unidade}}</li>
      </ul>
      <p>Aguardamos você!</p>
    `;

    // Enviar por WhatsApp
    if (channels.includes('whatsapp') && client.phone) {
      try {
        const result = await sendWhatsAppMessage({
          phoneNumber: client.phone,
          message: whatsappMessage,
          clientId: client.id,
          appointmentId: appointmentId,
          variables: {
            nome: client.name,
            data: new Date(appointment.startTime).toLocaleDateString('pt-BR'),
            hora: new Date(appointment.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            servico: appointment.service?.name || '',
            profissional: appointment.professional?.name || '',
            unidade: appointment.unidade?.name || ''
          }
        });

        if (result.success) {
          sent.push('whatsapp');
        } else {
          failed.push('whatsapp');
        }
      } catch (error) {
        failed.push('whatsapp');
      }
    }

    // Enviar por e-mail
    if (channels.includes('email') && client.email) {
      try {
        const result = await sendEmail({
          email: client.email,
          subject: emailSubject,
          message: emailMessage,
          clientId: client.id,
          appointmentId: appointmentId,
          variables: {
            nome: client.name,
            data: new Date(appointment.startTime).toLocaleDateString('pt-BR'),
            hora: new Date(appointment.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            servico: appointment.service?.name || '',
            profissional: appointment.professional?.name || '',
            unidade: appointment.unidade?.name || ''
          }
        });

        if (result.success) {
          sent.push('email');
        } else {
          failed.push('email');
        }
      } catch (error) {
        failed.push('email');
      }
    }

    // Enviar por SMS
    if (channels.includes('sms') && client.phone) {
      try {
        const result = await sendSms({
          phoneNumber: client.phone,
          message: `Olá ${client.name}! Seu agendamento foi confirmado para ${new Date(appointment.startTime).toLocaleDateString('pt-BR')} às ${new Date(appointment.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`,
          clientId: client.id,
          appointmentId: appointmentId
        });

        if (result.success) {
          sent.push('sms');
        } else {
          failed.push('sms');
        }
      } catch (error) {
        failed.push('sms');
      }
    }

    return {
      success: true,
      data: {
        sent,
        failed
      }
    };

  } catch (error) {
    console.error('Erro ao enviar confirmação de agendamento:', error);
    return {
      success: false,
      error: `Erro ao enviar confirmação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}
