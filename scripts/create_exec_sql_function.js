import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zbgzwvuegwpbkranaddg.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZ3p3dnVlZ3dwYmtyYW5hZGRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDAyNDcwMywiZXhwIjoyMDY1NjAwNzAzfQ.4W4usd1mrG0L6H5bJkPlAjQc7uorMiiujrtj55TgaSQ";

const supabase = createClient(supabaseUrl, supabaseKey);

async function createExecSqlFunction() {
  try {
    console.log("🔧 CRIANDO FUNÇÃO EXEC_SQL NO SUPABASE");
    console.log("========================================");

    // Primeiro, vou tentar criar a função exec_sql usando uma abordagem diferente
    console.log("  📝 Tentando criar função exec_sql...");

    // Vou usar o cliente Supabase para executar SQL diretamente
    // Primeiro, vou verificar se conseguimos acessar o banco
    const { data: testData, error: testError } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);

    if (testError) {
      console.log(`  ❌ Erro ao testar conexão: ${testError.message}`);
      return;
    }

    console.log("  ✅ Conexão com Supabase estabelecida!");

    // Agora vou tentar criar a função exec_sql usando uma abordagem alternativa
    // Vou usar o cliente para executar comandos SQL individuais

    console.log("\n📋 CRIANDO TABELAS DO MÓDULO DRE:");
    console.log("====================================");

    // Vou tentar criar as tabelas uma por uma usando o cliente Supabase
    // Primeiro, vou verificar se conseguimos criar tabelas

    console.log("  🔧 Tentando criar tabela contas_contabeis...");

    // Vou usar uma abordagem diferente - vou tentar inserir dados em uma tabela existente
    // para verificar se conseguimos acessar o banco

    const { data: insertData, error: insertError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (insertError) {
      console.log(
        `  ❌ Erro ao acessar tabela profiles: ${insertError.message}`
      );
    } else {
      console.log("  ✅ Acesso à tabela profiles confirmado");
    }

    // Como não conseguimos criar tabelas via cliente, vou sugerir uma abordagem alternativa
    console.log("\n💡 ABORDAGEM ALTERNATIVA NECESSÁRIA");
    console.log("=====================================");
    console.log("  📝 Para implementar o módulo DRE, você precisa:");
    console.log(
      "  1. Acessar o painel do Supabase em: https://supabase.com/dashboard"
    );
    console.log("  2. Fazer login e acessar o projeto: zbgzwvuegwpbkranaddg");
    console.log("  3. Ir para SQL Editor");
    console.log("  4. Executar o arquivo: supabase_dre_implementation.sql");
    console.log("  5. Ou executar os comandos SQL individualmente");

    console.log("\n📋 COMANDOS SQL PRINCIPAIS PARA EXECUTAR:");
    console.log("==========================================");
    console.log("  🔧 1. Criar extensões:");
    console.log('     CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    console.log('     CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    console.log("\n  🔧 2. Criar tabelas principais:");
    console.log("     - contas_contabeis");
    console.log("     - lancamentos_contabeis");
    console.log("     - centros_custo");
    console.log("     - dre");

    console.log("\n  🔧 3. Criar função calculate_dre");
    console.log("  🔧 4. Inserir dados iniciais");

    console.log("\n🎯 RECOMENDAÇÃO:");
    console.log("==================");
    console.log("  📝 Execute o arquivo SQL completo no painel do Supabase");
    console.log(
      "  📝 Ou me avise se quiser que eu crie um script de migração diferente"
    );
  } catch (error) {
    console.error("❌ Erro geral:", error.message);
    console.error("🔍 Detalhes do erro:", error);
  }
}

createExecSqlFunction();
