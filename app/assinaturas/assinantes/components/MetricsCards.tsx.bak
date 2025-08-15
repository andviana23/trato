"use client";

import { Card, CardBody, Chip, Button } from '@nextui-org/react';
import { CreditCardIcon, UserGroupIcon, BanknotesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAssinantesData } from '../hooks/useAssinantesData';

export default function MetricsCards() {
  const { metrics, loading, refreshData } = useAssinantesData();

  return (
    <div className="space-y-6">
      {/* Botão de Refresh */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Assinantes</h2>
        <Button
          color="primary"
          variant="light"
          startContent={<ArrowPathIcon className="w-4 h-4" />}
          onClick={refreshData}
          isLoading={loading}
        >
          Atualizar Dados
        </Button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card ASAAS Trato */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">ASAAS Trato</p>
                <p className="text-3xl font-bold">
                  {metrics.asaasTrato.loading ? '...' : metrics.asaasTrato.active}
                </p>
                <p className="text-blue-100 text-sm">
                  Pagamentos Ativos
                </p>
                {metrics.asaasTrato.total && (
                  <p className="text-blue-200 text-xs mt-1">
                    Total confirmados: {metrics.asaasTrato.total}
                  </p>
                )}
                {metrics.asaasTrato.error && (
                  <Chip size="sm" color="danger" variant="flat" className="mt-2">
                    {metrics.asaasTrato.error}
                  </Chip>
                )}
              </div>
              <div className="bg-blue-400 p-3 rounded-lg">
                <CreditCardIcon className="w-6 h-6" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Card ASAAS Andrey */}
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">ASAAS Andrey</p>
                <p className="text-3xl font-bold">
                  {metrics.asaasAndrey.loading ? '...' : metrics.asaasAndrey.active}
                </p>
                <p className="text-green-100 text-sm">
                  Pagamentos Ativos
                </p>
                {metrics.asaasAndrey.total && (
                  <p className="text-green-200 text-xs mt-1">
                    Total confirmados: {metrics.asaasAndrey.total}
                  </p>
                )}
                {metrics.asaasAndrey.error && (
                  <Chip size="sm" color="danger" variant="flat" className="mt-2">
                    {metrics.asaasAndrey.error}
                  </Chip>
                )}
              </div>
              <div className="bg-green-400 p-3 rounded-lg">
                <UserGroupIcon className="w-6 h-6" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Card Pagamentos Externos */}
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Pagamentos Externos</p>
                <p className="text-3xl font-bold">
                  {metrics.external.loading ? '...' : metrics.external.active}
                </p>
                <p className="text-purple-100 text-sm">
                  Pagamentos Ativos
                </p>
                {metrics.external.total && (
                  <p className="text-purple-200 text-xs mt-1">
                    Total registrados: {metrics.external.total}
                  </p>
                )}
                {metrics.external.error && (
                  <Chip size="sm" color="danger" variant="flat" className="mt-2">
                    {metrics.external.error}
                  </Chip>
                )}
              </div>
              <div className="bg-purple-400 p-3 rounded-lg">
                <BanknotesIcon className="w-6 h-6" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
} 
