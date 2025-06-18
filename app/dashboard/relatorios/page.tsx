"use client";

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardBody, CardHeader } from "@heroui/react";
import { ChartBarIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function RelatoriosPage() {
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
          Relatórios
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Visualize relatórios e análises detalhadas
        </p>
      </div>

      {/* Conteúdo principal */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Relatórios Disponíveis
          </h2>
        </CardHeader>
        <CardBody>
          <div className="text-center py-12">
            <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Funcionalidade em Desenvolvimento
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Em breve você poderá gerar relatórios de vendas, clientes, agendamentos e muito mais.
            </p>
          </div>
        </CardBody>
      </Card>
    </DashboardLayout>
  );
} 