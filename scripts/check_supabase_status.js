import { Client } from "pg";

const config = {
  connectionString:
    "postgresql://postgres.zbgzwvuegwpbkranaddg:Trato7310!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false },
};

async function checkSupabaseStatus() {
  const client = new Client(config);

  try {
    await client.connect();
    console.log("🔌 Conectado ao Supabase Database com sucesso!");

    // 1. Verificar versão do PostgreSQL
    const versionResult = await client.query("SELECT version()");
    console.log(
      `📊 Versão do PostgreSQL: ${versionResult.rows[0].version.split(" ")[0]}`
    );

    // 2. Listar todas as tabelas existentes
    console.log("\n📋 TABELAS EXISTENTES NO SUPABASE:");
    console.log("=====================================");

    const tablesResult = await client.query(`
      SELECT 
        table_name,
        table_type,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    if (tablesResult.rows.length === 0) {
      console.log("  ⚠️ Nenhuma tabela encontrada no schema public");
    } else {
      tablesResult.rows.forEach((table, index) => {
        console.log(
          `${index + 1}. 📋 ${table.table_name} (${table.table_type}) - ${
            table.column_count
          } colunas`
        );
      });
    }

    // 3. Verificar extensões instaladas
    console.log("\n🔧 EXTENSÕES INSTALADAS:");
    console.log("==========================");

    const extensionsResult = await client.query(`
      SELECT extname, extversion
      FROM pg_extension
      ORDER BY extname
    `);

    extensionsResult.rows.forEach((ext) => {
      console.log(`  📦 ${ext.extname} (v${ext.extversion})`);
    });

    // 4. Verificar funções customizadas
    console.log("\n⚙️ FUNÇÕES CUSTOMIZADAS:");
    console.log("==========================");

    const functionsResult = await client.query(`
      SELECT routine_name, routine_type
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_type = 'FUNCTION'
      ORDER BY routine_name
    `);

    if (functionsResult.rows.length === 0) {
      console.log("  ⚠️ Nenhuma função customizada encontrada");
    } else {
      functionsResult.rows.forEach((func) => {
        console.log(`  🔧 ${func.routine_name}`);
      });
    }

    // 5. Verificar políticas RLS
    console.log("\n🔒 POLÍTICAS RLS:");
    console.log("===================");

    const rlsResult = await client.query(`
      SELECT 
        schemaname, 
        tablename, 
        rowsecurity,
        (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
      FROM pg_tables t
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    rlsResult.rows.forEach((table) => {
      const rlsStatus = table.rowsecurity ? "✅ HABILITADO" : "❌ DESABILITADO";
      console.log(
        `  📋 ${table.tablename}: ${rlsStatus} (${table.policy_count} políticas)`
      );
    });

    // 6. Verificar dados nas tabelas principais
    console.log("\n📊 DADOS NAS TABELAS PRINCIPAIS:");
    console.log("===================================");

    const mainTables = [
      "profiles",
      "profissionais",
      "clientes",
      "agendamentos",
      "servicos",
    ];

    for (const tableName of mainTables) {
      try {
        const countResult = await client.query(
          `SELECT COUNT(*) as total FROM ${tableName}`
        );
        console.log(
          `  📋 ${tableName}: ${countResult.rows[0].total} registros`
        );
      } catch (error) {
        console.log(`  ❌ ${tableName}: Tabela não encontrada`);
      }
    }

    console.log("\n🎉 Verificação do Supabase concluída!");
    console.log("📊 Banco de dados está funcionando e acessível");
  } catch (error) {
    console.error("❌ Erro ao conectar ao Supabase:", error.message);
    console.error("🔍 Detalhes do erro:", error);
  } finally {
    await client.end();
  }
}

checkSupabaseStatus();
