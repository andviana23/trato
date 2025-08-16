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

    const result = await client.query("SELECT version()");
    console.log("📊 Versão do PostgreSQL:", result.rows[0].version);
  } catch (error) {
    console.error("❌ Erro na conexão:", error.message);
  } finally {
    await client.end();
    console.log("🔌 Conexão encerrada.");
  }
}

testConnection();
