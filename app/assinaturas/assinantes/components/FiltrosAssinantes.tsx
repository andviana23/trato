"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

export default function FiltrosAssinantes({ periodo, setPeriodo }: { periodo: { dataInicio?: string; dataFim?: string }; setPeriodo: (fn: (p: any) => any) => void }) {
  return (
    <div className="flex flex-wrap gap-4 items-end bg-white rounded-xl shadow p-4 mb-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Tipo de Pagamento</span>
        <Input placeholder="Cartão, PIX, Dinheiro..." className="w-48" />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">Período de vencimento</label>
        <Input type="date" value={periodo.dataInicio} onChange={e => setPeriodo(p => ({ ...p, dataInicio: e.target.value }))} className="w-36" />
        <span className="text-gray-500">até</span>
        <Input type="date" value={periodo.dataFim} onChange={e => setPeriodo(p => ({ ...p, dataFim: e.target.value }))} className="w-36" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Status de Vencimento</span>
        <Input placeholder="Todos / Pendentes / Confirmados" className="w-48" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Ordenar por</span>
        <Input placeholder="Data / Valor / Nome" className="w-48" />
      </div>
      <Button className="bg-red-100 text-red-600 font-semibold">Limpar</Button>
      {/* Chips de filtros ativos, se necessário */}
    </div>
  );
} 

