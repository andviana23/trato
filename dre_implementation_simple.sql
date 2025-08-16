-- =====================================================
-- MÓDULO FINANCEIRO DRE - IMPLEMENTAÇÃO SIMPLIFICADA
-- =====================================================
-- 1. Criar extensões (se não existirem)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- 2. Criar tabela de contas contábeis
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
-- 3. Criar tabela de lançamentos contábeis
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
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 4. Criar tabela de centros de custo
CREATE TABLE IF NOT EXISTS public.centros_custo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  unidade_id TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(codigo, unidade_id)
);
-- 5. Criar tabela de DRE
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
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(data_inicio, data_fim, unidade_id)
);
-- 6. Criar função calculate_dre
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
BEGIN v_unidade_id := COALESCE(p_unidade_id, 'trato');
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
-- 7. Inserir dados iniciais
INSERT INTO public.contas_contabeis (codigo, nome, tipo, categoria, nivel)
VALUES ('1', 'ATIVO', 'ativo', 'ativo', 1),
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
  ('5.1.1.1', 'SALÁRIOS', 'despesa', 'despesa', 4) ON CONFLICT (codigo) DO NOTHING;
-- 8. Inserir centros de custo básicos
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
  ) ON CONFLICT (codigo, unidade_id) DO NOTHING;
-- 9. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_contas_contabeis_codigo ON public.contas_contabeis(codigo);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data_competencia ON public.lancamentos_contabeis(data_competencia);
CREATE INDEX IF NOT EXISTS idx_lancamentos_unidade_id ON public.lancamentos_contabeis(unidade_id);
CREATE INDEX IF NOT EXISTS idx_dre_periodo ON public.dre(data_inicio, data_fim);
-- 10. Verificar implementação
SELECT 'Módulo DRE implementado com sucesso!' as status;
SELECT COUNT(*) as total_contas
FROM public.contas_contabeis;
SELECT COUNT(*) as total_centros_custo
FROM public.centros_custo;