"use client";

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card } from "@chakra-ui/react";
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
      <div>
        <h1>Relatórios</h1>
        <p>Visualize relatórios e análises detalhadas</p>
      </div>

      {/* Conteúdo principal */}
      <Card.Root>
        <Card.Body pt={6}>
          <h2>Relatórios Disponíveis</h2>
          <div style={{ textAlign: "center", padding: "3rem 0" }}>
            <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3>Funcionalidade em Desenvolvimento</h3>
            <p>
              Em breve você poderá gerar relatórios de vendas, clientes, agendamentos e muito mais.
            </p>
          </div>
        </Card.Body>
      </Card.Root>
    </DashboardLayout>
  );
} 
