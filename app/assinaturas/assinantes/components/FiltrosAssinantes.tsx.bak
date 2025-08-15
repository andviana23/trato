"use client";

import { Input, Select, Button, Chip } from "@nextui-org/react";
import { MagnifyingGlassIcon, XMarkIcon, FunnelIcon } from "@heroicons/react/24/outline";

interface Filtros {
  nome: string;
  tipo: string;
  vencimento: string;
  ordenacao: string;
  dataPagamentoInicio?: string;
  dataPagamentoFim?: string;
}

interface FiltrosAssinantesProps {
  filtros: Filtros;
  setFiltros: (filtros: Filtros) => void;
  limparFiltros: () => void;
  totalAssinantes: number;
  assinantesFiltrados: number;
}

export default function FiltrosAssinantes({ periodo, setPeriodo, ...props }) {
  return (
    <div className="flex flex-wrap gap-4 items-end bg-white rounded-xl shadow p-4 mb-4">
      <Select label="Tipo de Pagamento" className="w-48" />
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">Período de vencimento</label>
        <Input type="date" value={periodo.dataInicio} onChange={e => setPeriodo(p => ({ ...p, dataInicio: e.target.value }))} className="w-36" />
        <span className="text-gray-500">até</span>
        <Input type="date" value={periodo.dataFim} onChange={e => setPeriodo(p => ({ ...p, dataFim: e.target.value }))} className="w-36" />
      </div>
      <Select label="Status de Vencimento" className="w-48" />
      <Select label="Ordenar por" className="w-48" />
      <Button className="bg-red-100 text-red-600 font-semibold">Limpar</Button>
      {/* Chips de filtros ativos, se necessário */}
    </div>
  );
} 
