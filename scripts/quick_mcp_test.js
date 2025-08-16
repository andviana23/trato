import { Client } from 'pg';

const config = {
  connectionString: 'postgresql://neondb_owner:npg_Qqv3kXeOY6ot@ep-quiet-shape-ack5hkqy-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
};

async function quickTest() {
  const client = new Client(config);
  
  try {
    console.log('🚀 Teste MCP Rápido');
    console.log('===================\n');
    
    await client.connect();
    console.log('✅ Conectado ao Neon!');
    
    // Teste básico de consulta
    const unidades = await client.query('SELECT nome, id FROM unidades WHERE is_active = true');
    console.log(`🏢 Unidades encontradas: ${unidades.rows.length}`);
    
    unidades.rows.forEach(unidade => {
      console.log(`  📍 ${unidade.nome} (${unidade.id})`);
    });
    
    // Teste de análise de dados
    if (unidades.rows.length > 0) {
      const unidadeId = unidades.rows[0].id;
      
      const profCount = await client.query(
        'SELECT COUNT(*) as total FROM professionals WHERE unidade_id = $1',
        [unidadeId]
      );
      
      const clientCount = await client.query(
        'SELECT COUNT(*) as total FROM clients WHERE unidade_id = $1',
        [unidadeId]
      );
      
      console.log(`\n📊 Análise da unidade ${unidades.rows[0].nome}:`);
      console.log(`  👥 Profissionais: ${profCount.rows[0].total}`);
      console.log(`  👤 Clientes: ${clientCount.rows[0].total}`);
    }
    
    console.log('\n🎉 Teste MCP concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Conexão encerrada.');
  }
}

quickTest();
