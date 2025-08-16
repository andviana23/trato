import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Carregar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, "../.env.local") });

async function findRealTables() {
  console.log("🔍 DESCOBRINDO TABELAS REAIS DO SUPABASE");
  console.log("=========================================\n");

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente não configuradas");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🔌 Conectado ao Supabase!");
    console.log(`📡 URL: ${supabaseUrl}`);

    // Teste 1: Verificar tabelas que sabemos que existem
    console.log("\n📋 TESTE 1: Tabelas conhecidas");
    console.log("===============================");

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

    for (const tableName of knownTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select("*", { count: "exact", head: true });

        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: ${count || 0} registros`);
        }
      } catch (e) {
        console.log(`❌ ${tableName}: Erro - ${e.message}`);
      }
    }

    // Teste 2: Tentar acessar via SQL direto
    console.log("\n📋 TESTE 2: Acesso via SQL");
    console.log("============================");

    try {
      // Tentar diferentes queries para listar tabelas
      const queries = [
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
        "SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
      ];

      for (let i = 0; i < queries.length; i++) {
        try {
          console.log(
            `\n🔄 Tentativa ${i + 1}: ${queries[i].substring(0, 50)}...`
          );

          const { data, error } = await supabase.rpc("exec_sql", {
            sql: queries[i],
          });

          if (error) {
            console.log(`  ❌ Erro: ${error.message}`);
          } else if (data && data.length > 0) {
            console.log(`  ✅ Sucesso! ${data.length} tabelas encontradas:`);
            data.forEach((table, index) => {
              const tableName = table.table_name || table.tablename;
              console.log(`    ${index + 1}. ${tableName}`);
            });
            break;
          } else {
            console.log(`  ⚠️ Sem dados retornados`);
          }
        } catch (e) {
          console.log(`  ❌ Exceção: ${e.message}`);
        }
      }
    } catch (e) {
      console.log("❌ Erro geral ao tentar SQL:", e.message);
    }

    // Teste 3: Verificar se há funções customizadas
    console.log("\n📋 TESTE 3: Funções customizadas");
    console.log("================================");

    try {
      const { data: functions, error: funcError } = await supabase.rpc(
        "exec_sql",
        {
          sql: "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public'",
        }
      );

      if (funcError) {
        console.log("❌ Erro ao verificar funções:", funcError.message);
      } else if (functions && functions.length > 0) {
        console.log(`✅ ${functions.length} funções encontradas:`);
        functions.slice(0, 10).forEach((func, index) => {
          console.log(`  ${index + 1}. ${func.routine_name}`);
        });
        if (functions.length > 10) {
          console.log(`  ... e mais ${functions.length - 10} funções`);
        }
      } else {
        console.log("⚠️ Nenhuma função customizada encontrada");
      }
    } catch (e) {
      console.log("❌ Erro ao verificar funções:", e.message);
    }

    // Teste 4: Verificar se conseguimos acessar dados específicos
    console.log("\n📋 TESTE 4: Dados específicos");
    console.log("==============================");

    try {
      const { data: profiles, error: profError } = await supabase
        .from("profiles")
        .select("id, email, role, created_at")
        .limit(3);

      if (profError) {
        console.log("❌ Erro ao buscar profiles:", profError.message);
      } else if (profiles && profiles.length > 0) {
        console.log(`✅ Profiles encontrados: ${profiles.length}`);
        profiles.forEach((profile, index) => {
          console.log(`  ${index + 1}. ${profile.email} (${profile.role})`);
        });
      }
    } catch (e) {
      console.log("❌ Erro ao buscar profiles:", e.message);
    }

    // Teste 5: Verificar se conseguimos acessar outras tabelas
    console.log("\n📋 TESTE 5: Outras tabelas");
    console.log("============================");

    const testTables = ["unidades", "clients", "professionals"];
    for (const tableName of testTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .limit(1);

        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: ${data?.length || 0} registros`);
          if (data && data.length > 0) {
            const record = data[0];
            const keys = Object.keys(record).slice(0, 3);
            console.log(`    Colunas: ${keys.join(", ")}...`);
          }
        }
      } catch (e) {
        console.log(`❌ ${tableName}: Erro - ${e.message}`);
      }
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
    console.log("2. Verifique se há RLS (Row Level Security) ativo");
    console.log("3. Confirme as permissões do usuário anon");
    console.log("4. Verifique se as tabelas têm nomes diferentes");

    console.log("\n🎉 DESCOBERTA CONCLUÍDA!");
  } catch (error) {
    console.error("❌ Erro:", error.message);
  }
}

findRealTables();
