-- Tabela para metas da BarberBeer
CREATE TABLE IF NOT EXISTS metas_barberbeer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbeiro_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
    mes TEXT NOT NULL CHECK (
        mes IN (
            '01',
            '02',
            '03',
            '04',
            '05',
            '06',
            '07',
            '08',
            '09',
            '10',
            '11',
            '12'
        )
    ),
    ano TEXT NOT NULL,
    meta_venda_produto NUMERIC(10, 2) DEFAULT 0,
    meta_faturamento NUMERIC(10, 2) DEFAULT 0,
    tipo_bonificacao TEXT NOT NULL CHECK (tipo_bonificacao IN ('fixo', 'percentual')),
    valor_bonificacao NUMERIC(10, 2) NOT NULL,
    foi_batida BOOLEAN DEFAULT false,
    criado_em TIMESTAMP DEFAULT now(),
    atualizado_em TIMESTAMP DEFAULT now()
);
-- Tabela para metas da Trato de Barbados
CREATE TABLE IF NOT EXISTS metas_trato (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbeiro_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
    mes TEXT NOT NULL CHECK (
        mes IN (
            '01',
            '02',
            '03',
            '04',
            '05',
            '06',
            '07',
            '08',
            '09',
            '10',
            '11',
            '12'
        )
    ),
    ano TEXT NOT NULL,
    meta_venda_produto NUMERIC(10, 2) DEFAULT 0,
    meta_faturamento NUMERIC(10, 2) DEFAULT 0,
    tipo_bonificacao TEXT NOT NULL CHECK (tipo_bonificacao IN ('fixo', 'percentual')),
    valor_bonificacao NUMERIC(10, 2) NOT NULL,
    foi_batida BOOLEAN DEFAULT false,
    criado_em TIMESTAMP DEFAULT now(),
    atualizado_em TIMESTAMP DEFAULT now()
);
-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_metas_barberbeer_barbeiro_mes_ano ON metas_barberbeer(barbeiro_id, mes, ano);
CREATE INDEX IF NOT EXISTS idx_metas_trato_barbeiro_mes_ano ON metas_trato(barbeiro_id, mes, ano);
-- Trigger para atualizar o campo atualizado_em
CREATE OR REPLACE FUNCTION update_atualizado_em() RETURNS TRIGGER AS $$ BEGIN NEW.atualizado_em = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Aplicar trigger nas duas tabelas
CREATE TRIGGER trigger_update_atualizado_em_metas_barberbeer BEFORE
UPDATE ON metas_barberbeer FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();
CREATE TRIGGER trigger_update_atualizado_em_metas_trato BEFORE
UPDATE ON metas_trato FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();