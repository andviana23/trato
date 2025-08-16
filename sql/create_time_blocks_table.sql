-- ============================================================================
-- CRIAÇÃO DA TABELA TIME_BLOCKS
-- ============================================================================
-- Esta tabela é necessária para suportar a funcionalidade de bloqueio de horários
-- implementada nas Server Actions de agendamentos.
-- Criar tabela time_blocks
CREATE TABLE IF NOT EXISTS time_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidadeId UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
    professionalId UUID REFERENCES professionals(id) ON DELETE
    SET NULL,
        startTime TIMESTAMP WITH TIME ZONE NOT NULL,
        endTime TIMESTAMP WITH TIME ZONE NOT NULL,
        reason TEXT NOT NULL,
        blockedBy UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
        isRecurring BOOLEAN DEFAULT false,
        recurringDays INTEGER [] CHECK (
            recurringDays IS NULL
            OR array_length(recurringDays, 1) <= 7
        ),
        isActive BOOLEAN DEFAULT true,
        createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================
-- Índice para consultas por unidade e período
CREATE INDEX IF NOT EXISTS idx_time_blocks_unidade_time ON time_blocks(unidadeId, startTime, endTime);
-- Índice para consultas por profissional
CREATE INDEX IF NOT EXISTS idx_time_blocks_professional ON time_blocks(professionalId)
WHERE professionalId IS NOT NULL;
-- Índice para consultas de bloqueios ativos
CREATE INDEX IF NOT EXISTS idx_time_blocks_active ON time_blocks(isActive)
WHERE isActive = true;
-- Índice para consultas por período
CREATE INDEX IF NOT EXISTS idx_time_blocks_period ON time_blocks(startTime, endTime);
-- ============================================================================
-- CONSTRAINTS ADICIONAIS
-- ============================================================================
-- Constraint para garantir que endTime > startTime
ALTER TABLE time_blocks
ADD CONSTRAINT chk_time_blocks_valid_period CHECK (endTime > startTime);
-- Constraint para validar dias da semana (0 = Domingo, 6 = Sábado)
ALTER TABLE time_blocks
ADD CONSTRAINT chk_time_blocks_valid_days CHECK (
        recurringDays IS NULL
        OR (
            array_length(recurringDays, 1) > 0
            AND array_length(recurringDays, 1) <= 7
            AND (
                SELECT bool_and(
                        SELECT unnest(recurringDays) BETWEEN 0 AND 6
                    )
            )
        )
    );
-- ============================================================================
-- FUNÇÃO PARA ATUALIZAR TIMESTAMP
-- ============================================================================
CREATE OR REPLACE FUNCTION update_time_blocks_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updatedAt = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Trigger para atualizar updatedAt automaticamente
CREATE TRIGGER trigger_update_time_blocks_updated_at BEFORE
UPDATE ON time_blocks FOR EACH ROW EXECUTE FUNCTION update_time_blocks_updated_at();
-- ============================================================================
-- COMENTÁRIOS DA TABELA
-- ============================================================================
COMMENT ON TABLE time_blocks IS 'Tabela para armazenar bloqueios de horários que impedem agendamentos';
COMMENT ON COLUMN time_blocks.id IS 'Identificador único do bloqueio';
COMMENT ON COLUMN time_blocks.unidadeId IS 'ID da unidade onde o bloqueio se aplica';
COMMENT ON COLUMN time_blocks.professionalId IS 'ID do profissional específico (NULL para todos)';
COMMENT ON COLUMN time_blocks.startTime IS 'Data e hora de início do bloqueio';
COMMENT ON COLUMN time_blocks.endTime IS 'Data e hora de fim do bloqueio';
COMMENT ON COLUMN time_blocks.reason IS 'Motivo do bloqueio (ex: almoço, feriado, manutenção)';
COMMENT ON COLUMN time_blocks.blockedBy IS 'ID do usuário que criou o bloqueio';
COMMENT ON COLUMN time_blocks.isRecurring IS 'Indica se o bloqueio se repete';
COMMENT ON COLUMN time_blocks.recurringDays IS 'Array com dias da semana para recorrência (0=Domingo, 6=Sábado)';
COMMENT ON COLUMN time_blocks.isActive IS 'Indica se o bloqueio está ativo';
COMMENT ON COLUMN time_blocks.createdAt IS 'Data de criação do bloqueio';
COMMENT ON COLUMN time_blocks.updatedAt IS 'Data da última atualização';
-- ============================================================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- ============================================================================
-- Exemplo de bloqueio de horário de almoço para uma unidade
-- INSERT INTO time_blocks (
--   unidadeId,
--   startTime,
--   endTime,
--   reason,
--   blockedBy,
--   isRecurring,
--   recurringDays
-- ) VALUES (
--   'uuid-da-unidade-aqui',
--   '2024-01-15 12:00:00+00',
--   '2024-01-15 13:00:00+00',
--   'Horário de almoço',
--   'uuid-do-usuario-aqui',
--   true,
--   ARRAY[1,2,3,4,5] -- Segunda a sexta
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
WHERE table_name = 'time_blocks'
ORDER BY ordinal_position;
-- Verificar índices criados
SELECT indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'time_blocks';