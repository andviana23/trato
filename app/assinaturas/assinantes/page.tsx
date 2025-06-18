"use client";

import MetricsCards from "./components/MetricsCards";
import AssinantesTable from "./components/AssinantesTable";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function AssinantesPage() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Assinantes</h1>
        <p className="text-gray-600 dark:text-gray-400">Gestão unificada de assinantes ASAAS e pagamentos externos</p>
      </div>
      <MetricsCards />
      <div className="mt-8">
        <AssinantesTable />
      </div>
    </DashboardLayout>
  );
} 