"use client";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Tab, Tabs, Pagination } from '@nextui-org/react';
import AssinanteDetalhesModal from './AssinanteDetalhesModal';
import BadgeTipoAssinatura from './BadgeTipoAssinatura';
import { useState } from 'react';
import { ExclamationTriangleIcon, ClockIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import React from 'react';
export default function AssinantesTable({ assinantes, loading = false, onUpdate }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [assinanteSelecionado, setAssinanteSelecionado] = useState(null);
    const [aba, setAba] = useState('ATIVAS');
    const [pagina, setPagina] = useState(1);
    const itensPorPagina = 10;
    // Filtrar por aba
    const assinantesFiltrados = assinantes.filter(a => {
        if (aba === 'ATIVAS')
            return a.status === 'ATIVO' || a.status === 'ACTIVE';
        if (aba === 'CANCELADAS')
            return a.status === 'CANCELADA' || a.status === 'CANCELLED' || a.status === 'INATIVO' || a.status === 'INACTIVE';
        return true;
    });
    // Paginação
    const totalPaginas = Math.ceil(assinantesFiltrados.length / itensPorPagina);
    const assinantesPaginados = assinantesFiltrados.slice((pagina - 1) * itensPorPagina, pagina * itensPorPagina);
    // Resetar página ao trocar de aba
    React.useEffect(() => { setPagina(1); }, [aba, assinantesFiltrados.length]);
    const handleVerDetalhes = (assinante) => {
        setAssinanteSelecionado(assinante);
        setModalOpen(true);
    };
    const handleFecharModal = () => {
        setModalOpen(false);
        setAssinanteSelecionado(null);
    };
    const handleCancelarAssinatura = (assinante) => {
        // TODO: Implementar chamada de API para cancelar assinatura
        console.log('Cancelar assinatura:', assinante);
        setModalOpen(false);
    };
    const handleConfirmarPagamento = (assinante) => {
        // TODO: Implementar chamada de API para confirmar pagamento externo
        console.log('Confirmar pagamento externo:', assinante);
        setModalOpen(false);
    };
    // Função para calcular dias até vencimento
    const getDiasParaVencer = (dataVencimento) => {
        if (!dataVencimento)
            return null;
        const hoje = new Date();
        const vencimento = new Date(dataVencimento);
        return Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    };
    // Função para formatar data
    const formatarData = (data) => {
        if (!data || data === 'Não informado')
            return 'Não informado';
        try {
            return new Date(data).toLocaleDateString('pt-BR');
        }
        catch (_a) {
            return data;
        }
    };
    // Função para obter classe de linha baseada no vencimento
    const getLinhaClass = (assinante) => {
        const diasParaVencer = getDiasParaVencer(assinante.nextDueDate);
        if (diasParaVencer === null)
            return '';
        if (diasParaVencer < 0)
            return 'bg-red-50 hover:bg-red-100';
        if (diasParaVencer <= 7)
            return 'bg-orange-50 hover:bg-orange-100';
        return 'hover:bg-gray-50';
    };
    // Função para decidir status visual na tabela
    const getStatusTabela = (assinante) => {
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
    return (<div className="p-4 md:p-8">
      {/* Abas */}
      <div className="mb-4 flex gap-2">
        <Tabs selectedKey={aba} onSelectionChange={key => setAba(key)}>
          <Tab key="ATIVAS" title={<span>Ativas</span>}/>
          <Tab key="CANCELADAS" title={<span>Canceladas</span>}/>
        </Tabs>
      </div>
      {/* Tabela */}
      <Table aria-label="Tabela de Assinantes" removeWrapper className="min-w-[800px]">
        <TableHeader>
          <TableColumn aria-label="Nome">NOME</TableColumn>
          <TableColumn aria-label="Plano">PLANO</TableColumn>
          <TableColumn aria-label="Valor">VALOR</TableColumn>
          <TableColumn aria-label="Fonte">FONTE</TableColumn>
          <TableColumn aria-label="Status">STATUS</TableColumn>
          <TableColumn aria-label="Próximo Vencimento">PRÓX. VENCIMENTO</TableColumn>
          <TableColumn className="font-bold bg-gray-50 text-gray-700">DATA DE PAGAMENTO</TableColumn>
          <TableColumn aria-label="Ações">AÇÕES</TableColumn>
        </TableHeader>
        <TableBody emptyContent={"Nenhum assinante encontrado."} isLoading={loading} loadingContent={<div className="text-center py-4">Carregando...</div>}>
          {assinantesPaginados.map((assinante) => {
            var _a, _b, _c;
            const diasParaVencer = getDiasParaVencer(assinante.nextDueDate);
            const isVencido = diasParaVencer !== null && diasParaVencer < 0;
            const isProximoVencer = diasParaVencer !== null && diasParaVencer >= 0 && diasParaVencer <= 7;
            const dataPagamento = assinante.paymentDate || assinante.lastPaymentDate;
            return (<TableRow key={assinante.id} className={`transition-colors ${getLinhaClass(assinante)}`}>
                <TableCell className="font-medium text-zinc-800 dark:text-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {((_b = (_a = assinante.customerName) === null || _a === void 0 ? void 0 : _a.charAt(0)) === null || _b === void 0 ? void 0 : _b.toUpperCase()) || '?'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{assinante.customerName}</span>
                        {isVencido && <ExclamationTriangleIcon className="w-4 h-4 text-red-500"/>}
                        {isProximoVencer && <ClockIcon className="w-4 h-4 text-orange-500"/>}
                      </div>
                      <p className="text-sm text-gray-500">{assinante.telefone || 'Não informado'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-zinc-600 dark:text-zinc-300">
                  <span className="text-xs break-all">{assinante.description || 'Não informado'}</span>
                </TableCell>
                <TableCell className="text-blue-700 dark:text-blue-400 font-bold text-lg">
                  <span className="bg-blue-100 dark:bg-blue-900 rounded px-2 py-1">R$ {Number((_c = assinante.value) !== null && _c !== void 0 ? _c : 0).toFixed(2)}</span>
                </TableCell>
                <TableCell>
                  <BadgeTipoAssinatura tipo={assinante.source}/>
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="solid" color={getStatusTabela(assinante).color} className={`px-2 py-1 text-xs font-semibold ${getStatusTabela(assinante).color === 'success' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400' : getStatusTabela(assinante).color === 'danger' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400' : getStatusTabela(assinante).color === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-400' : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-400'}`}>
                    {getStatusTabela(assinante).label}
                  </Chip>
                </TableCell>
                <TableCell className="text-zinc-600 dark:text-zinc-300">
                  <span className="font-medium text-green-700 dark:text-green-400">{formatarData(assinante.nextDueDate)}</span>
                </TableCell>
                <TableCell className="text-zinc-600 dark:text-zinc-300">
                  <span className="font-medium text-green-700 dark:text-green-400">{formatarData(dataPagamento)}</span>
                </TableCell>
                <TableCell>
                  <button className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-zinc-800 transition-colors" title="Ver Detalhes" onClick={() => handleVerDetalhes(assinante)}>
                    <MagnifyingGlassIcon className="w-4 h-4"/>
                    Ver Detalhes
                  </button>
                </TableCell>
              </TableRow>);
        })}
        </TableBody>
      </Table>
      {/* Paginação */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-600">
          Mostrando {assinantesPaginados.length > 0 ? ((pagina - 1) * itensPorPagina + 1) : 0} até {((pagina - 1) * itensPorPagina) + assinantesPaginados.length} de {assinantesFiltrados.length} registros
        </span>
        <Pagination total={totalPaginas} page={pagina} onChange={setPagina} showControls className=""/>
      </div>
      {/* Modal de Detalhes */}
      <AssinanteDetalhesModal open={modalOpen} onClose={handleFecharModal} assinante={assinanteSelecionado} onCancelar={handleCancelarAssinatura} onConfirmarPagamento={handleConfirmarPagamento} onUpdate={onUpdate}/>
    </div>);
}
