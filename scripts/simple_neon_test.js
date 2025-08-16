import { Client } from "pg";

const config = {
  connectionString:
    "postgresql://neondb_owner:npg_Qqv3kXeOY6ot@ep-quiet-shape-ack5hkqy-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: {
    rejectUnauthorized: false,
  },
};

async function testConnection() {
  const client = new Client(config);
  try {
    console.log("🚀 Testando conexão com Neon...");
    await client.connect();
    console.log("✅ Conectado com sucesso!");

    // Testar query simples
    const result = await client.query("SELECT version()");
    console.log("📊 Versão do PostgreSQL:", result.rows[0].version);

    // Testar busca de tabelas
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log("\n📋 Tabelas encontradas:");
    tables.rows.forEach((row) => {
      console.log(`  📍 ${row.table_name}`);
    });

    // Testar busca de unidades
    const unidades = await client.query(
      "SELECT * FROM unidades WHERE is_active = true"
    );
    console.log(`\n🏢 Unidades ativas: ${unidades.rows.length}`);
    unidades.rows.forEach((unidade) => {
      console.log(`  📍 ${unidade.nome} (${unidade.id})`);
    });
  } catch (error) {
    console.error("❌ Erro na conexão:", error.message);
  } finally {
    await client.end();
    console.log("🔌 Conexão encerrada.");
  }
}

testConnection();
