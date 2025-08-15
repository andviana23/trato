"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Pagination from '@/components/Pagination';
import AssinanteDetalhesModal from './AssinanteDetalhesModal';
import { useState } from 'react';
import React from 'react';

interface Assinante {
  id: string;
  customerName: string;
  customerEmail: string;
  value: number;
  lastPaymentDate: string;
  nextDueDate: string;
  status: string;
  billingType: string;
  description?: string;
  source: 'ASAAS_TRATO' | 'EXTERNAL';
  created_at?: string;
  telefone?: string;
  paymentDate?: string;
}

interface AssinantesTableProps {
  assinantes: Assinante[];
  loading?: boolean;
  onUpdate?: () => void;
}

export default function AssinantesTable({ assinantes, loading = false, onUpdate }: AssinantesTableProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [assinanteSelecionado, setAssinanteSelecionado] = useState<Assinante | null>(null);
  const [aba, setAba] = useState<'ATIVAS' | 'CANCELADAS'>('ATIVAS');
  const [pagina, setPagina] = useState(1);
  const itensPorPagina = 10;

  // Filtrar por aba
  const assinantesFiltrados = assinantes.filter(a => {
    if (aba === 'ATIVAS') return a.status === 'ATIVO' || a.status === 'ACTIVE';
    if (aba === 'CANCELADAS') return a.status === 'CANCELADA' || a.status === 'CANCELLED' || a.status === 'INATIVO' || a.status === 'INACTIVE';
    return true;
  });

  // Paginação
  const totalPaginas = Math.ceil(assinantesFiltrados.length / itensPorPagina);
  const assinantesPaginados = assinantesFiltrados.slice((pagina - 1) * itensPorPagina, pagina * itensPorPagina);

  // Resetar página ao trocar de aba
  React.useEffect(() => { setPagina(1); }, [aba, assinantesFiltrados.length]);

  const handleVerDetalhes = (assinante: Assinante) => {
    setAssinanteSelecionado(assinante);
    setModalOpen(true);
  };

  const handleFecharModal = () => {
    setModalOpen(false);
    setAssinanteSelecionado(null);
  };

  const handleCancelarAssinatura = (assinante: Assinante) => {
    // TODO: Implementar chamada de API para cancelar assinatura
    console.log('Cancelar assinatura:', assinante);
    setModalOpen(false);
  };

  const handleConfirmarPagamento = (assinante: Assinante) => {
    // TODO: Implementar chamada de API para confirmar pagamento externo
    console.log('Confirmar pagamento externo:', assinante);
    setModalOpen(false);
  };

  // Utilitários legacy removidos para simplificar (status/estilos calculados diretamente no render)

  return (
    <div className="p-4 md:p-8">
      {/* Abas */}
      <div className="mb-4">
        <Tabs value={aba} onValueChange={(key) => setAba(key as 'ATIVAS' | 'CANCELADAS')}>
          <TabsList>
            <TabsTrigger value="ATIVAS">Ativas</TabsTrigger>
            <TabsTrigger value="CANCELADAS">Canceladas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {/* Tabela */}
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome do Cliente</th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plano</th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status do Pagamento</th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data do Pagamento</th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Próx. Vencimento</th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Pagamento</th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {assinantesPaginados.map((assinante) => (
            <tr key={assinante.id} className="hover:bg-gray-100">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{assinante.customerName}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assinante.customerEmail}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {assinante.value.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className={assinante.status === 'CONFIRMED' ? 'bg-green-100 text-green-800 px-2 py-1 rounded' : 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded'}>{assinante.status}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assinante.lastPaymentDate}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assinante.nextDueDate}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assinante.billingType}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onClick={() => handleVerDetalhes(assinante)} className="text-indigo-600 hover:text-indigo-900">Detalhes</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Paginação */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-600">
          Mostrando {assinantesPaginados.length > 0 ? ((pagina - 1) * itensPorPagina + 1) : 0} até {((pagina - 1) * itensPorPagina) + assinantesPaginados.length} de {assinantesFiltrados.length} registros
        </span>
        <Pagination
          total={totalPaginas}
          page={pagina}
          onChange={setPagina}
          showControls
          className=""
        />
      </div>
      {/* Modal de Detalhes */}
      <AssinanteDetalhesModal
        open={modalOpen}
        onClose={handleFecharModal}
        assinante={assinanteSelecionado}
        onCancelar={handleCancelarAssinatura}
        onConfirmarPagamento={handleConfirmarPagamento}
        onUpdate={onUpdate}
      />
    </div>
  );
} 


