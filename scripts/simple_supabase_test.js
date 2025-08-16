import { createClient } from "@supabase/supabase-js";

// Configuração do Supabase
const supabaseUrl = "https://zbgzwvuegwpbkranaddg.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZ3p3dnVlZ3dwYmtyYW5hZGRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMjQ3MDMsImV4cCI6MjA2NTYwMDcwM30.MmLLNXUMc3LdV9loAphWlldZuIvbD9Uphdrz47a1l4LM";

async function testSupabase() {
  console.log("🚀 TESTANDO SUPABASE");
  console.log("====================\n");

  try {
    console.log("🔑 Configuração:");
    console.log(`📡 URL: ${supabaseUrl}`);
    console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`);

    // Criar cliente
    console.log("\n🔌 Criando cliente...");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Teste básico
    console.log("\n📋 Testando conexão...");
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .limit(1);

    if (error) {
      console.log("❌ Erro:", error.message);
    } else {
      console.log("✅ Conexão bem-sucedida!");
      console.log(`📊 Dados encontrados: ${data?.length || 0} registros`);
    }

    // Listar tabelas disponíveis
    console.log("\n📋 Testando listagem de tabelas...");
    try {
      const { data: tables, error: tablesError } = await supabase
        .from("profiles")
        .select("*")
        .limit(0);

      if (tablesError) {
        console.log("❌ Erro ao listar tabelas:", tablesError.message);
      } else {
        console.log("✅ Tabela profiles acessível");
      }
    } catch (e) {
      console.log("❌ Erro ao acessar tabela:", e.message);
    }

    console.log("\n🎉 Teste concluído!");
  } catch (error) {
    console.error("❌ Erro geral:", error.message);
  }
}

testSupabase();
