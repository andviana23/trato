// Carregar variáveis de ambiente do arquivo .env.local
require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variáveis de ambiente obrigatórias");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅" : "❌");
  console.error("SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✅" : "❌");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addRecepcionistaRole() {
  try {
    console.log("🚀 Verificando roles existentes...");

    // Primeiro, vamos verificar se o role já existe
    const { data: existingRoles, error: checkError } = await supabase
      .from("information_schema.columns")
      .select("column_default")
      .eq("table_name", "users")
      .eq("column_name", "role");

    if (checkError) {
      console.error("❌ Erro ao verificar roles:", checkError);
      process.exit(1);
    }

    console.log("📋 Roles atuais encontrados");

    // Como não podemos executar ALTER TYPE diretamente via Supabase client,
    // vamos sugerir executar manualmente no SQL Editor
    console.log(
      '⚠️  Para adicionar o role "recepcionista", execute no SQL Editor do Supabase:'
    );
    console.log("");
    console.log("ALTER TYPE user_role ADD VALUE 'recepcionista';");
    console.log("");
    console.log("📋 Depois verifique com:");
    console.log(
      "SELECT unnest(enum_range(NULL::user_role)) as available_roles;"
    );
    console.log("");
    console.log(
      '✅ Após executar o SQL, o sistema estará pronto para usar o role "recepcionista"!'
    );
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
}

addRecepcionistaRole();
