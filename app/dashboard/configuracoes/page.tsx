"use client";

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card } from "@chakra-ui/react";
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ConfiguracoesPage() {
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
        <h1>Configurações</h1>
        <p>Configure suas preferências e configurações do sistema</p>
      </div>

      {/* Conteúdo principal */}
      <Card.Root>
        <Card.Body pt={6}>
          <h2>Configurações do Sistema</h2>
          <div className="text-center py-12">
            <Cog6ToothIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3>Funcionalidade em Desenvolvimento</h3>
            <p>Em breve você poderá configurar horários, serviços, profissionais e outras configurações.</p>
          </div>
        </Card.Body>
      </Card.Root>
    </DashboardLayout>
  );
} 
