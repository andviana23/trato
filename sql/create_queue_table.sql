-- ============================================================================
-- CRIAÇÃO DA TABELA QUEUE
-- ============================================================================
-- Este arquivo é necessário para suportar as Server Actions de fila
-- implementadas no sistema Trato.
-- ============================================================================
-- TABELA QUEUE
-- ============================================================================
CREATE TABLE IF NOT EXISTS queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clientId UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    serviceId UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'prioritaria', 'urgente')),
    estimatedWaitTime INTEGER CHECK (estimatedWaitTime > 0),
    actualWaitTime INTEGER CHECK (actualWaitTime > 0),
    notes TEXT,
    unidadeId UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'aguardando' CHECK (
        status IN (
            'aguardando',
            'chamado',
            'em_atendimento',
            'finalizado',
            'cancelado'
        )
    ),
    position INTEGER NOT NULL CHECK (position > 0),
    assignedProfessionalId UUID REFERENCES professionals(id) ON DELETE
    SET NULL,
        estimatedStartTime TIMESTAMP WITH TIME ZONE,
        actualStartTime TIMESTAMP WITH TIME ZONE,
        completedAt TIMESTAMP WITH TIME ZONE,
        addedBy UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
        createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================
-- Índice para consultas por unidade e status
CREATE INDEX IF NOT EXISTS idx_queue_unidade_status ON queue(unidadeId, status);
-- Índice para consultas por unidade e prioridade
CREATE INDEX IF NOT EXISTS idx_queue_unidade_priority ON queue(unidadeId, priority);
-- Índice para consultas por unidade e posição
CREATE INDEX IF NOT EXISTS idx_queue_unidade_position ON queue(unidadeId, position);
-- Índice para consultas por cliente
CREATE INDEX IF NOT EXISTS idx_queue_client ON queue(clientId);
-- Índice para consultas por profissional
CREATE INDEX IF NOT EXISTS idx_queue_professional ON queue(assignedProfessionalId)
WHERE assignedProfessionalId IS NOT NULL;
-- Índice para consultas por status ativo
CREATE INDEX IF NOT EXISTS idx_queue_active_status ON queue(status)
WHERE status IN ('aguardando', 'chamado', 'em_atendimento');
-- Índice para consultas por data de criação
CREATE INDEX IF NOT EXISTS idx_queue_created_at ON queue(createdAt);
-- Índice composto para ordenação eficiente
CREATE INDEX IF NOT EXISTS idx_queue_ordering ON queue(
    unidadeId,
    priority DESC,
    position ASC,
    createdAt ASC
);
-- ============================================================================
-- CONSTRAINTS ADICIONAIS
-- ============================================================================
-- Constraint para evitar clientes duplicados na fila ativa
ALTER TABLE queue
ADD CONSTRAINT chk_queue_unique_active_client UNIQUE (clientId, unidadeId, status)
WHERE status IN ('aguardando', 'chamado', 'em_atendimento');
-- Constraint para garantir que posições sejam únicas por unidade e status ativo
ALTER TABLE queue
ADD CONSTRAINT chk_queue_unique_position UNIQUE (unidadeId, position, status)
WHERE status IN ('aguardando', 'chamado', 'em_atendimento');
-- Constraint para validar que actualStartTime só pode ser definido quando status é 'em_atendimento'
ALTER TABLE queue
ADD CONSTRAINT chk_queue_start_time_status CHECK (
        (
            status = 'em_atendimento'
            AND actualStartTime IS NOT NULL
        )
        OR (
            status != 'em_atendimento'
            AND actualStartTime IS NULL
        )
    );
-- Constraint para validar que completedAt só pode ser definido quando status é 'finalizado'
ALTER TABLE queue
ADD CONSTRAINT chk_queue_completed_status CHECK (
        (
            status = 'finalizado'
            AND completedAt IS NOT NULL
        )
        OR (
            status != 'finalizado'
            AND completedAt IS NULL
        )
    );
-- ============================================================================
-- FUNÇÕES PARA ATUALIZAR TIMESTAMP
-- ============================================================================
-- Função para atualizar updatedAt da tabela queue
CREATE OR REPLACE FUNCTION update_queue_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updatedAt = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Trigger para atualizar updatedAt automaticamente
CREATE TRIGGER trigger_update_queue_updated_at BEFORE
UPDATE ON queue FOR EACH ROW EXECUTE FUNCTION update_queue_updated_at();
-- ============================================================================
-- FUNÇÕES AUXILIARES
-- ============================================================================
-- Função para calcular tempo de espera real
CREATE OR REPLACE FUNCTION calculate_actual_wait_time() RETURNS TRIGGER AS $$ BEGIN IF NEW.status = 'em_atendimento'
    AND NEW.actualStartTime IS NOT NULL THEN NEW.actualWaitTime = EXTRACT(
        EPOCH
        FROM (NEW.actualStartTime - NEW.createdAt)
    ) / 60;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Trigger para calcular tempo de espera real
CREATE TRIGGER trigger_calculate_wait_time BEFORE
UPDATE ON queue FOR EACH ROW EXECUTE FUNCTION calculate_actual_wait_time();
-- ============================================================================
-- COMENTÁRIOS DA TABELA
-- ============================================================================
COMMENT ON TABLE queue IS 'Tabela para armazenar fila de atendimento dos clientes';
COMMENT ON COLUMN queue.id IS 'Identificador único da posição na fila';
COMMENT ON COLUMN queue.clientId IS 'ID do cliente';
COMMENT ON COLUMN queue.serviceId IS 'ID do serviço solicitado';
COMMENT ON COLUMN queue.priority IS 'Prioridade do cliente (normal, prioritaria, urgente)';
COMMENT ON COLUMN queue.estimatedWaitTime IS 'Tempo estimado de espera em minutos';
COMMENT ON COLUMN queue.actualWaitTime IS 'Tempo real de espera em minutos';
COMMENT ON COLUMN queue.notes IS 'Observações sobre o cliente ou serviço';
COMMENT ON COLUMN queue.unidadeId IS 'ID da unidade';
COMMENT ON COLUMN queue.status IS 'Status atual na fila';
COMMENT ON COLUMN queue.position IS 'Posição atual na fila';
COMMENT ON COLUMN queue.assignedProfessionalId IS 'ID do profissional designado';
COMMENT ON COLUMN queue.estimatedStartTime IS 'Horário estimado de início do atendimento';
COMMENT ON COLUMN queue.actualStartTime IS 'Horário real de início do atendimento';
COMMENT ON COLUMN queue.completedAt IS 'Horário de conclusão do atendimento';
COMMENT ON COLUMN queue.addedBy IS 'ID do usuário que adicionou à fila';
COMMENT ON COLUMN queue.createdAt IS 'Data de entrada na fila';
COMMENT ON COLUMN queue.updatedAt IS 'Data da última atualização';
-- ============================================================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- ============================================================================
-- Exemplo de cliente na fila
-- INSERT INTO queue (
--   clientId,
--   serviceId,
--   priority,
--   estimatedWaitTime,
--   notes,
--   unidadeId,
--   position,
--   addedBy
-- ) VALUES (
--   'uuid-do-cliente-aqui',
--   'uuid-do-servico-aqui',
--   'normal',
--   30,
--   'Cliente regular',
--   'uuid-da-unidade-aqui',
--   1,
--   'uuid-do-usuario-aqui'
-- );
-- ============================================================================
-- VERIFICAÇÃO DA ESTRUTURA
-- ============================================================================
-- Verificar se a tabela foi criada corretamente
SELECT table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'queue'
ORDER BY ordinal_position;
-- Verificar índices criados
SELECT indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'queue'
ORDER BY indexname;
-- Verificar constraints
SELECT conname,
    contype,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'queue'::regclass
ORDER BY conname;
-- Verificar triggers
SELECT trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'queue'
ORDER BY trigger_name;