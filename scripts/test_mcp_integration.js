import { Client } from "pg";

/**
 * Script para testar a integração MCP com o banco Neon
 * Este script simula as funcionalidades que a IA poderá executar
 */

const config = {
  connectionString:
    "postgresql://neondb_owner:npg_Qqv3kXeOY6ot@ep-quiet-shape-ack5hkqy-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: {
    rejectUnauthorized: false,
  },
};

async function testMCPIntegration() {
  const client = new Client(config);

  try {
    console.log("🚀 TESTANDO INTEGRAÇÃO MCP COM NEON");
    console.log("====================================\n");

    await client.connect();
    console.log("✅ Conectado ao banco Neon!");

    // Teste 1: Análise de estrutura do banco
    console.log("\n📋 TESTE 1: Análise de estrutura do banco");
    const structure = await analyzeDatabaseStructure(client);
    console.log(`  📊 Total de tabelas: ${structure.tables.length}`);
    console.log(
      `  🔗 Total de relacionamentos: ${structure.foreignKeys.length}`
    );

    // Teste 2: Análise de dados por unidade
    console.log("\n📋 TESTE 2: Análise de dados por unidade");
    await analyzeDataByUnit(client);

    // Teste 3: Relatórios inteligentes
    console.log("\n📋 TESTE 3: Relatórios inteligentes");
    await generateIntelligentReports(client);

    // Teste 4: Análise de performance
    console.log("\n📋 TESTE 4: Análise de performance");
    await analyzePerformance(client);

    // Teste 5: Sugestões de otimização
    console.log("\n📋 TESTE 5: Sugestões de otimização");
    await generateOptimizationSuggestions(client);

    console.log("\n🎉 TESTES MCP CONCLUÍDOS COM SUCESSO!");
    console.log("✅ IA pode agora analisar e interagir com o banco Neon!");
  } catch (error) {
    console.error("❌ Erro durante testes MCP:", error.message);
  } finally {
    await client.end();
    console.log("🔌 Conexão encerrada.");
  }
}

async function analyzeDatabaseStructure(client) {
  // Analisar tabelas
  const tables = await client.query(`
    SELECT 
      table_name,
      (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
    FROM information_schema.tables t
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  // Analisar relacionamentos
  const foreignKeys = await client.query(`
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

  return { tables: tables.rows, foreignKeys: foreignKeys.rows };
}

async function analyzeDataByUnit(client) {
  const unidades = await client.query(
    "SELECT * FROM unidades WHERE is_active = true"
  );

  for (const unidade of unidades.rows) {
    console.log(`\n  🏢 Analisando unidade: ${unidade.nome}`);

    // Contar profissionais
    const profCount = await client.query(
      "SELECT COUNT(*) as total FROM professionals WHERE unidade_id = $1 AND is_active = true",
      [unidade.id]
    );
    console.log(`    👥 Profissionais: ${profCount.rows[0].total}`);

    // Contar clientes
    const clientCount = await client.query(
      "SELECT COUNT(*) as total FROM clients WHERE unidade_id = $1 AND is_active = true",
      [unidade.id]
    );
    console.log(`    👤 Clientes: ${clientCount.rows[0].total}`);

    // Contar agendamentos do mês
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    const apptCount = await client.query(
      "SELECT COUNT(*) as total FROM appointments WHERE unidade_id = $1 AND start_at >= $2 AND start_at <= $3",
      [unidade.id, inicioMes.toISOString(), fimMes.toISOString()]
    );
    console.log(`    📅 Agendamentos do mês: ${apptCount.rows[0].total}`);

    // Contar produtos
    const tableName = unidade.nome.toLowerCase().includes("barberbeer")
      ? "produtos_barberbeer"
      : "produtos_trato_de_barbados";
    const prodCount = await client.query(
      `SELECT COUNT(*) as total FROM ${tableName} WHERE unidade_id = $1 AND is_active = true`,
      [unidade.id]
    );
    console.log(`    📦 Produtos: ${prodCount.rows[0].total}`);
  }
}

async function generateIntelligentReports(client) {
  console.log("  📊 Gerando relatórios inteligentes...");

  // Relatório de agendamentos por status
  const apptStatus = await client.query(`
    SELECT 
      status,
      COUNT(*) as total,
      ROUND(AVG(EXTRACT(EPOCH FROM (end_at - start_at))/3600), 2) as duracao_media_horas
    FROM appointments 
    WHERE start_at >= NOW() - INTERVAL '30 days'
    GROUP BY status
    ORDER BY total DESC
  `);

  console.log("    📅 Status dos agendamentos (últimos 30 dias):");
  apptStatus.rows.forEach((row) => {
    console.log(
      `      ${row.status}: ${row.total} (${row.duracao_media_horas}h média)`
    );
  });

  // Relatório de comissões por barbeiro
  const comissoes = await client.query(`
    SELECT 
      p.name as barbeiro,
      u.nome as unidade,
      COUNT(sa.id) as servicos_realizados,
      SUM(sa.valor) as valor_total,
      SUM(sa.comissao) as comissao_total,
      ROUND(AVG(sa.comissao), 2) as comissao_media
    FROM professionals p
    JOIN unidades u ON p.unidade_id = u.id
    LEFT JOIN servicos_avulsos sa ON p.id = sa.profissional_id 
      AND sa.data_realizacao >= NOW() - INTERVAL '30 days'
    WHERE p.is_active = true
    GROUP BY p.id, p.name, u.nome
    ORDER BY comissao_total DESC NULLS LAST
    LIMIT 10
  `);

  console.log("\n    💰 Top 10 barbeiros por comissão (últimos 30 dias):");
  comissoes.rows.forEach((row, index) => {
    console.log(
      `      ${index + 1}. ${row.barbeiro} (${row.unidade}): R$ ${
        row.comissao_total || 0
      }`
    );
  });

  // Relatório de produtos mais vendidos
  const produtosVendidos = await client.query(`
    SELECT 
      p.nome as produto,
      u.nome as unidade,
      COUNT(vp.id) as vendas,
      SUM(vp.quantidade) as quantidade_total,
      SUM(vp.valor_total) as valor_total
    FROM vendas_produtos vp
    JOIN produtos_trato_de_barbados p ON vp.produto_id = p.id
    JOIN unidades u ON vp.unidade_id = u.id
    WHERE vp.data_venda >= NOW() - INTERVAL '30 days'
    GROUP BY p.id, p.nome, u.nome
    ORDER BY vendas DESC
    LIMIT 10
  `);

  console.log("\n    📦 Top 10 produtos mais vendidos (últimos 30 dias):");
  produtosVendidos.rows.forEach((row, index) => {
    console.log(
      `      ${index + 1}. ${row.produto} (${row.unidade}): ${
        row.vendas
      } vendas`
    );
  });
}

async function analyzePerformance(client) {
  console.log("  ⚡ Analisando performance do sistema...");

  // Análise de agendamentos por hora do dia
  const agendamentosPorHora = await client.query(`
    SELECT 
      EXTRACT(HOUR FROM start_at) as hora,
      COUNT(*) as total
    FROM appointments 
    WHERE start_at >= NOW() - INTERVAL '30 days'
    GROUP BY EXTRACT(HOUR FROM start_at)
    ORDER BY total DESC
  `);

  console.log("    🕐 Horários mais populares para agendamentos:");
  agendamentosPorHora.rows.slice(0, 5).forEach((row) => {
    console.log(`      ${row.hora}h: ${row.total} agendamentos`);
  });

  // Análise de duração dos serviços
  const duracaoServicos = await client.query(`
    SELECT 
      ROUND(AVG(EXTRACT(EPOCH FROM (end_at - start_at))/3600), 2) as duracao_media_horas,
      MIN(EXTRACT(EPOCH FROM (end_at - start_at))/3600) as duracao_minima_horas,
      MAX(EXTRACT(EPOCH FROM (end_at - start_at))/3600) as duracao_maxima_horas
    FROM appointments 
    WHERE status = 'atendido' 
    AND start_at >= NOW() - INTERVAL '30 days'
  `);

  const duracao = duracaoServicos.rows[0];
  console.log(
    `    ⏱️ Duração dos serviços: ${duracao.duracao_media_horas}h (média), ${duracao.duracao_minima_horas}h (mín), ${duracao.duracao_maxima_horas}h (máx)`
  );

  // Análise de taxa de ocupação
  const ocupacao = await client.query(`
    SELECT 
      COUNT(CASE WHEN status = 'atendido' THEN 1 END) as atendidos,
      COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as cancelados,
      COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show,
      COUNT(*) as total
    FROM appointments 
    WHERE start_at >= NOW() - INTERVAL '30 days'
  `);

  const stats = ocupacao.rows[0];
  const taxaOcupacao = ((stats.atendidos / stats.total) * 100).toFixed(1);
  const taxaCancelamento = ((stats.cancelados / stats.total) * 100).toFixed(1);
  const taxaNoShow = ((stats.no_show / stats.total) * 100).toFixed(1);

  console.log(
    `    📊 Taxa de ocupação: ${taxaOcupacao}% (atendidos), ${taxaCancelamento}% (cancelados), ${taxaNoShow}% (no show)`
  );
}

async function generateOptimizationSuggestions(client) {
  console.log("  💡 Gerando sugestões de otimização...");

  // Verificar tabelas sem índices
  const tabelasSemIndices = await client.query(`
    SELECT 
      t.table_name,
      (SELECT COUNT(*) FROM information_schema.indexes WHERE table_name = t.table_name) as index_count
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
    AND t.table_name NOT LIKE 'pg_%'
    HAVING (SELECT COUNT(*) FROM information_schema.indexes WHERE table_name = t.table_name) < 2
    ORDER BY index_count
  `);

  if (tabelasSemIndices.rows.length > 0) {
    console.log("    🔍 Tabelas que podem se beneficiar de índices:");
    tabelasSemIndices.rows.forEach((row) => {
      console.log(`      📍 ${row.table_name} (${row.index_count} índices)`);
    });
  }

  // Verificar relacionamentos órfãos
  const relacionamentosOrfaos = await client.query(`
    SELECT 
      'appointments' as tabela,
      'cliente_id' as coluna,
      COUNT(*) as registros_orfos
    FROM appointments a
    LEFT JOIN clients c ON a.cliente_id = c.id
    WHERE c.id IS NULL
    UNION ALL
    SELECT 
      'appointments' as tabela,
      'barbeiro_id' as coluna,
      COUNT(*) as registros_orfos
    FROM appointments a
    LEFT JOIN professionals p ON a.barbeiro_id = p.id
    WHERE p.id IS NULL
  `);

  const orfaos = relacionamentosOrfaos.rows.filter(
    (row) => row.registros_orfos > 0
  );
  if (orfaos.length > 0) {
    console.log("    ⚠️ Relacionamentos órfãos encontrados:");
    orfaos.forEach((row) => {
      console.log(
        `      📍 ${row.tabela}.${row.coluna}: ${row.registros_orfos} registros`
      );
    });
  }

  // Sugestões de métricas
  console.log("    📈 Sugestões de métricas para monitorar:");
  console.log("      • Taxa de conversão de agendamentos");
  console.log("      • Tempo médio de atendimento por barbeiro");
  console.log("      • Produtividade por unidade");
  console.log(
    "      • Satisfação do cliente (se implementar sistema de avaliação)"
  );
  console.log("      • Análise de sazonalidade dos agendamentos");
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testMCPIntegration().catch(console.error);
}

export { testMCPIntegration };
