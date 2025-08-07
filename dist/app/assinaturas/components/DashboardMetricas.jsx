import React, { useEffect, useState } from 'react';
import { FiUserPlus, FiTarget, FiDollarSign } from 'react-icons/fi';
function formatCurrency(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
const skeleton = (<div className="animate-pulse h-8 w-16 bg-gray-200 rounded"/>);
export default function DashboardMetricas() {
    const [stats, setStats] = useState({
        novosAssinantesMes: 0,
        metaAssinaturasMensal: 0,
        faturamentoParcial: 0,
    });
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetch('/api/dashboard-stats')
            .then(res => res.json())
            .then(data => {
            setStats(data);
            setLoading(false);
        });
    }, []);
    return (<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      {/* Card 1 */}
      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center group hover:shadow-lg transition cursor-pointer" title="Novos assinantes cadastrados neste mês">
        <div className="flex items-center gap-2 mb-2">
          <FiUserPlus className="w-6 h-6 text-blue-500"/>
          <span className="text-gray-500 text-sm">Novos Assinantes (Mês)</span>
        </div>
        <span className="text-3xl font-bold mt-2 text-blue-700">
          {loading ? skeleton : stats.novosAssinantesMes}
        </span>
      </div>
      {/* Card 2 */}
      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center group hover:shadow-lg transition cursor-pointer" title="Meta mensal de novos assinantes">
        <div className="flex items-center gap-2 mb-2">
          <FiTarget className="w-6 h-6 text-green-500"/>
          <span className="text-gray-500 text-sm">Meta Mensal</span>
        </div>
        <span className="text-3xl font-bold mt-2 text-green-700">
          {loading ? skeleton : `${stats.novosAssinantesMes} / ${stats.metaAssinaturasMensal}`}
        </span>
      </div>
      {/* Card 3 */}
      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center group hover:shadow-lg transition cursor-pointer" title="Faturamento parcial do mês">
        <div className="flex items-center gap-2 mb-2">
          <FiDollarSign className="w-6 h-6 text-yellow-500"/>
          <span className="text-gray-500 text-sm">Faturamento Parcial</span>
        </div>
        <span className="text-3xl font-bold mt-2 text-yellow-700">
          {loading ? skeleton : formatCurrency(stats.faturamentoParcial)}
        </span>
      </div>
    </div>);
}
