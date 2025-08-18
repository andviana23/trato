'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erro capturado pelo Error Boundary:', error, errorInfo);
    
    // Aqui você pode enviar o erro para um serviço de logging como Sentry
    // Sentry.captureException(error, { extra: errorInfo });
    
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ error }: { error?: Error }) {
  const router = useRouter();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">
            Algo deu errado
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6 text-gray-600">
            Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver o problema.
          </p>
          
          {error && process.env.NODE_ENV === 'development' && (
            <details className="mb-4 text-left">
              <summary className="cursor-pointer text-sm font-medium text-gray-700">
                Detalhes do erro (desenvolvimento)
              </summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                {error.message}
                {error.stack}
              </pre>
            </details>
          )}
          
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
            <Button
              onClick={handleGoHome}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Ir para o início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GlobalErrorBoundary;
