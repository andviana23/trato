import { logAuditEvent } from '../audit';

// ============================================================================
// INTERFACES
// ============================================================================

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  userId?: string;
  unidadeId?: string;
  error?: string;
  requestSize?: number;
  responseSize?: number;
}

export interface BusinessMetrics {
  date: string;
  appointments: {
    total: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    noShow: number;
  };
  clients: {
    new: number;
    active: number;
    total: number;
    returning: number;
  };
  revenue: {
    daily: number;
    monthly: number;
    averageTicket: number;
    totalTransactions: number;
  };
  queue: {
    current: number;
    averageWaitTime: number;
    totalServed: number;
    averageServiceTime: number;
  };
  bonuses: {
    totalCalculated: number;
    totalPaid: number;
    averageBonus: number;
    professionalsWithBonus: number;
  };
  services: {
    totalBooked: number;
    mostPopular: string;
    averageDuration: number;
    totalRevenue: number;
  };
}

export interface SystemHealth {
  database: boolean;
  redis: boolean;
  externalAPIs: boolean;
  diskSpace: number;
  memoryUsage: number;
  cpuUsage: number;
  uptime: number;
  lastCheck: Date;
}

export interface QueueMetrics {
  queueName: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  processingRate: number;
  averageProcessingTime: number;
  timestamp: Date;
}

// ============================================================================
// SERVIÇO DE MÉTRICAS
// ============================================================================

export class MetricsService {
  private static performanceMetrics: PerformanceMetrics[] = [];
  private static businessMetrics: BusinessMetrics[] = [];
  private static queueMetrics: QueueMetrics[] = [];
  
  // ============================================================================
  // MÉTRICAS DE PERFORMANCE
  // ============================================================================
  
  /**
   * Registra métricas de performance de uma requisição
   */
  static recordPerformanceMetrics(metrics: PerformanceMetrics): void {
    try {
      this.performanceMetrics.push(metrics);
      
      // Manter apenas as últimas 1000 métricas
      if (this.performanceMetrics.length > 1000) {
        this.performanceMetrics = this.performanceMetrics.slice(-1000);
      }
      
      // Log de auditoria para métricas críticas
      if (metrics.responseTime > 5000 || metrics.statusCode >= 500) {
        logAuditEvent({
          userId: metrics.userId || 'system',
          action: 'PERFORMANCE_ALERT',
          resource: 'API_ENDPOINT',
          resourceId: metrics.endpoint,
          metadata: {
            endpoint: metrics.endpoint,
            method: metrics.method,
            responseTime: metrics.responseTime,
            statusCode: metrics.statusCode,
            error: metrics.error,
            timestamp: metrics.timestamp,
          },
          success: metrics.statusCode < 400,
        });
      }
      
    } catch (error) {
      console.error('❌ Erro ao registrar métricas de performance:', error);
    }
  }
  
  /**
   * Obtém métricas de performance agregadas
   */
  static getPerformanceMetrics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    slowestEndpoints: Array<{ endpoint: string; averageTime: number; count: number }>;
    statusCodeDistribution: Record<number, number>;
  } {
    const now = Date.now();
    let cutoffTime: number;
    
    switch (timeRange) {
      case '1h':
        cutoffTime = now - 60 * 60 * 1000;
        break;
      case '24h':
        cutoffTime = now - 24 * 60 * 60 * 1000;
        break;
      case '7d':
        cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        cutoffTime = now - 24 * 60 * 60 * 1000;
    }
    
    const filteredMetrics = this.performanceMetrics.filter(
      m => m.timestamp.getTime() > cutoffTime
    );
    
    if (filteredMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        slowestEndpoints: [],
        statusCodeDistribution: {},
      };
    }
    
    // Calcular métricas agregadas
    const totalRequests = filteredMetrics.length;
    const averageResponseTime = filteredMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const errorCount = filteredMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorCount / totalRequests) * 100;
    
    // Endpoints mais lentos
    const endpointStats = new Map<string, { totalTime: number; count: number }>();
    filteredMetrics.forEach(m => {
      const existing = endpointStats.get(m.endpoint) || { totalTime: 0, count: 0 };
      existing.totalTime += m.responseTime;
      existing.count += 1;
      endpointStats.set(m.endpoint, existing);
    });
    
    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        averageTime: stats.totalTime / stats.count,
        count: stats.count,
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);
    
    // Distribuição de códigos de status
    const statusCodeDistribution: Record<number, number> = {};
    filteredMetrics.forEach(m => {
      statusCodeDistribution[m.statusCode] = (statusCodeDistribution[m.statusCode] || 0) + 1;
    });
    
    return {
      totalRequests,
      averageResponseTime,
      errorRate,
      slowestEndpoints,
      statusCodeDistribution,
    };
  }
  
  // ============================================================================
  // MÉTRICAS DE NEGÓCIO
  // ============================================================================
  
  /**
   * Registra métricas de negócio
   */
  static async recordBusinessMetrics(metrics: BusinessMetrics): Promise<void> {
    try {
      this.businessMetrics.push(metrics);
      
      // Manter apenas as últimas 365 métricas (1 ano)
      if (this.businessMetrics.length > 365) {
        this.businessMetrics = this.businessMetrics.slice(-365);
      }
      
      // Log de auditoria para métricas importantes
      await logAuditEvent({
        userId: 'system',
        action: 'BUSINESS_METRICS_RECORDED',
        resource: 'METRICS',
        resourceId: metrics.date,
        metadata: {
          date: metrics.date,
          totalAppointments: metrics.appointments.total,
          totalRevenue: metrics.revenue.daily,
          newClients: metrics.clients.new,
          success: true,
        },
        success: true,
      });
      
    } catch (error) {
      console.error('❌ Erro ao registrar métricas de negócio:', error);
    }
  }
  
  /**
   * Obtém métricas de negócio agregadas
   */
  static getBusinessMetrics(timeRange: '1d' | '7d' | '30d' | '90d' = '30d'): {
    totalAppointments: number;
    totalRevenue: number;
    totalClients: number;
    averageDailyAppointments: number;
    averageDailyRevenue: number;
    growthRate: number;
    topServices: Array<{ name: string; count: number; revenue: number }>;
  } {
    const now = new Date();
    let cutoffDate: Date;
    
    switch (timeRange) {
      case '1d':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    const filteredMetrics = this.businessMetrics.filter(
      m => new Date(m.date) > cutoffDate
    );
    
    if (filteredMetrics.length === 0) {
      return {
        totalAppointments: 0,
        totalRevenue: 0,
        totalClients: 0,
        averageDailyAppointments: 0,
        averageDailyRevenue: 0,
        growthRate: 0,
        topServices: [],
      };
    }
    
    // Calcular métricas agregadas
    const totalAppointments = filteredMetrics.reduce((sum, m) => sum + m.appointments.total, 0);
    const totalRevenue = filteredMetrics.reduce((sum, m) => sum + m.revenue.daily, 0);
    const totalClients = filteredMetrics.reduce((sum, m) => sum + m.clients.new, 0);
    const averageDailyAppointments = totalAppointments / filteredMetrics.length;
    const averageDailyRevenue = totalRevenue / filteredMetrics.length;
    
    // Calcular taxa de crescimento (comparando com período anterior)
    const halfPoint = Math.floor(filteredMetrics.length / 2);
    const firstHalf = filteredMetrics.slice(0, halfPoint);
    const secondHalf = filteredMetrics.slice(halfPoint);
    
    const firstHalfRevenue = firstHalf.reduce((sum, m) => sum + m.revenue.daily, 0);
    const secondHalfRevenue = secondHalf.reduce((sum, m) => sum + m.revenue.daily, 0);
    
    const growthRate = firstHalfRevenue > 0 
      ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 
      : 0;
    
    // Serviços mais populares (mock - implemente com dados reais)
    const topServices = [
      { name: 'Corte Masculino', count: 150, revenue: 3000 },
      { name: 'Barba', count: 120, revenue: 1800 },
      { name: 'Corte + Barba', count: 80, revenue: 2000 },
    ];
    
    return {
      totalAppointments,
      totalRevenue,
      totalClients,
      averageDailyAppointments,
      averageDailyRevenue,
      growthRate,
      topServices,
    };
  }
  
  // ============================================================================
  // MÉTRICAS DE FILA
  // ============================================================================
  
  /**
   * Registra métricas de fila
   */
  static recordQueueMetrics(metrics: QueueMetrics): void {
    try {
      this.queueMetrics.push(metrics);
      
      // Manter apenas as últimas 1000 métricas
      if (this.queueMetrics.length > 1000) {
        this.queueMetrics = this.queueMetrics.slice(-1000);
      }
      
      // Log de auditoria para filas com problemas
      if (metrics.failed > 0 || metrics.waiting > 100) {
        logAuditEvent({
          userId: 'system',
          action: 'QUEUE_ALERT',
          resource: 'QUEUE',
          resourceId: metrics.queueName,
          metadata: {
            queueName: metrics.queueName,
            waiting: metrics.waiting,
            failed: metrics.failed,
            processingRate: metrics.processingRate,
            timestamp: metrics.timestamp,
            success: metrics.failed === 0,
          },
          success: metrics.failed === 0,
        });
      }
      
    } catch (error) {
      console.error('❌ Erro ao registrar métricas de fila:', error);
    }
  }
  
  /**
   * Obtém métricas de fila agregadas
   */
  static getQueueMetrics(timeRange: '1h' | '24h' = '24h'): {
    totalJobs: number;
    averageProcessingTime: number;
    successRate: number;
    queueHealth: Array<{ name: string; health: 'good' | 'warning' | 'critical' }>;
  } {
    const now = Date.now();
    const cutoffTime = timeRange === '1h' 
      ? now - 60 * 60 * 1000 
      : now - 24 * 60 * 60 * 1000;
    
    const filteredMetrics = this.queueMetrics.filter(
      m => m.timestamp.getTime() > cutoffTime
    );
    
    if (filteredMetrics.length === 0) {
      return {
        totalJobs: 0,
        averageProcessingTime: 0,
        successRate: 0,
        queueHealth: [],
      };
    }
    
    // Calcular métricas agregadas
    const totalJobs = filteredMetrics.reduce((sum, m) => sum + m.completed + m.failed, 0);
    const averageProcessingTime = filteredMetrics.reduce((sum, m) => sum + m.averageProcessingTime, 0) / filteredMetrics.length;
    const totalCompleted = filteredMetrics.reduce((sum, m) => sum + m.completed, 0);
    const totalFailed = filteredMetrics.reduce((sum, m) => sum + m.failed, 0);
    const successRate = totalJobs > 0 ? (totalCompleted / totalJobs) * 100 : 0;
    
    // Saúde das filas
    const queueHealth = filteredMetrics
      .filter((m, index, arr) => {
        // Pegar apenas a métrica mais recente de cada fila
        return arr.findIndex(metric => metric.queueName === m.queueName) === index;
      })
      .map(m => {
        let health: 'good' | 'warning' | 'critical' = 'good';
        
        if (m.failed > 0 || m.waiting > 50) {
          health = 'warning';
        }
        if (m.failed > 10 || m.waiting > 100) {
          health = 'critical';
        }
        
        return {
          name: m.queueName,
          health,
        };
      });
    
    return {
      totalJobs,
      averageProcessingTime,
      successRate,
      queueHealth,
    };
  }
  
  // ============================================================================
  // SAÚDE DO SISTEMA
  // ============================================================================
  
  /**
   * Verifica a saúde geral do sistema
   */
  static async checkSystemHealth(): Promise<SystemHealth> {
    try {
      // Verificar banco de dados (mock - implemente com verificação real)
      const database = true;
      
      // Verificar Redis (mock - implemente com verificação real)
      const redis = true;
      
      // Verificar APIs externas (mock - implemente com verificação real)
      const externalAPIs = true;
      
      // Métricas do sistema (mock - implemente com métricas reais)
      const diskSpace = 75; // Porcentagem de uso
      const memoryUsage = 60; // Porcentagem de uso
      const cpuUsage = 45; // Porcentagem de uso
      const uptime = process.uptime(); // Tempo de atividade em segundos
      
      const health: SystemHealth = {
        database,
        redis,
        externalAPIs,
        diskSpace,
        memoryUsage,
        cpuUsage,
        uptime,
        lastCheck: new Date(),
      };
      
      // Log de auditoria para problemas de saúde
      if (diskSpace > 90 || memoryUsage > 90 || cpuUsage > 90) {
        await logAuditEvent({
          userId: 'system',
          action: 'SYSTEM_HEALTH_ALERT',
          resource: 'SYSTEM',
          resourceId: 'health-check',
          metadata: {
            diskSpace,
            memoryUsage,
            cpuUsage,
            uptime,
            timestamp: health.lastCheck,
            success: false,
          },
          success: false,
        });
      }
      
      return health;
      
    } catch (error) {
      console.error('❌ Erro ao verificar saúde do sistema:', error);
      
      return {
        database: false,
        redis: false,
        externalAPIs: false,
        diskSpace: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        uptime: 0,
        lastCheck: new Date(),
      };
    }
  }
  
  // ============================================================================
  // RELATÓRIOS E EXPORTAÇÃO
  // ============================================================================
  
  /**
   * Gera relatório completo de métricas
   */
  static generateMetricsReport(): {
    performance: ReturnType<typeof this.getPerformanceMetrics>;
    business: ReturnType<typeof this.getBusinessMetrics>;
    queue: ReturnType<typeof this.getQueueMetrics>;
    systemHealth: SystemHealth;
    timestamp: Date;
  } {
    return {
      performance: this.getPerformanceMetrics('24h'),
      business: this.getBusinessMetrics('30d'),
      queue: this.getQueueMetrics('24h'),
      systemHealth: {
        database: true,
        redis: true,
        externalAPIs: true,
        diskSpace: 75,
        memoryUsage: 60,
        cpuUsage: 45,
        uptime: process.uptime(),
        lastCheck: new Date(),
      },
      timestamp: new Date(),
    };
  }
  
  /**
   * Limpa métricas antigas
   */
  static cleanupOldMetrics(): void {
    const now = Date.now();
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
    
    // Limpar métricas de performance antigas
    this.performanceMetrics = this.performanceMetrics.filter(
      m => m.timestamp.getTime() > oneMonthAgo
    );
    
    // Limpar métricas de fila antigas
    this.queueMetrics = this.queueMetrics.filter(
      m => m.timestamp.getTime() > oneMonthAgo
    );
    
    console.log('🧹 Métricas antigas limpas');
  }
}

// ============================================================================
// FUNÇÕES DE UTILIDADE PARA USO DIRETO
// ============================================================================

export const recordPerformanceMetrics = MetricsService.recordPerformanceMetrics.bind(MetricsService);
export const recordBusinessMetrics = MetricsService.recordBusinessMetrics.bind(MetricsService);
export const recordQueueMetrics = MetricsService.recordQueueMetrics.bind(MetricsService);
export const getPerformanceMetrics = MetricsService.getPerformanceMetrics.bind(MetricsService);
export const getBusinessMetrics = MetricsService.getBusinessMetrics.bind(MetricsService);
export const getQueueMetrics = MetricsService.getQueueMetrics.bind(MetricsService);
export const checkSystemHealth = MetricsService.checkSystemHealth.bind(MetricsService);
export const generateMetricsReport = MetricsService.generateMetricsReport.bind(MetricsService);
export const cleanupOldMetrics = MetricsService.cleanupOldMetrics.bind(MetricsService);
