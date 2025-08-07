"use client";
import React from 'react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import FiltrosAtivos from './FiltrosAtivos';
export default function HeaderFiltros({ filtros, setFiltros, totalAssinantes, onNovoAssinante }) {
    return (<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      
      {/* Título e Total */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assinantes</h1>
          <p className="text-gray-600">{totalAssinantes} assinantes encontrados</p>
        </div>
        <button onClick={onNovoAssinante} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors">
          <PlusIcon className="w-4 h-4"/>
          Novo Assinante
        </button>
      </div>

      {/* Linha de Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Filtro por Nome */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buscar por nome
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"/>
            <input type="text" placeholder="Digite o nome do cliente..." value={filtros.nome} onChange={(e) => setFiltros(Object.assign(Object.assign({}, filtros), { nome: e.target.value }))} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"/>
          </div>
        </div>

        {/* Filtro por Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Pagamento
          </label>
          <select value={filtros.tipo} onChange={(e) => setFiltros(Object.assign(Object.assign({}, filtros), { tipo: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
            <option value="">Todos os tipos</option>
            <option value="ASAAS_TRATO">🟣 Asaas Trato</option>
            <option value="ASAAS_ANDREY">🟢 Asaas Andrey</option>
            <option value="EXTERNAL">⚪ Pagamento Externo</option>
          </select>
        </div>

        {/* Filtro por Vencimento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Por Vencimento
          </label>
          <select value={filtros.vencimento} onChange={(e) => setFiltros(Object.assign(Object.assign({}, filtros), { vencimento: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
            <option value="">Todos os períodos</option>
            <option value="PROXIMOS_VENCER">⏰ Próximos a vencer (7 dias)</option>
            <option value="VENCIDO">🔴 Vencidos</option>
            <option value="NOVOS_ASSINANTES">✨ Novos assinantes (30 dias)</option>
            <option value="ATIVOS">✅ Ativos</option>
          </select>
        </div>

        {/* Ordenação */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ordenar por
          </label>
          <select value={filtros.ordenacao} onChange={(e) => setFiltros(Object.assign(Object.assign({}, filtros), { ordenacao: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
            <option value="NOME_ASC">Nome (A-Z)</option>
            <option value="NOME_DESC">Nome (Z-A)</option>
            <option value="VENCIMENTO_ASC">Vencimento (próximo)</option>
            <option value="VENCIMENTO_DESC">Vencimento (distante)</option>
            <option value="CRIADO_DESC">Mais recentes</option>
            <option value="CRIADO_ASC">Mais antigos</option>
            <option value="VALOR_ASC">Valor (menor)</option>
            <option value="VALOR_DESC">Valor (maior)</option>
          </select>
        </div>

      </div>

      {/* Filtros Ativos */}
      <FiltrosAtivos filtros={filtros} setFiltros={setFiltros}/>
      
    </div>);
}
