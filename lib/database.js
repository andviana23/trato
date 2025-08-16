import { Pool } from 'pg';

/**
 * Cliente de banco de dados PostgreSQL para Neon
 * Substitui o Supabase no sistema Trato de Barbados
 */

// Configuração do pool de conexões
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Configurações de pool otimizadas
  max: 20, // Máximo de conexões no pool
  idleTimeoutMillis: 30000, // Tempo limite para conexões ociosas
  connectionTimeoutMillis: 2000, // Tempo limite para estabelecer conexão
  maxUses: 7500, // Máximo de usos por conexão antes de recriar
});

// Eventos do pool
pool.on('connect', (client) => {
  console.log('🔌 Nova conexão estabelecida com Neon');
});

pool.on('error', (err, client) => {
  console.error('❌ Erro no pool de conexões:', err);
});

/**
 * Funções auxiliares para queries comuns
 */

// Query simples
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`📊 Query executada em ${duration}ms: ${text.substring(0, 50)}...`);
    return res;
  } catch (error) {
    console.error('❌ Erro na query:', error.message);
    throw error;
  }
}

// Query para uma única linha
export async function queryOne(text, params) {
  const res = await query(text, params);
  return res.rows[0] || null;
}

// Query para múltiplas linhas
export async function queryMany(text, params) {
  const res = await query(text, params);
  return res.rows || [];
}

// Query para inserção/atualização
export async function execute(text, params) {
  const res = await query(text, params);
  return {
    rowCount: res.rowCount,
    rows: res.rows
  };
}

// Transação
export async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Funções específicas do sistema Trato de Barbados
 */

// Buscar unidades
export async function getUnidades() {
  return queryMany('SELECT * FROM unidades WHERE is_active = true ORDER BY nome');
}

// Buscar profissionais por unidade
export async function getProfessionalsByUnidade(unidadeId) {
  return queryMany(
    'SELECT * FROM professionals WHERE unidade_id = $1 AND is_active = true ORDER BY name',
    [unidadeId]
  );
}

// Buscar clientes por unidade
export async function getClientsByUnidade(unidadeId) {
  return queryMany(
    'SELECT * FROM clients WHERE unidade_id = $1 AND is_active = true ORDER BY name',
    [unidadeId]
  );
}

// Buscar agendamentos por unidade
export async function getAppointmentsByUnidade(unidadeId, startDate, endDate) {
  return queryMany(
    `SELECT a.*, c.name as cliente_nome, p.name as barbeiro_nome 
     FROM appointments a 
     LEFT JOIN clients c ON a.cliente_id = c.id 
     LEFT JOIN professionals p ON a.barbeiro_id = p.id 
     WHERE a.unidade_id = $1 
     AND a.start_at >= $2 
     AND a.start_at <= $3 
     ORDER BY a.start_at`,
    [unidadeId, startDate, endDate]
  );
}

// Buscar serviços por unidade
export async function getServicosByUnidade(unidadeId) {
  return queryMany(
    'SELECT * FROM servicos WHERE unidade_id = $1 AND is_active = true ORDER BY nome',
    [unidadeId]
  );
}

// Buscar produtos por unidade
export async function getProdutosByUnidade(unidadeId, tipo = 'trato') {
  const tableName = tipo === 'barberbeer' ? 'produtos_barberbeer' : 'produtos_trato_de_barbados';
  return queryMany(
    `SELECT * FROM ${tableName} WHERE unidade_id = $1 AND is_active = true ORDER BY nome`,
    [unidadeId]
  );
}

// Buscar metas por barbeiro
export async function getMetasByBarbeiro(barbeiroId, mes, ano) {
  return queryMany(
    `SELECT * FROM metas_barberbeer 
     WHERE barbeiro_id = $1 AND mes = $2 AND ano = $3
     UNION ALL
     SELECT * FROM metas_trato 
     WHERE barbeiro_id = $1 AND mes = $2 AND ano = $3`,
    [barbeiroId, mes, ano]
  );
}

// Buscar comissões por barbeiro
export async function getComissoesByBarbeiro(barbeiroId, mes, ano) {
  return queryMany(
    'SELECT * FROM comissoes_avulses WHERE profissional_id = $1 AND mes = $2 AND ano = $3 ORDER BY created_at',
    [barbeiroId, mes, ano]
  );
}

// Buscar faturamento por unidade
export async function getFaturamentoByUnidade(unidadeId, mes, ano) {
  return queryOne(
    'SELECT * FROM monthly_revenue WHERE unidade_id = $1 AND mes = $2 AND ano = $3',
    [unidadeId, mes, ano]
  );
}

// Fila de barbeiros por unidade
export async function getBarberQueueByUnidade(unidadeId) {
  return queryMany(
    'SELECT * FROM barber_queue WHERE unidade_id = $1 AND is_active = true ORDER BY queue_position',
    [unidadeId]
  );
}

/**
 * Funções de inserção/atualização
 */

// Criar novo agendamento
export async function createAppointment(appointmentData) {
  const { cliente_id, barbeiro_id, unidade_id, start_at, end_at, servicos, observacoes } = appointmentData;
  
  return queryOne(
    `INSERT INTO appointments (cliente_id, barbeiro_id, unidade_id, start_at, end_at, servicos, observacoes, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'agendado')
     RETURNING *`,
    [cliente_id, barbeiro_id, unidade_id, start_at, end_at, servicos, observacoes]
  );
}

// Atualizar status do agendamento
export async function updateAppointmentStatus(appointmentId, status) {
  return queryOne(
    'UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, appointmentId]
  );
}

// Criar novo cliente
export async function createClient(clientData) {
  const { name, email, phone, unidade_id, user_id } = clientData;
  
  return queryOne(
    `INSERT INTO clients (name, email, phone, unidade_id, user_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, email, phone, unidade_id, user_id]
  );
}

// Criar novo profissional
export async function createProfessional(professionalData) {
  const { name, email, phone, unidade_id, commission_rate, specialty } = professionalData;
  
  return queryOne(
    `INSERT INTO professionals (name, email, phone, unidade_id, commission_rate, specialty)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, email, phone, unidade_id, commission_rate, specialty]
  );
}

/**
 * Funções de relatório
 */

// Relatório de atendimentos por período
export async function getRelatorioAtendimentos(unidadeId, dataInicio, dataFim) {
  return queryMany(
    `SELECT 
       DATE(a.start_at) as data,
       COUNT(*) as total_agendamentos,
       COUNT(CASE WHEN a.status = 'atendido' THEN 1 END) as atendidos,
       COUNT(CASE WHEN a.status = 'cancelado' THEN 1 END) as cancelados,
       COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) as no_show
     FROM appointments a
     WHERE a.unidade_id = $1 
     AND a.start_at >= $2 
     AND a.start_at <= $3
     GROUP BY DATE(a.start_at)
     ORDER BY data`,
    [unidadeId, dataInicio, dataFim]
  );
}

// Relatório de comissões por barbeiro
export async function getRelatorioComissoes(unidadeId, mes, ano) {
  return queryMany(
    `SELECT 
       p.name as barbeiro_nome,
       p.commission_rate,
       COUNT(sa.id) as total_servicos,
       SUM(sa.valor) as valor_total,
       SUM(sa.comissao) as comissao_total
     FROM professionals p
     LEFT JOIN servicos_avulsos sa ON p.id = sa.profissional_id 
       AND EXTRACT(MONTH FROM sa.data_realizacao) = $2 
       AND EXTRACT(YEAR FROM sa.data_realizacao) = $3
     WHERE p.unidade_id = $1 AND p.is_active = true
     GROUP BY p.id, p.name, p.commission_rate
     ORDER BY comissao_total DESC`,
    [unidadeId, mes, ano]
  );
}

// Exportar o pool para uso direto se necessário
export { pool };

// Exportar como default para compatibilidade
export default {
  query,
  queryOne,
  queryMany,
  execute,
  transaction,
  getUnidades,
  getProfessionalsByUnidade,
  getClientsByUnidade,
  getAppointmentsByUnidade,
  getServicosByUnidade,
  getProdutosByUnidade,
  getMetasByBarbeiro,
  getComissoesByBarbeiro,
  getFaturamentoByUnidade,
  getBarberQueueByUnidade,
  createAppointment,
  updateAppointmentStatus,
  createClient,
  createProfessional,
  getRelatorioAtendimentos,
  getRelatorioComissoes
};
