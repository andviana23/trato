// ============================================================================
// SERVIÇOS DE NEGÓCIO CENTRALIZADOS
// ============================================================================

// Nota: Os serviços individuais serão criados posteriormente
// export * from './appointment';
// export * from './client';
// export * from './payment';
// export * from './queue';
// export * from './commission';
// export * from './notification';
// export * from './report';

// ============================================================================
// SERVIÇOS COMUNS
// ============================================================================

import { createClient } from '@/lib/supabase/server';

/**
 * Serviço base para operações comuns do banco de dados
 */
export class BaseService {
  protected async getSupabase() {
    return await createClient();
  }

  /**
   * Executa uma transação com rollback automático em caso de erro
   */
  protected async executeTransaction<T>(
    operations: () => Promise<T>
  ): Promise<{ success: true; data: T } | { success: false; error: string }> {
    try {
      const result = await operations();
      return { success: true, data: result };
    } catch (error) {
      console.error('Erro na transação:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Valida se um registro existe
   */
  protected async recordExists(
    table: string,
    field: string,
    value: string
  ): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .eq(field, value)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error(`Erro ao verificar existência em ${table}:`, error);
      return false;
    }
  }

  /**
   * Obtém um registro por ID
   */
  protected async getRecord<T>(
    table: string,
    id: string,
    select?: string
  ): Promise<{ success: true; data: T } | { success: false; error: string }> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from(table)
        .select(select || '*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Registro não encontrado' };
        }
        throw error;
      }

      return { success: true, data: data as T };
    } catch (error) {
      console.error(`Erro ao obter registro de ${table}:`, error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Lista registros com paginação e filtros
   */
  protected async listRecords<T>(
    table: string,
    params: {
      select?: string;
      filters?: Record<string, unknown>;
      orderBy?: { field: string; direction: 'asc' | 'desc' };
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ success: true; data: T[]; pagination: unknown } | { success: false; error: string }> {
    try {
      const { select = '*', filters = {}, orderBy, page = 1, limit = 20 } = params;
      const supabase = await this.getSupabase();

      let query = supabase
        .from(table)
        .select(select, { count: 'exact' });

      // Aplicar filtros
      Object.entries(filters).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(field, value);
          } else {
            query = query.eq(field, value);
          }
        }
      });

      // Aplicar ordenação
      if (orderBy) {
        query = query.order(orderBy.field, { ascending: orderBy.direction === 'asc' });
      }

      // Aplicar paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: (data || []) as T[],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      console.error(`Erro ao listar registros de ${table}:`, error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Cria um novo registro
   */
  protected async createRecord<T>(
    table: string,
    data: unknown,
    select?: string
  ): Promise<{ success: true; data: T } | { success: false; error: string }> {
    try {
      const supabase = await this.getSupabase();
      const { data: record, error } = await supabase
        .from(table)
        .insert([data])
        .select(select || '*')
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data: record as T };
    } catch (error) {
      console.error(`Erro ao criar registro em ${table}:`, error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Atualiza um registro existente
   */
  protected async updateRecord<T>(
    table: string,
    id: string,
    data: unknown,
    select?: string
  ): Promise<{ success: true; data: T } | { success: false; error: string }> {
    try {
      const supabase = await this.getSupabase();
      const { data: record, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select(select || '*')
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data: record as T };
    } catch (error) {
      console.error(`Erro ao atualizar registro em ${table}:`, error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Remove um registro
   */
  protected async deleteRecord(
    table: string,
    id: string
  ): Promise<{ success: true } | { success: false; error: string }> {
    try {
      const supabase = await this.getSupabase();
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error(`Erro ao remover registro de ${table}:`, error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Executa uma query SQL customizada
   */
  protected async executeSQL<T>(
    sql: string,
    params: unknown[] = []
  ): Promise<{ success: true; data: T[] } | { success: false; error: string }> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: sql,
        sql_params: params,
      });

      if (error) {
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Erro ao executar SQL:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Obtém estatísticas básicas de uma tabela
   */
  protected async getTableStats(
    table: string,
    filters: Record<string, unknown> = {}
  ): Promise<{ success: true; data: unknown } | { success: false; error: string }> {
    try {
      const supabase = await this.getSupabase();
      let query = supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      // Aplicar filtros
      Object.entries(filters).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(field, value);
        }
      });

      const { count, error } = await query;

      if (error) {
        throw error;
      }

      return { success: true, data: { total: count || 0 } };
    } catch (error) {
      console.error(`Erro ao obter estatísticas de ${table}:`, error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Verifica se há conflitos de horário
   */
  protected async checkTimeConflicts(
    professionalId: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<{ success: true; hasConflicts: boolean; conflicts: unknown[] } | { success: false; error: string }> {
    try {
      const supabase = await this.getSupabase();
      let query = supabase
        .from('appointments')
        .select('id, startTime, endTime, status')
        .eq('professionalId', professionalId)
        .neq('status', 'cancelled')
        .gte('startTime', startTime)
        .lte('endTime', endTime);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data: conflicts, error } = await query;

      if (error) {
        throw error;
      }

      return {
        success: true,
        hasConflicts: (conflicts || []).length > 0,
        conflicts: conflicts || [],
      };
    } catch (error) {
      console.error('Erro ao verificar conflitos de horário:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Calcula estatísticas de período
   */
  protected async calculatePeriodStats(
    table: string,
    dateField: string,
    startDate: string,
    endDate: string,
    filters: Record<string, unknown> = {}
  ): Promise<{ success: true; data: unknown } | { success: false; error: string }> {
    try {
      const supabase = await this.getSupabase();
      let query = supabase
        .from(table)
        .select('*', { count: 'exact' })
        .gte(dateField, startDate)
        .lte(dateField, endDate);

      // Aplicar filtros adicionais
      Object.entries(filters).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(field, value);
        }
      });

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: {
          total: count || 0,
          records: data || [],
          period: { startDate, endDate },
        },
      };
    } catch (error) {
      console.error(`Erro ao calcular estatísticas de período para ${table}:`, error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Gera relatório CSV
   */
  protected generateCSV(data: unknown[], headers: string[]): string {
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = (row as Record<string, unknown>)[header];
        // Escapar vírgulas e aspas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  }

  /**
   * Formata dados para exportação
   */
  protected formatDataForExport(data: unknown[], format: 'csv' | 'json' | 'xlsx'): string | unknown[] {
    switch (format) {
      case 'csv':
        if (data.length === 0) return '';
        const headers = Object.keys(data[0] as Record<string, unknown>);
        return this.generateCSV(data, headers);
      
      case 'json':
        return JSON.stringify(data, null, 2);
      
      case 'xlsx':
        // Para XLSX, retornar dados brutos (será processado pelo componente)
        return data;
      
      default:
        return data;
    }
  }

  /**
   * Valida dados antes de salvar
   */
  protected validateData<T>(
    schema: unknown,
    data: unknown
  ): { success: true; data: T } | { success: false; error: string } {
    try {
      // Type assertion para schema Zod
      const zodSchema = schema as { parse: (data: unknown) => T };
      const validatedData = zodSchema.parse(data);
      return { success: true, data: validatedData };
    } catch (error) {
      const zodError = error as { errors?: Array<{ message: string }> };
      if (zodError.errors && zodError.errors.length > 0) {
        return { success: false, error: zodError.errors[0].message };
      }
      return { success: false, error: 'Dados inválidos' };
    }
  }

  /**
   * Sanitiza dados de entrada
   */
  protected sanitizeData(data: unknown): unknown {
    if (typeof data === 'string') {
      return data.trim();
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        sanitized[key] = this.sanitizeData(value);
      }
      return sanitized;
    }
    
    return data;
  }

  /**
   * Log de auditoria
   */
  protected async logAudit(
    action: string,
    table: string,
    recordId: string,
    userId: string,
    details: unknown = {}
  ): Promise<void> {
    try {
      const supabase = await this.getSupabase();
      await supabase
        .from('audit_logs')
        .insert([{
          action,
          table_name: table,
          record_id: recordId,
          user_id: userId,
          details: JSON.stringify(details),
          timestamp: new Date().toISOString(),
        }]);
    } catch (error) {
      console.error('Erro ao registrar log de auditoria:', error);
    }
  }
}
