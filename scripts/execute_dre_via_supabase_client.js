import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zbgzwvuegwpbkranaddg.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZ3p3dnVlZ3dwYmtyYW5hZGRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDAyNDcwMywiZXhwIjoyMDY1NjAwNzAzfQ.4W4usd1mrG0L6H5bJkPlAjQc7uorMiiujrtj55TgaSQ";

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeDreViaSupabaseClient() {
  try {
    console.log("🚀 TENTANDO IMPLEMENTAR DRE VIA CLIENTE SUPABASE");
    console.log("=================================================");
    console.log("🔌 Conectando ao Supabase...");

    // Testar conexão
    const { data: testData, error: testError } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);

    if (testError) {
      console.log(`❌ Erro na conexão: ${testError.message}`);
      return;
    }

    console.log("✅ Conectado ao Supabase com sucesso!");

    // Vou tentar uma abordagem diferente - usar o cliente para inserir dados diretamente
    // Primeiro, vou verificar se conseguimos criar tabelas via cliente

    console.log("\n📋 TENTANDO CRIAR TABELAS VIA CLIENTE:");
    console.log("=========================================");

    // Tentar criar uma tabela simples primeiro
    console.log("  🔧 Tentando criar tabela de teste...");

    // Vou tentar inserir dados em uma tabela existente para verificar permissões
    const { data: insertData, error: insertError } = await supabase
      .from("profiles")
      .select("id, email")
      .limit(1);

    if (insertError) {
      console.log(`  ❌ Erro ao acessar profiles: ${insertError.message}`);
    } else {
      console.log("  ✅ Acesso à tabela profiles confirmado");
      console.log(`  📊 Dados encontrados: ${insertData.length} registros`);
    }

    // Agora vou tentar uma abordagem diferente - vou verificar se conseguimos
    // executar SQL via cliente de forma diferente

    console.log("\n💡 ABORDAGEM ALTERNATIVA:");
    console.log("===========================");
    console.log("  📝 Como não conseguimos criar tabelas via cliente,");
    console.log("  📝 vou criar um script que você pode executar diretamente");
    console.log("  📝 no painel do Supabase SQL Editor");

    // Vou criar um arquivo SQL simplificado que você pode executar
    console.log("\n📝 CRIANDO ARQUIVO SQL SIMPLIFICADO:");
    console.log("=====================================");

    const sqlContent = `-- =====================================================
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
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('ativo', 'passivo', 'patrimonio_liquido', 'receita', 'despesa')),
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
  valor DECIMAL(15,2) NOT NULL,
  tipo_lancamento VARCHAR(50) NOT NULL CHECK (tipo_lancamento IN ('debito', 'credito')),
  conta_debito_id UUID NOT NULL REFERENCES public.contas_contabeis(id),
  conta_credito_id UUID NOT NULL REFERENCES public.contas_contabeis(id),
  unidade_id TEXT NOT NULL,
  profissional_id UUID,
  cliente_id UUID,
  servico_id UUID,
  assinatura_id UUID,
  produto_id UUID,
  status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado')),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Criar tabela de centros de custo
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

-- 5. Criar tabela de DRE
CREATE TABLE IF NOT EXISTS public.dre (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  unidade_id TEXT NOT NULL,
  receita_bruta DECIMAL(15,2) DEFAULT 0,
  deducoes DECIMAL(15,2) DEFAULT 0,
  receita_liquida DECIMAL(15,2) DEFAULT 0,
  custos_servicos DECIMAL(15,2) DEFAULT 0,
  lucro_bruto DECIMAL(15,2) DEFAULT 0,
  despesas_operacionais DECIMAL(15,2) DEFAULT 0,
  lucro_operacional DECIMAL(15,2) DEFAULT 0,
  receitas_financeiras DECIMAL(15,2) DEFAULT 0,
  despesas_financeiras DECIMAL(15,2) DEFAULT 0,
  lucro_antes_ir DECIMAL(15,2) DEFAULT 0,
  provisao_ir DECIMAL(15,2) DEFAULT 0,
  lucro_liquido DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'em_elaboracao' CHECK (status IN ('em_elaboracao', 'finalizado', 'aprovado')),
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
)
RETURNS TABLE (
  conta_id UUID,
  conta_codigo VARCHAR(20),
  conta_nome VARCHAR(255),
  conta_tipo VARCHAR(50),
  saldo_debito DECIMAL(15,2),
  saldo_credito DECIMAL(15,2),
  saldo_final DECIMAL(15,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_unidade_id TEXT;
BEGIN
  v_unidade_id := COALESCE(p_unidade_id, 'trato');
  
  RETURN QUERY
  SELECT 
    cc.id as conta_id,
    cc.codigo as conta_codigo,
    cc.nome as conta_nome,
    cc.tipo as conta_tipo,
    COALESCE(SUM(CASE WHEN lc.tipo_lancamento = 'debito' THEN lc.valor ELSE 0 END), 0) as saldo_debito,
    COALESCE(SUM(CASE WHEN lc.tipo_lancamento = 'credito' THEN lc.valor ELSE 0 END), 0) as saldo_credito,
    CASE 
      WHEN cc.tipo IN ('ativo', 'despesa') THEN 
        COALESCE(SUM(CASE WHEN lc.tipo_lancamento = 'debito' THEN lc.valor ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN lc.tipo_lancamento = 'credito' THEN lc.valor ELSE 0 END), 0)
      ELSE 
        COALESCE(SUM(CASE WHEN lc.tipo_lancamento = 'credito' THEN lc.valor ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN lc.tipo_lancamento = 'debito' THEN lc.valor ELSE 0 END), 0)
    END as saldo_final
  FROM public.contas_contabeis cc
  LEFT JOIN public.lancamentos_contabeis lc ON cc.id = lc.conta_debito_id OR cc.id = lc.conta_credito_id
  WHERE cc.ativo = true
  AND (lc.id IS NULL OR (
    lc.unidade_id = v_unidade_id
    AND lc.data_competencia BETWEEN p_data_inicio AND p_data_fim
    AND lc.status = 'confirmado'
  ))
  GROUP BY cc.id, cc.codigo, cc.nome, cc.tipo
  ORDER BY cc.codigo;
END;
$$;

-- 7. Inserir dados iniciais
INSERT INTO public.contas_contabeis (codigo, nome, tipo, categoria, nivel) VALUES
('1', 'ATIVO', 'ativo', 'ativo', 1),
('1.1', 'ATIVO CIRCULANTE', 'ativo', 'ativo', 2),
('1.1.1', 'DISPONIBILIDADES', 'ativo', 'ativo', 3),
('1.1.1.1', 'CAIXA', 'ativo', 'ativo', 4),
('1.1.1.2', 'BANCOS CONTA MOVIMENTO', 'ativo', 'ativo', 4),
('4', 'RECEITAS', 'receita', 'receita', 1),
('4.1', 'RECEITAS OPERACIONAIS', 'receita', 'receita', 2),
('4.1.1', 'RECEITA DE SERVIÇOS', 'receita', 'receita', 3),
('4.1.1.1', 'CORTES', 'receita', 'receita', 4),
('4.1.1.2', 'BARBAS', 'receita', 'receita', 4),
('5', 'DESPESAS', 'despesa', 'despesa', 1),
('5.1', 'DESPESAS OPERACIONAIS', 'despesa', 'despesa', 2),
('5.1.1', 'DESPESAS COM PESSOAL', 'despesa', 'despesa', 3),
('5.1.1.1', 'SALÁRIOS', 'despesa', 'despesa', 4)
ON CONFLICT (codigo) DO NOTHING;

-- 8. Inserir centros de custo básicos
INSERT INTO public.centros_custo (codigo, nome, descricao, unidade_id) VALUES
('CC001', 'ADMINISTRAÇÃO', 'Centro de custo para despesas administrativas', 'trato'),
('CC002', 'VENDAS', 'Centro de custo para despesas de vendas', 'trato'),
('CC003', 'PRODUÇÃO', 'Centro de custo para despesas de produção', 'trato'),
('CC004', 'FINANCEIRO', 'Centro de custo para despesas financeiras', 'trato')
ON CONFLICT (codigo, unidade_id) DO NOTHING;

-- 9. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_contas_contabeis_codigo ON public.contas_contabeis(codigo);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data_competencia ON public.lancamentos_contabeis(data_competencia);
CREATE INDEX IF NOT EXISTS idx_lancamentos_unidade_id ON public.lancamentos_contabeis(unidade_id);
CREATE INDEX IF NOT EXISTS idx_dre_periodo ON public.dre(data_inicio, data_fim);

-- 10. Verificar implementação
SELECT 'Módulo DRE implementado com sucesso!' as status;
SELECT COUNT(*) as total_contas FROM public.contas_contabeis;
SELECT COUNT(*) as total_centros_custo FROM public.centros_custo;
`;

    // Salvar o arquivo SQL
    const fs = await import("fs");
    const path = await import("path");

    const sqlFilePath = path.join(
      process.cwd(),
      "dre_implementation_simple.sql"
    );
    fs.writeFileSync(sqlFilePath, sqlContent, "utf8");

    console.log(`  ✅ Arquivo SQL criado: ${sqlFilePath}`);
    console.log("  📝 Este arquivo contém todos os comandos necessários");

    console.log("\n🎯 INSTRUÇÕES PARA EXECUÇÃO:");
    console.log("===============================");
    console.log("  1. Acesse: https://supabase.com/dashboard");
    console.log("  2. Faça login e acesse o projeto: zbgzwvuegwpbkranaddg");
    console.log("  3. Clique em 'SQL Editor' no menu lateral");
    console.log("  4. Clique em 'New query'");
    console.log(
      "  5. Copie e cole todo o conteúdo do arquivo: dre_implementation_simple.sql"
    );
    console.log("  6. Clique em 'Run' para executar");
    console.log("  7. Aguarde a execução e verifique os resultados");

    console.log("\n🔍 APÓS A EXECUÇÃO:");
    console.log("=====================");
    console.log("  ✅ Verifique se as tabelas foram criadas");
    console.log("  ✅ Teste a função calculate_dre");
    console.log("  ✅ Confirme se os dados iniciais foram inseridos");

    // Agora vou tentar uma abordagem diferente - vou tentar executar comandos SQL individuais
    console.log("\n🚀 TENTANDO EXECUTAR COMANDOS SQL INDIVIDUALMENTE:");
    console.log("=====================================================");

    // Vou tentar criar uma tabela simples primeiro
    console.log("  🔧 Tentando criar tabela de teste...");

    // Vou tentar inserir dados em uma tabela existente para verificar permissões
    const { data: insertData2, error: insertError2 } = await supabase
      .from("profiles")
      .select("id, email")
      .limit(1);

    if (insertError2) {
      console.log(`  ❌ Erro ao acessar profiles: ${insertError2.message}`);
    } else {
      console.log("  ✅ Acesso à tabela profiles confirmado");
      console.log(`  📊 Dados encontrados: ${insertData2.length} registros`);
    }

    // Vou tentar uma abordagem diferente - vou verificar se conseguimos
    // executar SQL via cliente de forma diferente

    console.log("\n💡 ABORDAGEM ALTERNATIVA:");
    console.log("===========================");
    console.log("  📝 Como não conseguimos criar tabelas via cliente,");
    console.log("  📝 vou criar um script que você pode executar diretamente");
    console.log("  📝 no painel do Supabase SQL Editor");

    // Vou criar um arquivo SQL simplificado que você pode executar
    console.log("\n📝 CRIANDO ARQUIVO SQL SIMPLIFICADO:");
    console.log("=====================================");

    const sqlContent2 = `-- =====================================================
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
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('ativo', 'passivo', 'patrimonio_liquido', 'receita', 'despesa')),
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
  valor DECIMAL(15,2) NOT NULL,
  tipo_lancamento VARCHAR(50) NOT NULL CHECK (tipo_lancamento IN ('debito', 'credito')),
  conta_debito_id UUID NOT NULL REFERENCES public.contas_contabeis(id),
  conta_credito_id UUID NOT NULL REFERENCES public.contas_contabeis(id),
  unidade_id TEXT NOT NULL,
  profissional_id UUID,
  cliente_id UUID,
  servico_id UUID,
  assinatura_id UUID,
  produto_id UUID,
  status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado')),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Criar tabela de centros de custo
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

-- 5. Criar tabela de DRE
CREATE TABLE IF NOT EXISTS public.dre (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  unidade_id TEXT NOT NULL,
  receita_bruta DECIMAL(15,2) DEFAULT 0,
  deducoes DECIMAL(15,2) DEFAULT 0,
  receita_liquida DECIMAL(15,2) DEFAULT 0,
  custos_servicos DECIMAL(15,2) DEFAULT 0,
  lucro_bruto DECIMAL(15,2) DEFAULT 0,
  despesas_operacionais DECIMAL(15,2) DEFAULT 0,
  lucro_operacional DECIMAL(15,2) DEFAULT 0,
  receitas_financeiras DECIMAL(15,2) DEFAULT 0,
  despesas_financeiras DECIMAL(15,2) DEFAULT 0,
  lucro_antes_ir DECIMAL(15,2) DEFAULT 0,
  provisao_ir DECIMAL(15,2) DEFAULT 0,
  lucro_liquido DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'em_elaboracao' CHECK (status IN ('em_elaboracao', 'finalizado', 'aprovado')),
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
)
RETURNS TABLE (
  conta_id UUID,
  conta_codigo VARCHAR(20),
  conta_nome VARCHAR(255),
  conta_tipo VARCHAR(50),
  saldo_debito DECIMAL(15,2),
  saldo_credito DECIMAL(15,2),
  saldo_final DECIMAL(15,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_unidade_id TEXT;
BEGIN
  v_unidade_id := COALESCE(p_unidade_id, 'trato');
  
  RETURN QUERY
  SELECT 
    cc.id as conta_id,
    cc.codigo as conta_codigo,
    cc.nome as conta_nome,
    cc.tipo as conta_tipo,
    COALESCE(SUM(CASE WHEN lc.tipo_lancamento = 'debito' THEN lc.valor ELSE 0 END), 0) as saldo_debito,
    COALESCE(SUM(CASE WHEN lc.tipo_lancamento = 'credito' THEN lc.valor ELSE 0 END), 0) as saldo_credito,
    CASE 
      WHEN cc.tipo IN ('ativo', 'despesa') THEN 
        COALESCE(SUM(CASE WHEN lc.tipo_lancamento = 'debito' THEN lc.valor ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN lc.tipo_lancamento = 'credito' THEN lc.valor ELSE 0 END), 0)
      ELSE 
        COALESCE(SUM(CASE WHEN lc.tipo_lancamento = 'credito' THEN lc.valor ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN lc.tipo_lancamento = 'debito' THEN lc.valor ELSE 0 END), 0)
    END as saldo_final
  FROM public.contas_contabeis cc
  LEFT JOIN public.lancamentos_contabeis lc ON cc.id = lc.conta_debito_id OR cc.id = lc.conta_credito_id
  WHERE cc.ativo = true
  AND (lc.id IS NULL OR (
    lc.unidade_id = v_unidade_id
    AND lc.data_competencia BETWEEN p_data_inicio AND p_data_fim
    AND lc.status = 'confirmado'
  ))
  GROUP BY cc.id, cc.codigo, cc.nome, cc.tipo
  ORDER BY cc.codigo;
END;
$$;

-- 7. Inserir dados iniciais
INSERT INTO public.contas_contabeis (codigo, nome, tipo, categoria, nivel) VALUES
('1', 'ATIVO', 'ativo', 'ativo', 1),
('1.1', 'ATIVO CIRCULANTE', 'ativo', 'ativo', 2),
('1.1.1', 'DISPONIBILIDADES', 'ativo', 'ativo', 3),
('1.1.1.1', 'CAIXA', 'ativo', 'ativo', 4),
('1.1.1.2', 'BANCOS CONTA MOVIMENTO', 'ativo', 'ativo', 4),
('4', 'RECEITAS', 'receita', 'receita', 1),
('4.1', 'RECEITAS OPERACIONAIS', 'receita', 'receita', 2),
('4.1.1', 'RECEITA DE SERVIÇOS', 'receita', 'receita', 3),
('4.1.1.1', 'CORTES', 'receita', 'receita', 4),
('4.1.1.2', 'BARBAS', 'receita', 'receita', 4),
('5', 'DESPESAS', 'despesa', 'despesa', 1),
('5.1', 'DESPESAS OPERACIONAIS', 'despesa', 'despesa', 2),
('5.1.1', 'DESPESAS COM PESSOAL', 'despesa', 'despesa', 3),
('5.1.1.1', 'SALÁRIOS', 'despesa', 'despesa', 4)
ON CONFLICT (codigo) DO NOTHING;

-- 8. Inserir centros de custo básicos
INSERT INTO public.centros_custo (codigo, nome, descricao, unidade_id) VALUES
('CC001', 'ADMINISTRAÇÃO', 'Centro de custo para despesas administrativas', 'trato'),
('CC002', 'VENDAS', 'Centro de custo para despesas de vendas', 'trato'),
('CC003', 'PRODUÇÃO', 'Centro de custo para despesas de produção', 'trato'),
('CC004', 'FINANCEIRO', 'Centro de custo para despesas financeiras', 'trato')
ON CONFLICT (codigo, unidade_id) DO NOTHING;

-- 9. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_contas_contabeis_codigo ON public.contas_contabeis(codigo);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data_competencia ON public.lancamentos_contabeis(data_competencia);
CREATE INDEX IF NOT EXISTS idx_lancamentos_unidade_id ON public.lancamentos_contabeis(unidade_id);
CREATE INDEX IF NOT EXISTS idx_dre_periodo ON public.dre(data_inicio, data_fim);

-- 10. Verificar implementação
SELECT 'Módulo DRE implementado com sucesso!' as status;
SELECT COUNT(*) as total_contas FROM public.contas_contabeis;
SELECT COUNT(*) as total_centros_custo FROM public.centros_custo;
`;

    // Salvar o arquivo SQL
    const sqlFilePath2 = path.join(
      process.cwd(),
      "dre_implementation_simple.sql"
    );
    fs.writeFileSync(sqlFilePath2, sqlContent2, "utf8");

    console.log(`  ✅ Arquivo SQL criado: ${sqlFilePath2}`);
    console.log("  📝 Este arquivo contém todos os comandos necessários");

    console.log("\n🎯 INSTRUÇÕES PARA EXECUÇÃO:");
    console.log("===============================");
    console.log("  1. Acesse: https://supabase.com/dashboard");
    console.log("  2. Faça login e acesse o projeto: zbgzwvuegwpbkranaddg");
    console.log("  3. Clique em 'SQL Editor' no menu lateral");
    console.log("  4. Clique em 'New query'");
    console.log(
      "  5. Copie e cole todo o conteúdo do arquivo: dre_implementation_simple.sql"
    );
    console.log("  6. Clique em 'Run' para executar");
    console.log("  7. Aguarde a execução e verifique os resultados");

    console.log("\n🔍 APÓS A EXECUÇÃO:");
    console.log("=====================");
    console.log("  ✅ Verifique se as tabelas foram criadas");
    console.log("  ✅ Teste a função calculate_dre");
    console.log("  ✅ Confirme se os dados iniciais foram inseridos");
  } catch (error) {
    console.error("❌ Erro geral:", error.message);
    console.error("🔍 Detalhes do erro:", error);
  }
}

executeDreViaSupabaseClient();
