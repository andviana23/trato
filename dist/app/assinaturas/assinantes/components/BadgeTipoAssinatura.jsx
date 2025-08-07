"use client";
import React from 'react';
// Configuração de cores por tipo
const tipoAssinaturaConfig = {
    'ASAAS_TRATO': {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        border: 'border-purple-200',
        label: '🟣 Asaas Trato'
    },
    'EXTERNAL': {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-200',
        label: '⚪ Pagamento Externo'
    }
};
export default function BadgeTipoAssinatura({ tipo, className = '' }) {
    const config = tipoAssinaturaConfig[tipo] || tipoAssinaturaConfig['EXTERNAL'];
    return (<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}>
      {config.label}
    </span>);
}
