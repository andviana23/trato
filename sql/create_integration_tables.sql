-- ============================================================================
-- CRIAÇÃO DAS TABELAS DE INTEGRAÇÃO
-- ============================================================================
-- Este arquivo é necessário para suportar as integrações críticas
-- implementadas no sistema Trato.

-- ============================================================================
-- TABELA WEBHOOK_LOGS
-- ============================================================================
-- Armazena logs de todos os webhooks recebidos para auditoria

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('asaas', 'stripe', 'mercadopago', 'pix')),
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  isValid BOOLEAN NOT NULL,
  error TEXT,
  receivedAt TIMESTAMP WITH TIME ZONE NOT NULL,
  processedAt TIMESTAMP WITH TIME ZONE NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABELA NOTIFICATION_LOGS
-- ============================================================================
-- Armazena logs de todas as tentativas de envio de notificações

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('whatsapp', 'sms', 'email', 'push')),
  clientId UUID REFERENCES clients(id) ON DELETE SET NULL,
  appointmentId UUID REFERENCES appointments(id) ON DELETE SET NULL,
  recipient TEXT NOT NULL, -- telefone, email ou token push
  message TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  error TEXT,
  sentAt TIMESTAMP WITH TIME ZONE NOT NULL,
  provider TEXT NOT NULL, -- 'whatsapp', 'twilio', 'smtp', 'firebase'
  retryCount INTEGER DEFAULT 0,
  maxRetries INTEGER DEFAULT 3,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABELA GOOGLE_AUTH_TOKENS
-- ============================================================================
-- Armazena tokens de autenticação do Google para sincronização com Calendar

CREATE TABLE IF NOT EXISTS google_auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accessToken TEXT NOT NULL,
  refreshToken TEXT,
  expiresAt TIMESTAMP WITH TIME ZONE NOT NULL,
  tokenType TEXT NOT NULL DEFAULT 'Bearer',
  scope TEXT NOT NULL,
  isActive BOOLEAN DEFAULT true,
  lastUsedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABELA INTEGRATION_SETTINGS
-- ============================================================================
-- Configurações globais das integrações

CREATE TABLE IF NOT EXISTS integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  isEncrypted BOOLEAN DEFAULT false,
  isActive BOOLEAN DEFAULT true,
  updatedBy UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices para webhook_logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_provider_event 
ON webhook_logs(provider, event);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_received_at 
ON webhook_logs(receivedAt);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_is_valid 
ON webhook_logs(isValid);

-- Índices para notification_logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_type_success 
ON notification_logs(type, success);

CREATE INDEX IF NOT EXISTS idx_notification_logs_client_id 
ON notification_logs(clientId);

CREATE INDEX IF NOT EXISTS idx_notification_logs_appointment_id 
ON notification_logs(appointmentId);

CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at 
ON notification_logs(sentAt);

CREATE INDEX IF NOT EXISTS idx_notification_logs_provider 
ON notification_logs(provider);

-- Índices para google_auth_tokens
CREATE INDEX IF NOT EXISTS idx_google_auth_tokens_user_id 
ON google_auth_tokens(userId);

CREATE INDEX IF NOT EXISTS idx_google_auth_tokens_is_active 
ON google_auth_tokens(isActive);

CREATE INDEX IF NOT EXISTS idx_google_auth_tokens_expires_at 
ON google_auth_tokens(expiresAt);

-- Índices para integration_settings
CREATE INDEX IF NOT EXISTS idx_integration_settings_key 
ON integration_settings(key);

CREATE INDEX IF NOT EXISTS idx_integration_settings_is_active 
ON integration_settings(isActive);

-- ============================================================================
-- CONSTRAINTS ADICIONAIS
-- ============================================================================

-- Constraint para garantir que apenas um token ativo por usuário
ALTER TABLE google_auth_tokens 
ADD CONSTRAINT chk_google_auth_tokens_unique_active_user 
UNIQUE (userId, isActive) 
WHERE isActive = true;

-- Constraint para validar formato de telefone em notification_logs
ALTER TABLE notification_logs 
ADD CONSTRAINT chk_notification_logs_valid_phone 
CHECK (
  (type = 'whatsapp' OR type = 'sms') AND 
  recipient ~ '^\+?[1-9]\d{1,14}$'
) OR type NOT IN ('whatsapp', 'sms');

-- Constraint para validar formato de email em notification_logs
ALTER TABLE notification_logs 
ADD CONSTRAINT chk_notification_logs_valid_email 
CHECK (
  type = 'email' AND 
  recipient ~ '^[^@]+@[^@]+\.[^@]+$'
) OR type != 'email';

-- ============================================================================
-- FUNÇÕES PARA ATUALIZAR TIMESTAMP
-- ============================================================================

-- Função para atualizar updatedAt da tabela google_auth_tokens
CREATE OR REPLACE FUNCTION update_google_auth_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updatedAt automaticamente
CREATE TRIGGER trigger_update_google_auth_tokens_updated_at
  BEFORE UPDATE ON google_auth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_google_auth_tokens_updated_at();

-- Função para atualizar updatedAt da tabela integration_settings
CREATE OR REPLACE FUNCTION update_integration_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updatedAt automaticamente
CREATE TRIGGER trigger_update_integration_settings_updated_at
  BEFORE UPDATE ON integration_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_settings_updated_at();

-- ============================================================================
-- FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para limpar logs antigos automaticamente
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  -- Limpar webhook_logs com mais de 90 dias
  DELETE FROM webhook_logs 
  WHERE receivedAt < NOW() - INTERVAL '90 days';
  
  -- Limpar notification_logs com mais de 90 dias
  DELETE FROM notification_logs 
  WHERE sentAt < NOW() - INTERVAL '90 days';
  
  -- Limpar tokens expirados com mais de 30 dias
  DELETE FROM google_auth_tokens 
  WHERE expiresAt < NOW() - INTERVAL '30 days' AND isActive = false;
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas de integrações
CREATE OR REPLACE FUNCTION get_integration_stats(
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  provider TEXT,
  total_events BIGINT,
  success_count BIGINT,
  error_count BIGINT,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wl.provider,
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE wl.isValid = true) as success_count,
    COUNT(*) FILTER (WHERE wl.isValid = false) as error_count,
    ROUND(
      (COUNT(*) FILTER (WHERE wl.isValid = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 
      2
    ) as success_rate
  FROM webhook_logs wl
  WHERE wl.receivedAt >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY wl.provider
  ORDER BY total_events DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMENTÁRIOS DAS TABELAS
-- ============================================================================

COMMENT ON TABLE webhook_logs IS 'Logs de auditoria para todos os webhooks recebidos';
COMMENT ON COLUMN webhook_logs.provider IS 'Provedor do webhook (asaas, stripe, etc.)';
COMMENT ON COLUMN webhook_logs.event IS 'Tipo de evento recebido';
COMMENT ON COLUMN webhook_logs.payload IS 'Payload completo do webhook em formato JSON';
COMMENT ON COLUMN webhook_logs.isValid IS 'Indica se a validação da assinatura foi bem-sucedida';
COMMENT ON COLUMN webhook_logs.error IS 'Mensagem de erro em caso de falha';

COMMENT ON TABLE notification_logs IS 'Logs de todas as tentativas de envio de notificações';
COMMENT ON COLUMN notification_logs.type IS 'Tipo de notificação (whatsapp, sms, email)';
COMMENT ON COLUMN notification_logs.recipient IS 'Destinatário da notificação';
COMMENT ON COLUMN notification_logs.message IS 'Conteúdo da mensagem enviada';
COMMENT ON COLUMN notification_logs.success IS 'Indica se o envio foi bem-sucedido';
COMMENT ON COLUMN notification_logs.provider IS 'Provedor do serviço de notificação';

COMMENT ON TABLE google_auth_tokens IS 'Tokens de autenticação do Google para sincronização';
COMMENT ON COLUMN google_auth_tokens.accessToken IS 'Token de acesso atual';
COMMENT ON COLUMN google_auth_tokens.refreshToken IS 'Token para renovação do acesso';
COMMENT ON COLUMN google_auth_tokens.expiresAt IS 'Data de expiração do token';
COMMENT ON COLUMN google_auth_tokens.scope IS 'Escopo de permissões concedidas';

COMMENT ON TABLE integration_settings IS 'Configurações globais das integrações';
COMMENT ON COLUMN integration_settings.key IS 'Chave da configuração';
COMMENT ON COLUMN integration_settings.value IS 'Valor da configuração';
COMMENT ON COLUMN integration_settings.isEncrypted IS 'Indica se o valor está criptografado';

-- ============================================================================
-- DADOS INICIAIS
-- ============================================================================

-- Inserir configurações padrão das integrações
INSERT INTO integration_settings (key, value, description) VALUES
('asaas.webhook_url', 'https://seu-dominio.com/api/asaas/webhook', 'URL do webhook do ASAAS'),
('asaas.webhook_secret', '', 'Secret para validação do webhook do ASAAS'),
('whatsapp.api_url', 'https://graph.facebook.com/v17.0', 'URL da API do WhatsApp Business'),
('whatsapp.api_token', '', 'Token de acesso da API do WhatsApp'),
('twilio.account_sid', '', 'Account SID do Twilio'),
('twilio.auth_token', '', 'Auth Token do Twilio'),
('twilio.phone_number', '', 'Número de telefone do Twilio'),
('smtp.host', 'smtp.gmail.com', 'Host do servidor SMTP'),
('smtp.port', '587', 'Porta do servidor SMTP'),
('smtp.user', '', 'Usuário do servidor SMTP'),
('smtp.pass', '', 'Senha do servidor SMTP'),
('google.client_id', '', 'Client ID do Google OAuth2'),
('google.client_secret', '', 'Client Secret do Google OAuth2'),
('google.redirect_uri', '', 'URI de redirecionamento do Google OAuth2'),
('google.calendar_id', 'primary', 'ID do calendário do Google')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- ATUALIZAÇÕES NA TABELA APPOINTMENTS
-- ============================================================================
-- Adicionar campos necessários para as integrações

-- Campos para integração com Google Calendar
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS googleCalendarEventId TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS googleCalendarLink TEXT;

-- Campos para integração com ASAAS
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS asaasPaymentId TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS paymentStatus TEXT DEFAULT 'pending' CHECK (paymentStatus IN ('pending', 'received', 'confirmed', 'overdue', 'refunded', 'cancelled'));
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS paymentDate TIMESTAMP WITH TIME ZONE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS paymentValue DECIMAL(10,2);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS paymentNotes TEXT;

-- Campos para integração com notificações
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notificationSent BOOLEAN DEFAULT false;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notificationSentAt TIMESTAMP WITH TIME ZONE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notificationChannels TEXT[] DEFAULT '{}';

-- ============================================================================
-- ÍNDICES PARA OS NOVOS CAMPOS
-- ============================================================================

-- Índices para campos de pagamento
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status 
ON appointments(paymentStatus);

CREATE INDEX IF NOT EXISTS idx_appointments_asaas_payment_id 
ON appointments(asaasPaymentId);

CREATE INDEX IF NOT EXISTS idx_appointments_payment_date 
ON appointments(paymentDate);

-- Índices para campos do Google Calendar
CREATE INDEX IF NOT EXISTS idx_appointments_google_calendar_event_id 
ON appointments(googleCalendarEventId);

-- Índices para campos de notificação
CREATE INDEX IF NOT EXISTS idx_appointments_notification_sent 
ON appointments(notificationSent);

-- ============================================================================
-- VERIFICAÇÃO DA ESTRUTURA
-- ============================================================================

-- Verificar se as tabelas foram criadas corretamente
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('webhook_logs', 'notification_logs', 'google_auth_tokens', 'integration_settings')
ORDER BY table_name, ordinal_position;

-- Verificar índices criados
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('webhook_logs', 'notification_logs', 'google_auth_tokens', 'integration_settings')
ORDER BY tablename, indexname;

-- Verificar constraints
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid IN (
  'webhook_logs'::regclass, 
  'notification_logs'::regclass, 
  'google_auth_tokens'::regclass, 
  'integration_settings'::regclass
)
ORDER BY conname;

-- ============================================================================
-- EXEMPLOS DE USO
-- ============================================================================

-- Exemplo: Consultar logs de webhooks dos últimos 7 dias
-- SELECT 
--   provider,
--   event,
--   isValid,
--   receivedAt,
--   error
-- FROM webhook_logs 
-- WHERE receivedAt >= NOW() - INTERVAL '7 days'
-- ORDER BY receivedAt DESC;

-- Exemplo: Consultar estatísticas de notificações por tipo
-- SELECT 
--   type,
--   COUNT(*) as total,
--   COUNT(*) FILTER (WHERE success = true) as success_count,
--   COUNT(*) FILTER (WHERE success = false) as error_count
-- FROM notification_logs 
-- WHERE sentAt >= NOW() - INTERVAL '30 days'
-- GROUP BY type;

-- Exemplo: Consultar tokens do Google expirados
-- SELECT 
--   userId,
--   expiresAt,
--   isActive
-- FROM google_auth_tokens 
-- WHERE expiresAt < NOW() AND isActive = true;

-- Exemplo: Limpar logs antigos (executar periodicamente)
-- SELECT cleanup_old_logs();

-- Exemplo: Obter estatísticas das integrações
-- SELECT * FROM get_integration_stats(30);
