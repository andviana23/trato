"use client";

import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button } from '@heroui/react';
import AssinanteDetalhesModal from './AssinanteDetalhesModal';
import BadgeTipoAssinatura from './BadgeTipoAssinatura';
import { useState } from 'react';
import { 
  ExclamationTriangleIcon, 
  ClockIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

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
  source: 'ASAAS_TRATO' | 'ASAAS_ANDREY' | 'EXTERNAL';
  created_at?: string;
  telefone?: string;
}

interface AssinantesTableProps {
  assinantes: Assinante[];
  loading?: boolean;
  onUpdate?: () => void;
}

export default function AssinantesTable({ assinantes, loading = false, onUpdate }: AssinantesTableProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [assinanteSelecionado, setAssinanteSelecionado] = useState<Assinante | null>(null);

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

  // Função para calcular dias até vencimento
  const getDiasParaVencer = (dataVencimento: string) => {
    if (!dataVencimento) return null;
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    return Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Função para formatar data
  const formatarData = (data: string) => {
    if (!data) return 'Não informado';
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch {
      return data;
    }
  };

  // Função para obter classe de linha baseada no vencimento
  const getLinhaClass = (assinante: Assinante) => {
    const diasParaVencer = getDiasParaVencer(assinante.nextDueDate);
    if (diasParaVencer === null) return '';
    if (diasParaVencer < 0) return 'bg-red-50 hover:bg-red-100';
    if (diasParaVencer <= 7) return 'bg-orange-50 hover:bg-orange-100';
    return 'hover:bg-gray-50';
  };

  // Função para decidir status visual na tabela
  const getStatusTabela = (assinante: any) => {
    const status = (assinante.status || '').toUpperCase();
    const vencimento = assinante.nextDueDate;
    const diasParaVencer = getDiasParaVencer(vencimento);
    // Se cancelada/cancelled e vencimento futuro, mostrar como Ativo
    if ((status === 'CANCELADA' || status === 'CANCELLED') && diasParaVencer !== null && diasParaVencer >= 0) {
      return { color: 'success', label: 'Ativo' };
    }
    // Se status for INACTIVE mas vencimento futuro, mostrar como Ativo
    if ((status === 'INACTIVE' || status === 'INATIVO') && diasParaVencer !== null && diasParaVencer >= 0) {
      return { color: 'success', label: 'Ativo' };
    }
    if (status === 'ATIVO' || status === 'ACTIVE') {
      return { color: 'success', label: 'Ativo' };
    }
    if (status === 'PENDENTE' || status === 'PENDING') {
      return { color: 'warning', label: 'Pendente' };
    }
    if (status === 'ATRASADO' || status === 'OVERDUE') {
      return { color: 'danger', label: 'Atrasado' };
    }
    // Só mostrar cancelada se já passou do vencimento (não deveria aparecer na lista)
    if ((status === 'CANCELADA' || status === 'CANCELLED' || status === 'INACTIVE' || status === 'INATIVO') && diasParaVencer !== null && diasParaVencer < 0) {
      return { color: 'danger', label: 'Cancelada' };
    }
    return { color: 'default', label: status };
  };

  return (
    <div className="p-4 md:p-8">
      <Table aria-label="Tabela de Assinantes" removeWrapper className="min-w-[800px]">
        <TableHeader>
          <TableColumn>NOME</TableColumn>
          <TableColumn>EMAIL</TableColumn>
          <TableColumn>VALOR</TableColumn>
          <TableColumn>FONTE</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>PRÓX. VENCIMENTO</TableColumn>
          <TableColumn>AÇÕES</TableColumn>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-zinc-500 dark:text-zinc-300">Carregando...</TableCell>
            </TableRow>
          ) : assinantes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-zinc-400 dark:text-zinc-500">Nenhum assinante encontrado.</TableCell>
            </TableRow>
          ) : assinantes.map((assinante) => {
            const diasParaVencer = getDiasParaVencer(assinante.nextDueDate);
            const isVencido = diasParaVencer !== null && diasParaVencer < 0;
            const isProximoVencer = diasParaVencer !== null && diasParaVencer >= 0 && diasParaVencer <= 7;
            
            return (
              <TableRow 
                key={assinante.id} 
                className={`transition-colors ${getLinhaClass(assinante)}`}
              >
                <TableCell className="font-medium text-zinc-800 dark:text-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {assinante.customerName?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{assinante.customerName}</span>
                        {isVencido && <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />}
                        {isProximoVencer && <ClockIcon className="w-4 h-4 text-orange-500" />}
                      </div>
                      <p className="text-sm text-gray-500">{assinante.telefone || 'Não informado'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-zinc-600 dark:text-zinc-300">
                  <span className="text-xs break-all">{assinante.customerEmail}</span>
                </TableCell>
                <TableCell className="text-blue-600 dark:text-blue-400 font-bold">
                  R$ {Number(assinante.value ?? 0).toFixed(2)}
                </TableCell>
                <TableCell>
                  <BadgeTipoAssinatura tipo={assinante.source} />
                </TableCell>
                <TableCell>
                  <Chip
                    size="sm"
                    variant="flat"
                    color={getStatusTabela(assinante).color}
                    className="px-2 py-1 text-xs font-semibold"
                  >
                    {getStatusTabela(assinante).label}
                  </Chip>
                </TableCell>
                <TableCell className="text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${
                      isVencido ? 'text-red-600' : 
                      isProximoVencer ? 'text-orange-600' : 
                      'text-gray-900'
                    }`}>
                      {formatarData(assinante.nextDueDate)}
                    </span>
                    {diasParaVencer !== null && (
                      <span className="text-xs text-gray-500">
                        ({diasParaVencer >= 0 ? `${diasParaVencer} dias` : `${Math.abs(diasParaVencer)} dias atrasado`})
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <button
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-zinc-800 transition-colors"
                    title="Ver Detalhes"
                    onClick={() => handleVerDetalhes(assinante)}
                  >
                    <MagnifyingGlassIcon className="w-4 h-4" />
                    Ver Detalhes
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
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