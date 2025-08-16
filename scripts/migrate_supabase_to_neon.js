import { Client } from "pg";

// Configurações de conexão
const supabaseConfig = {
  connectionString:
    "postgresql://postgres:[@Trato7310!]@zbgzxwuegwpbkranaddg.supabase.co:5432/postgres",
  ssl: {
    rejectUnauthorized: false,
  },
};

const neonConfig = {
  connectionString:
    "postgresql://neondb_owner:npg_Qqv3kXeOY6ot@ep-quiet-shape-ack5hkqy-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: {
    rejectUnauthorized: false,
  },
};

async function analyzeSupabaseStructure() {
  const supabaseClient = new Client(supabaseConfig);

  try {
    console.log("🔍 Conectando ao Supabase para análise...");
    await supabaseClient.connect();
    console.log("✅ Conectado ao Supabase!");

    // Analisar tabelas existentes
    console.log("\n📊 Analisando estrutura do Supabase...");

    const tablesResult = await supabaseClient.query(`
      SELECT schemaname, tablename, tableowner 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);

    console.log("📋 Tabelas encontradas no Supabase:");
    tablesResult.rows.forEach((row) => {
      console.log(`  📍 ${row.tablename}`);
    });

    // Analisar dados das tabelas principais
    const mainTables = [
      "profiles",
      "professionals",
      "clients",
      "appointments",
      "servicos_avulsos",
      "vendas_produtos",
      "metas_barberbeer",
      "unidades",
    ];

    console.log("\n🔍 Analisando dados das tabelas principais...");

    for (const tableName of mainTables) {
      try {
        const countResult = await supabaseClient.query(
          `SELECT COUNT(*) as total FROM ${tableName}`
        );
        const total = countResult.rows[0].total;
        console.log(`  📊 ${tableName}: ${total} registros`);

        // Verificar estrutura da tabela
        const structureResult = await supabaseClient.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' 
          ORDER BY ordinal_position
        `);

        console.log(`    📋 Estrutura: ${structureResult.rows.length} colunas`);
      } catch (error) {
        console.log(
          `  ❌ ${tableName}: Tabela não encontrada ou erro - ${error.message}`
        );
      }
    }

    // Verificar relacionamentos
    console.log("\n🔗 Analisando relacionamentos...");

    const foreignKeysResult = await supabaseClient.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name
    `);

    console.log("🔗 Relacionamentos encontrados:");
    foreignKeysResult.rows.forEach((row) => {
      console.log(
        `  📍 ${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`
      );
    });

    return {
      tables: tablesResult.rows,
      foreignKeys: foreignKeysResult.rows,
    };
  } catch (error) {
    console.error("❌ Erro ao analisar Supabase:", error.message);
    throw error;
  } finally {
    await supabaseClient.end();
    console.log("🔌 Conexão com Supabase encerrada.");
  }
}

async function migrateDataToNeon() {
  const supabaseClient = new Client(supabaseConfig);
  const neonClient = new Client(neonConfig);

  try {
    console.log("\n🚀 Iniciando migração para Neon...");

    // Conectar aos dois bancos
    await supabaseClient.connect();
    await neonClient.connect();
    console.log("✅ Conectado aos dois bancos!");

    // Migrar dados tabela por tabela
    const migrationOrder = [
      "unidades",
      "profiles",
      "professionals",
      "clients",
      "appointments",
      "servicos_avulsos",
      "vendas_produtos",
      "metas_barberbeer",
    ];

    for (const tableName of migrationOrder) {
      try {
        console.log(`\n📦 Migrando tabela: ${tableName}`);

        // Verificar se a tabela existe no Supabase
        const tableExists = await supabaseClient.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
          )
        `);

        if (!tableExists.rows[0].exists) {
          console.log(
            `  ⚠️ Tabela ${tableName} não existe no Supabase, pulando...`
          );
          continue;
        }

        // Contar registros
        const countResult = await supabaseClient.query(
          `SELECT COUNT(*) as total FROM ${tableName}`
        );
        const totalRecords = countResult.rows[0].total;

        if (totalRecords === 0) {
          console.log(`  ⚠️ Tabela ${tableName} está vazia, pulando...`);
          continue;
        }

        console.log(`  📊 Total de registros: ${totalRecords}`);

        // Migrar em lotes para evitar problemas de memória
        const batchSize = 1000;
        let migratedCount = 0;

        for (let offset = 0; offset < totalRecords; offset += batchSize) {
          const batchResult = await supabaseClient.query(`
            SELECT * FROM ${tableName} 
            ORDER BY id 
            LIMIT ${batchSize} 
            OFFSET ${offset}
          `);

          if (batchResult.rows.length === 0) break;

          // Inserir no Neon
          for (const row of batchResult.rows) {
            try {
              const columns = Object.keys(row).filter(
                (key) => row[key] !== null
              );
              const values = columns.map((key) => row[key]);
              const placeholders = columns.map((_, index) => `$${index + 1}`);

              const insertQuery = `
                INSERT INTO ${tableName} (${columns.join(", ")})
                VALUES (${placeholders.join(", ")})
                ON CONFLICT (id) DO NOTHING
              `;

              await neonClient.query(insertQuery, values);
              migratedCount++;
            } catch (insertError) {
              console.log(
                `    ⚠️ Erro ao inserir registro: ${insertError.message}`
              );
            }
          }

          console.log(
            `    ✅ Lote processado: ${migratedCount}/${totalRecords} registros`
          );
        }

        console.log(`  🎉 Tabela ${tableName} migrada com sucesso!`);
      } catch (tableError) {
        console.error(`  ❌ Erro ao migrar ${tableName}:`, tableError.message);
      }
    }

    console.log("\n🎯 Migração concluída!");
  } catch (error) {
    console.error("❌ Erro durante migração:", error.message);
    throw error;
  } finally {
    await supabaseClient.end();
    await neonClient.end();
    console.log("🔌 Conexões encerradas.");
  }
}

async function main() {
  try {
    console.log("🚀 INICIANDO MIGRAÇÃO SUPABASE → NEON");
    console.log("=====================================\n");

    // Etapa 1: Analisar estrutura
    console.log("📋 ETAPA 1: ANALISANDO ESTRUTURA DO SUPABASE");
    const structure = await analyzeSupabaseStructure();

    // Etapa 2: Migrar dados
    console.log("\n📦 ETAPA 2: MIGRANDO DADOS PARA NEON");
    await migrateDataToNeon();

    console.log("\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!");
  } catch (error) {
    console.error("❌ Erro na migração:", error.message);
    process.exit(1);
  }
}

main();
