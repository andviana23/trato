"use client";
import React, { useMemo } from 'react';
import { UsersIcon, CheckCircleIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';
export default function EstatisticasRapidas({ assinantes }) {
    const estatisticas = useMemo(() => {
        const total = assinantes.length;
        const ativos = assinantes.filter(a => {
            const status = (a.status || '').toUpperCase();
            const vencimento = a.nextDueDate;
            const diasParaVencer = vencimento ? Math.ceil((new Date(vencimento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
            if ((status === 'CANCELADA' || status === 'CANCELLED' || status === 'INACTIVE' || status === 'INATIVO') && diasParaVencer !== null && diasParaVencer >= 0) {
                return true;
            }
            return status === 'ATIVO' || status === 'ACTIVE';
        }).length;
        const proximosVencer = assinantes.filter(a => {
            if (!a.nextDueDate)
                return false;
            const dias = Math.ceil((new Date(a.nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return dias >= 0 && dias <= 7;
        }).length;
        const novos = assinantes.filter(a => {
            if (!a.created_at)
                return false;
            const dias = Math.ceil((new Date().getTime() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24));
            return dias <= 30;
        }).length;
        const vencidos = assinantes.filter(a => {
            if (!a.nextDueDate)
                return false;
            const dias = Math.ceil((new Date(a.nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return dias < 0;
        }).length;
        return { total, ativos, proximosVencer, novos, vencidos };
    }, [assinantes]);
    return (<div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      
      {/* Total */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{estatisticas.total}</p>
          </div>
          <UsersIcon className="w-8 h-8 text-blue-500"/>
        </div>
      </div>

      {/* Ativos */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Ativos</p>
            <p className="text-2xl font-bold text-green-600">{estatisticas.ativos}</p>
          </div>
          <CheckCircleIcon className="w-8 h-8 text-green-500"/>
        </div>
      </div>

      {/* Próximos a vencer */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Próximos a vencer</p>
            <p className="text-2xl font-bold text-orange-600">{estatisticas.proximosVencer}</p>
          </div>
          <ClockIcon className="w-8 h-8 text-orange-500"/>
        </div>
      </div>

      {/* Vencidos */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Vencidos</p>
            <p className="text-2xl font-bold text-red-600">{estatisticas.vencidos}</p>
          </div>
          <ClockIcon className="w-8 h-8 text-red-500"/>
        </div>
      </div>

      {/* Novos */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Novos (30 dias)</p>
            <p className="text-2xl font-bold text-purple-600">{estatisticas.novos}</p>
          </div>
          <SparklesIcon className="w-8 h-8 text-purple-500"/>
        </div>
      </div>

    </div>);
}
