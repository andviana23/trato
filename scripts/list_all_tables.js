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

async function listAllTables() {
  const client = new Client(config);

  try {
    await client.connect();
    console.log("🔌 Conectado ao Supabase Database");

    const result = await client.query(`
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log("\n📋 Tabelas encontradas no banco:");
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name} (${row.table_type})`);
    });

    console.log(`\n📊 Total: ${result.rows.length} tabelas`);
  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await client.end();
  }
}

listAllTables();
