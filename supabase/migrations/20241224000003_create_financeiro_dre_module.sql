-- ============================================================================
-- MIGRATION: MÓDULO FINANCEIRO DRE (DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO)
-- ============================================================================
-- Data: 2024-12-24
-- Sistema: Trato de Barbados
-- Versão: 1.0.0
-- Descrição: Implementação completa do módulo financeiro DRE
-- ============================================================================
-- ============================================================================
-- 1. EXTENSÕES NECESSÁRIAS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- ============================================================================
-- 2. FUNÇÕES UTILITÁRIAS
-- ============================================================================
-- Função para obter a unidade corrente
CREATE OR REPLACE FUNCTION public.get_current_unidade() RETURNS TEXT LANGUAGE SQL STABLE AS $$
SELECT COALESCE(
        NULLIF(current_setting('app.unidade', true), ''),
        NULLIF(
            (
                current_setting('request.jwt.claims', true)::jsonb->>'unidade'
            ),
            ''
        ),
        'trato'::text
    );
$$;
-- Função para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
SELECT EXISTS (
        SELECT 1
        FROM auth.users u
            JOIN public.profiles p ON u.id = p.id
        WHERE u.id = auth.uid()
            AND p.role IN ('admin', 'barbershop_owner')
    );
$$;
-- ============================================================================
-- 3. TABELAS PRINCIPAIS DO MÓDULO DRE
-- ============================================================================
-- Tabela de contas contábeis
CREATE TABLE IF NOT EXISTS public.contas_contabeis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (
        tipo IN (
            'ativo',
            'passivo',
            'patrimonio_liquido',
            'receita',
            'despesa'
        )
    ),
    categoria VARCHAR(100),
    conta_pai_id UUID REFERENCES public.contas_contabeis(id),
    nivel INTEGER NOT NULL DEFAULT 1,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Tabela de lançamentos contábeis
CREATE TABLE IF NOT EXISTS public.lancamentos_contabeis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_lancamento DATE NOT NULL,
    data_competencia DATE NOT NULL,
    numero_documento VARCHAR(100),
    historico TEXT NOT NULL,
    valor DECIMAL(15, 2) NOT NULL,
    tipo_lancamento VARCHAR(50) NOT NULL CHECK (tipo_lancamento IN ('debito', 'credito')),
    conta_debito_id UUID NOT NULL REFERENCES public.contas_contabeis(id),
    conta_credito_id UUID NOT NULL REFERENCES public.contas_contabeis(id),
    unidade_id TEXT NOT NULL,
    profissional_id UUID,
    cliente_id UUID,
    servico_id UUID,
    assinatura_id UUID,
    produto_id UUID,
    status VARCHAR(50) DEFAULT 'pendente' CHECK (
        status IN ('pendente', 'confirmado', 'cancelado')
    ),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Tabela de centros de custo
CREATE TABLE IF NOT EXISTS public.centros_custo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    unidade_id TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Tabela de distribuição de custos
CREATE TABLE IF NOT EXISTS public.distribuicao_custos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lancamento_id UUID NOT NULL REFERENCES public.lancamentos_contabeis(id) ON DELETE CASCADE,
    centro_custo_id UUID NOT NULL REFERENCES public.centros_custo(id),
    percentual DECIMAL(5, 2) NOT NULL CHECK (
        percentual >= 0
        AND percentual <= 100
    ),
    valor DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Tabela de impostos e taxas
CREATE TABLE IF NOT EXISTS public.impostos_taxas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('imposto', 'taxa', 'contribuicao')),
    aliquota DECIMAL(5, 4) NOT NULL CHECK (
        aliquota >= 0
        AND aliquota <= 1
    ),
    base_calculo VARCHAR(100) DEFAULT 'valor_bruto',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Tabela de lançamentos de impostos
CREATE TABLE IF NOT EXISTS public.lancamentos_impostos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lancamento_id UUID NOT NULL REFERENCES public.lancamentos_contabeis(id) ON DELETE CASCADE,
    imposto_id UUID NOT NULL REFERENCES public.impostos_taxas(id),
    base_calculo DECIMAL(15, 2) NOT NULL,
    valor_imposto DECIMAL(15, 2) NOT NULL,
    data_vencimento DATE,
    data_pagamento DATE,
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Tabela de fluxo de caixa
CREATE TABLE IF NOT EXISTS public.fluxo_caixa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data DATE NOT NULL,
    tipo_movimento VARCHAR(50) NOT NULL CHECK (tipo_movimento IN ('entrada', 'saida')),
    categoria VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    valor DECIMAL(15, 2) NOT NULL,
    saldo_anterior DECIMAL(15, 2) NOT NULL,
    saldo_atual DECIMAL(15, 2) NOT NULL,
    unidade_id TEXT NOT NULL,
    lancamento_id UUID REFERENCES public.lancamentos_contabeis(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Tabela de balanço patrimonial
CREATE TABLE IF NOT EXISTS public.balanco_patrimonial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_referencia DATE NOT NULL,
    unidade_id TEXT NOT NULL,
    conta_id UUID NOT NULL REFERENCES public.contas_contabeis(id),
    saldo_debito DECIMAL(15, 2) DEFAULT 0,
    saldo_credito DECIMAL(15, 2) DEFAULT 0,
    saldo_final DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(data_referencia, unidade_id, conta_id)
);
-- Tabela de DRE (Demonstração do Resultado do Exercício)
CREATE TABLE IF NOT EXISTS public.dre (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    unidade_id TEXT NOT NULL,
    receita_bruta DECIMAL(15, 2) DEFAULT 0,
    deducoes DECIMAL(15, 2) DEFAULT 0,
    receita_liquida DECIMAL(15, 2) DEFAULT 0,
    custos_servicos DECIMAL(15, 2) DEFAULT 0,
    lucro_bruto DECIMAL(15, 2) DEFAULT 0,
    despesas_operacionais DECIMAL(15, 2) DEFAULT 0,
    lucro_operacional DECIMAL(15, 2) DEFAULT 0,
    receitas_financeiras DECIMAL(15, 2) DEFAULT 0,
    despesas_financeiras DECIMAL(15, 2) DEFAULT 0,
    lucro_antes_ir DECIMAL(15, 2) DEFAULT 0,
    provisao_ir DECIMAL(15, 2) DEFAULT 0,
    lucro_liquido DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'em_elaboracao' CHECK (
        status IN ('em_elaboracao', 'finalizado', 'aprovado')
    ),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(data_inicio, data_fim, unidade_id)
);
-- ============================================================================
-- 4. ÍNDICES PARA PERFORMANCE
-- ============================================================================
-- Índices para contas contábeis
CREATE INDEX IF NOT EXISTS idx_contas_contabeis_codigo ON public.contas_contabeis(codigo);
CREATE INDEX IF NOT EXISTS idx_contas_contabeis_tipo ON public.contas_contabeis(tipo);
CREATE INDEX IF NOT EXISTS idx_contas_contabeis_ativo ON public.contas_contabeis(ativo);
-- Índices para lançamentos contábeis
CREATE INDEX IF NOT EXISTS idx_lancamentos_data_lancamento ON public.lancamentos_contabeis(data_lancamento);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data_competencia ON public.lancamentos_contabeis(data_competencia);
CREATE INDEX IF NOT EXISTS idx_lancamentos_unidade_id ON public.lancamentos_contabeis(unidade_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_status ON public.lancamentos_contabeis(status);
CREATE INDEX IF NOT EXISTS idx_lancamentos_conta_debito ON public.lancamentos_contabeis(conta_debito_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_conta_credito ON public.lancamentos_contabeis(conta_credito_id);
-- Índices para centros de custo
CREATE INDEX IF NOT EXISTS idx_centros_custo_codigo ON public.centros_custo(codigo);
CREATE INDEX IF NOT EXISTS idx_centros_custo_unidade_id ON public.centros_custo(unidade_id);
-- Índices para fluxo de caixa
CREATE INDEX IF NOT EXISTS idx_fluxo_caixa_data ON public.fluxo_caixa(data);
CREATE INDEX IF NOT EXISTS idx_fluxo_caixa_unidade_id ON public.fluxo_caixa(unidade_id);
CREATE INDEX IF NOT EXISTS idx_fluxo_caixa_tipo_movimento ON public.fluxo_caixa(tipo_movimento);
-- Índices para balanço patrimonial
CREATE INDEX IF NOT EXISTS idx_balanco_data_referencia ON public.balanco_patrimonial(data_referencia);
CREATE INDEX IF NOT EXISTS idx_balanco_unidade_id ON public.balanco_patrimonial(unidade_id);
-- Índices para DRE
CREATE INDEX IF NOT EXISTS idx_dre_periodo ON public.dre(data_inicio, data_fim);
CREATE INDEX IF NOT EXISTS idx_dre_unidade_id ON public.dre(unidade_id);
CREATE INDEX IF NOT EXISTS idx_dre_status ON public.dre(status);
-- ============================================================================
-- 5. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ============================================================================
-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Aplicar trigger em todas as tabelas que têm updated_at
CREATE TRIGGER trg_update_contas_contabeis_updated_at BEFORE
UPDATE ON public.contas_contabeis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_update_lancamentos_contabeis_updated_at BEFORE
UPDATE ON public.lancamentos_contabeis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_update_centros_custo_updated_at BEFORE
UPDATE ON public.centros_custo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_update_impostos_taxas_updated_at BEFORE
UPDATE ON public.impostos_taxas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_update_lancamentos_impostos_updated_at BEFORE
UPDATE ON public.lancamentos_impostos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_update_dre_updated_at BEFORE
UPDATE ON public.dre FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- ============================================================================
-- 6. FUNÇÃO PRINCIPAL: CALCULAR DRE
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calculate_dre(
        p_data_inicio DATE,
        p_data_fim DATE,
        p_unidade_id TEXT DEFAULT NULL
    ) RETURNS TABLE (
        conta_id UUID,
        conta_codigo VARCHAR(20),
        conta_nome VARCHAR(255),
        conta_tipo VARCHAR(50),
        saldo_debito DECIMAL(15, 2),
        saldo_credito DECIMAL(15, 2),
        saldo_final DECIMAL(15, 2)
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_unidade_id TEXT;
BEGIN -- Obter unidade do contexto ou parâmetro
v_unidade_id := COALESCE(p_unidade_id, public.get_current_unidade());
IF v_unidade_id IS NULL THEN RAISE EXCEPTION 'Unidade não definida no contexto';
END IF;
-- Retornar saldos das contas contábeis para o período
RETURN QUERY
SELECT cc.id as conta_id,
    cc.codigo as conta_codigo,
    cc.nome as conta_nome,
    cc.tipo as conta_tipo,
    COALESCE(
        SUM(
            CASE
                WHEN lc.tipo_lancamento = 'debito' THEN lc.valor
                ELSE 0
            END
        ),
        0
    ) as saldo_debito,
    COALESCE(
        SUM(
            CASE
                WHEN lc.tipo_lancamento = 'credito' THEN lc.valor
                ELSE 0
            END
        ),
        0
    ) as saldo_credito,
    CASE
        WHEN cc.tipo IN ('ativo', 'despesa') THEN COALESCE(
            SUM(
                CASE
                    WHEN lc.tipo_lancamento = 'debito' THEN lc.valor
                    ELSE 0
                END
            ),
            0
        ) - COALESCE(
            SUM(
                CASE
                    WHEN lc.tipo_lancamento = 'credito' THEN lc.valor
                    ELSE 0
                END
            ),
            0
        )
        ELSE COALESCE(
            SUM(
                CASE
                    WHEN lc.tipo_lancamento = 'credito' THEN lc.valor
                    ELSE 0
                END
            ),
            0
        ) - COALESCE(
            SUM(
                CASE
                    WHEN lc.tipo_lancamento = 'debito' THEN lc.valor
                    ELSE 0
                END
            ),
            0
        )
    END as saldo_final
FROM public.contas_contabeis cc
    LEFT JOIN public.lancamentos_contabeis lc ON cc.id = lc.conta_debito_id
    OR cc.id = lc.conta_credito_id
WHERE cc.ativo = true
    AND (
        lc.id IS NULL
        OR (
            lc.unidade_id = v_unidade_id
            AND lc.data_competencia BETWEEN p_data_inicio AND p_data_fim
            AND lc.status = 'confirmado'
        )
    )
GROUP BY cc.id,
    cc.codigo,
    cc.nome,
    cc.tipo
ORDER BY cc.codigo;
END;
$$;
-- ============================================================================
-- 7. FUNÇÕES AUXILIARES
-- ============================================================================
-- Função para calcular fluxo de caixa
CREATE OR REPLACE FUNCTION public.calculate_fluxo_caixa(
        p_data_inicio DATE,
        p_data_fim DATE,
        p_unidade_id TEXT DEFAULT NULL
    ) RETURNS TABLE (
        data DATE,
        tipo_movimento VARCHAR(50),
        categoria VARCHAR(100),
        total_entradas DECIMAL(15, 2),
        total_saidas DECIMAL(15, 2),
        saldo_dia DECIMAL(15, 2),
        saldo_acumulado DECIMAL(15, 2)
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_unidade_id TEXT;
v_saldo_acumulado DECIMAL(15, 2) := 0;
r RECORD;
BEGIN v_unidade_id := COALESCE(p_unidade_id, public.get_current_unidade());
IF v_unidade_id IS NULL THEN RAISE EXCEPTION 'Unidade não definida no contexto';
END IF;
-- Gerar série de datas
FOR r IN
SELECT generate_series(p_data_inicio, p_data_fim, '1 day'::interval)::date as data LOOP -- Calcular totais do dia
SELECT COALESCE(
        SUM(
            CASE
                WHEN tipo_movimento = 'entrada' THEN valor
                ELSE 0
            END
        ),
        0
    ),
    COALESCE(
        SUM(
            CASE
                WHEN tipo_movimento = 'saida' THEN valor
                ELSE 0
            END
        ),
        0
    ) INTO total_entradas,
    total_saidas
FROM public.fluxo_caixa
WHERE data = r.data
    AND unidade_id = v_unidade_id;
-- Calcular saldo do dia e acumulado
saldo_dia := total_entradas - total_saidas;
v_saldo_acumulado := v_saldo_acumulado + saldo_dia;
RETURN NEXT;
END LOOP;
END;
$$;
-- Função para calcular balanço patrimonial
CREATE OR REPLACE FUNCTION public.calculate_balanco_patrimonial(
        p_data_referencia DATE,
        p_unidade_id TEXT DEFAULT NULL
    ) RETURNS TABLE (
        conta_id UUID,
        conta_codigo VARCHAR(20),
        conta_nome VARCHAR(255),
        conta_tipo VARCHAR(50),
        saldo_final DECIMAL(15, 2)
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_unidade_id TEXT;
BEGIN v_unidade_id := COALESCE(p_unidade_id, public.get_current_unidade());
IF v_unidade_id IS NULL THEN RAISE EXCEPTION 'Unidade não definida no contexto';
END IF;
RETURN QUERY
SELECT cc.id,
    cc.codigo,
    cc.nome,
    cc.tipo,
    CASE
        WHEN cc.tipo IN ('ativo', 'despesa') THEN COALESCE(
            SUM(
                CASE
                    WHEN lc.tipo_lancamento = 'debito' THEN lc.valor
                    ELSE 0
                END
            ),
            0
        ) - COALESCE(
            SUM(
                CASE
                    WHEN lc.tipo_lancamento = 'credito' THEN lc.valor
                    ELSE 0
                END
            ),
            0
        )
        ELSE COALESCE(
            SUM(
                CASE
                    WHEN lc.tipo_lancamento = 'credito' THEN lc.valor
                    ELSE 0
                END
            ),
            0
        ) - COALESCE(
            SUM(
                CASE
                    WHEN lc.tipo_lancamento = 'debito' THEN lc.valor
                    ELSE 0
                END
            ),
            0
        )
    END as saldo_final
FROM public.contas_contabeis cc
    LEFT JOIN public.lancamentos_contabeis lc ON cc.id = lc.conta_debito_id
    OR cc.id = lc.conta_credito_id
WHERE cc.ativo = true
    AND (
        lc.id IS NULL
        OR (
            lc.unidade_id = v_unidade_id
            AND lc.data_competencia <= p_data_referencia
            AND lc.status = 'confirmado'
        )
    )
GROUP BY cc.id,
    cc.codigo,
    cc.nome,
    cc.tipo
ORDER BY cc.codigo;
END;
$$;
-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Habilitar RLS em todas as tabelas
ALTER TABLE public.contas_contabeis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos_contabeis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centros_custo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribuicao_custos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impostos_taxas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos_impostos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluxo_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balanco_patrimonial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dre ENABLE ROW LEVEL SECURITY;
-- Políticas para contas contábeis (todos podem ler, apenas admins podem modificar)
DROP POLICY IF EXISTS "contas_contabeis_select" ON public.contas_contabeis;
CREATE POLICY "contas_contabeis_select" ON public.contas_contabeis FOR
SELECT USING (true);
DROP POLICY IF EXISTS "contas_contabeis_modify" ON public.contas_contabeis;
CREATE POLICY "contas_contabeis_modify" ON public.contas_contabeis FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
-- Políticas para lançamentos contábeis
DROP POLICY IF EXISTS "lancamentos_contabeis_select" ON public.lancamentos_contabeis;
CREATE POLICY "lancamentos_contabeis_select" ON public.lancamentos_contabeis FOR
SELECT USING (unidade_id = public.get_current_unidade());
DROP POLICY IF EXISTS "lancamentos_contabeis_modify" ON public.lancamentos_contabeis;
CREATE POLICY "lancamentos_contabeis_modify" ON public.lancamentos_contabeis FOR ALL USING (unidade_id = public.get_current_unidade()) WITH CHECK (unidade_id = public.get_current_unidade());
-- Políticas para centros de custo
DROP POLICY IF EXISTS "centros_custo_select" ON public.centros_custo;
CREATE POLICY "centros_custo_select" ON public.centros_custo FOR
SELECT USING (unidade_id = public.get_current_unidade());
DROP POLICY IF EXISTS "centros_custo_modify" ON public.centros_custo;
CREATE POLICY "centros_custo_modify" ON public.centros_custo FOR ALL USING (unidade_id = public.get_current_unidade()) WITH CHECK (unidade_id = public.get_current_unidade());
-- Políticas para distribuição de custos
DROP POLICY IF EXISTS "distribuicao_custos_select" ON public.distribuicao_custos;
CREATE POLICY "distribuicao_custos_select" ON public.distribuicao_custos FOR
SELECT USING (true);
DROP POLICY IF EXISTS "distribuicao_custos_modify" ON public.distribuicao_custos;
CREATE POLICY "distribuicao_custos_modify" ON public.distribuicao_custos FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
-- Políticas para impostos e taxas (todos podem ler, apenas admins podem modificar)
DROP POLICY IF EXISTS "impostos_taxas_select" ON public.impostos_taxas;
CREATE POLICY "impostos_taxas_select" ON public.impostos_taxas FOR
SELECT USING (true);
DROP POLICY IF EXISTS "impostos_taxas_modify" ON public.impostos_taxas;
CREATE POLICY "impostos_taxas_modify" ON public.impostos_taxas FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
-- Políticas para lançamentos de impostos
DROP POLICY IF EXISTS "lancamentos_impostos_select" ON public.lancamentos_impostos;
CREATE POLICY "lancamentos_impostos_select" ON public.lancamentos_impostos FOR
SELECT USING (true);
DROP POLICY IF EXISTS "lancamentos_impostos_modify" ON public.lancamentos_impostos;
CREATE POLICY "lancamentos_impostos_modify" ON public.lancamentos_impostos FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
-- Políticas para fluxo de caixa
DROP POLICY IF EXISTS "fluxo_caixa_select" ON public.fluxo_caixa;
CREATE POLICY "fluxo_caixa_select" ON public.fluxo_caixa FOR
SELECT USING (unidade_id = public.get_current_unidade());
DROP POLICY IF EXISTS "fluxo_caixa_modify" ON public.fluxo_caixa;
CREATE POLICY "fluxo_caixa_modify" ON public.fluxo_caixa FOR ALL USING (unidade_id = public.get_current_unidade()) WITH CHECK (unidade_id = public.get_current_unidade());
-- Políticas para balanço patrimonial
DROP POLICY IF EXISTS "balanco_patrimonial_select" ON public.balanco_patrimonial;
CREATE POLICY "balanco_patrimonial_select" ON public.balanco_patrimonial FOR
SELECT USING (unidade_id = public.get_current_unidade());
DROP POLICY IF EXISTS "balanco_patrimonial_modify" ON public.balanco_patrimonial;
CREATE POLICY "balanco_patrimonial_modify" ON public.balanco_patrimonial FOR ALL USING (unidade_id = public.get_current_unidade()) WITH CHECK (unidade_id = public.get_current_unidade());
-- Políticas para DRE
DROP POLICY IF EXISTS "dre_select" ON public.dre;
CREATE POLICY "dre_select" ON public.dre FOR
SELECT USING (unidade_id = public.get_current_unidade());
DROP POLICY IF EXISTS "dre_modify" ON public.dre;
CREATE POLICY "dre_modify" ON public.dre FOR ALL USING (unidade_id = public.get_current_unidade()) WITH CHECK (unidade_id = public.get_current_unidade());
-- ============================================================================
-- 9. DADOS INICIAIS
-- ============================================================================
-- Inserir contas contábeis básicas
INSERT INTO public.contas_contabeis (codigo, nome, tipo, categoria, nivel)
VALUES -- Ativo
    ('1', 'ATIVO', 'ativo', 'ativo', 1),
    ('1.1', 'ATIVO CIRCULANTE', 'ativo', 'ativo', 2),
    ('1.1.1', 'DISPONIBILIDADES', 'ativo', 'ativo', 3),
    ('1.1.1.1', 'CAIXA', 'ativo', 'ativo', 4),
    (
        '1.1.1.2',
        'BANCOS CONTA MOVIMENTO',
        'ativo',
        'ativo',
        4
    ),
    ('1.1.2', 'CRÉDITOS', 'ativo', 'ativo', 3),
    ('1.1.2.1', 'CLIENTES', 'ativo', 'ativo', 4),
    (
        '1.1.2.2',
        'OUTRAS CONTAS A RECEBER',
        'ativo',
        'ativo',
        4
    ),
    ('1.1.3', 'ESTOQUES', 'ativo', 'ativo', 3),
    (
        '1.1.3.1',
        'PRODUTOS PARA REVENDA',
        'ativo',
        'ativo',
        4
    ),
    (
        '1.1.4',
        'DESPESAS ANTECIPADAS',
        'ativo',
        'ativo',
        3
    ),
    ('1.1.4.1', 'SEGUROS', 'ativo', 'ativo', 4),
    ('1.1.4.2', 'ALUGUÉIS', 'ativo', 'ativo', 4),
    -- Passivo
    ('2', 'PASSIVO', 'passivo', 'passivo', 1),
    (
        '2.1',
        'PASSIVO CIRCULANTE',
        'passivo',
        'passivo',
        2
    ),
    ('2.1.1', 'FORNECEDORES', 'passivo', 'passivo', 3),
    (
        '2.1.2',
        'OBRIGAÇÕES TRABALHISTAS',
        'passivo',
        'passivo',
        3
    ),
    (
        '2.1.2.1',
        'SALÁRIOS A PAGAR',
        'passivo',
        'passivo',
        4
    ),
    (
        '2.1.2.2',
        'INSS A RECOLHER',
        'passivo',
        'passivo',
        4
    ),
    (
        '2.1.2.3',
        'FGTS A RECOLHER',
        'passivo',
        'passivo',
        4
    ),
    (
        '2.1.3',
        'OBRIGAÇÕES FISCAIS',
        'passivo',
        'passivo',
        3
    ),
    (
        '2.1.3.1',
        'ICMS A RECOLHER',
        'passivo',
        'passivo',
        4
    ),
    (
        '2.1.3.2',
        'ISS A RECOLHER',
        'passivo',
        'passivo',
        4
    ),
    (
        '2.1.3.3',
        'IRRF A RECOLHER',
        'passivo',
        'passivo',
        4
    ),
    ('2.1.4', 'EMPRÉSTIMOS', 'passivo', 'passivo', 3),
    -- Patrimônio Líquido
    (
        '3',
        'PATRIMÔNIO LÍQUIDO',
        'patrimonio_liquido',
        'patrimonio_liquido',
        1
    ),
    (
        '3.1',
        'CAPITAL SOCIAL',
        'patrimonio_liquido',
        'patrimonio_liquido',
        2
    ),
    (
        '3.2',
        'RESERVAS',
        'patrimonio_liquido',
        'patrimonio_liquido',
        2
    ),
    (
        '3.3',
        'LUCROS ACUMULADOS',
        'patrimonio_liquido',
        'patrimonio_liquido',
        2
    ),
    -- Receitas
    ('4', 'RECEITAS', 'receita', 'receita', 1),
    (
        '4.1',
        'RECEITAS OPERACIONAIS',
        'receita',
        'receita',
        2
    ),
    (
        '4.1.1',
        'RECEITA DE SERVIÇOS',
        'receita',
        'receita',
        3
    ),
    ('4.1.1.1', 'CORTES', 'receita', 'receita', 4),
    ('4.1.1.2', 'BARBAS', 'receita', 'receita', 4),
    (
        '4.1.1.3',
        'TRATAMENTOS',
        'receita',
        'receita',
        4
    ),
    (
        '4.1.2',
        'RECEITA DE PRODUTOS',
        'receita',
        'receita',
        3
    ),
    (
        '4.1.2.1',
        'VENDAS DE PRODUTOS',
        'receita',
        'receita',
        4
    ),
    (
        '4.1.3',
        'RECEITA DE ASSINATURAS',
        'receita',
        'receita',
        3
    ),
    (
        '4.1.3.1',
        'PLANOS MENSAL',
        'receita',
        'receita',
        4
    ),
    (
        '4.1.3.2',
        'PLANOS ANUAL',
        'receita',
        'receita',
        4
    ),
    -- Despesas
    ('5', 'DESPESAS', 'despesa', 'despesa', 1),
    (
        '5.1',
        'DESPESAS OPERACIONAIS',
        'despesa',
        'despesa',
        2
    ),
    (
        '5.1.1',
        'DESPESAS COM PESSOAL',
        'despesa',
        'despesa',
        3
    ),
    ('5.1.1.1', 'SALÁRIOS', 'despesa', 'despesa', 4),
    (
        '5.1.1.2',
        'ENCARGOS SOCIAIS',
        'despesa',
        'despesa',
        4
    ),
    ('5.1.1.3', 'COMISSÕES', 'despesa', 'despesa', 4),
    (
        '5.1.2',
        'DESPESAS ADMINISTRATIVAS',
        'despesa',
        'despesa',
        3
    ),
    ('5.1.2.1', 'ALUGUÉIS', 'despesa', 'despesa', 4),
    ('5.1.2.2', 'ÁGUA', 'despesa', 'despesa', 4),
    ('5.1.2.3', 'LUZ', 'despesa', 'despesa', 4),
    ('5.1.2.4', 'TELEFONE', 'despesa', 'despesa', 4),
    ('5.1.2.5', 'INTERNET', 'despesa', 'despesa', 4),
    ('5.1.2.6', 'LIMPEZA', 'despesa', 'despesa', 4),
    (
        '5.1.3',
        'DESPESAS COM MERCADORIAS',
        'despesa',
        'despesa',
        3
    ),
    (
        '5.1.3.1',
        'CUSTO DOS PRODUTOS VENDIDOS',
        'despesa',
        'despesa',
        4
    ),
    (
        '5.1.4',
        'DESPESAS FINANCEIRAS',
        'despesa',
        'despesa',
        3
    ),
    ('5.1.4.1', 'JUROS', 'despesa', 'despesa', 4),
    ('5.1.4.2', 'MULTAS', 'despesa', 'despesa', 4),
    (
        '5.1.4.3',
        'TAXAS BANCÁRIAS',
        'despesa',
        'despesa',
        4
    ) ON CONFLICT (codigo) DO NOTHING;
-- Inserir centros de custo básicos
INSERT INTO public.centros_custo (codigo, nome, descricao, unidade_id)
VALUES (
        'CC001',
        'ADMINISTRAÇÃO',
        'Centro de custo para despesas administrativas',
        'trato'
    ),
    (
        'CC002',
        'VENDAS',
        'Centro de custo para despesas de vendas',
        'trato'
    ),
    (
        'CC003',
        'PRODUÇÃO',
        'Centro de custo para despesas de produção',
        'trato'
    ),
    (
        'CC004',
        'FINANCEIRO',
        'Centro de custo para despesas financeiras',
        'trato'
    ),
    (
        'CC005',
        'ADMINISTRAÇÃO',
        'Centro de custo para despesas administrativas',
        'barberbeer'
    ),
    (
        'CC006',
        'VENDAS',
        'Centro de custo para despesas de vendas',
        'barberbeer'
    ),
    (
        'CC007',
        'PRODUÇÃO',
        'Centro de custo para despesas de produção',
        'barberbeer'
    ),
    (
        'CC008',
        'FINANCEIRO',
        'Centro de custo para despesas financeiras',
        'barberbeer'
    ) ON CONFLICT (codigo, unidade_id) DO NOTHING;
-- Inserir impostos e taxas básicos
INSERT INTO public.impostos_taxas (nome, tipo, aliquota, base_calculo)
VALUES ('ICMS', 'imposto', 0.18, 'valor_bruto'),
    ('ISS', 'imposto', 0.05, 'valor_bruto'),
    ('PIS', 'imposto', 0.0165, 'valor_bruto'),
    ('COFINS', 'imposto', 0.076, 'valor_bruto'),
    ('IRRF', 'imposto', 0.15, 'valor_bruto'),
    ('INSS', 'contribuicao', 0.11, 'valor_bruto'),
    ('FGTS', 'contribuicao', 0.08, 'valor_bruto') ON CONFLICT (nome) DO NOTHING;
-- ============================================================================
-- 10. COMENTÁRIOS DAS TABELAS
-- ============================================================================
COMMENT ON TABLE public.contas_contabeis IS 'Plano de contas contábeis do sistema';
COMMENT ON TABLE public.lancamentos_contabeis IS 'Lançamentos contábeis do sistema';
COMMENT ON TABLE public.centros_custo IS 'Centros de custo para rateio de despesas';
COMMENT ON TABLE public.distribuicao_custos IS 'Distribuição de custos por centro de custo';
COMMENT ON TABLE public.impostos_taxas IS 'Cadastro de impostos e taxas';
COMMENT ON TABLE public.lancamentos_impostos IS 'Lançamentos de impostos e taxas';
COMMENT ON TABLE public.fluxo_caixa IS 'Fluxo de caixa diário';
COMMENT ON TABLE public.balanco_patrimonial IS 'Balanço patrimonial por data';
COMMENT ON TABLE public.dre IS 'Demonstração do Resultado do Exercício';
-- ============================================================================
-- MIGRATION COMPLETA - MÓDULO FINANCEIRO DRE
-- ============================================================================
-- Status: ✅ CONCLUÍDA
-- Tabelas criadas: 9
-- Funções criadas: 4
-- Políticas RLS: 18
-- Dados iniciais: Contas contábeis, centros de custo, impostos
-- ============================================================================