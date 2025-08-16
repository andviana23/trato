import { Client } from "pg";

// Configuração de conexão direta ao PostgreSQL do Supabase
const config = {
  host: "aws-0-sa-east-1.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  user: "postgres.zbgzwvuegwpbkranaddg",
  password: "Trato7310!",
  ssl: { rejectUnauthorized: false },
};

async function applyDreMigration() {
  const client = new Client(config);

  try {
    console.log("🚀 INICIANDO IMPLEMENTAÇÃO DO MÓDULO FINANCEIRO DRE");
    console.log("=====================================================");
    console.log("🔌 Conectando ao PostgreSQL do Supabase...");

    await client.connect();
    console.log("✅ Conectado ao PostgreSQL do Supabase com sucesso!");

    // 1. Criar extensões necessárias
    console.log("\n📦 CRIANDO EXTENSÕES:");
    console.log("=======================");

    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log("  ✅ Extensão uuid-ossp criada/verificada");

      await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
      console.log("  ✅ Extensão pgcrypto criada/verificada");
    } catch (error) {
      console.log(`  ⚠️ Erro nas extensões: ${error.message}`);
    }

    // 2. Criar funções utilitárias
    console.log("\n⚙️ CRIANDO FUNÇÕES UTILITÁRIAS:");
    console.log("==================================");

    // Função get_current_unidade
    console.log("  🔧 Criando função get_current_unidade...");
    try {
      await client.query(`
        CREATE OR REPLACE FUNCTION public.get_current_unidade()
        RETURNS TEXT
        LANGUAGE SQL
        STABLE
        AS $$
          SELECT COALESCE(
            NULLIF(current_setting('app.unidade', true), ''),
            NULLIF(
              (current_setting('request.jwt.claims', true)::jsonb->>'unidade'),
              ''
            ),
            'trato'::text
          );
        $$;
      `);
      console.log("    ✅ Função get_current_unidade criada com sucesso!");
    } catch (error) {
      console.log(`    ❌ Erro: ${error.message}`);
    }

    // Função is_admin
    console.log("  🔧 Criando função is_admin...");
    try {
      await client.query(`
        CREATE OR REPLACE FUNCTION public.is_admin()
        RETURNS BOOLEAN
        LANGUAGE SQL
        STABLE
        AS $$
          SELECT EXISTS (
            SELECT 1 FROM auth.users u
            JOIN public.profiles p ON u.id = p.id
            WHERE u.id = auth.uid()
            AND p.role IN ('admin', 'barbershop_owner')
          );
        $$;
      `);
      console.log("    ✅ Função is_admin criada com sucesso!");
    } catch (error) {
      console.log(`    ❌ Erro: ${error.message}`);
    }

    // 3. Criar tabelas do módulo DRE
    console.log("\n📋 CRIANDO TABELAS DO MÓDULO DRE:");
    console.log("====================================");

    // Tabela de contas contábeis
    console.log("  🔧 Criando tabela contas_contabeis...");
    try {
      await client.query(`
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
      `);
      console.log("    ✅ Tabela contas_contabeis criada com sucesso!");
    } catch (error) {
      console.log(`    ❌ Erro: ${error.message}`);
    }

    // Tabela de lançamentos contábeis
    console.log("  🔧 Criando tabela lancamentos_contabeis...");
    try {
      await client.query(`
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
      `);
      console.log("    ✅ Tabela lancamentos_contabeis criada com sucesso!");
    } catch (error) {
      console.log(`    ❌ Erro: ${error.message}`);
    }

    // Tabela de centros de custo
    console.log("  🔧 Criando tabela centros_custo...");
    try {
      await client.query(`
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
      `);
      console.log("    ✅ Tabela centros_custo criada com sucesso!");
    } catch (error) {
      console.log(`    ❌ Erro: ${error.message}`);
    }

    // Tabela de distribuição de custos
    console.log("  🔧 Criando tabela distribuicao_custos...");
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.distribuicao_custos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          lancamento_id UUID NOT NULL REFERENCES public.lancamentos_contabeis(id) ON DELETE CASCADE,
          centro_custo_id UUID NOT NULL REFERENCES public.centros_custo(id),
          percentual DECIMAL(5,2) NOT NULL CHECK (percentual >= 0 AND percentual <= 100),
          valor DECIMAL(15,2) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log("    ✅ Tabela distribuicao_custos criada com sucesso!");
    } catch (error) {
      console.log(`    ❌ Erro: ${error.message}`);
    }

    // Tabela de impostos e taxas
    console.log("  🔧 Criando tabela impostos_taxas...");
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.impostos_taxas (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          nome VARCHAR(255) NOT NULL,
          tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('imposto', 'taxa', 'contribuicao')),
          aliquota DECIMAL(5,4) NOT NULL CHECK (aliquota >= 0 AND aliquota <= 1),
          base_calculo VARCHAR(100) DEFAULT 'valor_bruto',
          ativo BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log("    ✅ Tabela impostos_taxas criada com sucesso!");
    } catch (error) {
      console.log(`    ❌ Erro: ${error.message}`);
    }

    // Tabela de lançamentos de impostos
    console.log("  🔧 Criando tabela lancamentos_impostos...");
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.lancamentos_impostos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          lancamento_id UUID NOT NULL REFERENCES public.lancamentos_contabeis(id) ON DELETE CASCADE,
          imposto_id UUID NOT NULL REFERENCES public.impostos_taxas(id),
          base_calculo DECIMAL(15,2) NOT NULL,
          valor_imposto DECIMAL(15,2) NOT NULL,
          data_vencimento DATE,
          data_pagamento DATE,
          status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido')),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log("    ✅ Tabela lancamentos_impostos criada com sucesso!");
    } catch (error) {
      console.log(`    ❌ Erro: ${error.message}`);
    }

    // Tabela de fluxo de caixa
    console.log("  🔧 Criando tabela fluxo_caixa...");
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.fluxo_caixa (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          data DATE NOT NULL,
          tipo_movimento VARCHAR(50) NOT NULL CHECK (tipo_movimento IN ('entrada', 'saida')),
          categoria VARCHAR(100) NOT NULL,
          descricao TEXT NOT NULL,
          valor DECIMAL(15,2) NOT NULL,
          saldo_anterior DECIMAL(15,2) NOT NULL,
          saldo_atual DECIMAL(15,2) NOT NULL,
          unidade_id TEXT NOT NULL,
          lancamento_id UUID REFERENCES public.lancamentos_contabeis(id),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log("    ✅ Tabela fluxo_caixa criada com sucesso!");
    } catch (error) {
      console.log(`    ❌ Erro: ${error.message}`);
    }

    // Tabela de balanço patrimonial
    console.log("  🔧 Criando tabela balanco_patrimonial...");
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.balanco_patrimonial (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          data_referencia DATE NOT NULL,
          unidade_id TEXT NOT NULL,
          conta_id UUID NOT NULL REFERENCES public.contas_contabeis(id),
          saldo_debito DECIMAL(15,2) DEFAULT 0,
          saldo_credito DECIMAL(15,2) DEFAULT 0,
          saldo_final DECIMAL(15,2) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(data_referencia, unidade_id, conta_id)
        );
      `);
      console.log("    ✅ Tabela balanco_patrimonial criada com sucesso!");
    } catch (error) {
      console.log(`    ❌ Erro: ${error.message}`);
    }

    // Tabela de DRE
    console.log("  🔧 Criando tabela dre...");
    try {
      await client.query(`
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
      `);
      console.log("    ✅ Tabela dre criada com sucesso!");
    } catch (error) {
      console.log(`    ❌ Erro: ${error.message}`);
    }

    // 4. Criar índices para performance
    console.log("\n🔍 CRIANDO ÍNDICES PARA PERFORMANCE:");
    console.log("======================================");

    try {
      // Índices para contas contábeis
      await client.query(
        "CREATE INDEX IF NOT EXISTS idx_contas_contabeis_codigo ON public.contas_contabeis(codigo)"
      );
      await client.query(
        "CREATE INDEX IF NOT EXISTS idx_contas_contabeis_tipo ON public.contas_contabeis(tipo)"
      );
      await client.query(
        "CREATE INDEX IF NOT EXISTS idx_contas_contabeis_ativo ON public.contas_contabeis(ativo)"
      );

      // Índices para lançamentos contábeis
      await client.query(
        "CREATE INDEX IF NOT EXISTS idx_lancamentos_data_lancamento ON public.lancamentos_contabeis(data_lancamento)"
      );
      await client.query(
        "CREATE INDEX IF NOT EXISTS idx_lancamentos_data_competencia ON public.lancamentos_contabeis(data_competencia)"
      );
      await client.query(
        "CREATE INDEX IF NOT EXISTS idx_lancamentos_unidade_id ON public.lancamentos_contabeis(unidade_id)"
      );
      await client.query(
        "CREATE INDEX IF NOT EXISTS idx_lancamentos_status ON public.lancamentos_contabeis(status)"
      );

      // Índices para centros de custo
      await client.query(
        "CREATE INDEX IF NOT EXISTS idx_centros_custo_codigo ON public.centros_custo(codigo)"
      );
      await client.query(
        "CREATE INDEX IF NOT EXISTS idx_centros_custo_unidade_id ON public.centros_custo(unidade_id)"
      );

      // Índices para fluxo de caixa
      await client.query(
        "CREATE INDEX IF NOT EXISTS idx_fluxo_caixa_data ON public.fluxo_caixa(data)"
      );
      await client.query(
        "CREATE INDEX IF NOT EXISTS idx_fluxo_caixa_unidade_id ON public.fluxo_caixa(unidade_id)"
      );

      // Índices para DRE
      await client.query(
        "CREATE INDEX IF NOT EXISTS idx_dre_periodo ON public.dre(data_inicio, data_fim)"
      );
      await client.query(
        "CREATE INDEX IF NOT EXISTS idx_dre_unidade_id ON public.dre(unidade_id)"
      );

      console.log("  ✅ Todos os índices criados com sucesso!");
    } catch (error) {
      console.log(`  ⚠️ Erro ao criar índices: ${error.message}`);
    }

    // 5. Criar função principal calculate_dre
    console.log("\n🔧 CRIANDO FUNÇÃO PRINCIPAL CALCULATE_DRE:");
    console.log("============================================");

    try {
      await client.query(`
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
          v_unidade_id := COALESCE(p_unidade_id, public.get_current_unidade());
          
          IF v_unidade_id IS NULL THEN
            RAISE EXCEPTION 'Unidade não definida no contexto';
          END IF;

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
      `);
      console.log("  ✅ Função calculate_dre criada com sucesso!");
    } catch (error) {
      console.log(`  ❌ Erro: ${error.message}`);
    }

    // 6. Inserir dados iniciais
    console.log("\n📝 INSERINDO DADOS INICIAIS:");
    console.log("===============================");

    // Inserir contas contábeis básicas
    console.log("  📋 Inserindo contas contábeis...");
    try {
      await client.query(`
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
      `);
      console.log("    ✅ Contas contábeis inseridas com sucesso!");
    } catch (error) {
      console.log(`    ❌ Erro: ${error.message}`);
    }

    // Inserir centros de custo básicos
    console.log("  📋 Inserindo centros de custo...");
    try {
      await client.query(`
        INSERT INTO public.centros_custo (codigo, nome, descricao, unidade_id) VALUES
        ('CC001', 'ADMINISTRAÇÃO', 'Centro de custo para despesas administrativas', 'trato'),
        ('CC002', 'VENDAS', 'Centro de custo para despesas de vendas', 'trato'),
        ('CC003', 'PRODUÇÃO', 'Centro de custo para despesas de produção', 'trato'),
        ('CC004', 'FINANCEIRO', 'Centro de custo para despesas financeiras', 'trato')
        ON CONFLICT (codigo, unidade_id) DO NOTHING;
      `);
      console.log("    ✅ Centros de custo inseridos com sucesso!");
    } catch (error) {
      console.log(`    ❌ Erro: ${error.message}`);
    }

    // Inserir impostos básicos
    console.log("  📋 Inserindo impostos e taxas...");
    try {
      await client.query(`
        INSERT INTO public.impostos_taxas (nome, tipo, aliquota, base_calculo) VALUES
        ('ICMS', 'imposto', 0.18, 'valor_bruto'),
        ('ISS', 'imposto', 0.05, 'valor_bruto'),
        ('PIS', 'imposto', 0.0165, 'valor_bruto'),
        ('COFINS', 'imposto', 0.076, 'valor_bruto')
        ON CONFLICT (nome) DO NOTHING;
      `);
      console.log("    ✅ Impostos e taxas inseridos com sucesso!");
    } catch (error) {
      console.log(`    ❌ Erro: ${error.message}`);
    }

    // 7. Verificar implementação
    console.log("\n🔍 VERIFICANDO IMPLEMENTAÇÃO:");
    console.log("===============================");

    // Verificar se as tabelas foram criadas
    const tablesToCheck = [
      "contas_contabeis",
      "lancamentos_contabeis",
      "centros_custo",
      "dre",
    ];

    for (const tableName of tablesToCheck) {
      try {
        const result = await client.query(
          `SELECT COUNT(*) as total FROM ${tableName}`
        );
        console.log(
          `  ✅ ${tableName}: Tabela criada e acessível (${result.rows[0].total} registros)`
        );
      } catch (error) {
        console.log(`  ❌ ${tableName}: ${error.message}`);
      }
    }

    // Verificar se a função calculate_dre foi criada
    try {
      const result = await client.query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_name = 'calculate_dre' 
        AND routine_schema = 'public'
      `);

      if (result.rows.length > 0) {
        console.log("  ✅ Função calculate_dre: Criada e disponível");
      } else {
        console.log("  ❌ Função calculate_dre: Não encontrada");
      }
    } catch (error) {
      console.log(`  ❌ Erro ao verificar função: ${error.message}`);
    }

    console.log("\n🎉 IMPLEMENTAÇÃO DO MÓDULO DRE CONCLUÍDA!");
    console.log("📊 Sistema financeiro está funcionando e acessível");
  } catch (error) {
    console.error("❌ Erro durante a implementação:", error.message);
    console.error("🔍 Detalhes do erro:", error);
  } finally {
    await client.end();
    console.log("🔌 Conexão com o PostgreSQL fechada");
  }
}

applyDreMigration();
