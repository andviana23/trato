import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface Plano {
  id: string;
  nome: string;
  preco: number;
  descricao: string;
  categoria?: string;
}

interface PlanosTableProps {
  planos: Plano[];
  onNovoPlano: () => void;
}

export default function PlanosTable({ planos, onNovoPlano }: PlanosTableProps) {
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("");

  // Extrai categorias únicas dos planos
  const categorias = Array.from(new Set(planos.map((p) => p.categoria).filter(Boolean)));

  // Filtra os planos pela categoria selecionada
  const planosFiltrados = categoriaFiltro
    ? planos.filter((plano) => plano.categoria === categoriaFiltro)
    : planos;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-4 md:p-8 transition-colors duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-zinc-800 dark:text-zinc-100">Planos cadastrados</h2>
        <Button className="font-semibold px-6 py-2" onClick={onNovoPlano}>
          Novo Plano
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {planos.map((plano) => (
          <div
            key={plano.id}
            className="flex flex-col justify-between bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-lg transition-shadow p-6 min-h-[180px]"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-bold text-zinc-800 dark:text-zinc-100">{plano.nome}</span>
                <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium">{plano.categoria || 'Sem categoria'}</span>
              </div>
              <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mb-2 block">{plano.preco !== undefined && plano.preco !== null && !isNaN(plano.preco) ? `R$ ${plano.preco.toFixed(2)}` : 'R$ --'}</span>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-2 line-clamp-3">{plano.descricao}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 

