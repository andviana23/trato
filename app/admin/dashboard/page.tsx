'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Users, 
  Calendar, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react';

// ============================================================================
// INTERFACES
// ============================================================================

interface SystemHealth {
  database: boolean;
  redis: boolean;
  externalAPIs: boolean;
  diskSpace: number;
  memoryUsage: number;
  cpuUsage: number;
  uptime: number;
  lastCheck: Date;
}

interface QueueMetrics {
  totalJobs: number;
  averageProcessingTime: number;
  successRate: number;
  queueHealth: Array<{ name: string; health: 'good' | 'warning' | 'critical' }>;
}

interface BusinessMetrics {
  totalAppointments: number;
  totalRevenue: number;
  totalClients: number;
  averageDailyAppointments: number;
  averageDailyRevenue: number;
  growthRate: number;
  topServices: Array<{ name: string; count: number; revenue: number }>;
}

interface PerformanceMetrics {
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  slowestEndpoints: Array<{ endpoint: string; averageTime: number; count: number }>;
  statusCodeDistribution: Record<number, number>;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function AdminDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics | null>(null);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // ============================================================================
  // FUNÇÕES DE CARREGAMENTO
  // ============================================================================

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar dados de saúde do sistema
      const healthResponse = await fetch('/api/admin/system-health');
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        setSystemHealth(health);
      }
      
      // Carregar métricas de fila
      const queueResponse = await fetch('/api/admin/queue-metrics');
      if (queueResponse.ok) {
        const queue = await queueResponse.json();
        setQueueMetrics(queue);
      }
      
      // Carregar métricas de negócio
      const businessResponse = await fetch('/api/admin/business-metrics');
      if (businessResponse.ok) {
        const business = await businessResponse.json();
        setBusinessMetrics(business);
      }
      
      // Carregar métricas de performance
      const performanceResponse = await fetch('/api/admin/performance-metrics');
      if (performanceResponse.ok) {
        const performance = await performanceResponse.json();
        setPerformanceMetrics(performance);
      }
      
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // EFEITOS
  // ============================================================================

  useEffect(() => {
    loadDashboardData();
    
    // Atualizar dados a cada 30 segundos
    const interval = setInterval(loadDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // ============================================================================
  // FUNÇÕES AUXILIARES
  // ============================================================================

  const getHealthStatus = (isHealthy: boolean) => {
    return isHealthy ? (
      <Badge variant="default" className="bg-green-500">
        <CheckCircle className="w-3 h-3 mr-1" />
        Saudável
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Problema
      </Badge>
    );
  };

  const getQueueHealthStatus = (health: 'good' | 'warning' | 'critical') => {
    const variants = {
      good: 'bg-green-500',
      warning: 'bg-yellow-500',
      critical: 'bg-red-500',
    };
    
    const labels = {
      good: 'Boa',
      warning: 'Atenção',
      critical: 'Crítico',
    };
    
    return (
      <Badge variant="default" className={variants[health]}>
        {labels[health]}
      </Badge>
    );
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // ============================================================================
  // RENDERIZAÇÃO
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Produção</h1>
          <p className="text-muted-foreground">
            Monitoramento em tempo real do sistema Trato de Barbados
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <p className="text-sm text-muted-foreground">
            Última atualização: {lastUpdate.toLocaleTimeString()}
          </p>
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {businessMetrics?.totalAppointments || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Média diária: {businessMetrics?.averageDailyAppointments || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(businessMetrics?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Média diária: {formatCurrency(businessMetrics?.averageDailyRevenue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {businessMetrics?.totalClients || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Novos hoje: {businessMetrics?.totalClients || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Crescimento</CardTitle>
            {businessMetrics?.growthRate && businessMetrics.growthRate > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {businessMetrics?.growthRate ? `${businessMetrics.growthRate.toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Detalhes */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="queues">Filas</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Serviços Mais Populares */}
            <Card>
              <CardHeader>
                <CardTitle>Serviços Mais Populares</CardTitle>
                <CardDescription>Top 5 serviços por agendamentos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {businessMetrics?.topServices.map((service, index) => (
                    <div key={service.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{service.count}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(service.revenue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Status do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle>Status do Sistema</CardTitle>
                <CardDescription>Componentes principais</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Banco de Dados</span>
                    {systemHealth && getHealthStatus(systemHealth.database)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Redis</span>
                    {systemHealth && getHealthStatus(systemHealth.redis)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>APIs Externas</span>
                    {systemHealth && getHealthStatus(systemHealth.externalAPIs)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tempo de Atividade</span>
                    <span className="text-sm text-muted-foreground">
                      {systemHealth ? formatUptime(systemHealth.uptime) : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Requisições</CardTitle>
                <CardDescription>Últimas 24 horas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {performanceMetrics?.totalRequests || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total de requisições
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tempo de Resposta</CardTitle>
                <CardDescription>Média das últimas 24h</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {performanceMetrics?.averageResponseTime ? 
                    `${performanceMetrics.averageResponseTime.toFixed(0)}ms` : '0ms'
                  }
                </div>
                <p className="text-sm text-muted-foreground">
                  Tempo médio
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taxa de Erro</CardTitle>
                <CardDescription>Últimas 24 horas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {performanceMetrics?.errorRate ? 
                    `${performanceMetrics.errorRate.toFixed(2)}%` : '0%'
                  }
                </div>
                <p className="text-sm text-muted-foreground">
                  Requisições com erro
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Endpoints Mais Lentos */}
          <Card>
            <CardHeader>
              <CardTitle>Endpoints Mais Lentos</CardTitle>
              <CardDescription>Top 10 por tempo de resposta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceMetrics?.slowestEndpoints.map((endpoint, index) => (
                  <div key={endpoint.endpoint} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-mono text-sm">{endpoint.endpoint}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {endpoint.averageTime.toFixed(0)}ms
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {endpoint.count} requisições
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Filas */}
        <TabsContent value="queues" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total de Jobs</CardTitle>
                <CardDescription>Processados nas últimas 24h</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {queueMetrics?.totalJobs || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Jobs processados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taxa de Sucesso</CardTitle>
                <CardDescription>Jobs bem-sucedidos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {queueMetrics?.successRate ? 
                    `${queueMetrics.successRate.toFixed(1)}%` : '0%'
                  }
                </div>
                <p className="text-sm text-muted-foreground">
                  Sucesso nos jobs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tempo de Processamento</CardTitle>
                <CardDescription>Média dos jobs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {queueMetrics?.averageProcessingTime ? 
                    `${queueMetrics.averageProcessingTime.toFixed(0)}ms` : '0ms'
                  }
                </div>
                <p className="text-sm text-muted-foreground">
                  Tempo médio
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Saúde das Filas */}
          <Card>
            <CardHeader>
              <CardTitle>Saúde das Filas</CardTitle>
              <CardDescription>Status de cada fila do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {queueMetrics?.queueHealth.map((queue) => (
                  <div key={queue.name} className="flex items-center justify-between">
                    <span className="font-medium">{queue.name}</span>
                    {getQueueHealthStatus(queue.health)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sistema */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recursos do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle>Recursos do Sistema</CardTitle>
                <CardDescription>Uso atual de recursos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Disco</span>
                      <span className="text-sm text-muted-foreground">
                        {systemHealth?.diskSpace || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (systemHealth?.diskSpace || 0) > 90 ? 'bg-red-500' :
                          (systemHealth?.diskSpace || 0) > 75 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${systemHealth?.diskSpace || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Memória</span>
                      <span className="text-sm text-muted-foreground">
                        {systemHealth?.memoryUsage || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (systemHealth?.memoryUsage || 0) > 90 ? 'bg-red-500' :
                          (systemHealth?.memoryUsage || 0) > 75 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${systemHealth?.memoryUsage || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>CPU</span>
                      <span className="text-sm text-muted-foreground">
                        {systemHealth?.cpuUsage || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (systemHealth?.cpuUsage || 0) > 90 ? 'bg-red-500' :
                          (systemHealth?.cpuUsage || 0) > 75 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${systemHealth?.cpuUsage || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Sistema</CardTitle>
                <CardDescription>Detalhes técnicos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Ambiente</span>
                    <Badge variant="outline">Produção</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Versão</span>
                    <span className="text-sm text-muted-foreground">1.0.0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Última Verificação</span>
                    <span className="text-sm text-muted-foreground">
                      {systemHealth?.lastCheck ? 
                        systemHealth.lastCheck.toLocaleString() : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status Geral</span>
                    {systemHealth && (
                      systemHealth.database && systemHealth.redis && systemHealth.externalAPIs ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Operacional
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Problemas Detectados
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
