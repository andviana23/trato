"use client";

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Card, CardBody, CardHeader, Button, Avatar, Chip } from "@heroui/react";
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ClientesPage() {
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

  // Dados mockados para exemplo
  const clientes = [
    {
      id: 1,
      nome: "João Silva",
      email: "joao@email.com",
      telefone: "(11) 99999-9999",
      status: "ativo",
      ultimaVisita: "2024-01-15"
    },
    {
      id: 2,
      nome: "Pedro Santos",
      email: "pedro@email.com",
      telefone: "(11) 88888-8888",
      status: "ativo",
      ultimaVisita: "2024-01-14"
    },
    {
      id: 3,
      nome: "Carlos Oliveira",
      email: "carlos@email.com",
      telefone: "(11) 77777-7777",
      status: "inativo",
      ultimaVisita: "2024-01-10"
    }
  ];

  // Memoize datas formatadas para evitar hydration mismatch
  const clientesFormatados = useMemo(() => {
    return clientes.map((cliente) => ({
      ...cliente,
      ultimaVisitaFormatada: new Date(cliente.ultimaVisita).toLocaleDateString('pt-BR'),
    }));
  }, [clientes]);

  return (
    <DashboardLayout>
      {/* Header da página */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Clientes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie seus clientes e informações
          </p>
        </div>
        <Button
          color="primary"
          startContent={<PlusIcon className="w-4 h-4" />}
        >
          Novo Cliente
        </Button>
      </div>

      {/* Filtros e busca */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button variant="bordered">
              Filtrar
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Lista de clientes */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Lista de Clientes ({clientes.length})
          </h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {clientesFormatados.map((cliente) => (
              <div
                key={cliente.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <Avatar
                    name={cliente.nome}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {cliente.nome}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {cliente.email}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {cliente.telefone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Chip
                    color={cliente.status === 'ativo' ? 'success' : 'default'}
                    variant="flat"
                    size="sm"
                  >
                    {cliente.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </Chip>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Última visita
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {cliente.ultimaVisitaFormatada}
                    </p>
                  </div>
                  <Button
                    variant="light"
                    size="sm"
                  >
                    Ver detalhes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </DashboardLayout>
  );
} 