/**
 * Serviço de Auditoria
 * 
 * Este serviço registra todas as operações críticas do sistema para
 * rastreabilidade e segurança, incluindo quem, quando e o que foi feito.
 */

import { createClient } from '@/lib/supabase/server';
import { AppError } from '@/lib/errors';

export interface AuditLog {
  id: string;
  userId: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId: string;
  resourceType: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  unidadeId?: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
}

export interface AuditContext {
  userId: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  unidadeId?: string;
}

/**
 * Tipos de ações auditáveis
 */
export const AuditActions = {
  // Metas
  META_CREATED: 'META_CREATED',
  META_UPDATED: 'META_UPDATED',
  META_DELETED: 'META_DELETED',
  META_ACTIVATED: 'META_ACTIVATED',
  META_DEACTIVATED: 'META_DEACTIVATED',
  
  // Agendamentos
  APPOINTMENT_CREATED: 'APPOINTMENT_CREATED',
  APPOINTMENT_UPDATED: 'APPOINTMENT_UPDATED',
  APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
  APPOINTMENT_CONFIRMED: 'APPOINTMENT_CONFIRMED',
  APPOINTMENT_STARTED: 'APPOINTMENT_STARTED',
  APPOINTMENT_FINISHED: 'APPOINTMENT_FINISHED',
  
  // Clientes
  CLIENT_CREATED: 'CLIENT_CREATED',
  CLIENT_UPDATED: 'CLIENT_UPDATED',
  CLIENT_DEACTIVATED: 'CLIENT_DEACTIVATED',
  CLIENT_REACTIVATED: 'CLIENT_REACTIVATED',
  
  // Pagamentos
  PAYMENT_CREATED: 'PAYMENT_CREATED',
  PAYMENT_PROCESSED: 'PAYMENT_PROCESSED',
  PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',
  
  // Fila
  QUEUE_ITEM_ADDED: 'QUEUE_ITEM_ADDED',
  QUEUE_ITEM_REMOVED: 'QUEUE_ITEM_REMOVED',
  QUEUE_ITEM_PROCESSED: 'QUEUE_ITEM_PROCESSED',
  
  // Autenticação
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_PASSWORD_CHANGED: 'USER_PASSWORD_CHANGED',
  USER_PROFILE_UPDATED: 'USER_PROFILE_UPDATED',
  
  // Sistema
  SYSTEM_CONFIG_CHANGED: 'SYSTEM_CONFIG_CHANGED',
  BACKUP_CREATED: 'BACKUP_CREATED',
  MAINTENANCE_MODE_TOGGLED: 'MAINTENANCE_MODE_TOGGLED',
} as const;

export type AuditAction = typeof AuditActions[keyof typeof AuditActions];

/**
 * Tipos de recursos auditáveis
 */
export const AuditResources = {
  META: 'META',
  APPOINTMENT: 'APPOINTMENT',
  CLIENT: 'CLIENT',
  PAYMENT: 'PAYMENT',
  QUEUE_ITEM: 'QUEUE_ITEM',
  USER: 'USER',
  SYSTEM: 'SYSTEM',
} as const;

export type AuditResource = typeof AuditResources[keyof typeof AuditResources];

/**
 * Registra uma operação no log de auditoria
 */
export async function logAuditEvent(
  context: AuditContext,
  action: AuditAction,
  resource: AuditResource,
  resourceId: string,
  options: {
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    metadata?: Record<string, any>;
    success?: boolean;
    errorMessage?: string;
  } = {}
): Promise<void> {
  try {
    const supabase = await createClient();
    
    const auditLog: Omit<AuditLog, 'id' | 'timestamp'> = {
      userId: context.userId,
      userEmail: context.userEmail,
      action,
      resource,
      resourceId,
      resourceType: resource,
      oldValues: options.oldValues,
      newValues: options.newValues,
      metadata: options.metadata,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      unidadeId: context.unidadeId,
      success: options.success ?? true,
      errorMessage: options.errorMessage,
    };

    const { error } = await supabase
      .from('audit_logs')
      .insert(auditLog);

    if (error) {
      console.error('Erro ao registrar log de auditoria:', error);
      // Não lançar erro para não interromper a operação principal
    }
  } catch (error) {
    console.error('Erro inesperado ao registrar log de auditoria:', error);
    // Não lançar erro para não interromper a operação principal
  }
}

/**
 * Registra criação de recurso
 */
export async function logResourceCreated(
  context: AuditContext,
  resource: AuditResource,
  resourceId: string,
  newValues: Record<string, any>,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent(
    context,
    `${resource}_CREATED` as AuditAction,
    resource,
    resourceId,
    {
      newValues,
      metadata,
      success: true,
    }
  );
}

/**
 * Registra atualização de recurso
 */
export async function logResourceUpdated(
  context: AuditContext,
  resource: AuditResource,
  resourceId: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent(
    context,
    `${resource}_UPDATED` as AuditAction,
    resource,
    resourceId,
    {
      oldValues,
      newValues,
      metadata,
      success: true,
    }
  );
}

/**
 * Registra exclusão de recurso
 */
export async function logResourceDeleted(
  context: AuditContext,
  resource: AuditResource,
  resourceId: string,
  oldValues: Record<string, any>,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent(
    context,
    `${resource}_DELETED` as AuditAction,
    resource,
    resourceId,
    {
      oldValues,
      metadata,
      success: true,
    }
  );
}

/**
 * Registra operação de sucesso
 */
export async function logSuccessfulOperation(
  context: AuditContext,
  action: AuditAction,
  resource: AuditResource,
  resourceId: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent(
    context,
    action,
    resource,
    resourceId,
    {
      metadata,
      success: true,
    }
  );
}

/**
 * Registra operação com falha
 */
export async function logFailedOperation(
  context: AuditContext,
  action: AuditAction,
  resource: AuditResource,
  resourceId: string,
  errorMessage: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent(
    context,
    action,
    resource,
    resourceId,
    {
      metadata,
      success: false,
      errorMessage,
    }
  );
}

/**
 * Registra tentativa de acesso não autorizado
 */
export async function logUnauthorizedAccess(
  context: AuditContext,
  resource: AuditResource,
  resourceId: string,
  action: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent(
    context,
    'UNAUTHORIZED_ACCESS' as AuditAction,
    resource,
    resourceId,
    {
      metadata: {
        ...metadata,
        attemptedAction: action,
      },
      success: false,
      errorMessage: 'Acesso não autorizado',
    }
  );
}

/**
 * Registra alteração de configuração do sistema
 */
export async function logSystemConfigChange(
  context: AuditContext,
  configKey: string,
  oldValue: any,
  newValue: any,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent(
    context,
    AuditActions.SYSTEM_CONFIG_CHANGED,
    AuditResources.SYSTEM,
    configKey,
    {
      oldValues: { [configKey]: oldValue },
      newValues: { [configKey]: newValue },
      metadata,
      success: true,
    }
  );
}

/**
 * Busca logs de auditoria com filtros
 */
export async function getAuditLogs(
  filters: {
    userId?: string;
    action?: AuditAction;
    resource?: AuditResource;
    resourceId?: string;
    unidadeId?: string;
    startDate?: string;
    endDate?: string;
    success?: boolean;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
  try {
    const supabase = await createClient();
    
    // Construir query base
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    // Aplicar filtros
    if (filters.userId) {
      query = query.eq('userId', filters.userId);
    }

    if (filters.action) {
      query = query.eq('action', filters.action);
    }

    if (filters.resource) {
      query = query.eq('resource', filters.resource);
    }

    if (filters.resourceId) {
      query = query.eq('resourceId', filters.resourceId);
    }

    if (filters.unidadeId) {
      query = query.eq('unidadeId', filters.unidadeId);
    }

    if (filters.startDate) {
      query = query.gte('timestamp', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('timestamp', filters.endDate);
    }

    if (filters.success !== undefined) {
      query = query.eq('success', filters.success);
    }

    // Aplicar paginação
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;
    
    query = query.range(offset, offset + limit - 1);

    // Ordenar por timestamp (mais recente primeiro)
    query = query.order('timestamp', { ascending: false });

    // Executar query
    const { data: logs, error, count } = await query;

    if (error) {
      throw AppError.internalError(
        'Erro ao buscar logs de auditoria',
        { supabaseError: error }
      );
    }

    return {
      data: logs || [],
      total: count || 0,
      page,
      limit,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw AppError.internalError(
      'Erro inesperado ao buscar logs de auditoria',
      { originalError: error }
    );
  }
}

/**
 * Gera relatório de auditoria
 */
export async function generateAuditReport(
  filters: {
    unidadeId?: string;
    startDate: string;
    endDate: string;
    groupBy: 'action' | 'resource' | 'user' | 'day';
    format: 'json' | 'csv';
  }
): Promise<any> {
  try {
    const logs = await getAuditLogs({
      unidadeId: filters.unidadeId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      limit: 10000, // Buscar todos os logs do período
    });

    // Agrupar dados conforme solicitado
    const groupedData = groupAuditLogs(logs.data, filters.groupBy);

    if (filters.format === 'csv') {
      return convertToCSV(groupedData);
    }

    return {
      summary: {
        totalLogs: logs.total,
        period: {
          start: filters.startDate,
          end: filters.endDate,
        },
        groupBy: filters.groupBy,
      },
      data: groupedData,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw AppError.internalError(
      'Erro inesperado ao gerar relatório de auditoria',
      { originalError: error }
    );
  }
}

/**
 * Agrupa logs de auditoria por critério específico
 */
function groupAuditLogs(logs: AuditLog[], groupBy: string): Record<string, any> {
  const grouped: Record<string, any> = {};

  logs.forEach(log => {
    let key: string;

    switch (groupBy) {
      case 'action':
        key = log.action;
        break;
      case 'resource':
        key = log.resource;
        break;
      case 'user':
        key = log.userId;
        break;
      case 'day':
        key = log.timestamp.split('T')[0];
        break;
      default:
        key = 'unknown';
    }

    if (!grouped[key]) {
      grouped[key] = {
        count: 0,
        successCount: 0,
        failureCount: 0,
        logs: [],
      };
    }

    grouped[key].count++;
    if (log.success) {
      grouped[key].successCount++;
    } else {
      grouped[key].failureCount++;
    }
    grouped[key].logs.push(log);
  });

  return grouped;
}

/**
 * Converte dados para formato CSV
 */
function convertToCSV(data: Record<string, any>): string {
  const headers = ['Key', 'Count', 'Success Count', 'Failure Count'];
  const rows = Object.entries(data).map(([key, value]) => [
    key,
    value.count,
    value.successCount,
    value.failureCount,
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
}
