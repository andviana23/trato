"use client";

import React from 'react';
import { 
  useGeneralQueueStats, 
  useFailedJobsMonitoring, 
  useActiveJobsMonitoring 
} from '@/lib/queue/hooks';
import { 
  useNotificationActions, 
  useReportActions, 
  useCleanupActions, 
  useSyncActions 
} from '@/lib/queue/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  MessageSquare, 
  RefreshCw, 
  Settings, 
  Trash2, 
  Users 
} from 'lucide-react';

// ============================================================================
// COMPONENTE PRINCIPAL DO DASHBOARD
// ============================================================================

export default function QueueDashboard() {
  const { 
    stats, 
    loading: statsLoading, 
    error: statsError, 
    summary, 
    refresh: refreshStats 
  } = useGeneralQueueStats(10000);

  const { 
    failedJobs, 
    loading: failedLoading, 
    totalFailedJobs, 
    failedJobsByQueue, 
    retryAllJobs, 
    clearOldFailedJobs,
    refresh: refreshFailed 
  } = useFailedJobsMonitoring(5000);

  const { 
    activeJobs, 
    loading: activeLoading, 
    totalActiveJobs, 
    activeJobsByQueue, 
    refresh: refreshActive 
  } = useActiveJobsMonitoring(3000);

  const { 
    sendWhatsApp, 
    sendSMS, 
    sendEmail, 
    loading: notificationLoading 
  } = useNotificationActions();

  const { 
    generateDailyReport, 
    generateWeeklyReport, 
    generateMonthlyReport, 
    loading: reportLoading 
  } = useReportActions();

  const { 
    scheduleAuditLogsCleanup, 
    scheduleTempFilesCleanup, 
    scheduleCacheCleanup, 
    loading: cleanupLoading 
  } = useCleanupActions();

  const { 
    syncGoogleCalendar, 
    syncAsaasWebhooks, 
    syncExternalAPI, 
    loading: syncLoading 
  } = useSyncActions();

  // Função para retry de todos os jobs falhados
  const handleRetryAllFailed = async (queueName: string) => {
    try {
      const result = await retryAllJobs(queueName);
      if (result.success) {
        console.log(`Retry de ${result.successCount} jobs da fila ${queueName}`);
      }
    } catch (error) {
      console.error(`Erro ao fazer retry dos jobs da fila ${queueName}:`, error);
    }
  };

  // Função para limpar jobs antigos
  const handleClearOldJobs = async (queueName: string) => {
    try {
      const result = await clearOldFailedJobs(queueName, 24);
      if (result.success) {
        console.log(`Limpeza de ${result.clearedCount} jobs antigos da fila ${queueName}`);
      }
    } catch (error) {
      console.error(`Erro ao limpar jobs antigos da fila ${queueName}:`, error);
    }
  };

  // Função para enviar notificação de teste
  const handleSendTestNotification = async (type: 'whatsapp' | 'sms' | 'email') => {
    const testData = {
      recipient: type === 'email' ? 'teste@exemplo.com' : '+5511999999999',
      message: `Teste de notificação ${type} - ${new Date().toLocaleString()}`,
      metadata: { test: true, timestamp: Date.now() }
    };

    try {
      let result;
      switch (type) {
        case 'whatsapp':
          result = await sendWhatsApp(testData.recipient, testData.message, testData.metadata);
          break;
        case 'sms':
          result = await sendSMS(testData.recipient, testData.message, testData.metadata);
          break;
        case 'email':
          result = await sendEmail(testData.recipient, testData.message, testData.metadata);
          break;
      }

      if (result.success) {
        console.log(`Notificação de teste ${type} enviada com sucesso`);
      }
    } catch (error) {
      console.error(`Erro ao enviar notificação de teste ${type}:`, error);
    }
  };

  // Função para gerar relatório de teste
  const handleGenerateTestReport = async (type: 'daily' | 'weekly' | 'monthly') => {
    try {
      const result = await generateDailyReport('test-unidade', 'pdf', { test: true });
      if (result.success) {
        console.log(`Relatório de teste ${type} gerado com sucesso`);
      }
    } catch (error) {
      console.error(`Erro ao gerar relatório de teste ${type}:`, error);
    }
  };

  // Função para agendar limpeza de teste
  const handleScheduleTestCleanup = async (type: 'audit_logs' | 'temp_files' | 'cache') => {
    try {
      let result;
      switch (type) {
        case 'audit_logs':
          result = await scheduleAuditLogsCleanup(7);
          break;
        case 'temp_files':
          result = await scheduleTempFilesCleanup(1);
          break;
        case 'cache':
          result = await scheduleCacheCleanup(1);
          break;
      }

      if (result.success) {
        console.log(`Limpeza de teste ${type} agendada com sucesso`);
      }
    } catch (error) {
      console.error(`Erro ao agendar limpeza de teste ${type}:`, error);
    }
  };

  // Função para sincronização de teste
  const handleTestSync = async (type: 'google_calendar' | 'asaas_webhooks' | 'external_api') => {
    try {
      let result;
      switch (type) {
        case 'google_calendar':
          result = await syncGoogleCalendar('test-entity');
          break;
        case 'asaas_webhooks':
          result = await syncAsaasWebhooks('test-entity');
          break;
        case 'external_api':
          result = await syncExternalAPI('test-entity');
          break;
      }

      if (result.success) {
        console.log(`Sincronização de teste ${type} agendada com sucesso`);
      }
    } catch (error) {
      console.error(`Erro ao agendar sincronização de teste ${type}:`, error);
    }
  };

  // Função para refresh de todos os dados
  const handleRefreshAll = () => {
    refreshStats();
    refreshFailed();
    refreshActive();
  };

  if (statsLoading && failedLoading && activeLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Carregando dashboard...</span>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">Erro ao carregar dados</h3>
          <p className="text-muted-foreground mb-4">{statsError}</p>
          <Button onClick={handleRefreshAll} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header do Dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard das Filas</h1>
          <p className="text-muted-foreground">
            Monitoramento em tempo real do sistema de filas
          </p>
        </div>
        <Button onClick={handleRefreshAll} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas Gerais */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Jobs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalJobs}</div>
              <p className="text-xs text-muted-foreground">
                Jobs processados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jobs Ativos</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.activeJobs}</div>
              <p className="text-xs text-muted-foreground">
                Em processamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jobs Falhados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.failedJobs}</div>
              <p className="text-xs text-muted-foreground">
                Requerem atenção
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.successRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Jobs completados
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status de Saúde das Filas */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Status das Filas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(stats).map(([queueName, queueStats]) => (
                <div key={queueName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{queueName}</span>
                    <Badge variant={getHealthBadgeVariant(queueStats)}>
                      {getHealthStatus(queueStats)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                    <span>Esperando: {queueStats.waiting}</span>
                    <span>Ativo: {queueStats.active}</span>
                    <span>Completo: {queueStats.completed}</span>
                    <span>Falhou: {queueStats.failed}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Progress className="h-5 w-5 mr-2" />
                Progresso das Filas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(stats).map(([queueName, queueStats]) => {
                const total = queueStats.waiting + queueStats.active + queueStats.completed + queueStats.failed;
                const progress = total > 0 ? ((queueStats.completed + queueStats.failed) / total) * 100 : 0;
                
                return (
                  <div key={queueName} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{queueName}</span>
                      <span className="text-sm text-muted-foreground">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Jobs Falhados */}
      {totalFailedJobs > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
              Jobs Falhados ({totalFailedJobs})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {failedJobsByQueue.map(({ queueName, count, jobs }) => (
                count > 0 && (
                  <div key={queueName} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold capitalize">{queueName} ({count})</h4>
                      <div className="space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleRetryAllFailed(queueName)}
                          disabled={failedLoading}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry Todos
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleClearOldJobs(queueName)}
                          disabled={failedLoading}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Limpar Antigos
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {jobs.slice(0, 5).map((job) => (
                        <div key={job.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                          <div>
                            <span className="font-medium">#{job.id}</span>
                            <span className="text-muted-foreground ml-2">{job.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="destructive" className="text-xs">
                              {job.attemptsMade} tentativas
                            </Badge>
                            <span className="text-muted-foreground text-xs">
                              {new Date(job.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                      {jobs.length > 5 && (
                        <p className="text-sm text-muted-foreground text-center">
                          ... e mais {jobs.length - 5} jobs
                        </p>
                      )}
                    </div>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Painel de Ações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ações de Notificação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => handleSendTestNotification('whatsapp')}
              disabled={notificationLoading}
              className="w-full"
              variant="outline"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Teste WhatsApp
            </Button>
            <Button 
              onClick={() => handleSendTestNotification('sms')}
              disabled={notificationLoading}
              className="w-full"
              variant="outline"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Teste SMS
            </Button>
            <Button 
              onClick={() => handleSendTestNotification('email')}
              disabled={notificationLoading}
              className="w-full"
              variant="outline"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Teste Email
            </Button>
          </CardContent>
        </Card>

        {/* Ações de Relatório */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Relatórios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => handleGenerateTestReport('daily')}
              disabled={reportLoading}
              className="w-full"
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Relatório Diário
            </Button>
            <Button 
              onClick={() => handleGenerateTestReport('weekly')}
              disabled={reportLoading}
              className="w-full"
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Relatório Semanal
            </Button>
            <Button 
              onClick={() => handleGenerateTestReport('monthly')}
              disabled={reportLoading}
              className="w-full"
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Relatório Mensal
            </Button>
          </CardContent>
        </Card>

        {/* Ações de Limpeza */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trash2 className="h-5 w-5 mr-2" />
              Limpeza
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => handleScheduleTestCleanup('audit_logs')}
              disabled={cleanupLoading}
              className="w-full"
              variant="outline"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Logs
            </Button>
            <Button 
              onClick={() => handleScheduleTestCleanup('temp_files')}
              disabled={cleanupLoading}
              className="w-full"
              variant="outline"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Arquivos
            </Button>
            <Button 
              onClick={() => handleScheduleTestCleanup('cache')}
              disabled={cleanupLoading}
              className="w-full"
              variant="outline"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Cache
            </Button>
          </CardContent>
        </Card>

        {/* Ações de Sincronização */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Sincronização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => handleTestSync('google_calendar')}
              disabled={syncLoading}
              className="w-full"
              variant="outline"
            >
              <Settings className="h-4 w-4 mr-2" />
              Google Calendar
            </Button>
            <Button 
              onClick={() => handleTestSync('asaas_webhooks')}
              disabled={syncLoading}
              className="w-full"
              variant="outline"
            >
              <Settings className="h-4 w-4 mr-2" />
              ASAAS Webhooks
            </Button>
            <Button 
              onClick={() => handleTestSync('external_api')}
              disabled={syncLoading}
              className="w-full"
              variant="outline"
            >
              <Settings className="h-4 w-4 mr-2" />
              API Externa
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Informações de Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Última Atualização:</span>
              <br />
              <span className="text-muted-foreground">
                {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="font-medium">Status Geral:</span>
              <br />
              <Badge variant={getOverallHealthBadgeVariant(summary?.overallHealth)}>
                {summary?.overallHealth || 'N/A'}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Monitoramento:</span>
              <br />
              <Badge variant="secondary">Ativo</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function getHealthStatus(queueStats: any): string {
  const total = queueStats.waiting + queueStats.active + queueStats.completed + queueStats.failed;
  
  if (total === 0) return 'idle';
  
  const failureRate = total > 0 ? (queueStats.failed / total) * 100 : 0;
  const activeRate = total > 0 ? (queueStats.active / total) * 100 : 0;
  
  if (failureRate > 20) return 'critical';
  if (failureRate > 10) return 'warning';
  if (activeRate > 80) return 'busy';
  if (activeRate > 50) return 'moderate';
  
  return 'healthy';
}

function getHealthBadgeVariant(queueStats: any): "default" | "secondary" | "destructive" | "outline" {
  const status = getHealthStatus(queueStats);
  
  switch (status) {
    case 'critical': return 'destructive';
    case 'warning': return 'destructive';
    case 'busy': return 'secondary';
    case 'moderate': return 'outline';
    case 'healthy': return 'default';
    default: return 'outline';
  }
}

function getOverallHealthBadgeVariant(health?: string): "default" | "secondary" | "destructive" | "outline" {
  switch (health) {
    case 'excellent': return 'default';
    case 'good': return 'default';
    case 'moderate': return 'secondary';
    case 'poor': return 'destructive';
    case 'critical': return 'destructive';
    default: return 'outline';
  }
}
