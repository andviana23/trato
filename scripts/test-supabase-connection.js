// Script para testar conexão com Supabase e verificar tabelas
require('dotenv').config({ path: '.env.local' });

console.log('🚀 Testando conexão com Supabase...\n');

// Verificar variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('📋 Verificando variáveis de ambiente:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Não encontrada');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Configurada' : '❌ Não encontrada');
console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceKey ? '✅ Configurada' : '❌ Não encontrada');

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ ERRO: Variáveis de ambiente não configuradas!');
  console.log('\n📝 INSTRUÇÕES:');
  console.log('1. Crie um arquivo .env.local na raiz do projeto');
  console.log('2. Copie o conteúdo do arquivo env-exemplo.txt');
  console.log('3. Substitua pelos valores reais do seu Supabase');
  console.log('4. Reinicie este script');
  process.exit(1);
}

// Tentar conectar
async function testarConexao() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    console.log('\n🔌 Conectando ao Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Teste básico de conexão
    console.log('🔍 Testando conexão básica...');
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro na conexão:', error.message);
      return;
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso!');
    
    // Verificar tabelas relacionadas a clientes
    console.log('\n🔍 Verificando tabelas de clientes...');
    
    const { data: tabelasClientes, error: errorClientes } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .or('table_name.ilike.%client%,table_name.ilike.%cliente%');
    
    if (errorClientes) {
      console.log('❌ Erro ao verificar tabelas:', errorClientes.message);
      return;
    }
    
    if (tabelasClientes && tabelasClientes.length > 0) {
      console.log('✅ Tabelas relacionadas a clientes encontradas:');
      tabelasClientes.forEach(tabela => {
        console.log(`  - ${tabela.table_name} (${tabela.table_type})`);
      });
    } else {
      console.log('❌ Nenhuma tabela de clientes encontrada');
    }
    
    // Verificar especificamente a tabela 'clientes'
    console.log('\n🔍 Verificando tabela "clientes"...');
    
    const { data: estruturaClientes, error: errorEstrutura } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'clientes')
      .order('ordinal_position');
    
    if (errorEstrutura) {
      console.log('❌ Erro ao verificar estrutura:', errorEstrutura.message);
      return;
    }
    
    if (estruturaClientes && estruturaClientes.length > 0) {
      console.log('✅ Tabela "clientes" existe com as seguintes colunas:');
      estruturaClientes.forEach(coluna => {
        console.log(`  - ${coluna.column_name}: ${coluna.data_type} ${coluna.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
      
      // Verificar dados na tabela
      console.log('\n📊 Verificando dados na tabela "clientes"...');
      const { data: dadosClientes, error: errorDados, count } = await supabase
        .from('clientes')
        .select('*', { count: 'exact' })
        .limit(5);
      
      if (errorDados) {
        console.log('❌ Erro ao buscar dados:', errorDados.message);
      } else {
        console.log(`✅ Total de clientes: ${count || 0}`);
        if (dadosClientes && dadosClientes.length > 0) {
          console.log('📋 Primeiros 5 clientes:');
          dadosClientes.forEach((cliente, index) => {
            console.log(`  ${index + 1}. ${cliente.nome || 'Sem nome'} (${cliente.unidade || 'Sem unidade'}) - ${cliente.telefone || 'Sem telefone'}`);
          });
        } else {
          console.log('📋 Tabela está vazia');
        }
      }
      
    } else {
      console.log('❌ Tabela "clientes" não existe');
      console.log('\n💡 SOLUÇÃO: Execute o script de criação da tabela');
      console.log('   node scripts/run-clientes-migration.js');
    }
    
    // Verificar todas as tabelas públicas
    console.log('\n📋 Todas as tabelas públicas no banco:');
    const { data: todasTabelas, error: errorTodas } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (errorTodas) {
      console.log('❌ Erro ao listar tabelas:', errorTodas.message);
    } else if (todasTabelas && todasTabelas.length > 0) {
      console.log(`✅ Total de ${todasTabelas.length} tabelas encontradas:`);
      todasTabelas.forEach((tabela, index) => {
        console.log(`  ${index + 1}. ${tabela.table_name}`);
      });
    }
    
    console.log('\n🎉 Verificação concluída!');
    
  } catch (error) {
    console.log('❌ Erro durante o teste:', error.message);
    console.log('\n💡 DICAS:');
    console.log('1. Verifique se as credenciais do Supabase estão corretas');
    console.log('2. Verifique se o projeto Supabase está ativo');
    console.log('3. Verifique a conexão com a internet');
  }
}

// Executar o teste
testarConexao();









