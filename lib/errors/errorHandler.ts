/**
 * Utilitário para Tratamento Centralizado de Erros
 * 
 * Este módulo fornece funções para capturar, processar e responder a erros
 * de forma consistente em todo o sistema.
 */

import { AppError } from './AppError';
import { ActionResult } from '@/lib/types/action';

/**
 * Wrapper para capturar erros em funções assíncronas
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw handleError(error, context);
  }
}

/**
 * Wrapper para capturar erros em Server Actions
 */
export async function withActionResultErrorHandling<T>(
  fn: () => Promise<ActionResult<T>>,
  context?: Record<string, any>
): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (error) {
    const appError = handleError(error, context);
    return appError.toApiResponse();
  }
}

/**
 * Processa e padroniza diferentes tipos de erro
 */
export function handleError(error: unknown, context?: Record<string, any>): AppError {
  // Se já é um AppError, retorna como está
  if (error instanceof AppError) {
    return error;
  }

  // Se é um erro de validação Zod
  if (error && typeof error === 'object' && 'errors' in error) {
    const zodError = error as { errors: Array<{ message: string; path: string[] }> };
    const messages = zodError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return AppError.validationError(`Dados inválidos: ${messages}`, context);
  }

  // Se é um erro do Supabase
  if (error && typeof error === 'object' && 'message' in error && 'code' in error) {
    const supabaseError = error as { message: string; code: string };
    
    switch (supabaseError.code) {
      case 'PGRST116': // Not found
        return AppError.notFoundError('Recurso', { ...context, supabaseCode: supabaseError.code });
      case '23505': // Unique violation
        return AppError.conflictError('Dados duplicados', { ...context, supabaseCode: supabaseError.code });
      case '23503': // Foreign key violation
        return AppError.validationError('Referência inválida', { ...context, supabaseCode: supabaseError.code });
      case '23514': // Check violation
        return AppError.validationError('Dados inválidos', { ...context, supabaseCode: supabaseError.code });
      default:
        return AppError.internalError(`Erro do banco: ${supabaseError.message}`, { ...context, supabaseCode: supabaseError.code });
    }
  }

  // Se é um erro padrão do JavaScript
  if (error instanceof Error) {
    return AppError.internalError(error.message, { ...context, originalError: error.name });
  }

  // Se é um erro desconhecido
  return AppError.internalError('Erro desconhecido', { ...context, originalError: String(error) });
}

/**
 * Função para logging estruturado de erros
 */
export function logError(error: unknown, context?: Record<string, any>): void {
  const appError = handleError(error, context);
  
  // O AppError já faz o log automático, mas podemos adicionar contexto adicional
  if (context) {
    console.error('📋 Contexto adicional:', context);
  }
}

/**
 * Função para criar resposta de erro padronizada
 */
export function createErrorResponse(error: unknown, context?: Record<string, any>): { success: false; error: string; errorId: string; context?: Record<string, any> } {
  const appError = handleError(error, context);
  return appError.toApiResponse();
}

/**
 * Função para verificar se um erro é operacional
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Função para extrair código de status de um erro
 */
export function getErrorStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  return 500;
}

/**
 * Função para extrair mensagem de erro de forma segura
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Erro desconhecido';
}
