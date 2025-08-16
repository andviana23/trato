import { createClient } from "@supabase/supabase-js";

// Configuração do Supabase
const supabaseUrl = "https://zbgzwvuegwpbkranaddg.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZ3p3dnVlZ3dwYmtyYW5hZGRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMjQ3MDMsImV4cCI6MjA2NTYwMDcwM30.MmLLNXUMc3LdV9loAphWlldZuIvbD9Uphdrz47a1l4LM";

async function discoverSupabaseStructure() {
  console.log("🔍 DESCOBRINDO ESTRUTURA REAL DO SUPABASE");
  console.log("==========================================\n");

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🔌 Testando conexão básica...");

    // Teste 1: Verificar se conseguimos acessar o banco
    try {
      const { data: testData, error: testError } = await supabase
        .from("profiles")
        .select("*")
        .limit(1);

      if (testError) {
        console.log("❌ Erro ao acessar profiles:", testError.message);
      } else {
        console.log(
          "✅ Profiles acessível:",
          testData?.length || 0,
          "registros"
        );
      }
    } catch (e) {
      console.log("❌ Erro geral ao acessar profiles:", e.message);
    }

    // Teste 2: Tentar acessar via SQL direto
    console.log("\n🔍 Tentando acessar via SQL...");
    try {
      const { data: sqlData, error: sqlError } = await supabase.rpc(
        "exec_sql",
        { sql: "SELECT current_database(), current_user" }
      );

      if (sqlError) {
        console.log("❌ Erro ao executar SQL:", sqlError.message);
      } else {
        console.log("✅ SQL executado:", sqlData);
      }
    } catch (e) {
      console.log("❌ Erro ao executar SQL:", e.message);
    }

    // Teste 3: Verificar se há tabelas com nomes diferentes
    console.log("\n🔍 Verificando tabelas com nomes alternativos...");
    const alternativeNames = [
      "user",
      "users",
      "auth_user",
      "auth_users",
      "barber",
      "barbers",
      "employee",
      "employees",
      "customer",
      "customers",
      "client",
      "clients",
      "booking",
      "bookings",
      "schedule",
      "schedules",
      "service",
      "services",
      "product",
      "products",
      "sale",
      "sales",
      "transaction",
      "transactions",
      "goal",
      "goals",
      "target",
      "targets",
      "commission",
      "commissions",
      "payment",
      "payments",
      "branch",
      "branches",
      "location",
      "locations",
    ];

    for (const tableName of alternativeNames) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select("*", { count: "exact", head: true });

        if (!error && count !== null) {
          console.log(`✅ ${tableName}: ${count} registros`);
        }
      } catch (e) {
        // Ignorar erros de tabelas que não existem
      }
    }

    // Teste 4: Verificar se conseguimos listar todas as tabelas
    console.log("\n🔍 Tentando listar todas as tabelas...");
    try {
      // Tentar diferentes abordagens para listar tabelas
      const approaches = [
        {
          name: "information_schema.tables",
          query:
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
        },
        {
          name: "pg_tables",
          query: "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
        },
        {
          name: "pg_catalog",
          query:
            "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'",
        },
      ];

      for (const approach of approaches) {
        try {
          const { data, error } = await supabase.rpc("exec_sql", {
            sql: approach.query,
          });

          if (!error && data) {
            console.log(
              `✅ ${approach.name}: ${data.length} tabelas encontradas`
            );
            if (data.length > 0) {
              console.log("  📋 Primeiras tabelas:");
              data.slice(0, 5).forEach((table, index) => {
                console.log(
                  `    ${index + 1}. ${table.table_name || table.tablename}`
                );
              });
            }
            break;
          }
        } catch (e) {
          console.log(`❌ ${approach.name}: ${e.message}`);
        }
      }
    } catch (e) {
      console.log("❌ Erro ao listar tabelas:", e.message);
    }

    // Teste 5: Verificar se há funções customizadas
    console.log("\n🔍 Verificando funções customizadas...");
    try {
      const { data: functions, error: funcError } = await supabase.rpc(
        "exec_sql",
        {
          sql: "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public'",
        }
      );

      if (!funcError && functions) {
        console.log(`✅ Funções encontradas: ${functions.length}`);
        if (functions.length > 0) {
          console.log("  🔧 Primeiras funções:");
          functions.slice(0, 5).forEach((func, index) => {
            console.log(`    ${index + 1}. ${func.routine_name}`);
          });
        }
      }
    } catch (e) {
      console.log("❌ Erro ao verificar funções:", e.message);
    }

    console.log("\n🎯 CONFIGURAÇÃO PARA SQLTOOLS:");
    console.log("===============================");
    console.log("Para conectar via SQLTools, use:");
    console.log(`📡 Host: zbgzwvuegwpbkranaddg.supabase.co`);
    console.log("🗄️ Database: postgres");
    console.log("👤 Username: postgres");
    console.log("🔑 Password: [Sua senha do banco Supabase]");
    console.log("🔌 Port: 5432");
    console.log("🔒 SSL: Require");

    console.log("\n💡 RECOMENDAÇÕES:");
    console.log("==================");
    console.log("1. Use o SQLTools para conectar diretamente ao banco");
    console.log("2. Verifique se as tabelas existem com nomes diferentes");
    console.log("3. Confirme as permissões do usuário anon");
    console.log("4. Verifique se há RLS (Row Level Security) ativo");

    console.log("\n🎉 DESCOBERTA CONCLUÍDA!");
  } catch (error) {
    console.error("❌ Erro:", error.message);
  }
}

discoverSupabaseStructure();
