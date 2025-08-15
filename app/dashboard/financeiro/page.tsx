"use client";

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card } from "@chakra-ui/react";
import { CurrencyDollarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function FinanceiroPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null;
  }

  return (
    <DashboardLayout>
      {/* Header da página */}
      <div>
        <h1>Financeiro</h1>
        <p>Acompanhe suas receitas e despesas</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card.Root>
          <Card.Body>
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-sm opacity-90">Receita Hoje</p>
                <p className="text-2xl font-bold">R$ 450</p>
              </div>
            </div>
          </Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Body>
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-sm opacity-90">Receita Mensal</p>
                <p className="text-2xl font-bold">R$ 12.500</p>
              </div>
            </div>
          </Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Body>
            <div className="flex items-center">
              <ArrowTrendingDownIcon className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-sm opacity-90">Despesas Mensal</p>
                <p className="text-2xl font-bold">R$ 3.200</p>
              </div>
            </div>
          </Card.Body>
        </Card.Root>
      </div>

      {/* Conteúdo principal */}
      <Card.Root>
        <Card.Body pt={6}>
          <h2>Resumo Financeiro</h2>
          <div className="text-center py-12">
            <CurrencyDollarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3>Funcionalidade em Desenvolvimento</h3>
            <p>Em breve você poderá visualizar gráficos, relatórios e análises financeiras detalhadas.</p>
          </div>
        </Card.Body>
      </Card.Root>
    </DashboardLayout>
  );
} 
