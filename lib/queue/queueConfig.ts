import { Queue, Worker, QueueScheduler } from 'bullmq';
import Redis from 'ioredis';

// Configuração do Redis
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
};

// Cliente Redis
export const redis = new Redis(redisConfig);

// Configurações padrão para as filas
const defaultJobOptions = {
  removeOnComplete: 100, // Remove jobs completados após 100
  removeOnFail: 50,      // Remove jobs falhados após 50
  attempts: 3,            // Número de tentativas
  backoff: {
    type: 'exponential',
    delay: 2000,          // Delay inicial de 2 segundos
  },
};

// Configurações específicas por tipo de job
export const jobConfigs = {
  notifications: {
    ...defaultJobOptions,
    priority: 1,          // Prioridade alta para notificações
    delay: 0,             // Sem delay para notificações
  },
  reminders: {
    ...defaultJobOptions,
    priority: 2,          // Prioridade média para lembretes
    delay: 0,
  },
  monthlyBonus: {
    ...defaultJobOptions,
    priority: 3,          // Prioridade baixa para cálculos mensais
    delay: 0,
  },
  cleanup: {
    ...defaultJobOptions,
    priority: 4,          // Prioridade mais baixa para limpeza
    delay: 0,
  },
};

// Configurações de fila
export const queueConfigs = {
  notifications: {
    name: 'notifications',
    concurrency: 5,       // Processar 5 jobs simultaneamente
  },
  reminders: {
    name: 'reminders',
    concurrency: 3,       // Processar 3 jobs simultaneamente
  },
  monthlyBonus: {
    name: 'monthly-bonus',
    concurrency: 1,       // Processar 1 job por vez (cálculos críticos)
  },
  cleanup: {
    name: 'cleanup',
    concurrency: 2,       // Processar 2 jobs simultaneamente
  },
};

// Função para criar conexão Redis com fallback
export function createRedisConnection() {
  try {
    return new Redis(redisConfig);
  } catch (error) {
    console.error('❌ Erro ao conectar com Redis:', error);
    // Fallback para memória local se Redis não estiver disponível
    return null;
  }
}

// Função para verificar saúde da conexão Redis
export async function checkRedisHealth(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('❌ Redis não está respondendo:', error);
    return false;
  }
}

// Função para obter estatísticas das filas
export async function getQueueStats() {
  try {
    const stats = await redis.info('stats');
    return {
      connected: true,
      stats,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}
