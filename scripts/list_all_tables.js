import { Client } from "pg";

const config = {
  connectionString:
    "postgresql://neondb_owner:npg_Qqv3kXeOY6ot@ep-quiet-shape-ack5hkqy-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: {
    rejectUnauthorized: false,
  },
};

async function listAllTables() {
  const client = new Client(config);

  try {
    console.log("🚀 LISTANDO TODAS AS TABELAS DO BANCO NEON");
    console.log("==========================================\n");

    await client.connect();
    console.log("✅ Conectado ao banco Neon!");

    // 1. Listar todas as tabelas
    console.log("📋 TABELAS ENCONTRADAS:");
    console.log("========================");

    const tables = await client.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    tables.rows.forEach((table, index) => {
      console.log(
        `${index + 1}. 📍 ${table.table_name} (${table.column_count} colunas)`
      );
    });

    console.log(`\n📊 Total de tabelas: ${tables.rows.length}`);

    // 2. Detalhes de cada tabela
    console.log("\n🔍 DETALHES DAS TABELAS:");
    console.log("==========================");

    for (const table of tables.rows) {
      console.log(`\n📋 TABELA: ${table.table_name}`);
      console.log("─".repeat(50));

      // Estrutura da tabela
      const columns = await client.query(
        `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `,
        [table.table_name]
      );

      console.log("  📋 Estrutura:");
      columns.rows.forEach((col) => {
        const nullable = col.is_nullable === "YES" ? "NULL" : "NOT NULL";
        const defaultVal = col.column_default
          ? `DEFAULT ${col.column_default}`
          : "";
        const length = col.character_maximum_length
          ? `(${col.character_maximum_length})`
          : "";
        console.log(
          `    • ${col.column_name}: ${col.data_type}${length} ${nullable} ${defaultVal}`.trim()
        );
      });

      // Contar registros
      try {
        const count = await client.query(
          `SELECT COUNT(*) as total FROM ${table.table_name}`
        );
        console.log(`  📊 Total de registros: ${count.rows[0].total}`);
      } catch (error) {
        console.log(
          `  📊 Total de registros: Erro ao contar - ${error.message}`
        );
      }

      // Verificar se tem chave primária
      const primaryKeys = await client.query(
        `
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY' 
          AND tc.table_name = $1
      `,
        [table.table_name]
      );

      if (primaryKeys.rows.length > 0) {
        console.log(
          `  🔑 Chave Primária: ${primaryKeys.rows
            .map((pk) => pk.column_name)
            .join(", ")}`
        );
      }

      // Verificar relacionamentos (Foreign Keys)
      const foreignKeys = await client.query(
        `
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name = $1
      `,
        [table.table_name]
      );

      if (foreignKeys.rows.length > 0) {
        console.log("  🔗 Relacionamentos:");
        foreignKeys.rows.forEach((fk) => {
          console.log(
            `    • ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`
          );
        });
      }

      // Verificar índices
      const indexes = await client.query(
        `
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = $1
        ORDER BY indexname
      `,
        [table.table_name]
      );

      if (indexes.rows.length > 0) {
        console.log(`  📍 Índices (${indexes.rows.length}):`);
        indexes.rows.forEach((idx) => {
          console.log(`    • ${idx.indexname}`);
        });
      }
    }

    // 3. Resumo das tabelas por categoria
    console.log("\n📊 RESUMO POR CATEGORIA:");
    console.log("==========================");

    const categories = {
      "Autenticação e Usuários": ["profiles"],
      "Estrutura Organizacional": ["unidades"],
      Profissionais: ["professionals"],
      Clientes: ["clients"],
      Agendamentos: ["appointments"],
      Serviços: ["servicos_avulsos"],
      Produtos: [
        "produtos_trato_de_barbados",
        "produtos_barberbeer",
        "marcas",
        "categorias",
      ],
      Vendas: ["vendas_produtos"],
      Assinaturas: ["subscriptions", "planos"],
      Faturamento: ["monthly_revenue", "faturamento_assinatura"],
      Metas: ["metas_trato", "metas_barberbeer"],
      Comissões: ["comissoes_avulses"],
      Fila: ["barber_queue"],
    };

    for (const [category, tableNames] of Object.entries(categories)) {
      const foundTables = tableNames.filter((name) =>
        tables.rows.some((t) => t.table_name === name)
      );
      if (foundTables.length > 0) {
        console.log(`\n🏷️ ${category}:`);
        foundTables.forEach((tableName) => {
          const table = tables.rows.find((t) => t.table_name === tableName);
          console.log(`  📍 ${tableName} (${table.column_count} colunas)`);
        });
      }
    }

    // 4. Estatísticas gerais
    console.log("\n📈 ESTATÍSTICAS GERAIS:");
    console.log("==========================");

    const totalColumns = tables.rows.reduce(
      (sum, table) => sum + parseInt(table.column_count),
      0
    );
    console.log(`📊 Total de colunas em todas as tabelas: ${totalColumns}`);
    console.log(
      `📊 Média de colunas por tabela: ${(
        totalColumns / tables.rows.length
      ).toFixed(1)}`
    );

    // Tabelas com mais colunas
    const tablesByColumns = tables.rows.sort(
      (a, b) => b.column_count - a.column_count
    );
    console.log("\n🏆 Top 5 tabelas com mais colunas:");
    tablesByColumns.slice(0, 5).forEach((table, index) => {
      console.log(
        `  ${index + 1}. ${table.table_name}: ${table.column_count} colunas`
      );
    });

    console.log("\n🎉 LISTAGEM COMPLETA FINALIZADA!");
  } catch (error) {
    console.error("❌ Erro durante a listagem:", error.message);
  } finally {
    await client.end();
    console.log("🔌 Conexão encerrada.");
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  listAllTables().catch(console.error);
}

export { listAllTables };

