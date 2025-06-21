const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log("🚀 Iniciando migração...");

    // Ler o arquivo de migração
    const migrationPath = path.join(
      __dirname,
      "../supabase/migrations/20241201000004_profissionais_and_queue.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("📄 Executando migração...");

    // Executar a migração
    const { error } = await supabase.rpc("exec_sql", { sql: migrationSQL });

    if (error) {
      console.error("❌ Erro ao executar migração:", error);
      process.exit(1);
    }

    console.log("✅ Migração executada com sucesso!");
    console.log("📋 Tabelas criadas:");
    console.log("   - profissionais");
    console.log("   - barber_queue");
    console.log("   - Índices e triggers");
    console.log("   - Políticas RLS");
  } catch (error) {
    console.error("❌ Erro inesperado:", error);
    process.exit(1);
  }
}

runMigration();
