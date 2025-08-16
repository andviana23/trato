// ============================================================================
// TIPOS PADRONIZADOS PARA SERVER ACTIONS
// ============================================================================

/**
 * Tipo padronizado para retorno de todas as Server Actions
 */
export type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Tipo para operações que não retornam dados
 */
export type ActionResultVoid = ActionResult<void>;

/**
 * Tipo para operações que retornam listas com paginação
 */
export type ActionResultPaginated<T> = ActionResult<{
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>;

/**
 * Tipo para operações que retornam estatísticas
 */
export type ActionResultStats<T = unknown> = ActionResult<{
  total: number;
  data: T[];
  period?: {
    startDate: string;
    endDate: string;
  };
}>;

/**
 * Tipo para operações de validação
 */
export type ValidationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  details?: string[];
};

/**
 * Tipo para operações de transação
 */
export type TransactionResult<T> = ActionResult<T>;

/**
 * Tipo para operações de auditoria
 */
export type AuditResult = ActionResult<{
  action: string;
  table: string;
  recordId: string;
  userId: string;
  timestamp: string;
}>;
