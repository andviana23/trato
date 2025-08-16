/**
 * Script para gerar dados financeiros realistas para testes
 * 
 * Este script simula vários meses de transações financeiras com:
 * - Diferentes categorias de receitas e despesas
 * - Valores realistas baseados em uma clínica de pequeno/médio porte
 * - Padrões sazonais e distribuição temporal realista
 * - Clientes e fornecedores fictícios mas plausíveis
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// CONFIGURAÇÕES E CONSTANTES
// ============================================================================

const UNIDADE_ID = 'trato';
const MESES_PARA_GERAR = 12; // Últimos 12 meses
const CREATED_BY_USER = 'system-test-data';

// Faixas de valores (em R$)
const VALORES_CONSULTA = { min: 80, max: 300 };
const VALORES_PROCEDIMENTO = { min: 200, max: 1500 };
const VALORES_PLANO = { min: 150, max: 800 };
const VALORES_DESPESA_PEQUENA = { min: 50, max: 500 };
const VALORES_DESPESA_MEDIA = { min: 500, max: 2000 };
const VALORES_DESPESA_GRANDE = { min: 2000, max: 10000 };

// ============================================================================
// DADOS FICTÍCIOS REALISTAS
// ============================================================================

const CLIENTES_FICTICIOS = [
  { nome: 'Maria Silva Santos', cpf: '123.456.789-01', telefone: '(11) 98765-4321' },
  { nome: 'João Carlos Oliveira', cpf: '234.567.890-12', telefone: '(11) 97654-3210' },
  { nome: 'Ana Paula Costa', cpf: '345.678.901-23', telefone: '(11) 96543-2109' },
  { nome: 'Pedro Henrique Lima', cpf: '456.789.012-34', telefone: '(11) 95432-1098' },
  { nome: 'Carla Fernanda Rocha', cpf: '567.890.123-45', telefone: '(11) 94321-0987' },
  { nome: 'Lucas Gabriel Alves', cpf: '678.901.234-56', telefone: '(11) 93210-9876' },
  { nome: 'Juliana Beatriz Souza', cpf: '789.012.345-67', telefone: '(11) 92109-8765' },
  { nome: 'Rafael Augusto Martins', cpf: '890.123.456-78', telefone: '(11) 91098-7654' },
  { nome: 'Camila Vitória Pereira', cpf: '901.234.567-89', telefone: '(11) 90987-6543' },
  { nome: 'Bruno Leonardo Dias', cpf: '012.345.678-90', telefone: '(11) 89876-5432' },
  { nome: 'Larissa Cristina Reis', cpf: '123.456.789-02', telefone: '(11) 88765-4321' },
  { nome: 'Felipe Eduardo Morais', cpf: '234.567.890-13', telefone: '(11) 87654-3210' },
  { nome: 'Gabriela Sophia Nunes', cpf: '345.678.901-24', telefone: '(11) 86543-2109' },
  { nome: 'Thiago Matheus Cardoso', cpf: '456.789.012-35', telefone: '(11) 85432-1098' },
  { nome: 'Natália Isabella Ribeiro', cpf: '567.890.123-46', telefone: '(11) 84321-0987' }
];

const FORNECEDORES_FICTICIOS = [
  { nome: 'Medicamentos e Suprimentos Ltda', cnpj: '12.345.678/0001-90' },
  { nome: 'Equipamentos Médicos do Brasil', cnpj: '23.456.789/0001-01' },
  { nome: 'Limpeza e Higiene Profissional', cnpj: '34.567.890/0001-12' },
  { nome: 'Informática e Tecnologia em Saúde', cnpj: '45.678.901/0001-23' },
  { nome: 'Segurança e Monitoramento Ltda', cnpj: '56.789.012/0001-34' },
  { nome: 'Energia Elétrica Regional', cnpj: '67.890.123/0001-45' },
  { nome: 'Telecomunicações e Internet', cnpj: '78.901.234/0001-56' },
  { nome: 'Seguros e Benefícios Empresariais', cnpj: '89.012.345/0001-67' },
  { nome: 'Contabilidade e Consultoria', cnpj: '90.123.456/0001-78' },
  { nome: 'Marketing e Publicidade Digital', cnpj: '01.234.567/0001-89' }
];

const TIPOS_RECEITA = [
  { codigo: '4.1.1.1', descricao: 'Consultas Médicas', peso: 0.4, faixa: VALORES_CONSULTA },
  { codigo: '4.1.1.2', descricao: 'Procedimentos Especializados', peso: 0.3, faixa: VALORES_PROCEDIMENTO },
  { codigo: '4.1.1.3', descricao: 'Planos de Tratamento', peso: 0.2, faixa: VALORES_PLANO },
  { codigo: '4.1.1.4', descricao: 'Exames e Diagnósticos', peso: 0.1, faixa: VALORES_CONSULTA }
];

const TIPOS_DESPESA = [
  { codigo: '5.1.1.1', descricao: 'Salários e Encargos', peso: 0.35, faixa: VALORES_DESPESA_GRANDE, mensal: true },
  { codigo: '5.1.1.2', descricao: 'Aluguel e Condomínio', peso: 0.15, faixa: { min: 3000, max: 8000 }, mensal: true },
  { codigo: '5.1.1.3', descricao: 'Medicamentos e Materiais', peso: 0.20, faixa: VALORES_DESPESA_MEDIA, mensal: false },
  { codigo: '5.1.1.4', descricao: 'Energia Elétrica', peso: 0.05, faixa: { min: 800, max: 2000 }, mensal: true },
  { codigo: '5.1.1.5', descricao: 'Telefone e Internet', peso: 0.03, faixa: { min: 300, max: 800 }, mensal: true },
  { codigo: '5.1.1.6', descricao: 'Limpeza e Conservação', peso: 0.08, faixa: VALORES_DESPESA_PEQUENA, mensal: false },
  { codigo: '5.1.1.7', descricao: 'Seguros e Benefícios', peso: 0.06, faixa: VALORES_DESPESA_MEDIA, mensal: true },
  { codigo: '5.1.1.8', descricao: 'Marketing e Publicidade', peso: 0.04, faixa: VALORES_DESPESA_PEQUENA, mensal: false },
  { codigo: '5.1.1.9', descricao: 'Contabilidade e Consultoria', peso: 0.04, faixa: { min: 1000, max: 3000 }, mensal: true }
];

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max));
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomDate(startDate: Date, endDate: Date): Date {
  const start = startDate.getTime();
  const end = endDate.getTime();
  return new Date(start + Math.random() * (end - start));
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Funções utilitárias removidas (não utilizadas no script atual)
// function generateCpf() e addBusinessDays() foram removidas para limpar o código

// ============================================================================
// FUNÇÕES DE GERAÇÃO DE DADOS
// ============================================================================

async function createClients(): Promise<Array<{ id: string; name: string; cpf: string }>> {
  console.log('📋 Criando clientes fictícios...');
  
  const clientes = CLIENTES_FICTICIOS.map(cliente => ({
    name: cliente.nome,
    cpf: cliente.cpf,
    phone: cliente.telefone,
    email: `${cliente.nome.toLowerCase().replace(/\s+/g, '.')}@email.com`,
    unidade_id: UNIDADE_ID,
    is_active: true,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('clients')
    .insert(clientes)
    .select('id, name, cpf');

  if (error) {
    console.error('❌ Erro ao criar clientes:', error);
    throw error;
  }

  console.log(`✅ ${data.length} clientes criados`);
  return data;
}

async function ensureAccountsExist(): Promise<void> {
  console.log('🏦 Verificando contas contábeis...');
  
  // Verificar se as contas já existem
  const { data: existingAccounts } = await supabase
    .from('contas_contabeis')
    .select('codigo')
    .eq('unidade_id', UNIDADE_ID);

  const existingCodes = new Set(existingAccounts?.map(acc => acc.codigo) || []);
  
  // Contas que precisam existir
  const requiredAccounts = [
    ...TIPOS_RECEITA.map(tipo => ({ codigo: tipo.codigo, nome: tipo.descricao, tipo: 'receita' })),
    ...TIPOS_DESPESA.map(tipo => ({ codigo: tipo.codigo, nome: tipo.descricao, tipo: 'despesa' })),
    { codigo: '1.1.1.1', nome: 'CAIXA', tipo: 'ativo' }
  ];

  const accountsToCreate = requiredAccounts.filter(acc => !existingCodes.has(acc.codigo));

  if (accountsToCreate.length > 0) {
    const { error } = await supabase
      .from('contas_contabeis')
      .insert(accountsToCreate.map(acc => ({
        codigo: acc.codigo,
        nome: acc.nome,
        tipo: acc.tipo,
        categoria: acc.tipo,
        nivel: acc.codigo.split('.').length,
        unidade_id: UNIDADE_ID,
        ativo: true
      })));

    if (error) {
      console.error('❌ Erro ao criar contas contábeis:', error);
      throw error;
    }

    console.log(`✅ ${accountsToCreate.length} contas contábeis criadas`);
  } else {
    console.log('✅ Todas as contas contábeis já existem');
  }
}

async function getAccountByCode(codigo: string): Promise<{ id: string; codigo: string; nome: string; tipo: string }> {
  const { data, error } = await supabase
    .from('contas_contabeis')
    .select('id, codigo, nome, tipo')
    .eq('codigo', codigo)
    .eq('unidade_id', UNIDADE_ID)
    .single();

  if (error) {
    throw new Error(`Conta contábil ${codigo} não encontrada`);
  }

  return data;
}

async function generateMonthlyTransactions(
  month: Date,
  clients: Array<{ id: string; name: string; cpf: string }>
): Promise<void> {
  console.log(`📊 Gerando transações para ${month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}...`);
  
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  
  const transactions = [];
  
  // Gerar receitas (variação sazonal)
  const sazonalMultiplier = getSazonalMultiplier(month.getMonth());
  const baseReceitas = Math.floor(randomBetween(80, 150) * sazonalMultiplier);
  
  for (let i = 0; i < baseReceitas; i++) {
    const tipoReceita = getWeightedChoice(TIPOS_RECEITA);
    const cliente = randomChoice(clients);
    const valor = randomBetween(tipoReceita.faixa.min, tipoReceita.faixa.max);
    const dataTransacao = generateRandomDate(startOfMonth, endOfMonth);
    
    // Pular fins de semana para receitas (consultas não acontecem nos fins de semana)
    if (dataTransacao.getDay() === 0 || dataTransacao.getDay() === 6) {
      continue;
    }

    const contaReceita = await getAccountByCode(tipoReceita.codigo);
    const contaCaixa = await getAccountByCode('1.1.1.1');

    // Lançamento de receita (débito no caixa, crédito na receita)
    transactions.push({
      data_lancamento: formatDate(dataTransacao),
      data_competencia: formatDate(dataTransacao),
      numero_documento: `REC${month.getFullYear()}${String(month.getMonth() + 1).padStart(2, '0')}${String(i + 1).padStart(4, '0')}`,
      historico: `${tipoReceita.descricao} - ${cliente.name}`,
      valor: valor,
      tipo_lancamento: 'debito',
      conta_debito_id: contaCaixa.id,
      conta_credito_id: contaReceita.id,
      unidade_id: UNIDADE_ID,
      cliente_id: cliente.id,
      status: 'confirmado',
      created_by: CREATED_BY_USER
    });
  }

  // Gerar despesas
  for (const tipoDespesa of TIPOS_DESPESA) {
    const quantidadeBase = tipoDespesa.mensal ? 1 : Math.floor(randomBetween(2, 8));
    
    for (let i = 0; i < quantidadeBase; i++) {
      const valor = randomBetween(tipoDespesa.faixa.min, tipoDespesa.faixa.max);
      const dataTransacao = tipoDespesa.mensal 
        ? new Date(month.getFullYear(), month.getMonth(), randomInt(1, 5)) // Início do mês para despesas fixas
        : generateRandomDate(startOfMonth, endOfMonth);

      const contaDespesa = await getAccountByCode(tipoDespesa.codigo);
      const contaCaixa = await getAccountByCode('1.1.1.1');
      const fornecedor = randomChoice(FORNECEDORES_FICTICIOS);

      // Lançamento de despesa (débito na despesa, crédito no caixa)
      transactions.push({
        data_lancamento: formatDate(dataTransacao),
        data_competencia: formatDate(dataTransacao),
        numero_documento: `DESP${month.getFullYear()}${String(month.getMonth() + 1).padStart(2, '0')}${String(Date.now()).slice(-6)}`,
        historico: `${tipoDespesa.descricao} - ${fornecedor.nome}`,
        valor: valor,
        tipo_lancamento: 'credito',
        conta_debito_id: contaDespesa.id,
        conta_credito_id: contaCaixa.id,
        unidade_id: UNIDADE_ID,
        cliente_id: null,
        status: 'confirmado',
        created_by: CREATED_BY_USER
      });
    }
  }

  // Inserir transações em lotes para melhor performance
  const BATCH_SIZE = 50;
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);
    
    const { error } = await supabase
      .from('lancamentos_contabeis')
      .insert(batch);

    if (error) {
      console.error('❌ Erro ao inserir lançamentos:', error);
      throw error;
    }
  }

  console.log(`✅ ${transactions.length} transações criadas para ${month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`);
}

function getSazonalMultiplier(month: number): number {
  // Simulação de sazonalidade (dezembro mais baixo, março/abril altos)
  const multipliers = [
    1.0,  // Janeiro
    0.9,  // Fevereiro
    1.2,  // Março
    1.1,  // Abril
    1.0,  // Maio
    0.95, // Junho
    0.9,  // Julho (férias)
    1.0,  // Agosto
    1.1,  // Setembro
    1.0,  // Outubro
    0.95, // Novembro
    0.7   // Dezembro (festas)
  ];
  
  return multipliers[month];
}

function getWeightedChoice<T extends { peso: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.peso, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.peso;
    if (random <= 0) {
      return item;
    }
  }
  
  return items[items.length - 1];
}

async function generateReceiptAutomation(): Promise<void> {
  console.log('🤖 Gerando algumas receitas automáticas simuladas...');
  
  // Simular algumas receitas automáticas dos últimos 30 dias
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  const contaReceita = await getAccountByCode('4.1.1.1');
  const contaCaixa = await getAccountByCode('1.1.1.1');
  
  const automaticReceipts = [];
  
  for (let i = 0; i < 10; i++) {
    const paymentId = `pay_test_${Date.now()}_${i}`;
    const customerId = `cus_test_${Date.now()}_${i}`;
    const valor = randomBetween(100, 500);
    const dataTransacao = generateRandomDate(startDate, new Date());
    
    // Criar lançamento contábil
    const { data: lancamento, error: lancamentoError } = await supabase
      .from('lancamentos_contabeis')
      .insert({
        data_lancamento: formatDate(dataTransacao),
        data_competencia: formatDate(dataTransacao),
        numero_documento: `AUTO${paymentId}`,
        historico: `Receita automática ASAAS - ${paymentId}`,
        valor: valor,
        tipo_lancamento: 'debito',
        conta_debito_id: contaCaixa.id,
        conta_credito_id: contaReceita.id,
        unidade_id: UNIDADE_ID,
        status: 'confirmado',
        created_by: 'system-webhook'
      })
      .select('id')
      .single();

    if (lancamentoError) {
      console.error('❌ Erro ao criar lançamento automático:', lancamentoError);
      continue;
    }

    // Criar receita automática
    automaticReceipts.push({
      payment_id: paymentId,
      customer_id: customerId,
      value: valor,
      description: `Pagamento automático de teste ${i + 1}`,
      billing_type: randomChoice(['CREDIT_CARD', 'PIX', 'BOLETO']),
      lancamento_id: lancamento.id,
      unidade_id: UNIDADE_ID,
      status: 'processado',
      webhook_data: {
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: paymentId,
          customer: customerId,
          value: valor * 100, // Em centavos
          description: `Pagamento automático de teste ${i + 1}`,
          billingType: randomChoice(['CREDIT_CARD', 'PIX', 'BOLETO'])
        },
        timestamp: dataTransacao.toISOString()
      },
      created_at: dataTransacao.toISOString()
    });
  }

  const { error } = await supabase
    .from('receitas_automaticas')
    .insert(automaticReceipts);

  if (error) {
    console.error('❌ Erro ao criar receitas automáticas:', error);
    throw error;
  }

  console.log(`✅ ${automaticReceipts.length} receitas automáticas criadas`);
}

async function cleanupTestData(): Promise<void> {
  console.log('🧹 Limpando dados de teste existentes...');
  
  // Remover dados de teste anteriores
  await supabase.from('receitas_automaticas').delete().eq('unidade_id', UNIDADE_ID);
  await supabase.from('lancamentos_contabeis').delete().eq('created_by', CREATED_BY_USER);
  await supabase.from('clients').delete().like('email', '%@email.com');
  
  console.log('✅ Dados de teste anteriores removidos');
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function generateFinancialTestData(): Promise<void> {
  try {
    console.log('🚀 INICIANDO GERAÇÃO DE DADOS FINANCEIROS DE TESTE\n');
    
    // Limpeza inicial
    await cleanupTestData();
    
    // Preparação
    await ensureAccountsExist();
    const clients = await createClients();
    
    // Gerar dados históricos
    console.log(`\n📅 Gerando dados para os últimos ${MESES_PARA_GERAR} meses...\n`);
    
    for (let i = MESES_PARA_GERAR - 1; i >= 0; i--) {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      month.setDate(1);
      
      await generateMonthlyTransactions(month, clients);
      
      // Pequena pausa para não sobrecarregar o banco
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Gerar receitas automáticas
    await generateReceiptAutomation();
    
    console.log('\n🎉 GERAÇÃO DE DADOS CONCLUÍDA COM SUCESSO!');
    console.log('\n📊 RESUMO DOS DADOS GERADOS:');
    
    // Estatísticas finais
    const { count: totalLancamentos } = await supabase
      .from('lancamentos_contabeis')
      .select('*', { count: 'exact', head: true })
      .eq('unidade_id', UNIDADE_ID);
    
    const { count: totalClientes } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('unidade_id', UNIDADE_ID);
    
    const { count: totalReceitas } = await supabase
      .from('receitas_automaticas')
      .select('*', { count: 'exact', head: true })
      .eq('unidade_id', UNIDADE_ID);

    console.log(`   💰 ${totalLancamentos || 0} lançamentos contábeis`);
    console.log(`   👥 ${totalClientes || 0} clientes`);
    console.log(`   🤖 ${totalReceitas || 0} receitas automáticas`);
    
    console.log('\n✅ Os dados estão prontos para testes de performance e validação!');
    console.log('\n💡 Para testar o DRE, execute:');
    console.log('   SELECT * FROM calculate_dre(\'2024-01-01\', \'2024-12-31\', \'trato\');');
    
  } catch (error) {
    console.error('\n❌ ERRO NA GERAÇÃO DE DADOS:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  generateFinancialTestData().then(() => {
    console.log('\n🏁 Script concluído. Dados de teste gerados com sucesso!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Falha na execução:', error);
    process.exit(1);
  });
}

export { generateFinancialTestData };
