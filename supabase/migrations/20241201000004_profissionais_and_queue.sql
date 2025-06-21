-- Migração para adicionar tabelas profissionais e barber_queue
-- 20241201000004_profissionais_and_queue.sql
-- ============================================================================
-- TABELA: profissionais (profissionais da barbearia)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profissionais (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    funcao VARCHAR(50) NOT NULL CHECK (funcao IN ('barbeiro', 'recepcionista')),
    data_nascimento DATE,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- ============================================================================
-- TABELA: barber_queue (fila de barbeiros)
-- ============================================================================
CREATE TABLE IF NOT EXISTS barber_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profissional_id UUID REFERENCES profissionais(id) ON DELETE CASCADE NOT NULL,
    queue_position INTEGER NOT NULL DEFAULT 1,
    daily_services INTEGER DEFAULT 0,
    total_services INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    last_service_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profissional_id)
);
-- ============================================================================
-- ÍNDICES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profissionais_funcao ON profissionais(funcao);
CREATE INDEX IF NOT EXISTS idx_profissionais_user_id ON profissionais(user_id);
CREATE INDEX IF NOT EXISTS idx_barber_queue_position ON barber_queue(queue_position);
CREATE INDEX IF NOT EXISTS idx_barber_queue_profissional_id ON barber_queue(profissional_id);
-- ============================================================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_profissionais_updated_at BEFORE
UPDATE ON profissionais FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_barber_queue_updated_at BEFORE
UPDATE ON barber_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
-- Habilitar RLS nas tabelas
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_queue ENABLE ROW LEVEL SECURITY;
-- Políticas para profissionais
CREATE POLICY "Profissionais são visíveis para todos os usuários autenticados" ON profissionais FOR
SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Apenas admins podem inserir profissionais" ON profissionais FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'barbershop_owner')
        )
    );
CREATE POLICY "Apenas admins podem atualizar profissionais" ON profissionais FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'barbershop_owner')
        )
    );
CREATE POLICY "Apenas admins podem deletar profissionais" ON profissionais FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'barbershop_owner')
    )
);
-- Políticas para barber_queue
CREATE POLICY "Barber queue é visível para todos os usuários autenticados" ON barber_queue FOR
SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Apenas admins podem gerenciar barber queue" ON barber_queue FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'barbershop_owner')
    )
);
-- ============================================================================
-- FUNÇÃO PARA INSERIR PROFISSIONAL NA FILA
-- ============================================================================
CREATE OR REPLACE FUNCTION insert_professional_in_queue() RETURNS TRIGGER AS $$ BEGIN -- Se o profissional for barbeiro, inserir na fila
    IF NEW.funcao = 'barbeiro' THEN
INSERT INTO barber_queue (profissional_id, queue_position)
VALUES (
        NEW.id,
        (
            SELECT COALESCE(MAX(queue_position), 0) + 1
            FROM barber_queue
        )
    );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_insert_professional_in_queue
AFTER
INSERT ON profissionais FOR EACH ROW EXECUTE FUNCTION insert_professional_in_queue();