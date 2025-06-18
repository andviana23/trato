"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button, Card, CardBody, CardHeader, Chip, Tooltip, Progress } from "@heroui/react";
import { ArrowPathIcon, UserGroupIcon, CreditCardIcon, BanknotesIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useAssinantesData } from "./hooks/useAssinantesData";
import { useFiltrosAssinantes } from "./hooks/useFiltrosAssinantes";
import AssinantesTable from "./components/AssinantesTable";
import CadastrarAssinanteModal from "./components/CadastrarAssinanteModal";

export default function AssinantesPage() {
  const [modalAberto, setModalAberto] = useState(false);
  const { allPayments, metrics, refreshData, loading } = useAssinantesData();
  const { filtros, setFiltros, assinantesFiltrados } = useFiltrosAssinantes(allPayments);

  const handleNovoAssinante = () => setModalAberto(true);
  const handleFecharModal = () => setModalAberto(false);
  const handleAssinanteCriado = () => refreshData();

  // Cálculos para UI
  const totalAssinantes = assinantesFiltrados.length;
  const ativosTrato = metrics.asaasTrato.active;
  const ativosAndrey = metrics.asaasAndrey.active;
  const ativosExternos = metrics.external.active;
  const totalAtivos = ativosTrato + ativosAndrey + ativosExternos;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1 flex items-center gap-2">
              <UserGroupIcon className="w-7 h-7 text-primary-500" /> Assinantes
            </h1>
            <p className="text-default-500">
              Gerencie todos os assinantes ativos e históricos do sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button color="primary" variant="flat" startContent={<ArrowPathIcon className="w-4 h-4" />} onPress={refreshData} isLoading={loading}>
              Atualizar Dados
            </Button>
            <Button color="success" onPress={handleNovoAssinante}>
              Novo Assinante
            </Button>
          </div>
        </div>

        {/* Cards de Destaque */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-sm">
            <CardBody className="flex flex-col items-center justify-center text-center p-4 gap-2">
              <span className="text-xs text-default-500">ASAAS Trato</span>
              <span className="text-2xl font-bold text-secondary-600">{ativosTrato}</span>
              <Chip color="secondary" variant="flat" className="mt-1">Ativos</Chip>
              <Tooltip content="Clientes ativos com pagamentos em dia pelo ASAAS Trato">
                <CreditCardIcon className="w-5 h-5 text-secondary-400 mt-2" />
              </Tooltip>
            </CardBody>
          </Card>
          <Card className="shadow-sm">
            <CardBody className="flex flex-col items-center justify-center text-center p-4 gap-2">
              <span className="text-xs text-default-500">ASAAS Andrey</span>
              <span className="text-2xl font-bold text-success-600">{ativosAndrey}</span>
              <Chip color="success" variant="flat" className="mt-1">Ativos</Chip>
              <Tooltip content="Clientes ativos com pagamentos em dia pelo ASAAS Andrey">
                <UserGroupIcon className="w-5 h-5 text-success-400 mt-2" />
              </Tooltip>
            </CardBody>
          </Card>
          <Card className="shadow-sm">
            <CardBody className="flex flex-col items-center justify-center text-center p-4 gap-2">
              <span className="text-xs text-default-500">Pagamentos Externos</span>
              <span className="text-2xl font-bold text-purple-600">{ativosExternos}</span>
              <Chip color="secondary" variant="flat" className="mt-1">Ativos</Chip>
              <Tooltip content="Clientes ativos com pagamentos externos">
                <BanknotesIcon className="w-5 h-5 text-purple-400 mt-2" />
              </Tooltip>
            </CardBody>
          </Card>
          <Card className="shadow-sm">
            <CardBody className="flex flex-col items-center justify-center text-center p-4 gap-2">
              <span className="text-xs text-default-500">Total Ativos</span>
              <span className="text-2xl font-bold text-foreground">{totalAtivos}</span>
              <Chip color="default" variant="flat" className="mt-1">Assinantes</Chip>
              <Tooltip content="Total de assinantes ativos em todas as fontes">
                <UserGroupIcon className="w-5 h-5 text-default-400 mt-2" />
              </Tooltip>
            </CardBody>
          </Card>
        </div>

        {/* Detalhamento Mensal */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary-500" /> Detalhamento Mensal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-md border-l-4 border-secondary-500">
              <CardBody className="flex flex-col items-center justify-center text-center p-4 gap-2">
                <span className="text-xs text-default-500">ASAAS Trato</span>
                <span className="text-2xl font-bold text-secondary-600">{ativosTrato}</span>
                <Progress value={totalAtivos ? Math.round((ativosTrato / totalAtivos) * 100) : 0} color="secondary" className="w-full mt-2" />
              </CardBody>
            </Card>
            <Card className="shadow-md border-l-4 border-success-500">
              <CardBody className="flex flex-col items-center justify-center text-center p-4 gap-2">
                <span className="text-xs text-default-500">ASAAS Andrey</span>
                <span className="text-2xl font-bold text-success-600">{ativosAndrey}</span>
                <Progress value={totalAtivos ? Math.round((ativosAndrey / totalAtivos) * 100) : 0} color="success" className="w-full mt-2" />
              </CardBody>
            </Card>
            <Card className="shadow-md border-l-4 border-purple-500">
              <CardBody className="flex flex-col items-center justify-center text-center p-4 gap-2">
                <span className="text-xs text-default-500">Pagamentos Externos</span>
                <span className="text-2xl font-bold text-purple-600">{ativosExternos}</span>
                <Progress value={totalAtivos ? Math.round((ativosExternos / totalAtivos) * 100) : 0} color="secondary" className="w-full mt-2" />
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Tabela de Assinantes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <AssinantesTable
            assinantes={assinantesFiltrados}
            loading={loading}
            onUpdate={refreshData}
          />
        </div>

        {/* Modal de Cadastro */}
        <CadastrarAssinanteModal
          open={modalAberto}
          onClose={handleFecharModal}
          onSuccess={handleAssinanteCriado}
        />
      </div>
    </DashboardLayout>
  );
} 