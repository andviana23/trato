"use client";

import { useAuth, useRequireAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Card, CardBody, CardHeader, Avatar, Chip } from "@heroui/react";
import { UserIcon, BuildingOfficeIcon, CalendarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function DashboardPage() {
  useRequireAuth();
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  // Memoize datas formatadas para evitar hydration mismatch
  const dataCadastro = useMemo(() => {
    if (!user?.created_at) return '';
    return new Date(user.created_at).toLocaleDateString('pt-BR');
  }, [user?.created_at]);

  const ultimoAcesso = useMemo(() => {
    if (!user?.last_sign_in_at && !user?.created_at) return '';
    return new Date(user.last_sign_in_at || user.created_at).toLocaleDateString('pt-BR');
  }, [user?.last_sign_in_at, user?.created_at]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-barbershop-light to-white dark:from-barbershop-dark dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'barbershop_owner':
        return 'Proprietário';
      case 'professional':
        return 'Profissional';
      case 'client':
        return 'Cliente';
      case 'admin':
        return 'Administrador';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'barbershop_owner':
        return 'primary';
      case 'professional':
        return 'secondary';
      case 'client':
        return 'default';
      case 'admin':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <DashboardLayout>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Bem-vindo, {profile?.first_name || 'Usuário'}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie sua barbearia de forma eficiente e profissional
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="p-6">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-sm opacity-90">Clientes Hoje</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardBody className="p-6">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-sm opacity-90">Agendamentos</p>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardBody className="p-6">
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-sm opacity-90">Profissionais</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
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
      </div>

      {/* User Info Card */}
      <Card className="shadow-xl border-0">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Informações do Usuário
          </h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <p className="text-gray-900 dark:text-white">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome Completo
                </label>
                <p className="text-gray-900 dark:text-white">
                  {profile?.first_name} {profile?.last_name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefone
                </label>
                <p className="text-gray-900 dark:text-white">
                  {profile?.phone || 'Não informado'}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Função
                </label>
                <Chip
                  color={getRoleColor(profile?.role || 'client')}
                  variant="flat"
                >
                  {getRoleLabel(profile?.role || 'client')}
                </Chip>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data de Cadastro
                </label>
                <p className="text-gray-900 dark:text-white">
                  {dataCadastro}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Último Acesso
                </label>
                <p className="text-gray-900 dark:text-white">
                  {ultimoAcesso}
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </DashboardLayout>
  );
} 