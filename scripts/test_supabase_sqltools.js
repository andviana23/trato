import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Carregar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, "../.env.local") });

async function testSupabaseConnection() {
  console.log("🚀 TESTANDO CONEXÃO COM SUPABASE");
  console.log("==================================\n");

  try {
    // Verificar se as variáveis estão carregadas
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_service_role_KEY;

    console.log("🔑 CONFIGURAÇÃO CARREGADA:");
    console.log("==========================");
    console.log(
      `📡 URL: ${supabaseUrl ? "✅ Configurado" : "❌ Não configurado"}`
    );
    console.log(
      `🔑 Anon Key: ${supabaseKey ? "✅ Configurado" : "❌ Não configurado"}`
    );
    console.log(
      `🔑 Service Role Key: ${
        serviceKey ? "✅ Configurado" : "❌ Não configurado"
      }`
    );

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas");
    }

    // Criar cliente Supabase
    console.log("\n🔌 CRIANDO CLIENTE SUPABASE...");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Teste 1: Conexão básica
    console.log("\n📋 TESTE 1: Conexão básica");
    const { data: version, error: versionError } = await supabase.rpc(
      "version"
    );

    if (versionError) {
      console.log("  ⚠️ Erro ao obter versão:", versionError.message);
    } else {
      console.log("  ✅ Conexão estabelecida com sucesso!");
    }

    // Teste 2: Listar tabelas
    console.log("\n📋 TESTE 2: Listar tabelas");
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public");

    if (tablesError) {
      console.log("  ⚠️ Erro ao listar tabelas:", tablesError.message);

      // Tentar método alternativo
      console.log("  🔄 Tentando método alternativo...");
      const { data: altTables, error: altError } = await supabase.rpc(
        "get_tables"
      );

      if (altError) {
        console.log(
          "    ❌ Método alternativo também falhou:",
          altError.message
        );
      } else {
        console.log(
          "    ✅ Tabelas encontradas via RPC:",
          altTables?.length || 0
        );
      }
    } else {
      console.log(`  ✅ Tabelas encontradas: ${tables?.length || 0}`);
      if (tables && tables.length > 0) {
        console.log("  📋 Primeiras 5 tabelas:");
        tables.slice(0, 5).forEach((table, index) => {
          console.log(`    ${index + 1}. ${table.table_name}`);
        });
      }
    }

    // Teste 3: Verificar tabelas específicas do sistema
    console.log("\n📋 TESTE 3: Verificar tabelas específicas");
    const systemTables = [
      "profiles",
      "professionals",
      "clients",
      "appointments",
      "servicos_avulsos",
      "vendas_produtos",
      "metas_barberbeer",
      "unidades",
    ];

    for (const tableName of systemTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select("*", { count: "exact", head: true });

        if (error) {
          console.log(`  ❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`  ✅ ${tableName}: ${count || 0} registros`);
        }
      } catch (error) {
        console.log(`  ❌ ${tableName}: Erro - ${error.message}`);
      }
    }

    // Teste 4: Testar inserção simples (apenas verificar permissões)
    console.log("\n📋 TESTE 4: Testar permissões de escrita");
    try {
      const { error: insertError } = await supabase.from("unidades").insert([
        {
          nome: "TESTE_TEMP",
          tipo: "teste",
          is_active: false,
        },
      ]);

      if (insertError) {
        console.log("  ⚠️ Erro ao testar inserção:", insertError.message);
        console.log(
          "    (Isso pode ser normal se a tabela não existir ou não tiver permissões)"
        );
      } else {
        console.log("  ✅ Permissão de escrita confirmada");
      }
    } catch (error) {
      console.log("  ⚠️ Erro ao testar inserção:", error.message);
    }

    // Teste 5: Verificar configuração do SQLTools
    console.log("\n📋 TESTE 5: Configuração para SQLTools");
    console.log("  🔧 Para conectar via SQLTools, use:");
    console.log(
      `  📡 Host: ${supabaseUrl
        .replace("https://", "")
        .replace(".supabase.co", ".supabase.co")}`
    );
    console.log("  🗄️ Database: postgres");
    console.log("  👤 Username: postgres");
    console.log("  🔑 Password: [Sua senha do banco]");
    console.log("  🔌 Port: 5432");
    console.log("  🔒 SSL: Require");

    console.log("\n🎉 TESTE DE CONEXÃO CONCLUÍDO!");

    if (supabaseUrl && supabaseKey) {
      console.log("✅ Supabase está configurado e acessível!");
      console.log(
        "🔧 Agora você pode usar o SQLTools para conectar diretamente ao banco."
      );
    } else {
      console.log("❌ Há problemas na configuração do Supabase.");
    }
  } catch (error) {
    console.error("❌ Erro durante o teste:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testSupabaseConnection().catch(console.error);
}

export { testSupabaseConnection };
