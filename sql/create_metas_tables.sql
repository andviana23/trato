-- ============================================================================
-- CRIAÇÃO DAS TABELAS DE METAS E BÔNUS
-- ============================================================================
-- Este arquivo é necessário para suportar as Server Actions de metas
-- implementadas no sistema Trato.
-- ============================================================================
-- TABELA METAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS metas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professionalId UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    unidadeId UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (
        month >= 1
        AND month <= 12
    ),
    year INTEGER NOT NULL CHECK (
        year >= 2020
        AND year <= 2030
    ),
    targetRevenue DECIMAL(10, 2) NOT NULL CHECK (targetRevenue > 0),
    targetAppointments INTEGER NOT NULL CHECK (targetAppointments > 0),
    targetServices INTEGER NOT NULL CHECK (targetServices > 0),
    commissionRate DECIMAL(3, 2) NOT NULL CHECK (
        commissionRate >= 0
        AND commissionRate <= 1
    ),
    notes TEXT,
    isActive BOOLEAN DEFAULT true,
    createdBy UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- ============================================================================
-- TABELA BONUS
-- ============================================================================
CREATE TABLE IF NOT EXISTS bonus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metaId UUID NOT NULL REFERENCES metas(id) ON DELETE CASCADE,
    professionalId UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    unidadeId UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (
        month >= 1
        AND month <= 12
    ),
    year INTEGER NOT NULL CHECK (
        year >= 2020
        AND year <= 2030
    ),
    baseAmount DECIMAL(10, 2) NOT NULL CHECK (baseAmount > 0),
    bonusAmount DECIMAL(10, 2) NOT NULL CHECK (bonusAmount >= 0),
    totalAmount DECIMAL(10, 2) NOT NULL CHECK (totalAmount >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    paidAt TIMESTAMP WITH TIME ZONE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================
-- Índices para tabela metas
CREATE INDEX IF NOT EXISTS idx_metas_professional_period ON metas(professionalId, month, year);
CREATE INDEX IF NOT EXISTS idx_metas_unidade_period ON metas(unidadeId, month, year);
CREATE INDEX IF NOT EXISTS idx_metas_active ON metas(isActive)
WHERE isActive = true;
CREATE INDEX IF NOT EXISTS idx_metas_created_by ON metas(createdBy);
-- Índices para tabela bonus
CREATE INDEX IF NOT EXISTS idx_bonus_meta ON bonus(metaId);
CREATE INDEX IF NOT EXISTS idx_bonus_professional_period ON bonus(professionalId, month, year);
CREATE INDEX IF NOT EXISTS idx_bonus_unidade_period ON bonus(unidadeId, month, year);
CREATE INDEX IF NOT EXISTS idx_bonus_status ON bonus(status);
-- ============================================================================
-- CONSTRAINTS ADICIONAIS
-- ============================================================================
-- Constraint para evitar metas duplicadas no mesmo período para o mesmo profissional
ALTER TABLE metas
ADD CONSTRAINT chk_metas_unique_period UNIQUE (professionalId, month, year, isActive);
-- Constraint para garantir que o totalAmount seja a soma de baseAmount + bonusAmount
ALTER TABLE bonus
ADD CONSTRAINT chk_bonus_total_amount CHECK (totalAmount = baseAmount + bonusAmount);
-- ============================================================================
-- FUNÇÕES PARA ATUALIZAR TIMESTAMP
-- ============================================================================
-- Função para atualizar updatedAt da tabela metas
CREATE OR REPLACE FUNCTION update_metas_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updatedAt = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Função para atualizar updatedAt da tabela bonus
CREATE OR REPLACE FUNCTION update_bonus_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updatedAt = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Triggers para atualizar updatedAt automaticamente
CREATE TRIGGER trigger_update_metas_updated_at BEFORE
UPDATE ON metas FOR EACH ROW EXECUTE FUNCTION update_metas_updated_at();
CREATE TRIGGER trigger_update_bonus_updated_at BEFORE
UPDATE ON bonus FOR EACH ROW EXECUTE FUNCTION update_bonus_updated_at();
-- ============================================================================
-- COMENTÁRIOS DAS TABELAS
-- ============================================================================
COMMENT ON TABLE metas IS 'Tabela para armazenar metas mensais dos profissionais';
COMMENT ON COLUMN metas.id IS 'Identificador único da meta';
COMMENT ON COLUMN metas.professionalId IS 'ID do profissional';
COMMENT ON COLUMN metas.unidadeId IS 'ID da unidade';
COMMENT ON COLUMN metas.month IS 'Mês da meta (1-12)';
COMMENT ON COLUMN metas.year IS 'Ano da meta';
COMMENT ON COLUMN metas.targetRevenue IS 'Meta de faturamento em reais';
COMMENT ON COLUMN metas.targetAppointments IS 'Meta de número de agendamentos';
COMMENT ON COLUMN metas.targetServices IS 'Meta de número de serviços';
COMMENT ON COLUMN metas.commissionRate IS 'Taxa de comissão (0.00 a 1.00)';
COMMENT ON COLUMN metas.notes IS 'Observações sobre a meta';
COMMENT ON COLUMN metas.isActive IS 'Indica se a meta está ativa';
COMMENT ON COLUMN metas.createdBy IS 'ID do usuário que criou a meta';
COMMENT ON COLUMN metas.createdAt IS 'Data de criação da meta';
COMMENT ON COLUMN metas.updatedAt IS 'Data da última atualização';
COMMENT ON TABLE bonus IS 'Tabela para armazenar bônus calculados das metas';
COMMENT ON COLUMN bonus.id IS 'Identificador único do bônus';
COMMENT ON COLUMN bonus.metaId IS 'ID da meta relacionada';
COMMENT ON COLUMN bonus.professionalId IS 'ID do profissional';
COMMENT ON COLUMN bonus.unidadeId IS 'ID da unidade';
COMMENT ON COLUMN bonus.month IS 'Mês do bônus (1-12)';
COMMENT ON COLUMN bonus.year IS 'Ano do bônus';
COMMENT ON COLUMN bonus.baseAmount IS 'Valor base para cálculo do bônus';
COMMENT ON COLUMN bonus.bonusAmount IS 'Valor do bônus calculado';
COMMENT ON COLUMN bonus.totalAmount IS 'Valor total (base + bônus)';
COMMENT ON COLUMN bonus.status IS 'Status do bônus (pending, paid, cancelled)';
COMMENT ON COLUMN bonus.paidAt IS 'Data do pagamento do bônus';
COMMENT ON COLUMN bonus.createdAt IS 'Data de criação do bônus';
COMMENT ON COLUMN bonus.updatedAt IS 'Data da última atualização';
-- ============================================================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- ============================================================================
-- Exemplo de meta para um profissional
-- INSERT INTO metas (
--   professionalId,
--   unidadeId,
--   month,
--   year,
--   targetRevenue,
--   targetAppointments,
--   targetServices,
--   commissionRate,
--   notes,
--   createdBy
-- ) VALUES (
--   'uuid-do-profissional-aqui',
--   'uuid-da-unidade-aqui',
--   1,
--   2024,
--   5000.00,
--   50,
--   60,
--   0.15,
--   'Meta de janeiro - alta temporada',
--   'uuid-do-usuario-aqui'
-- );
-- ============================================================================
-- VERIFICAÇÃO DA ESTRUTURA
-- ============================================================================
-- Verificar se as tabelas foram criadas corretamente
SELECT table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('metas', 'bonus')
ORDER BY table_name,
    ordinal_position;
-- Verificar índices criados
SELECT indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE tablename IN ('metas', 'bonus')
ORDER BY tablename,
    indexname;
-- Verificar constraints
SELECT conname,
    conrelid::regclass AS table_name,
    contype,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid IN ('metas'::regclass, 'bonus'::regclass)
ORDER BY table_name,
    conname;