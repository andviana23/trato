"use client";

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardBody, CardHeader } from "@nextui-org/react";
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Financeiro
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Acompanhe suas receitas e despesas
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardBody className="p-6">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-sm opacity-90">Receita Hoje</p>
                <p className="text-2xl font-bold">R$ 450</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="p-6">
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-sm opacity-90">Receita Mensal</p>
                <p className="text-2xl font-bold">R$ 12.500</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardBody className="p-6">
            <div className="flex items-center">
              <ArrowTrendingDownIcon className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-sm opacity-90">Despesas Mensal</p>
                <p className="text-2xl font-bold">R$ 3.200</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Conteúdo principal */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Resumo Financeiro
          </h2>
        </CardHeader>
        <CardBody>
          <div className="text-center py-12">
            <CurrencyDollarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Funcionalidade em Desenvolvimento
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Em breve você poderá visualizar gráficos, relatórios e análises financeiras detalhadas.
            </p>
          </div>
        </CardBody>
      </Card>
    </DashboardLayout>
  );
} 
