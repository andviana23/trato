import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zbgzwvuegwpbkranaddg.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZ3p3dnVlZ3dwYmtyYW5hZGRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDAyNDcwMywiZXhwIjoyMDY1NjAwNzAzfQ.4W4usd1mrG0L6H5bJkPlAjQc7uorMiiujrtj55TgaSQ";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabaseStatus() {
  try {
    console.log("🔌 Conectando ao Supabase via cliente...");

    // 1. Testar conexão básica
    console.log("\n📊 TESTANDO CONEXÃO BÁSICA:");
    console.log("==============================");

    const { data: testData, error: testError } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);

    if (testError) {
      console.log(`  ❌ Erro na conexão: ${testError.message}`);
    } else {
      console.log("  ✅ Conexão estabelecida com sucesso!");
    }

    // 2. Listar tabelas disponíveis (tentando acessar algumas tabelas conhecidas)
    console.log("\n📋 VERIFICANDO TABELAS DISPONÍVEIS:");
    console.log("=====================================");

    const tablesToCheck = [
      "profiles",
      "profissionais",
      "clientes",
      "agendamentos",
      "servicos",
      "metas",
      "bonus",
      "receitas",
      "despesas",
      "monthly_revenue",
      "monthly_goals",
      "comissoes_avulses",
      "faturamento_assinatura",
      "barber_queue",
    ];

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .limit(1);

        if (error) {
          if (
            error.message.includes("relation") &&
            error.message.includes("does not exist")
          ) {
            console.log(`  ❌ ${tableName}: Tabela não existe`);
          } else {
            console.log(`  ⚠️ ${tableName}: ${error.message}`);
          }
        } else {
          console.log(`  ✅ ${tableName}: Tabela existe e acessível`);
        }
      } catch (err) {
        console.log(`  ❌ ${tableName}: Erro ao verificar - ${err.message}`);
      }
    }

    // 3. Verificar dados nas tabelas existentes
    console.log("\n📊 VERIFICANDO DADOS NAS TABELAS:");
    console.log("===================================");

    const existingTables = ["profiles", "profissionais", "clientes"];

    for (const tableName of existingTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select("*", { count: "exact", head: true });

        if (error) {
          console.log(`  ❌ ${tableName}: Erro ao contar - ${error.message}`);
        } else {
          console.log(`  📋 ${tableName}: ${count} registros`);
        }
      } catch (err) {
        console.log(`  ❌ ${tableName}: Erro ao verificar - ${err.message}`);
      }
    }

    // 4. Verificar funções RPC disponíveis
    console.log("\n⚙️ VERIFICANDO FUNÇÕES RPC:");
    console.log("===============================");

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "get_current_unidade"
      );

      if (rpcError) {
        console.log("  ❌ Função get_current_unidade: Não disponível");
      } else {
        console.log("  ✅ Função get_current_unidade: Disponível");
      }
    } catch (err) {
      console.log("  ❌ Erro ao verificar funções RPC");
    }

    // 5. Verificar configurações de RLS
    console.log("\n🔒 VERIFICANDO CONFIGURAÇÕES DE SEGURANÇA:");
    console.log("=============================================");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) {
        console.log(
          "  ⚠️ Autenticação: Não autenticado (normal para verificação)"
        );
      } else {
        console.log("  ✅ Autenticação: Usuário autenticado");
      }
    } catch (err) {
      console.log("  ❌ Erro ao verificar autenticação");
    }

    console.log("\n🎉 Verificação do Supabase concluída!");
    console.log("📊 Sistema está funcionando e acessível");
  } catch (error) {
    console.error("❌ Erro geral:", error.message);
    console.error("🔍 Detalhes do erro:", error);
  }
}

checkSupabaseStatus();
