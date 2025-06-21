"use client";

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Card, CardBody, CardHeader, Button, Chip } from "@nextui-org/react";
import { PlusIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AgendamentosPage() {
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
  const agendamentos = [
    {
      id: 1,
      cliente: "João Silva",
      servico: "Corte + Barba",
      profissional: "Carlos",
      data: "2024-01-20",
      horario: "14:00",
      status: "confirmado",
      valor: "R$ 45,00"
    },
    {
      id: 2,
      cliente: "Pedro Santos",
      servico: "Corte",
      profissional: "Miguel",
      data: "2024-01-20",
      horario: "15:30",
      status: "pendente",
      valor: "R$ 30,00"
    },
    {
      id: 3,
      cliente: "André Costa",
      servico: "Barba",
      profissional: "Carlos",
      data: "2024-01-20",
      horario: "16:00",
      status: "cancelado",
      valor: "R$ 25,00"
    }
  ];

  // Memoize datas formatadas para evitar hydration mismatch
  const agendamentosFormatados = useMemo(() => {
    return agendamentos.map((agendamento) => ({
      ...agendamento,
      dataFormatada: new Date(agendamento.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    }));
  }, [agendamentos]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'success';
      case 'pendente':
        return 'warning';
      case 'cancelado':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'Confirmado';
      case 'pendente':
        return 'Pendente';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <DashboardLayout>
      {/* Header da página */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Agendamentos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie os horários e compromissos
          </p>
        </div>
        <Button
          color="primary"
          startContent={<PlusIcon className="w-4 h-4" />}
        >
          Novo Agendamento
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="p-6">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-sm opacity-90">Hoje</p>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardBody className="p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-sm opacity-90">Confirmados</p>
                <p className="text-2xl font-bold">5</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardBody className="p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-sm opacity-90">Pendentes</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Lista de agendamentos */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Agendamentos de Hoje ({agendamentos.length})
          </h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {agendamentosFormatados.map((agendamento) => (
              <div
                key={agendamento.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {agendamento.dataFormatada}
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {agendamento.horario}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {agendamento.cliente}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {agendamento.servico} • {agendamento.profissional}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {agendamento.valor}
                    </p>
                  </div>
                  <Chip
                    color={getStatusColor(agendamento.status)}
                    variant="flat"
                    size="sm"
                  >
                    {getStatusLabel(agendamento.status)}
                  </Chip>
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
