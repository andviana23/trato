-- ============================================================================
-- CRIAÇÃO DA TABELA DE RECEITAS AUTOMÁTICAS
-- ============================================================================
-- Tabela para armazenar receitas processadas automaticamente via webhook ASAAS
CREATE TABLE IF NOT EXISTS receitas_automaticas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Dados do pagamento ASAAS
    payment_id TEXT NOT NULL UNIQUE,
    customer_id TEXT NOT NULL,
    subscription_id TEXT,
    -- Dados financeiros
    value DECIMAL(15, 2) NOT NULL,
    description TEXT NOT NULL,
    billing_type TEXT,
    -- URLs dos documentos
    invoice_url TEXT,
    transaction_receipt_url TEXT,
    -- Relacionamentos
    lancamento_id UUID REFERENCES lancamentos_contabeis(id) ON DELETE CASCADE,
    unidade_id TEXT NOT NULL DEFAULT 'trato',
    -- Status e controle
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (
        status IN ('pendente', 'processado', 'erro', 'reprocessado')
    ),
    -- Dados completos do webhook para reprocessamento
    webhook_data JSONB,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Índices para performance
    CONSTRAINT receitas_automaticas_payment_id_unique UNIQUE (payment_id)
);
-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_receitas_automaticas_customer_id ON receitas_automaticas(customer_id);
CREATE INDEX IF NOT EXISTS idx_receitas_automaticas_status ON receitas_automaticas(status);
CREATE INDEX IF NOT EXISTS idx_receitas_automaticas_created_at ON receitas_automaticas(created_at);
CREATE INDEX IF NOT EXISTS idx_receitas_automaticas_unidade_id ON receitas_automaticas(unidade_id);
CREATE INDEX IF NOT EXISTS idx_receitas_automaticas_lancamento_id ON receitas_automaticas(lancamento_id);
-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_receitas_automaticas_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_receitas_automaticas_updated_at BEFORE
UPDATE ON receitas_automaticas FOR EACH ROW EXECUTE FUNCTION update_receitas_automaticas_updated_at();
-- Comentários da tabela
COMMENT ON TABLE receitas_automaticas IS 'Tabela para armazenar receitas processadas automaticamente via webhook ASAAS';
COMMENT ON COLUMN receitas_automaticas.payment_id IS 'ID único do pagamento no ASAAS';
COMMENT ON COLUMN receitas_automaticas.customer_id IS 'ID do cliente no ASAAS';
COMMENT ON COLUMN receitas_automaticas.subscription_id IS 'ID da assinatura no ASAAS (se aplicável)';
COMMENT ON COLUMN receitas_automaticas.value IS 'Valor da receita em reais';
COMMENT ON COLUMN receitas_automaticas.description IS 'Descrição da receita';
COMMENT ON COLUMN receitas_automaticas.billing_type IS 'Tipo de cobrança (BOLETO, CREDIT_CARD, etc.)';
COMMENT ON COLUMN receitas_automaticas.invoice_url IS 'URL da fatura no ASAAS';
COMMENT ON COLUMN receitas_automaticas.transaction_receipt_url IS 'URL do comprovante de transação';
COMMENT ON COLUMN receitas_automaticas.lancamento_id IS 'ID do lançamento contábil relacionado';
COMMENT ON COLUMN receitas_automaticas.unidade_id IS 'ID da unidade de negócio';
COMMENT ON COLUMN receitas_automaticas.status IS 'Status do processamento da receita';
COMMENT ON COLUMN receitas_automaticas.webhook_data IS 'Dados completos do webhook para reprocessamento';
COMMENT ON COLUMN receitas_automaticas.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN receitas_automaticas.updated_at IS 'Data da última atualização';
-- Inserir dados de exemplo (opcional)
-- INSERT INTO receitas_automaticas (payment_id, customer_id, value, description, unidade_id, status) 
-- VALUES 
--   ('exemplo_payment_001', 'exemplo_customer_001', 99.90, 'Assinatura Mensal - Plano Premium', 'trato', 'pendente'),
--   ('exemplo_payment_002', 'exemplo_customer_002', 149.90, 'Assinatura Trimestral - Plano Business', 'trato', 'pendente');
-- ============================================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================================================
-- Habilitar RLS
ALTER TABLE receitas_automaticas ENABLE ROW LEVEL SECURITY;
-- Política para usuários autenticados (ler todas as receitas da unidade)
CREATE POLICY "Usuários autenticados podem ler receitas da unidade" ON receitas_automaticas FOR
SELECT USING (
        auth.role() = 'authenticated'
        AND unidade_id = get_current_unidade()
    );
-- Política para administradores (ler todas as receitas)
CREATE POLICY "Administradores podem ler todas as receitas" ON receitas_automaticas FOR
SELECT USING (is_admin());
-- Política para sistema (inserir/atualizar receitas automáticas)
CREATE POLICY "Sistema pode inserir e atualizar receitas" ON receitas_automaticas FOR ALL USING (auth.role() = 'service_role');
-- Política para usuários autenticados (atualizar status de receitas da unidade)
CREATE POLICY "Usuários autenticados podem atualizar status de receitas da unidade" ON receitas_automaticas FOR
UPDATE USING (
        auth.role() = 'authenticated'
        AND unidade_id = get_current_unidade()
    ) WITH CHECK (
        auth.role() = 'authenticated'
        AND unidade_id = get_current_unidade()
    );
-- ============================================================================
-- FUNÇÕES AUXILIARES
-- ============================================================================
-- Função para obter estatísticas das receitas automáticas
CREATE OR REPLACE FUNCTION get_receitas_automaticas_stats(p_unidade_id TEXT DEFAULT 'trato') RETURNS TABLE (
        total BIGINT,
        valor_total DECIMAL(15, 2),
        por_status JSONB,
        ultimos_30_dias BIGINT
    ) AS $$ BEGIN RETURN QUERY
SELECT COUNT(*)::BIGINT as total,
    COALESCE(SUM(value), 0) as valor_total,
    jsonb_object_agg(status, count) as por_status,
    COUNT(*) FILTER (
        WHERE created_at >= NOW() - INTERVAL '30 days'
    )::BIGINT as ultimos_30_dias
FROM (
        SELECT status,
            COUNT(*) as count
        FROM receitas_automaticas
        WHERE unidade_id = p_unidade_id
        GROUP BY status
    ) status_counts
    CROSS JOIN (
        SELECT COUNT(*) as total_count,
            COALESCE(SUM(value), 0) as total_value
        FROM receitas_automaticas
        WHERE unidade_id = p_unidade_id
    ) totals;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Função para limpar receitas antigas
CREATE OR REPLACE FUNCTION clean_old_receitas_automaticas(p_days INTEGER DEFAULT 90) RETURNS INTEGER AS $$
DECLARE deleted_count INTEGER;
BEGIN
DELETE FROM receitas_automaticas
WHERE created_at < NOW() - INTERVAL '1 day' * p_days
    AND status IN ('processado', 'reprocessado');
GET DIAGNOSTICS deleted_count = ROW_COUNT;
RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================
-- Verificar se a tabela foi criada corretamente
SELECT 'Tabela receitas_automaticas criada com sucesso!' as status,
    COUNT(*) as total_registros
FROM receitas_automaticas;