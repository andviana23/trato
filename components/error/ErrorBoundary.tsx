"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Log error for monitoring (Sentry, Datadog, etc.)
    this.props.onError?.(error, errorInfo);
    
    // You can also log the error to an error reporting service here
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  private handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl">Algo deu errado</CardTitle>
              <CardDescription>
                Ocorreu um erro inesperado. Nossa equipe foi notificada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="rounded-lg border p-3 text-sm">
                  <summary className="cursor-pointer font-medium mb-2">
                    Detalhes do erro (Desenvolvimento)
                  </summary>
                  <div className="space-y-2 text-xs font-mono">
                    <div>
                      <strong>Mensagem:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs mt-1">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  </div>
                </details>
              )}
              
              <div className="flex flex-col gap-2">
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar Novamente
                </Button>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={this.handleGoBack} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  
                  <Button variant="outline" onClick={this.handleGoHome} className="flex-1">
                    <Home className="mr-2 h-4 w-4" />
                    Início
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para usar em componentes funcionais
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error("Error caught by useErrorHandler:", error, errorInfo);
    
    // Log error for monitoring
    // Example: Sentry.captureException(error, { extra: errorInfo });
    
    // You can also show a toast notification here
    // Example: toast.error("Ocorreu um erro. Tente novamente.");
  };
}
