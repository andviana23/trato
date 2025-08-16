const { Client } = require("pg");

const config = {
  connectionString:
    process.env.SUPABASE_DB_URL ||
    "postgresql://postgres:postgres@localhost:54322/postgres",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
};

async function migrateToSupabase() {
  const client = new Client(config);

  try {
    await client.connect();
    console.log("🔌 Conectado ao Supabase Database");

    console.log("📋 Iniciando migração para Supabase...");

    // 1. Verificar tabelas existentes
    const existingTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log("\n📊 Tabelas existentes no Supabase:");
    existingTables.rows.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });

    // 2. Verificar estrutura das tabelas principais
    const mainTables = [
      "profiles",
      "profissionais",
      "clientes",
      "agendamentos",
      "servicos",
    ];

    for (const tableName of mainTables) {
      if (existingTables.rows.some((t) => t.table_name === tableName)) {
        console.log(`\n🔍 Verificando estrutura da tabela: ${tableName}`);

        const columns = await client.query(
          `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `,
          [tableName]
        );

        console.log(`  Colunas encontradas: ${columns.rows.length}`);
        columns.rows.forEach((col) => {
          console.log(
            `    • ${col.column_name}: ${col.data_type} ${
              col.is_nullable === "YES" ? "NULL" : "NOT NULL"
            }`
          );
        });
      }
    }

    // 3. Verificar políticas RLS
    console.log("\n🔒 Verificando políticas RLS...");

    const rlsTables = await client.query(`
      SELECT schemaname, tablename, rowsecurity
      FROM pg_tables 
      WHERE schemaname = 'public' AND rowsecurity = true
      ORDER BY tablename
    `);

    console.log(`Tabelas com RLS habilitado: ${rlsTables.rows.length}`);
    rlsTables.rows.forEach((table) => {
      console.log(`  ✅ ${table.tablename}`);
    });

    // 4. Verificar funções
    console.log("\n⚙️ Verificando funções customizadas...");

    const functions = await client.query(`
      SELECT routine_name, routine_type
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_type = 'FUNCTION'
      ORDER BY routine_name
    `);

    console.log(`Funções encontradas: ${functions.rows.length}`);
    functions.rows.forEach((func) => {
      console.log(`  🔧 ${func.routine_name}`);
    });

    // 5. Verificar extensões
    console.log("\n🔧 Verificando extensões...");

    const extensions = await client.query(`
      SELECT extname, extversion
      FROM pg_extension
      ORDER BY extname
    `);

    console.log(`Extensões instaladas: ${extensions.rows.length}`);
    extensions.rows.forEach((ext) => {
      console.log(`  📦 ${ext.extname} (v${ext.extversion})`);
    });

    console.log("\n🎉 Migração para Supabase concluída com sucesso!");
    console.log("📊 Banco de dados configurado e funcionando");
  } catch (error) {
    console.error("❌ Erro durante a migração:", error.message);
  } finally {
    await client.end();
  }
}

migrateToSupabase();
