/**
 * Classe de Erro Customizada para o Sistema
 * 
 * Esta classe centraliza o tratamento de erros, fornecendo:
 * - Mensagens de erro estruturadas
 * - Códigos de status HTTP
 * - Contexto detalhado para debugging
 * - Logs estruturados
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly context?: Record<string, any>;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly errorId: string;

  constructor(
    message: string,
    statusCode: number = 500,
    context?: Record<string, any>,
    isOperational: boolean = true
  ) {
    super(message);
    
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.context = context;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.errorId = this.generateErrorId();
    
    // Garantir que a stack trace seja capturada corretamente
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
    
    // Log estruturado do erro
    this.logError();
  }

  /**
   * Gera um ID único para o erro
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log estruturado do erro
   */
  private logError(): void {
    const logData = {
      errorId: this.errorId,
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
      isOperational: this.isOperational,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };

    if (this.statusCode >= 500) {
      console.error('🚨 ERRO CRÍTICO:', logData);
    } else if (this.statusCode >= 400) {
      console.warn('⚠️ ERRO DO CLIENTE:', logData);
    } else {
      console.info('ℹ️ ERRO INFORMATIVO:', logData);
    }
  }

  /**
   * Cria um erro de validação
   */
  static validationError(message: string, context?: Record<string, any>): AppError {
    return new AppError(message, 400, context, true);
  }

  /**
   * Cria um erro de não encontrado
   */
  static notFoundError(resource: string, context?: Record<string, any>): AppError {
    return new AppError(`${resource} não encontrado`, 404, context, true);
  }

  /**
   * Cria um erro de não autorizado
   */
  static unauthorizedError(message: string = 'Não autorizado', context?: Record<string, any>): AppError {
    return new AppError(message, 401, context, true);
  }

  /**
   * Cria um erro de acesso negado
   */
  static forbiddenError(message: string = 'Acesso negado', context?: Record<string, any>): AppError {
    return new AppError(message, 403, context, true);
  }

  /**
   * Cria um erro de conflito
   */
  static conflictError(message: string, context?: Record<string, any>): AppError {
    return new AppError(message, 409, context, true);
  }

  /**
   * Cria um erro interno do servidor
   */
  static internalError(message: string = 'Erro interno do servidor', context?: Record<string, any>): AppError {
    return new AppError(message, 500, context, false);
  }

  /**
   * Cria um erro de serviço indisponível
   */
  static serviceUnavailableError(message: string = 'Serviço temporariamente indisponível', context?: Record<string, any>): AppError {
    return new AppError(message, 503, context, false);
  }

  /**
   * Converte o erro para um objeto serializável
   */
  toJSON(): Record<string, any> {
    return {
      errorId: this.errorId,
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      ...(this.context && { context: this.context }),
    };
  }

  /**
   * Converte o erro para uma resposta de API
   */
  toApiResponse(): { success: false; error: string; errorId: string; context?: Record<string, any> } {
    return {
      success: false,
      error: this.message,
      errorId: this.errorId,
      ...(this.context && { context: this.context }),
    };
  }
}

/**
 * Tipos de erro comuns
 */
export const ErrorTypes = {
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INTERNAL: 'INTERNAL',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorType = typeof ErrorTypes[keyof typeof ErrorTypes];
