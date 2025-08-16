import { NextRequest, NextResponse } from 'next/server';
import { recordPerformanceMetrics } from './metricsService';

// ============================================================================
// MIDDLEWARE DE MONITORAMENTO DE PERFORMANCE
// ============================================================================

export interface PerformanceMiddlewareOptions {
  enabled: boolean;
  excludePaths?: string[];
  excludeMethods?: string[];
  slowRequestThreshold?: number; // em milissegundos
  logSlowRequests?: boolean;
}

const defaultOptions: PerformanceMiddlewareOptions = {
  enabled: true,
  excludePaths: ['/api/health', '/api/metrics', '/_next', '/favicon.ico'],
  excludeMethods: ['OPTIONS'],
  slowRequestThreshold: 5000, // 5 segundos
  logSlowRequests: true,
};

/**
 * Middleware para monitorar performance das requisições
 */
export function withPerformanceMonitoring(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: Partial<PerformanceMiddlewareOptions> = {}
) {
  const config = { ...defaultOptions, ...options };
  
  return async (req: NextRequest) => {
    if (!config.enabled) {
      return handler(req);
    }
    
    // Verificar se deve excluir o path
    if (config.excludePaths?.some(path => req.nextUrl.pathname.startsWith(path))) {
      return handler(req);
    }
    
    // Verificar se deve excluir o método
    if (config.excludeMethods?.includes(req.method)) {
      return handler(req);
    }
    
    const startTime = Date.now();
    let response: NextResponse;
    let error: Error | null = null;
    
    try {
      // Executar o handler original
      response = await handler(req);
      
      // Calcular tempo de resposta
      const responseTime = Date.now() - startTime;
      
      // Registrar métricas de performance
      recordPerformanceMetrics({
        endpoint: req.nextUrl.pathname,
        method: req.method,
        responseTime,
        statusCode: response.status,
        timestamp: new Date(),
        userId: extractUserId(req),
        unidadeId: extractUnidadeId(req),
        requestSize: req.headers.get('content-length') ? parseInt(req.headers.get('content-length')!) : undefined,
        responseSize: response.headers.get('content-length') ? parseInt(response.headers.get('content-length')!) : undefined,
      });
      
      // Log de requisições lentas
      if (config.logSlowRequests && responseTime > config.slowRequestThreshold) {
        console.warn(`🐌 Requisição lenta detectada: ${req.method} ${req.nextUrl.pathname} - ${responseTime}ms`);
      }
      
      return response;
      
    } catch (err) {
      error = err as Error;
      const responseTime = Date.now() - startTime;
      
      // Registrar métricas de erro
      recordPerformanceMetrics({
        endpoint: req.nextUrl.pathname,
        method: req.method,
        responseTime,
        statusCode: 500,
        timestamp: new Date(),
        userId: extractUserId(req),
        unidadeId: extractUnidadeId(req),
        error: error.message,
        requestSize: req.headers.get('content-length') ? parseInt(req.headers.get('content-length')!) : undefined,
      });
      
      console.error(`❌ Erro na requisição ${req.method} ${req.nextUrl.pathname}:`, error);
      
      // Re-throw o erro para ser tratado pelo handler de erro global
      throw error;
    }
  };
}

/**
 * Middleware para monitorar performance de Server Actions
 */
export function withServerActionMonitoring<T extends any[], R>(
  action: (...args: T) => Promise<R>,
  actionName: string,
  options: Partial<PerformanceMiddlewareOptions> = {}
) {
  const config = { ...defaultOptions, ...options };
  
  return async (...args: T): Promise<R> => {
    if (!config.enabled) {
      return action(...args);
    }
    
    const startTime = Date.now();
    let result: R;
    let error: Error | null = null;
    
    try {
      // Executar a Server Action original
      result = await action(...args);
      
      // Calcular tempo de execução
      const responseTime = Date.now() - startTime;
      
      // Registrar métricas de performance
      recordPerformanceMetrics({
        endpoint: `server-action:${actionName}`,
        method: 'POST',
        responseTime,
        statusCode: 200,
        timestamp: new Date(),
        userId: extractUserIdFromArgs(args),
        unidadeId: extractUnidadeIdFromArgs(args),
      });
      
      // Log de ações lentas
      if (config.logSlowRequests && responseTime > config.slowRequestThreshold) {
        console.warn(`🐌 Server Action lenta detectada: ${actionName} - ${responseTime}ms`);
      }
      
      return result;
      
    } catch (err) {
      error = err as Error;
      const responseTime = Date.now() - startTime;
      
      // Registrar métricas de erro
      recordPerformanceMetrics({
        endpoint: `server-action:${actionName}`,
        method: 'POST',
        responseTime,
        statusCode: 500,
        timestamp: new Date(),
        userId: extractUserIdFromArgs(args),
        unidadeId: extractUnidadeIdFromArgs(args),
        error: error.message,
      });
      
      console.error(`❌ Erro na Server Action ${actionName}:`, error);
      
      // Re-throw o erro
      throw error;
    }
  };
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Extrai o ID do usuário da requisição
 */
function extractUserId(req: NextRequest): string | undefined {
  try {
    // Tentar extrair do header de autorização
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Aqui você implementaria a decodificação do JWT para extrair o userId
      // Por enquanto, retornamos undefined
      return undefined;
    }
    
    // Tentar extrair do query parameter
    const userId = req.nextUrl.searchParams.get('userId');
    if (userId) {
      return userId;
    }
    
    return undefined;
  } catch (error) {
    return undefined;
  }
}

/**
 * Extrai o ID da unidade da requisição
 */
function extractUnidadeId(req: NextRequest): string | undefined {
  try {
    // Tentar extrair do header
    const unidadeId = req.headers.get('x-unidade-id');
    if (unidadeId) {
      return unidadeId;
    }
    
    // Tentar extrair do query parameter
    const unidadeIdParam = req.nextUrl.searchParams.get('unidadeId');
    if (unidadeIdParam) {
      return unidadeIdParam;
    }
    
    return undefined;
  } catch (error) {
    return undefined;
  }
}

/**
 * Extrai o ID do usuário dos argumentos da Server Action
 */
function extractUserIdFromArgs(args: any[]): string | undefined {
  try {
    // Procurar por userId nos argumentos
    for (const arg of args) {
      if (arg && typeof arg === 'object') {
        if (arg.userId) {
          return arg.userId;
        }
        if (arg.user && arg.user.id) {
          return arg.user.id;
        }
      }
    }
    return undefined;
  } catch (error) {
    return undefined;
  }
}

/**
 * Extrai o ID da unidade dos argumentos da Server Action
 */
function extractUnidadeIdFromArgs(args: any[]): string | undefined {
  try {
    // Procurar por unidadeId nos argumentos
    for (const arg of args) {
      if (arg && typeof arg === 'object') {
        if (arg.unidadeId) {
          return arg.unidadeId;
        }
        if (arg.unidade && arg.unidade.id) {
          return arg.unidade.id;
        }
      }
    }
    return undefined;
  } catch (error) {
    return undefined;
  }
}

// ============================================================================
// DECORATOR PARA SERVER ACTIONS
// ============================================================================

/**
 * Decorator para monitorar performance de Server Actions
 */
export function monitorPerformance(actionName: string, options?: Partial<PerformanceMiddlewareOptions>) {
  return function <T extends any[], R>(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = withServerActionMonitoring(originalMethod, actionName, options);
    
    return descriptor;
  };
}

// ============================================================================
// MIDDLEWARE PARA API ROUTES
// ============================================================================

/**
 * Middleware para monitorar performance de API Routes
 */
export function createPerformanceMiddleware(options?: Partial<PerformanceMiddlewareOptions>) {
  return function middleware(req: NextRequest) {
    return withPerformanceMonitoring(async (req) => {
      // Este é um placeholder - o middleware real será aplicado na API Route
      return new NextResponse('Not implemented', { status: 501 });
    }, options)(req);
  };
}

// ============================================================================
// UTILITÁRIOS PARA MONITORAMENTO
// ============================================================================

/**
 * Função para medir performance de uma função específica
 */
export async function measurePerformance<T>(
  fn: () => Promise<T>,
  operationName: string,
  context?: Record<string, any>
): Promise<T> {
  const startTime = Date.now();
  let result: T;
  let error: Error | null = null;
  
  try {
    result = await fn();
    
    const duration = Date.now() - startTime;
    
    // Registrar métricas de performance
    recordPerformanceMetrics({
      endpoint: `function:${operationName}`,
      method: 'FUNCTION',
      responseTime: duration,
      statusCode: 200,
      timestamp: new Date(),
      userId: context?.userId,
      unidadeId: context?.unidadeId,
    });
    
    return result;
    
  } catch (err) {
    error = err as Error;
    const duration = Date.now() - startTime;
    
    // Registrar métricas de erro
    recordPerformanceMetrics({
      endpoint: `function:${operationName}`,
      method: 'FUNCTION',
      responseTime: duration,
      statusCode: 500,
      timestamp: new Date(),
      userId: context?.userId,
      unidadeId: context?.unidadeId,
      error: error.message,
    });
    
    throw error;
  }
}

/**
 * Função para criar um timer de performance
 */
export function createPerformanceTimer(operationName: string, context?: Record<string, any>) {
  const startTime = Date.now();
  
  return {
    end: () => {
      const duration = Date.now() - startTime;
      
      recordPerformanceMetrics({
        endpoint: `timer:${operationName}`,
        method: 'TIMER',
        responseTime: duration,
        statusCode: 200,
        timestamp: new Date(),
        userId: context?.userId,
        unidadeId: context?.unidadeId,
      });
      
      return duration;
    },
    
    endWithError: (error: Error) => {
      const duration = Date.now() - startTime;
      
      recordPerformanceMetrics({
        endpoint: `timer:${operationName}`,
        method: 'TIMER',
        responseTime: duration,
        statusCode: 500,
        timestamp: new Date(),
        userId: context?.userId,
        unidadeId: context?.unidadeId,
        error: error.message,
      });
      
      return duration;
    },
  };
}
