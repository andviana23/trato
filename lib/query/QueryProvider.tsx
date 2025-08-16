/**
 * Provider do React Query
 * 
 * Este componente fornece o contexto do React Query para toda a aplicação,
 * permitindo o uso de hooks como useQuery e useMutation.
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Criar uma nova instância do QueryClient para cada sessão do usuário
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Tempo que os dados ficam "frescos" (não precisam ser refetched)
            staleTime: 5 * 60 * 1000, // 5 minutos
            
            // Tempo que os dados ficam em cache
            gcTime: 10 * 60 * 1000, // 10 minutos
            
            // Número de tentativas em caso de falha
            retry: (failureCount, error) => {
              // Não tentar novamente para erros 4xx (erros do cliente)
              if (error && typeof error === 'object' && 'statusCode' in error) {
                const statusCode = (error as any).statusCode;
                if (statusCode >= 400 && statusCode < 500) {
                  return false;
                }
              }
              
              // Máximo de 3 tentativas para erros 5xx
              return failureCount < 3;
            },
            
            // Delay entre tentativas (exponencial backoff)
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            
            // Refetch automático quando reconecta à internet
            refetchOnReconnect: true,
            
            // Refetch automático quando sai do modo offline
            refetchOnMount: true,
            
            // Não refetch automaticamente em background
            refetchOnWindowFocus: false,
          },
          mutations: {
            // Número de tentativas para mutações
            retry: 1,
            
            // Retry delay para mutações
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools apenas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}
