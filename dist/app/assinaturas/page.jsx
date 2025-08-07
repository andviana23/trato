"use client";
import React, { useState } from 'react';
import MenuLateral from './components/MenuLateral';
import DashboardMetricas from './components/DashboardMetricas';
import BarraFerramentas from './components/BarraFerramentas';
import TabelaAssinaturas from './components/TabelaAssinaturas';
export default function AssinaturasPage() {
    const [busca, setBusca] = useState('');
    const [refresh, setRefresh] = useState(false);
    // Função para atualizar a tabela após pagamento externo
    const handleRefresh = () => setRefresh(r => !r);
    return (<div className="min-h-screen flex bg-gray-50">
      {/* Menu lateral fixo */}
      <aside className="w-64 bg-white border-r border-gray-200 min-h-screen hidden md:block">
        <MenuLateral />
      </aside>
      {/* Conteúdo principal */}
      <main className="flex-1 p-4 md:p-10 max-w-7xl mx-auto w-full">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
          <ol className="list-none p-0 inline-flex gap-2">
            <li><span className="hover:underline cursor-pointer">Início</span> <span className="mx-1">/</span></li>
            <li className="text-blue-600 font-semibold">Assinaturas</li>
          </ol>
        </nav>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gerenciamento de Assinaturas</h1>
          <button className="md:hidden flex items-center gap-2 px-3 py-2 rounded bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Menu
          </button>
        </div>
        <section aria-label="Painel de métricas">
          <DashboardMetricas />
        </section>
        <section className="my-6" aria-label="Barra de ferramentas e busca">
          <BarraFerramentas busca={busca} setBusca={setBusca}/>
        </section>
        <section aria-label="Tabela de assinaturas">
          <TabelaAssinaturas busca={busca} refresh={refresh} onPagamentoExterno={handleRefresh}/>
        </section>
      </main>
    </div>);
}
