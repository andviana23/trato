const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variáveis de ambiente não configuradas");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅" : "❌");
  console.error("SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✅" : "❌");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verificarTabelasClientes() {
  console.log("🔍 Verificando tabelas relacionadas a clientes...\n");

  try {
    // 1. Buscar todas as tabelas que contém "client" no nome
    console.log("📋 Tabelas que contém 'client' ou 'cliente':");
    const { data: tabelas, error: tabelasError } = await supabase
      .from("information_schema.tables")
      .select("table_name, table_type")
      .eq("table_schema", "public")
      .or("table_name.ilike.%client%,table_name.ilike.%cliente%");

    if (tabelasError) {
      console.error("❌ Erro ao buscar tabelas:", tabelasError);
    } else {
      if (tabelas && tabelas.length > 0) {
        tabelas.forEach((tabela) => {
          console.log(`  ✅ ${tabela.table_name} (${tabela.table_type})`);
        });
      } else {
        console.log("  ❌ Nenhuma tabela encontrada com 'client' ou 'cliente'");
      }
    }

    console.log("\n" + "=".repeat(60) + "\n");

    // 2. Verificar estrutura da tabela 'clientes' se existir
    console.log("🔍 Verificando estrutura da tabela 'clientes':");
    const { data: colunasClientes, error: colunasError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable, column_default")
      .eq("table_schema", "public")
      .eq("table_name", "clientes")
      .order("ordinal_position");

    if (colunasError) {
      console.error("❌ Erro ao verificar colunas:", colunasError);
    } else {
      if (colunasClientes && colunasClientes.length > 0) {
        console.log("✅ Tabela 'clientes' existe:");
        colunasClientes.forEach((coluna) => {
          console.log(
            `  - ${coluna.column_name}: ${coluna.data_type} ${
              coluna.is_nullable === "NO" ? "(NOT NULL)" : ""
            } ${
              coluna.column_default ? `DEFAULT ${coluna.column_default}` : ""
            }`
          );
        });

        // Verificar dados na tabela clientes
        console.log("\n📊 Dados na tabela 'clientes':");
        const { data: dadosClientes, error: dadosError } = await supabase
          .from("clientes")
          .select("*")
          .limit(10);

        if (dadosError) {
          console.error("❌ Erro ao buscar dados:", dadosError);
        } else {
          console.log(
            `✅ Total de registros encontrados: ${dadosClientes.length}`
          );
          dadosClientes.forEach((cliente, index) => {
            console.log(
              `  ${index + 1}. ${cliente.nome || "Sem nome"} (${
                cliente.unidade || "Sem unidade"
              }) - ${cliente.telefone || "Sem telefone"}`
            );
          });
        }
      } else {
        console.log("❌ Tabela 'clientes' não existe");
      }
    }

    console.log("\n" + "=".repeat(60) + "\n");

    // 3. Verificar se existe tabela 'clients' (inglês)
    console.log("🔍 Verificando estrutura da tabela 'clients':");
    const { data: colunasClients, error: colunasClientsError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable, column_default")
      .eq("table_schema", "public")
      .eq("table_name", "clients")
      .order("ordinal_position");

    if (colunasClientsError) {
      console.error("❌ Erro ao verificar colunas:", colunasClientsError);
    } else {
      if (colunasClients && colunasClients.length > 0) {
        console.log("✅ Tabela 'clients' existe:");
        colunasClients.forEach((coluna) => {
          console.log(
            `  - ${coluna.column_name}: ${coluna.data_type} ${
              coluna.is_nullable === "NO" ? "(NOT NULL)" : ""
            } ${
              coluna.column_default ? `DEFAULT ${coluna.column_default}` : ""
            }`
          );
        });

        // Verificar dados na tabela clients
        console.log("\n📊 Dados na tabela 'clients':");
        const { data: dadosClients, error: dadosClientsError } = await supabase
          .from("clients")
          .select("*")
          .limit(10);

        if (dadosClientsError) {
          console.error("❌ Erro ao buscar dados:", dadosClientsError);
        } else {
          console.log(
            `✅ Total de registros encontrados: ${dadosClients.length}`
          );
          dadosClients.forEach((client, index) => {
            console.log(
              `  ${index + 1}. ${client.name || client.nome || "Sem nome"} - ${
                client.phone || client.telefone || "Sem telefone"
              }`
            );
          });
        }
      } else {
        console.log("❌ Tabela 'clients' não existe");
      }
    }

    console.log("\n" + "=".repeat(60) + "\n");

    // 4. Verificar views relacionadas a clientes
    console.log("🔍 Verificando views relacionadas a clientes:");
    const { data: views, error: viewsError } = await supabase
      .from("information_schema.views")
      .select("table_name")
      .eq("table_schema", "public")
      .or("table_name.ilike.%client%,table_name.ilike.%cliente%");

    if (viewsError) {
      console.error("❌ Erro ao buscar views:", viewsError);
    } else {
      if (views && views.length > 0) {
        console.log("✅ Views relacionadas a clientes:");
        views.forEach((view) => {
          console.log(`  - ${view.table_name}`);
        });
      } else {
        console.log("❌ Nenhuma view relacionada a clientes encontrada");
      }
    }

    console.log("\n" + "=".repeat(60) + "\n");

    // 5. Tentar identificar onde os clientes estão sendo inseridos
    console.log(
      "🔍 Verificando em qual tabela os clientes são inseridos atualmente:"
    );

    // Verificar na tabela auth.users se há registros com metadata de clientes
    const { data: authUsers, error: authError } = await supabase
      .from("auth.users")
      .select("id, email, raw_user_meta_data")
      .limit(5);

    if (!authError && authUsers && authUsers.length > 0) {
      console.log("✅ Usuários em auth.users:");
      authUsers.forEach((user, index) => {
        const metadata = user.raw_user_meta_data || {};
        console.log(
          `  ${index + 1}. ${user.email} - Metadata: ${JSON.stringify(
            metadata
          )}`
        );
      });
    }

    console.log("\n🎉 Verificação concluída!");
    console.log("\n📝 Recomendações:");
    console.log(
      "1. Se a tabela 'clientes' não existir, execute o script de criação"
    );
    console.log("2. Se existir mas estiver vazia, importe os dados existentes");
    console.log(
      "3. Verifique se o campo 'unidade' está preenchido corretamente"
    );
  } catch (error) {
    console.error("❌ Erro durante a verificação:", error);
  }
}

// Executar a verificação
verificarTabelasClientes();









