import * as Sentry from '@sentry/nextjs';

// Configuração do Sentry
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Configurações de performance
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Configurações de sessão
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Configurações de ambiente
  environment: process.env.NODE_ENV,
  
  // Configurações de debug
  debug: process.env.NODE_ENV === 'development',
  
  // Configurações de integração
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  
  // Configurações de contexto
  beforeSend(event) {
    // Filtrar eventos sensíveis
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    
    // Adicionar contexto do usuário
    if (event.user) {
      event.user.ip_address = '{{auto}}';
    }
    
    return event;
  },
  
  // Configurações de amostragem
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});

// Função para capturar erros
export const captureError = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

// Função para capturar mensagens
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

// Função para adicionar contexto do usuário
export const setUserContext = (user: {
  id: string;
  email?: string;
  username?: string;
  unidade?: string;
}) => {
  Sentry.setUser(user);
};

// Função para adicionar tags
export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

// Função para adicionar contexto extra
export const setContext = (name: string, context: Record<string, any>) => {
  Sentry.setContext(name, context);
};

// Função para capturar métricas de performance
export const capturePerformanceMetric = (
  name: string,
  value: number,
  unit: string = 'millisecond'
) => {
  Sentry.metrics.increment(name, value, {
    unit,
    tags: {
      environment: process.env.NODE_ENV || 'development',
    },
  });
};

// Função para capturar transação de performance
export const startTransaction = (
  name: string,
  operation: string
) => {
  return Sentry.startTransaction({
    name,
    op: operation,
  });
};

// Hook para capturar erros de React
export const captureReactError = (error: Error, errorInfo: React.ErrorInfo) => {
  Sentry.captureException(error, {
    extra: {
      componentStack: errorInfo.componentStack,
    },
  });
};

// Configuração para diferentes ambientes
export const configureSentryForEnvironment = () => {
  if (process.env.NODE_ENV === 'production') {
    // Configurações específicas para produção
    Sentry.setTag('environment', 'production');
    Sentry.setTag('version', process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0');
  } else if (process.env.NODE_ENV === 'staging') {
    // Configurações específicas para staging
    Sentry.setTag('environment', 'staging');
    Sentry.setTag('version', process.env.NEXT_PUBLIC_APP_VERSION || 'staging');
  } else {
    // Configurações para desenvolvimento
    Sentry.setTag('environment', 'development');
  }
};

// Inicializar configuração baseada no ambiente
configureSentryForEnvironment();

