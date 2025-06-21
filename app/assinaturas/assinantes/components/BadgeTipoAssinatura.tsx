"use client";

import React from 'react';

interface BadgeTipoAssinaturaProps {
  tipo: string;
  className?: string;
}

// Configuração de cores por tipo
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

export default function BadgeTipoAssinatura({ tipo, className = '' }: BadgeTipoAssinaturaProps) {
  const config = tipoAssinaturaConfig[tipo as keyof typeof tipoAssinaturaConfig] || tipoAssinaturaConfig['EXTERNAL'];
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}>
      {config.label}
    </span>
  );
} 
