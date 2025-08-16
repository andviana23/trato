import { Client } from "pg";

const config = {
  connectionString:
    "postgresql://neondb_owner:npg_Qqv3kXeOY6ot@ep-quiet-shape-ack5hkqy-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: {
    rejectUnauthorized: false,
  },
};

async function listTables() {
  const client = new Client(config);

  try {
    console.log("🚀 LISTANDO TABELAS DO BANCO NEON");
    console.log("==================================\n");

    await client.connect();
    console.log("✅ Conectado ao banco Neon!");

    // Listar todas as tabelas
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log("📋 TABELAS ENCONTRADAS:");
    console.log("========================");

    tables.rows.forEach((table, index) => {
      console.log(`${index + 1}. 📍 ${table.table_name}`);
    });

    console.log(`\n📊 Total de tabelas: ${tables.rows.length}`);

    // Mostrar algumas estatísticas básicas
    if (tables.rows.length > 0) {
      console.log("\n🔍 ESTATÍSTICAS BÁSICAS:");
      console.log("==========================");

      for (const table of tables.rows.slice(0, 5)) {
        // Primeiras 5 tabelas
        try {
          const count = await client.query(
            `SELECT COUNT(*) as total FROM ${table.table_name}`
          );
          console.log(
            `📊 ${table.table_name}: ${count.rows[0].total} registros`
          );
        } catch (error) {
          console.log(`📊 ${table.table_name}: Erro ao contar`);
        }
      }

      if (tables.rows.length > 5) {
        console.log(`... e mais ${tables.rows.length - 5} tabelas`);
      }
    }
  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await client.end();
    console.log("🔌 Conexão encerrada.");
  }
}

listTables();

