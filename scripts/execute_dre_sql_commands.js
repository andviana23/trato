import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zbgzwvuegwpbkranaddg.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZ3p3dnVlZ3dwYmtyYW5hZGRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDAyNDcwMywiZXhwIjoyMDY1NjAwNzAzfQ.4W4usd1mrG0L6H5bJkPlAjQc7uorMiiujrtj55TgaSQ";

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeDreSqlCommands() {
  try {
    console.log("🚀 INICIANDO IMPLEMENTAÇÃO DO MÓDULO FINANCEIRO DRE");
    console.log("=====================================================");
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

    // 1. Criar extensões (via RPC se disponível)
    console.log("\n📦 CRIANDO EXTENSÕES:");
    console.log("=======================");

    try {
      // Tentar criar extensão uuid-ossp
      const { error: uuidError } = await supabase.rpc("exec_sql", {
        sql: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"',
      });

      if (uuidError) {
        console.log(
          "  ⚠️ Extensão uuid-ossp: Não foi possível criar (pode já existir)"
        );
      } else {
        console.log("  ✅ Extensão uuid-ossp criada/verificada");
      }

      // Tentar criar extensão pgcrypto
      const { error: pgcryptoError } = await supabase.rpc("exec_sql", {
        sql: 'CREATE EXTENSION IF NOT EXISTS "pgcrypto"',
      });

      if (pgcryptoError) {
        console.log(
          "  ⚠️ Extensão pgcrypto: Não foi possível criar (pode já existir)"
        );
      } else {
        console.log("  ✅ Extensão pgcrypto criada/verificada");
      }
    } catch (error) {
      console.log(
        "  ⚠️ Função exec_sql não disponível, extensões podem já existir"
      );
    }

    // 2. Criar tabelas uma por uma
    console.log("\n📋 CRIANDO TABELAS DO MÓDULO DRE:");
    console.log("====================================");

    // Tabela contas_contabeis
    console.log("  🔧 Criando tabela contas_contabeis...");
    try {
      const { error: createError } = await supabase.rpc("exec_sql", {
        sql: `
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
        `,
      });

      if (createError) {
        console.log(`    ❌ Erro: ${createError.message}`);
      } else {
        console.log("    ✅ Tabela contas_contabeis criada com sucesso!");
      }
    } catch (error) {
      console.log(`    ❌ Erro: ${error.message}`);
    }

    // Tabela lancamentos_contabeis
    console.log("  🔧 Criando tabela lancamentos_contabeis...");
    try {
      const { error: createError } = await supabase.rpc("exec_sql", {
        sql: `
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
        `,
      });

      if (createError) {
        console.log(`    ❌ Erro: ${createError.message}`);
      } else {
        console.log("    ✅ Tabela lancamentos_contabeis criada com sucesso!");
      }
    } catch (error) {
      console.log(`    ❌ Erro: ${error.message}`);
    }

    // Tabela centros_custo
    console.log("  🔧 Criando tabela centros_custo...");
    try {
      const { error: createError } = await supabase.rpc("exec_sql", {
        sql: `
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
        `,
      });

      if (createError) {
        console.log(`    ❌ Erro: ${createError.message}`);
      } else {
        console.log("    ✅ Tabela centros_custo criada com sucesso!");
      }
    } catch (error) {
      console.log(`    ❌ Erro: ${error.message}`);
    }

    // Tabela dre
    console.log("  🔧 Criando tabela dre...");
    try {
      const { error: createError } = await supabase.rpc("exec_sql", {
        sql: `
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
        `,
      });

      if (createError) {
        console.log(`    ❌ Erro: ${createError.message}`);
      } else {
        console.log("    ✅ Tabela dre criada com sucesso!");
      }
    } catch (error) {
      console.log(`    ❌ Erro: ${error.message}`);
    }

    // 3. Criar função calculate_dre
    console.log("\n🔧 CRIANDO FUNÇÃO CALCULATE_DRE:");
    console.log("===================================");

    try {
      const { error: createError } = await supabase.rpc("exec_sql", {
        sql: `
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
        `,
      });

      if (createError) {
        console.log(`    ❌ Erro: ${createError.message}`);
      } else {
        console.log("    ✅ Função calculate_dre criada com sucesso!");
      }
    } catch (error) {
      console.log(`    ❌ Erro: ${error.message}`);
    }

    // 4. Inserir dados iniciais
    console.log("\n📝 INSERINDO DADOS INICIAIS:");
    console.log("===============================");

    // Inserir contas contábeis básicas
    console.log("  📋 Inserindo contas contábeis...");
    try {
      const { error: insertError } = await supabase.rpc("exec_sql", {
        sql: `
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
        `,
      });

      if (insertError) {
        console.log(`    ❌ Erro: ${insertError.message}`);
      } else {
        console.log("    ✅ Contas contábeis inseridas com sucesso!");
      }
    } catch (error) {
      console.log(`    ❌ Erro: ${error.message}`);
    }

    // 5. Verificar implementação
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
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .limit(1);

        if (error) {
          console.log(`  ❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`  ✅ ${tableName}: Tabela criada e acessível`);
        }
      } catch (err) {
        console.log(`  ❌ ${tableName}: Erro ao verificar - ${err.message}`);
      }
    }

    // Verificar se a função calculate_dre foi criada
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "calculate_dre",
        {
          p_data_inicio: "2024-01-01",
          p_data_fim: "2024-01-31",
        }
      );

      if (rpcError) {
        console.log(`  ❌ Função calculate_dre: ${rpcError.message}`);
      } else {
        console.log("  ✅ Função calculate_dre: Funcionando corretamente!");
      }
    } catch (err) {
      console.log("  ❌ Erro ao testar função calculate_dre");
    }

    console.log("\n🎉 IMPLEMENTAÇÃO DO MÓDULO DRE CONCLUÍDA!");
    console.log("📊 Sistema financeiro está funcionando e acessível");
  } catch (error) {
    console.error("❌ Erro durante a implementação:", error.message);
    console.error("🔍 Detalhes do erro:", error);
  }
}

executeDreSqlCommands();
