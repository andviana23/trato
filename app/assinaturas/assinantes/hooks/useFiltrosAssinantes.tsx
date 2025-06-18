"use client";

import { useState, useMemo } from 'react';

interface Filtros {
  nome: string;
  tipo: string;
  vencimento: string;
  ordenacao: string;
}

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

export function useFiltrosAssinantes(assinantes: Assinante[]) {
  const [filtros, setFiltros] = useState<Filtros>({
    nome: '',
    tipo: '',
    vencimento: '',
    ordenacao: 'NOME_ASC'
  });

  const assinantesFiltrados = useMemo(() => {
    let resultado = [...assinantes];

    // Filtro por nome (busca em nome, email e telefone)
    if (filtros.nome) {
      const termoBusca = filtros.nome.toLowerCase();
      resultado = resultado.filter(assinante => 
        assinante.customerName?.toLowerCase().includes(termoBusca) ||
        assinante.customerEmail?.toLowerCase().includes(termoBusca) ||
        assinante.telefone?.includes(termoBusca) ||
        assinante.description?.toLowerCase().includes(termoBusca)
      );
    }

    // Filtro por tipo
    if (filtros.tipo) {
      resultado = resultado.filter(assinante => assinante.source === filtros.tipo);
    }

    // Filtro por vencimento
    if (filtros.vencimento) {
      const hoje = new Date();
      
      resultado = resultado.filter(assinante => {
        if (!assinante.nextDueDate) return false;
        
        const dataVencimento = new Date(assinante.nextDueDate);
        const diasParaVencer = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        const diasCriado = assinante.created_at ? 
          Math.ceil((hoje.getTime() - new Date(assinante.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;

        switch (filtros.vencimento) {
          case 'PROXIMOS_VENCER':
            return diasParaVencer >= 0 && diasParaVencer <= 7;
          case 'VENCIDO':
            return diasParaVencer < 0;
          case 'NOVOS_ASSINANTES':
            return diasCriado <= 30;
          case 'ATIVOS':
            return assinante.status === 'ATIVO' || assinante.status === 'ACTIVE';
          default:
            return true;
        }
      });
    }

    // Ordenação
    resultado.sort((a, b) => {
      switch (filtros.ordenacao) {
        case 'NOME_ASC':
          return (a.customerName || '').localeCompare(b.customerName || '');
        case 'NOME_DESC':
          return (b.customerName || '').localeCompare(a.customerName || '');
        case 'VENCIMENTO_ASC':
          return new Date(a.nextDueDate || 0).getTime() - new Date(b.nextDueDate || 0).getTime();
        case 'VENCIMENTO_DESC':
          return new Date(b.nextDueDate || 0).getTime() - new Date(a.nextDueDate || 0).getTime();
        case 'CRIADO_DESC':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'CRIADO_ASC':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case 'VALOR_ASC':
          return (a.value || 0) - (b.value || 0);
        case 'VALOR_DESC':
          return (b.value || 0) - (a.value || 0);
        default:
          return 0;
      }
    });

    return resultado;
  }, [assinantes, filtros]);

  const limparFiltros = () => {
    setFiltros({
      nome: '',
      tipo: '',
      vencimento: '',
      ordenacao: 'NOME_ASC'
    });
  };

  return { 
    filtros, 
    setFiltros, 
    assinantesFiltrados, 
    limparFiltros 
  };
} 