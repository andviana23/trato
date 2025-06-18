"use client";

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Filtros {
  nome: string;
  tipo: string;
  vencimento: string;
  ordenacao: string;
}

interface FiltrosAtivosProps {
  filtros: Filtros;
  setFiltros: (filtros: Filtros) => void;
}

// Configuração de tipos de assinatura
const tipoAssinaturaConfig = {
  'ASAAS_TRATO': {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200',
    label: '🟣 Asaas Trato'
  },
  'ASAAS_ANDREY': {
    bg: 'bg-green-100', 
    text: 'text-green-800',
    border: 'border-green-200',
    label: '🟢 Asaas Andrey'
  },
  'EXTERNAL': {
    bg: 'bg-gray-100',
    text: 'text-gray-800', 
    border: 'border-gray-200',
    label: '⚪ Pagamento Externo'
  }
};

// Função para obter label do filtro de vencimento
const getFiltroVencimentoLabel = (vencimento: string) => {
  const labels = {
    'PROXIMOS_VENCER': '⏰ Próximos a vencer (7 dias)',
    'VENCIDO': '🔴 Vencidos',
    'NOVOS_ASSINANTES': '✨ Novos assinantes (30 dias)',
    'ATIVOS': '✅ Ativos'
  };
  return labels[vencimento as keyof typeof labels] || vencimento;
};

export default function FiltrosAtivos({ filtros, setFiltros }: FiltrosAtivosProps) {
  const filtrosAtivos = [];
  
  if (filtros.nome) {
    filtrosAtivos.push({ 
      key: 'nome', 
      label: `Nome: "${filtros.nome}"`,
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    });
  }
  
  if (filtros.tipo) {
    const config = tipoAssinaturaConfig[filtros.tipo as keyof typeof tipoAssinaturaConfig];
    filtrosAtivos.push({ 
      key: 'tipo', 
      label: `Tipo: ${config?.label}`,
      color: `${config?.bg} ${config?.text} ${config?.border}`
    });
  }
  
  if (filtros.vencimento) {
    filtrosAtivos.push({ 
      key: 'vencimento', 
      label: getFiltroVencimentoLabel(filtros.vencimento),
      color: 'bg-orange-100 text-orange-800 border-orange-200'
    });
  }

  if (filtrosAtivos.length === 0) return null;

  const removerFiltro = (key: string) => {
    setFiltros({ ...filtros, [key]: '' });
  };

  const limparTodos = () => {
    setFiltros({
      nome: '',
      tipo: '',
      vencimento: '',
      ordenacao: 'NOME_ASC'
    });
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-600 font-medium">Filtros ativos:</span>
        
        {filtrosAtivos.map((filtro) => (
          <span 
            key={filtro.key}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${filtro.color}`}
          >
            {filtro.label}
            <button
              onClick={() => removerFiltro(filtro.key)}
              className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
              title={`Remover filtro ${filtro.label}`}
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </span>
        ))}
        
        <button
          onClick={limparTodos}
          className="text-sm text-gray-500 hover:text-gray-700 underline font-medium transition-colors"
        >
          Limpar todos
        </button>
      </div>
    </div>
  );
} 