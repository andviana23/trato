-- ============================================================================
-- OTIMIZAÇÕES DE PERFORMANCE PARA MÓDULO FINANCEIRO
-- ============================================================================
-- 
-- Este arquivo contém todas as otimizações de performance identificadas
-- durante os testes de QA do módulo financeiro.
-- 
-- Aplicar em sequência no banco de dados Supabase.
-- ============================================================================
-- ============================================================================
-- 1. ÍNDICES PARA TABELA LANCAMENTOS_CONTABEIS
-- ============================================================================
-- Índice composto para consultas por unidade e período (usado no DRE)
-- IMPACTO: Melhora drasticamente a performance da função calculate_dre
CREATE INDEX IF NOT EXISTS idx_lancamentos_unidade_data_status ON public.lancamentos_contabeis(unidade_id, data_competencia, status);
-- Índice para relacionamentos com contas de débito
-- IMPACTO: Acelera JOINs com contas_contabeis na função calculate_dre
CREATE INDEX IF NOT EXISTS idx_lancamentos_conta_debito ON public.lancamentos_contabeis(conta_debito_id);
-- Índice para relacionamentos com contas de crédito
-- IMPACTO: Acelera JOINs com contas_contabeis na função calculate_dre
CREATE INDEX IF NOT EXISTS idx_lancamentos_conta_credito ON public.lancamentos_contabeis(conta_credito_id);
-- Índice para consultas de auditoria por cliente
-- IMPACTO: Acelera buscas de lançamentos por cliente específico
CREATE INDEX IF NOT EXISTS idx_lancamentos_cliente_data ON public.lancamentos_contabeis(cliente_id, data_competencia)
WHERE cliente_id IS NOT NULL;
-- Índice para valor e tipo de lançamento (usado em validações)
-- IMPACTO: Acelera validações de balanceamento contábil
CREATE INDEX IF NOT EXISTS idx_lancamentos_valor_tipo ON public.lancamentos_contabeis(valor, tipo_lancamento, status)
WHERE status = 'confirmado';
-- ============================================================================
-- 2. ÍNDICES PARA TABELA CONTAS_CONTABEIS
-- ============================================================================
-- Índice composto para código e status ativo
-- IMPACTO: Acelera buscas por código de conta (usado constantemente)
CREATE INDEX IF NOT EXISTS idx_contas_codigo_ativo ON public.contas_contabeis(codigo, ativo);
-- Índice para tipo de conta (usado para agrupamento no DRE)
-- IMPACTO: Acelera filtragem por tipo de conta (receita, despesa, etc.)
CREATE INDEX IF NOT EXISTS idx_contas_tipo_ativo ON public.contas_contabeis(tipo, ativo)
WHERE ativo = true;
-- Índice para buscas por unidade
-- IMPACTO: Acelera consultas filtrando por unidade
CREATE INDEX IF NOT EXISTS idx_contas_unidade_ativo ON public.contas_contabeis(unidade_id, ativo)
WHERE ativo = true;
-- ============================================================================
-- 3. ÍNDICES PARA TABELA RECEITAS_AUTOMATICAS
-- ============================================================================
-- Índice único para payment_id (prevenção de duplicatas)
-- IMPACTO: Acelera verificação de duplicatas no processamento automático
CREATE UNIQUE INDEX IF NOT EXISTS idx_receitas_payment_id_unique ON public.receitas_automaticas(payment_id);
-- Índice para consultas por cliente e período
-- IMPACTO: Acelera relatórios de receitas por cliente
CREATE INDEX IF NOT EXISTS idx_receitas_customer_data ON public.receitas_automaticas(customer_id, created_at);
-- Índice para status e unidade
-- IMPACTO: Acelera consultas de receitas por status
CREATE INDEX IF NOT EXISTS idx_receitas_status_unidade ON public.receitas_automaticas(status, unidade_id);
-- ============================================================================
-- 4. ÍNDICES PARA TABELA CLIENTS
-- ============================================================================
-- Índice para ASAAS customer ID (usado no processamento de webhook)
-- IMPACTO: Acelera busca de cliente pelo ID do ASAAS
CREATE INDEX IF NOT EXISTS idx_clients_asaas_customer ON public.clients(asaas_customer_id)
WHERE asaas_customer_id IS NOT NULL;
-- Índice para consultas por unidade e status
-- IMPACTO: Acelera listagem de clientes ativos por unidade
CREATE INDEX IF NOT EXISTS idx_clients_unidade_ativo ON public.clients(unidade_id, is_active)
WHERE is_active = true;
-- ============================================================================
-- 5. ÍNDICES PARA TABELA CENTROS_CUSTO
-- ============================================================================
-- Índice para código e unidade
-- IMPACTO: Acelera buscas de centro de custo por código
CREATE INDEX IF NOT EXISTS idx_centros_custo_codigo_unidade ON public.centros_custo(codigo, unidade_id, ativo)
WHERE ativo = true;
-- ============================================================================
-- 6. OTIMIZAÇÃO DA FUNÇÃO CALCULATE_DRE
-- ============================================================================
-- Criar função otimizada com melhor uso de índices
CREATE OR REPLACE FUNCTION public.calculate_dre_optimized(
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
BEGIN v_unidade_id := COALESCE(p_unidade_id, public.get_current_unidade());
IF v_unidade_id IS NULL THEN RAISE EXCEPTION 'Unidade não definida no contexto';
END IF;
-- Usar CTE para melhor performance
RETURN QUERY WITH lancamentos_periodo AS (
    SELECT lc.conta_debito_id,
        lc.conta_credito_id,
        lc.valor,
        lc.tipo_lancamento
    FROM public.lancamentos_contabeis lc
    WHERE lc.unidade_id = v_unidade_id
        AND lc.data_competencia BETWEEN p_data_inicio AND p_data_fim
        AND lc.status = 'confirmado'
),
saldos_calculados AS (
    SELECT cc.id as conta_id,
        cc.codigo as conta_codigo,
        cc.nome as conta_nome,
        cc.tipo as conta_tipo,
        COALESCE(
            SUM(
                CASE
                    WHEN lp.conta_debito_id = cc.id
                    AND lp.tipo_lancamento = 'debito' THEN lp.valor
                    ELSE 0
                END
            ),
            0
        ) as saldo_debito,
        COALESCE(
            SUM(
                CASE
                    WHEN lp.conta_credito_id = cc.id
                    AND lp.tipo_lancamento = 'credito' THEN lp.valor
                    ELSE 0
                END
            ),
            0
        ) as saldo_credito
    FROM public.contas_contabeis cc
        LEFT JOIN lancamentos_periodo lp ON (
            cc.id = lp.conta_debito_id
            OR cc.id = lp.conta_credito_id
        )
    WHERE cc.ativo = true
    GROUP BY cc.id,
        cc.codigo,
        cc.nome,
        cc.tipo
)
SELECT sc.conta_id,
    sc.conta_codigo,
    sc.conta_nome,
    sc.conta_tipo,
    sc.saldo_debito,
    sc.saldo_credito,
    CASE
        WHEN sc.conta_tipo IN ('ativo', 'despesa') THEN sc.saldo_debito - sc.saldo_credito
        ELSE sc.saldo_credito - sc.saldo_debito
    END as saldo_final
FROM saldos_calculados sc
ORDER BY sc.conta_codigo;
END;
$$;
-- Comentário na função original para uso da otimizada
COMMENT ON FUNCTION public.calculate_dre(DATE, DATE, TEXT) IS 'Função original - considere usar calculate_dre_optimized para melhor performance';
-- ============================================================================
-- 7. MATERIALIZED VIEWS PARA CONSULTAS FREQUENTES
-- ============================================================================
-- View materializada para DRE mensal (atualizada diariamente)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.dre_mensal_cache AS WITH meses_recentes AS (
    SELECT date_trunc(
            'month',
            generate_series(
                CURRENT_DATE - INTERVAL '12 months',
                CURRENT_DATE,
                INTERVAL '1 month'
            )
        ) as mes
),
unidades AS (
    SELECT DISTINCT unidade_id
    FROM public.lancamentos_contabeis
    WHERE data_competencia >= CURRENT_DATE - INTERVAL '12 months'
)
SELECT u.unidade_id,
    m.mes::DATE as data_inicio,
    (m.mes + INTERVAL '1 month - 1 day')::DATE as data_fim,
    dre.*
FROM unidades u
    CROSS JOIN meses_recentes m
    CROSS JOIN LATERAL (
        SELECT *
        FROM public.calculate_dre_optimized(
                m.mes::DATE,
                (m.mes + INTERVAL '1 month - 1 day')::DATE,
                u.unidade_id
            )
    ) dre;
-- Índices na view materializada
CREATE INDEX IF NOT EXISTS idx_dre_cache_unidade_periodo ON public.dre_mensal_cache(unidade_id, data_inicio, data_fim);
CREATE INDEX IF NOT EXISTS idx_dre_cache_conta_tipo ON public.dre_mensal_cache(conta_tipo, unidade_id);
-- ============================================================================
-- 8. FUNÇÃO PARA ATUALIZAR CACHE
-- ============================================================================
-- Função para refresh do cache DRE
CREATE OR REPLACE FUNCTION public.refresh_dre_cache() RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN REFRESH MATERIALIZED VIEW public.dre_mensal_cache;
-- Log da atualização
INSERT INTO public.audit_logs (
        table_name,
        operation,
        details,
        created_at
    )
VALUES (
        'dre_mensal_cache',
        'REFRESH',
        jsonb_build_object('refreshed_at', NOW()),
        NOW()
    );
END;
$$;
-- ============================================================================
-- 9. TRIGGER PARA INVALIDAÇÃO AUTOMÁTICA DE CACHE
-- ============================================================================
-- Função para invalidar cache quando há novos lançamentos
CREATE OR REPLACE FUNCTION public.invalidate_dre_cache() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN -- Agendar refresh do cache (pode ser implementado com pg_cron ou similar)
    PERFORM pg_notify('dre_cache_invalidated', NEW.unidade_id);
RETURN NEW;
END;
$$;
-- Trigger para invalidação automática
DROP TRIGGER IF EXISTS trg_invalidate_dre_cache ON public.lancamentos_contabeis;
CREATE TRIGGER trg_invalidate_dre_cache
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON public.lancamentos_contabeis FOR EACH ROW EXECUTE FUNCTION public.invalidate_dre_cache();
-- ============================================================================
-- 10. ANÁLISE DE PERFORMANCE
-- ============================================================================
-- Função para análise de performance das consultas DRE
CREATE OR REPLACE FUNCTION public.analyze_dre_performance(
        p_unidade_id TEXT DEFAULT 'trato',
        p_meses_analise INTEGER DEFAULT 6
    ) RETURNS TABLE (
        periodo TEXT,
        total_contas INTEGER,
        total_lancamentos INTEGER,
        tempo_execucao_ms INTEGER,
        recomendacao TEXT
    ) LANGUAGE plpgsql AS $$
DECLARE v_start_time TIMESTAMP;
v_end_time TIMESTAMP;
v_execution_time INTEGER;
v_mes DATE;
v_total_contas INTEGER;
v_total_lancamentos INTEGER;
BEGIN FOR i IN 0..p_meses_analise -1 LOOP v_mes := date_trunc(
    'month',
    CURRENT_DATE - (i || ' months')::INTERVAL
);
-- Contar lançamentos no período
SELECT COUNT(*) INTO v_total_lancamentos
FROM public.lancamentos_contabeis
WHERE unidade_id = p_unidade_id
    AND data_competencia BETWEEN v_mes AND (v_mes + INTERVAL '1 month - 1 day')
    AND status = 'confirmado';
-- Medir tempo de execução do DRE
v_start_time := clock_timestamp();
SELECT COUNT(*) INTO v_total_contas
FROM public.calculate_dre_optimized(
        v_mes,
        (v_mes + INTERVAL '1 month - 1 day')::DATE,
        p_unidade_id
    );
v_end_time := clock_timestamp();
v_execution_time := EXTRACT(
    EPOCH
    FROM (v_end_time - v_start_time)
) * 1000;
-- Retornar análise
periodo := to_char(v_mes, 'YYYY-MM');
total_contas := v_total_contas;
total_lancamentos := v_total_lancamentos;
tempo_execucao_ms := v_execution_time;
-- Gerar recomendação
IF v_execution_time > 2000 THEN recomendacao := 'CRÍTICO: Considerar particionamento ou cache';
ELSIF v_execution_time > 1000 THEN recomendacao := 'ATENÇÃO: Monitorar crescimento dos dados';
ELSIF v_execution_time > 500 THEN recomendacao := 'OK: Performance aceitável';
ELSE recomendacao := 'EXCELENTE: Performance ótima';
END IF;
RETURN NEXT;
END LOOP;
END;
$$;
-- ============================================================================
-- 11. INSTRUÇÕES DE APLICAÇÃO
-- ============================================================================
/*
 INSTRUÇÕES PARA APLICAR AS OTIMIZAÇÕES:
 
 1. APLICAR EM PRODUÇÃO (HORÁRIO DE BAIXA DEMANDA):
 - Executar este script durante horário de manutenção
 - Monitorar impacto na performance durante aplicação
 
 2. VERIFICAR ÍNDICES CRIADOS:
 SELECT indexname, tablename 
 FROM pg_indexes 
 WHERE schemaname = 'public' 
 AND indexname LIKE 'idx_%';
 
 3. TESTAR PERFORMANCE:
 SELECT * FROM public.analyze_dre_performance('trato', 6);
 
 4. MONITORAR CACHE:
 -- Configurar job para refresh diário do cache
 -- Implementar monitoramento de invalidações
 
 5. MÉTRICAS DE SUCESSO:
 - Tempo de execução do DRE < 1 segundo
 - Validações financeiras < 5 segundos
 - Processamento de receitas < 500ms
 
 OBSERVAÇÕES IMPORTANTES:
 - Estes índices vão ocupar espaço adicional no banco
 - Monitorar uso de disco após aplicação
 - Índices podem tornar INSERTs/UPDATEs mais lentos
 - Benefício é maior em tabelas com muitos dados
 
 ROLLBACK (SE NECESSÁRIO):
 - Remover índices: DROP INDEX IF EXISTS nome_do_indice;
 - Remover views: DROP MATERIALIZED VIEW IF EXISTS nome_da_view;
 - Remover funções: DROP FUNCTION IF EXISTS nome_da_funcao;
 */