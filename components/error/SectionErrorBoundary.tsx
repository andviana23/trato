'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  sectionName?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Erro na seção ${this.props.sectionName || 'desconhecida'}:`, error, errorInfo);
    
    // Aqui você pode enviar o erro para um serviço de logging como Sentry
    // Sentry.captureException(error, { 
    //   extra: errorInfo,
    //   tags: { section: this.props.sectionName }
    // });
    
    this.setState({ error });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <SectionErrorFallback 
          error={this.state.error} 
          sectionName={this.props.sectionName}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

function SectionErrorFallback({ 
  error, 
  sectionName, 
  onRetry 
}: { 
  error?: Error; 
  sectionName?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Erro ao carregar {sectionName ? `a seção "${sectionName}"` : 'esta seção'}
          </h3>
          <p className="mt-1 text-sm text-red-700">
            Ocorreu um problema ao carregar o conteúdo. Tente novamente.
          </p>
          
          {error && process.env.NODE_ENV === 'development' && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-medium text-red-600">
                Detalhes do erro
              </summary>
              <pre className="mt-1 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
          
          <div className="mt-3">
            <Button
              onClick={onRetry}
              size="sm"
              variant="outline"
              className="flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SectionErrorBoundary;
