// ============================================================================
// TEMPLATES DE NOTIFICAÇÃO
// ============================================================================

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'whatsapp' | 'email' | 'sms';
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
}

// ============================================================================
// TEMPLATES DE WHATSAPP
// ============================================================================

export const whatsappTemplates: NotificationTemplate[] = [
  {
    id: 'appointment_confirmation',
    name: 'Confirmação de Agendamento',
    type: 'whatsapp',
    content: `Olá {{clientName}}! 

✅ Seu agendamento foi confirmado!

📅 Data: {{appointmentDate}}
🕐 Horário: {{appointmentTime}}
💇‍♂️ Profissional: {{professionalName}}
📍 Local: {{unidadeName}}
🔧 Serviço: {{serviceName}}

📱 Para reagendar ou cancelar, entre em contato conosco.

Obrigado por escolher {{unidadeName}}! 🎉`,
    variables: ['clientName', 'appointmentDate', 'appointmentTime', 'professionalName', 'unidadeName', 'serviceName'],
    isActive: true,
  },
  {
    id: 'appointment_reminder',
    name: 'Lembrete de Agendamento',
    type: 'whatsapp',
    content: `Olá {{clientName}}! 

⏰ Lembrete do seu agendamento!

📅 Data: {{appointmentDate}}
🕐 Horário: {{appointmentTime}}
💇‍♂️ Profissional: {{professionalName}}
📍 Local: {{unidadeName}}

⚠️ Chegue com 10 minutos de antecedência.

📱 Para reagendar ou cancelar, entre em contato conosco.

Até logo! 👋`,
    variables: ['clientName', 'appointmentDate', 'appointmentTime', 'professionalName', 'unidadeName'],
    isActive: true,
  },
  {
    id: 'appointment_cancelled',
    name: 'Agendamento Cancelado',
    type: 'whatsapp',
    content: `Olá {{clientName}}! 

❌ Seu agendamento foi cancelado.

📅 Data: {{appointmentDate}}
🕐 Horário: {{appointmentTime}}

📱 Para reagendar, entre em contato conosco.

Desculpe pelo inconveniente. 😔`,
    variables: ['clientName', 'appointmentDate', 'appointmentTime'],
    isActive: true,
  },
  {
    id: 'payment_confirmation',
    name: 'Confirmação de Pagamento',
    type: 'whatsapp',
    content: `Olá {{clientName}}! 

💳 Pagamento confirmado com sucesso!

💰 Valor: R$ {{amount}}
📅 Data: {{paymentDate}}
🔢 Transação: {{transactionId}}

✅ Seu agendamento está confirmado!

Obrigado! 🎉`,
    variables: ['clientName', 'amount', 'paymentDate', 'transactionId'],
    isActive: true,
  },
  {
    id: 'queue_position',
    name: 'Posição na Fila',
    type: 'whatsapp',
    content: `Olá {{clientName}}! 

🔄 Você está na fila de espera.

📍 Local: {{unidadeName}}
👥 Posição: {{position}} de {{total}}
⏱️ Tempo estimado: {{estimatedTime}}

📱 Acompanhe sua posição em tempo real.

Obrigado pela paciência! 🙏`,
    variables: ['clientName', 'unidadeName', 'position', 'total', 'estimatedTime'],
    isActive: true,
  },
];

// ============================================================================
// TEMPLATES DE EMAIL
// ============================================================================

export const emailTemplates: NotificationTemplate[] = [
  {
    id: 'appointment_confirmation_email',
    name: 'Confirmação de Agendamento - Email',
    type: 'email',
    subject: '✅ Agendamento Confirmado - {{unidadeName}}',
    content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Agendamento Confirmado</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
        .info { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #4CAF50; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Agendamento Confirmado!</h1>
        </div>
        <div class="content">
            <p>Olá <strong>{{clientName}}</strong>!</p>
            
            <p>Seu agendamento foi confirmado com sucesso!</p>
            
            <div class="info">
                <strong>📅 Data:</strong> {{appointmentDate}}<br>
                <strong>🕐 Horário:</strong> {{appointmentTime}}<br>
                <strong>💇‍♂️ Profissional:</strong> {{professionalName}}<br>
                <strong>📍 Local:</strong> {{unidadeName}}<br>
                <strong>🔧 Serviço:</strong> {{serviceName}}
            </div>
            
            <p><strong>⚠️ Importante:</strong> Chegue com 10 minutos de antecedência.</p>
            
            <p>Para reagendar ou cancelar, entre em contato conosco.</p>
            
            <p>Obrigado por escolher <strong>{{unidadeName}}</strong>! 🎉</p>
        </div>
        <div class="footer">
            <p>Este é um email automático, não responda a esta mensagem.</p>
        </div>
    </div>
</body>
</html>`,
    variables: ['clientName', 'appointmentDate', 'appointmentTime', 'professionalName', 'unidadeName', 'serviceName'],
    isActive: true,
  },
  {
    id: 'appointment_reminder_email',
    name: 'Lembrete de Agendamento - Email',
    type: 'email',
    subject: '⏰ Lembrete: Seu agendamento é amanhã - {{unidadeName}}',
    content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Lembrete de Agendamento</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
        .info { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #FF9800; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ Lembrete de Agendamento</h1>
        </div>
        <div class="content">
            <p>Olá <strong>{{clientName}}</strong>!</p>
            
            <p>Este é um lembrete do seu agendamento para amanhã:</p>
            
            <div class="info">
                <strong>📅 Data:</strong> {{appointmentDate}}<br>
                <strong>🕐 Horário:</strong> {{appointmentTime}}<br>
                <strong>💇‍♂️ Profissional:</strong> {{professionalName}}<br>
                <strong>📍 Local:</strong> {{unidadeName}}
            </div>
            
            <p><strong>⚠️ Lembre-se:</strong> Chegue com 10 minutos de antecedência.</p>
            
            <p>Para reagendar ou cancelar, entre em contato conosco.</p>
            
            <p>Até logo! 👋</p>
        </div>
        <div class="footer">
            <p>Este é um email automático, não responda a esta mensagem.</p>
        </div>
    </div>
</body>
</html>`,
    variables: ['clientName', 'appointmentDate', 'appointmentTime', 'professionalName', 'unidadeName'],
    isActive: true,
  },
  {
    id: 'payment_confirmation_email',
    name: 'Confirmação de Pagamento - Email',
    type: 'email',
    subject: '💳 Pagamento Confirmado - {{unidadeName}}',
    content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Pagamento Confirmado</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
        .info { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #2196F3; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💳 Pagamento Confirmado!</h1>
        </div>
        <div class="content">
            <p>Olá <strong>{{clientName}}</strong>!</p>
            
            <p>Seu pagamento foi processado com sucesso!</p>
            
            <div class="info">
                <strong>💰 Valor:</strong> R$ {{amount}}<br>
                <strong>📅 Data:</strong> {{paymentDate}}<br>
                <strong>🔢 Transação:</strong> {{transactionId}}<br>
                <strong>💳 Forma de Pagamento:</strong> {{paymentMethod}}
            </div>
            
            <p>✅ Seu agendamento está confirmado!</p>
            
            <p>Obrigado por escolher <strong>{{unidadeName}}</strong>! 🎉</p>
        </div>
        <div class="footer">
            <p>Este é um email automático, não responda a esta mensagem.</p>
        </div>
    </div>
</body>
</html>`,
    variables: ['clientName', 'amount', 'paymentDate', 'transactionId', 'paymentMethod', 'unidadeName'],
    isActive: true,
  },
];

// ============================================================================
// TEMPLATES DE SMS
// ============================================================================

export const smsTemplates: NotificationTemplate[] = [
  {
    id: 'appointment_confirmation_sms',
    name: 'Confirmação de Agendamento - SMS',
    type: 'sms',
    content: '{{unidadeName}}: Agendamento confirmado para {{appointmentDate}} às {{appointmentTime}}. Prof: {{professionalName}}. Chegue 10min antes.',
    variables: ['unidadeName', 'appointmentDate', 'appointmentTime', 'professionalName'],
    isActive: true,
  },
  {
    id: 'appointment_reminder_sms',
    name: 'Lembrete de Agendamento - SMS',
    type: 'sms',
    content: '{{unidadeName}}: Lembrete - Agendamento amanhã às {{appointmentTime}}. Chegue 10min antes. Para reagendar: {{phoneNumber}}',
    variables: ['unidadeName', 'appointmentTime', 'phoneNumber'],
    isActive: true,
  },
  {
    id: 'queue_position_sms',
    name: 'Posição na Fila - SMS',
    type: 'sms',
    content: '{{unidadeName}}: Você está na posição {{position}} de {{total}}. Tempo estimado: {{estimatedTime}}min.',
    variables: ['unidadeName', 'position', 'total', 'estimatedTime'],
    isActive: true,
  },
];

// ============================================================================
// FUNÇÕES DE UTILIDADE
// ============================================================================

export function getAllTemplates(): NotificationTemplate[] {
  return [
    ...whatsappTemplates,
    ...emailTemplates,
    ...smsTemplates,
  ];
}

export function getTemplateById(id: string): NotificationTemplate | undefined {
  return getAllTemplates().find(template => template.id === id);
}

export function getTemplatesByType(type: 'whatsapp' | 'email' | 'sms'): NotificationTemplate[] {
  return getAllTemplates().filter(template => template.type === type);
}

export function getActiveTemplates(): NotificationTemplate[] {
  return getAllTemplates().filter(template => template.isActive);
}

export function renderTemplate(template: NotificationTemplate, variables: Record<string, string>): string {
  let content = template.content;
  
  // Substituir variáveis no template
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    content = content.replace(new RegExp(placeholder, 'g'), value);
  }
  
  return content;
}

export function validateTemplateVariables(template: NotificationTemplate, variables: Record<string, string>): boolean {
  const requiredVariables = template.variables;
  const providedVariables = Object.keys(variables);
  
  return requiredVariables.every(variable => providedVariables.includes(variable));
}

// ============================================================================
// TEMPLATES PRÉ-DEFINIDOS PARA CASOS COMUNS
// ============================================================================

export const commonTemplates = {
  // Agendamentos
  appointmentConfirmation: {
    whatsapp: 'appointment_confirmation',
    email: 'appointment_confirmation_email',
    sms: 'appointment_confirmation_sms',
  },
  
  // Lembretes
  appointmentReminder: {
    whatsapp: 'appointment_reminder',
    email: 'appointment_reminder_email',
    sms: 'appointment_reminder_sms',
  },
  
  // Pagamentos
  paymentConfirmation: {
    whatsapp: 'payment_confirmation',
    email: 'payment_confirmation_email',
    sms: null, // SMS não tem template de pagamento
  },
  
  // Fila
  queuePosition: {
    whatsapp: 'queue_position',
    email: null, // Email não tem template de fila
    sms: 'queue_position_sms',
  },
};
