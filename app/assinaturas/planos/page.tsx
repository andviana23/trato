"use client";
import React, { useState, useEffect } from "react";
import PlanosTable from "./components/PlanosTable";
import PlanoModal from "./components/PlanoModal";
import { getPlanos, criarPlano } from "@/lib/services/plans";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function PlanosPage() {
  const [modalAberto, setModalAberto] = useState(false);
  const [planos, setPlanos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [categorias, setCategorias] = useState<string[]>([]);
  const [planoEditando, setPlanoEditando] = useState<any | null>(null);

  useEffect(() => {
    async function fetchPlanos() {
      setCarregando(true);
      try {
        const data = await getPlanos();
        setPlanos(data || []);
        setCategorias(Array.from(new Set(data?.map((p: any) => p.categoria) || [])));
      } catch (e: any) {
        setErro("Erro ao buscar planos: " + (e.message || e));
      } finally {
        setCarregando(false);
      }
    }
    fetchPlanos();
  }, []);

  async function handleNovoPlano(plano: any) {
    try {
      const novo = await criarPlano(plano);
      if (!novo) throw new Error('Plano não foi criado.');
      setPlanos((prev) => [...prev, novo]);
    } catch (e: any) {
      setErro("Erro ao criar plano: " + (e.message || e));
    }
  }

  async function handleEditarPlano(plano: any) {
    setPlanoEditando(plano);
    setModalAberto(true);
  }

  async function handleSalvarPlanoEditado(planoEditado: any) {
    // Atualiza no backend e frontend
    // (implementar chamada para atualizar no banco, ex: await atualizarPlano(planoEditado))
    setPlanos((prev) => prev.map((p) => p.id === planoEditado.id ? planoEditado : p));
    setPlanoEditando(null);
    setModalAberto(false);
  }

  async function handleExcluirPlano(planoId: string) {
    if (window.confirm('Tem certeza que deseja excluir este plano?')) {
      // await excluirPlano(planoId); // implementar backend
      setPlanos((prev) => prev.filter((p) => p.id !== planoId));
    }
  }

  const planosFiltrados = planos.filter((plano) =>
    categoriaFiltro === "" || plano.categoria === categoriaFiltro
  );

  return (
    <DashboardLayout>
      <div>
        {/* Filtro de categoria global */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-1">Planos</h1>
            <p className="text-zinc-600 dark:text-zinc-400">Gestão de planos de assinatura disponíveis</p>
          </div>
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-4 py-2 border border-zinc-200 dark:border-zinc-700">
            <label htmlFor="filtro-categoria-global" className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">Filtrar por categoria:</label>
            <select
              id="filtro-categoria-global"
              value={categoriaFiltro}
              onChange={e => setCategoriaFiltro(e.target.value)}
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none"
            >
              <option value="">Todas</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <button
            className="bg-black hover:bg-zinc-800 text-white font-semibold px-6 py-2 rounded-lg shadow transition-colors"
            onClick={() => setModalAberto(true)}
          >
            Novo Plano
          </button>
        </div>

        {/* Mensagem de erro */}
        {erro && (
          <div className="mb-6">
            <div className="text-red-600 dark:text-red-400 text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {erro}
            </div>
          </div>
        )}

        {/* Conteúdo principal */}
        {carregando ? (
          <div className="flex justify-center items-center h-32">
            <span className="text-zinc-500 dark:text-zinc-300">Carregando planos...</span>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-6">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-6">Planos cadastrados</h2>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {planosFiltrados.map((plano) => (
                <li key={plano.id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm md:text-base">
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-100 text-base md:text-lg">{plano.nome}</span>
                    {plano.categoria && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium">{plano.categoria}</span>
                    )}
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">{plano.descricao}</div>
                  </div>
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-base md:text-lg">{plano.preco !== undefined && plano.preco !== null && !isNaN(plano.preco) ? `R$ ${plano.preco.toFixed(2)}` : 'R$ --'}</span>
                  <div className="flex gap-2 ml-2">
                    <button onClick={() => handleEditarPlano(plano)} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"><PencilIcon className="w-5 h-5 text-zinc-500" /></button>
                    <button onClick={() => handleExcluirPlano(plano.id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900"><TrashIcon className="w-5 h-5 text-red-500" /></button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Modal */}
        <PlanoModal open={modalAberto} plano={planoEditando} onClose={() => { setModalAberto(false); setPlanoEditando(null); }} onSalvar={planoEditando ? handleSalvarPlanoEditado : handleNovoPlano} />
      </div>
    </DashboardLayout>
  );
} 