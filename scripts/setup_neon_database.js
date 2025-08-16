#!/usr/bin/env node

/**
 * Script para configurar o banco de dados Neon para o sistema Trato de Barbados
 * Executa todas as tabelas, views, funções e configurações necessárias
 */

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações de conexão com o Neon
const config = {
  connectionString: 'postgresql://neondb_owner:npg_Qqv3kXeOY6ot@ep-quiet-shape-ack5hkqy-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
};

async function setupDatabase() {
  const client = new Client(config);
  
  try {
    console.log('🚀 Conectando ao banco Neon...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');
    
    // Ler o arquivo SQL
    const sqlFile = path.join(__dirname, '../sql/neon_database_setup.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📖 Executando script SQL...');
    console.log('⏳ Isso pode levar alguns minutos...');
    
    // Executar o script SQL
    await client.query(sqlContent);
    
    console.log('🎉 Banco de dados configurado com sucesso!');
    
    // Verificar a estrutura criada
    console.log('\n📊 Verificando estrutura criada...');
    
    // Verificar tabelas
    const tablesResult = await client.query(`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    console.log('\n📋 Tabelas criadas:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✅ ${row.tablename}`);
    });
    
    // Verificar views
    const viewsResult = await client.query(`
      SELECT schemaname, viewname 
      FROM pg_views 
      WHERE schemaname = 'public' 
      ORDER BY viewname
    `);
    
    console.log('\n👁️ Views criadas:');
    viewsResult.rows.forEach(row => {
      console.log(`  ✅ ${row.viewname}`);
    });
    
    // Verificar funções
    const functionsResult = await client.query(`
      SELECT proname as function_name
      FROM pg_proc 
      WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ORDER BY proname
    `);
    
    console.log('\n⚙️ Funções criadas:');
    functionsResult.rows.forEach(row => {
      console.log(`  ✅ ${row.function_name}`);
    });
    
    // Verificar dados iniciais
    console.log('\n🔍 Verificando dados iniciais...');
    
    const unidadesResult = await client.query('SELECT COUNT(*) as total FROM unidades');
    console.log(`  📍 Unidades: ${unidadesResult.rows[0].total}`);
    
    const categoriasResult = await client.query('SELECT COUNT(*) as total FROM categorias');
    console.log(`  🏷️ Categorias: ${categoriasResult.rows[0].total}`);
    
    const planosResult = await client.query('SELECT COUNT(*) as total FROM planos');
    console.log(`  📋 Planos: ${planosResult.rows[0].total}`);
    
    console.log('\n🎯 Sistema Trato de Barbados configurado com sucesso no Neon!');
    console.log('\n📝 Próximos passos:');
    console.log('  1. Configurar variáveis de ambiente no Next.js');
    console.log('  2. Testar conexão com o banco');
    console.log('  3. Configurar políticas RLS específicas');
    console.log('  4. Testar funcionalidades do sistema');
    
  } catch (error) {
    console.error('❌ Erro ao configurar banco:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada.');
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase().catch(console.error);
}

export { setupDatabase };
