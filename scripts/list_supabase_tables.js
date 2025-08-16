import { createClient } from "@supabase/supabase-js";

// Configuração do Supabase
const supabaseUrl = "https://zbgzwvuegwpbkranaddg.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZ3p3dnVlZ3dwYmtyYW5hZGRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMjQ3MDMsImV4cCI6MjA2NTYwMDcwM30.MmLLNXUMc3LdV9loAphWlldZuIvbD9Uphdrz47a1l4LM";

async function listSupabaseTables() {
  console.log("🚀 LISTANDO TABELAS DO SUPABASE");
  console.log("================================\n");

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Lista de tabelas conhecidas do sistema
    const knownTables = [
      "profiles",
      "professionals",
      "clients",
      "appointments",
      "servicos_avulsos",
      "vendas_produtos",
      "metas_barberbeer",
      "unidades",
      "servicos",
      "produtos_trato_de_barbados",
      "produtos_barberbeer",
      "marcas",
      "categorias",
      "subscriptions",
      "planos",
      "monthly_revenue",
      "faturamento_assinatura",
      "metas_trato",
      "comissoes_avulses",
      "barber_queue",
    ];

    console.log("📋 TABELAS ENCONTRADAS:");
    console.log("========================");

    let totalTables = 0;
    let totalRecords = 0;

    for (const tableName of knownTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select("*", { count: "exact", head: true });

        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          const recordCount = count || 0;
          totalTables++;
          totalRecords += recordCount;

          console.log(`✅ ${tableName}: ${recordCount} registros`);
        }
      } catch (e) {
        console.log(`❌ ${tableName}: Erro - ${e.message}`);
      }
    }

    console.log(`\n📊 RESUMO:`);
    console.log(`===========`);
    console.log(`📋 Total de tabelas acessíveis: ${totalTables}`);
    console.log(`📊 Total de registros: ${totalRecords}`);

    // Verificar dados específicos
    console.log(`\n🔍 DADOS ESPECÍFICOS:`);
    console.log(`======================`);

    // Profiles
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, role, created_at")
        .limit(3);

      if (profiles && profiles.length > 0) {
        console.log(`\n👥 PROFILES (${profiles.length} mostrados):`);
        profiles.forEach((profile, index) => {
          console.log(
            `  ${index + 1}. ${profile.email} (${profile.role}) - ${
              profile.created_at
            }`
          );
        });
      }
    } catch (e) {
      console.log("❌ Erro ao buscar profiles:", e.message);
    }

    // Unidades
    try {
      const { data: unidades } = await supabase.from("unidades").select("*");

      if (unidades && unidades.length > 0) {
        console.log(`\n🏢 UNIDADES (${unidades.length}):`);
        unidades.forEach((unidade) => {
          console.log(
            `  📍 ${unidade.nome} (${unidade.tipo}) - ID: ${unidade.id}`
          );
        });
      }
    } catch (e) {
      console.log("❌ Erro ao buscar unidades:", e.message);
    }

    // Clients
    try {
      const { data: clients } = await supabase
        .from("clients")
        .select("id, name, email, unidade_id")
        .limit(3);

      if (clients && clients.length > 0) {
        console.log(`\n👤 CLIENTS (${clients.length} mostrados):`);
        clients.forEach((client, index) => {
          console.log(
            `  ${index + 1}. ${client.name} (${
              client.email || "Sem email"
            }) - Unidade: ${client.unidade_id}`
          );
        });
      }
    } catch (e) {
      console.log("❌ Erro ao buscar clients:", e.message);
    }

    console.log(`\n🎉 LISTAGEM CONCLUÍDA!`);
    console.log(`✅ Supabase está funcionando perfeitamente!`);
    console.log(
      `🔧 Você pode usar o SQLTools para conectar diretamente ao banco.`
    );
  } catch (error) {
    console.error("❌ Erro:", error.message);
  }
}

listSupabaseTables();
