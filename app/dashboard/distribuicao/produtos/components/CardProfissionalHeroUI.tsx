import { Card } from '@heroicons/react/24/solid';
import { Progress } from '@nextui-org/react';
import { CheckCircleIcon, ShoppingCartIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import React from 'react';

interface CardProfissionalHeroUIProps {
  nome: string;
  avatarUrl?: string;
  produtosVendidos: number;
  meta: number;
  barbeiroId: string;
  unidadeId: string;
}

export default function CardProfissionalHeroUI({ nome, avatarUrl, produtosVendidos, meta }: CardProfissionalHeroUIProps) {
  const progresso = meta > 0 ? Math.min(100, Math.round((produtosVendidos / meta) * 100)) : 0;
  const faltam = Math.max(0, meta - produtosVendidos);
  let cor = 'bg-red-500';
  if (progresso >= 100) cor = 'bg-green-500';
  else if (progresso >= 80) cor = 'bg-yellow-400';

  return (
    <div className="w-full max-w-sm mx-auto rounded-2xl shadow-lg p-6 flex flex-col items-center bg-white relative">
      <div className="absolute top-4 right-4">
        {progresso >= 100 && (
          <span className="inline-flex items-center px-2 py-1 text-xs font-bold leading-none text-green-100 bg-green-600 rounded-full animate-bounce">
            <CheckCircleIcon className="w-4 h-4 mr-1" /> Meta Batida!
          </span>
        )}
      </div>
      <div className="mb-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt={nome} className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow" />
        ) : (
          <UserCircleIcon className="w-16 h-16 text-gray-300" />
        )}
      </div>
      <div className="text-xl font-bold text-gray-900 text-center mb-1">{nome}</div>
      <div className="flex items-center text-md text-gray-700 mb-2">
        <ShoppingCartIcon className="w-5 h-5 mr-1 text-blue-500" />
        <span className="font-semibold">{produtosVendidos}</span>
        <span className="mx-1">/</span>
        <span className="text-gray-500">{meta}</span>
        <span className="ml-2 text-xs text-gray-400">Produtos</span>
      </div>
      <div className="w-full flex flex-col items-center mb-2">
        <Progress
          aria-label="Progresso da Meta"
          value={progresso}
          className="w-full h-3 rounded-full"
          color={progresso >= 100 ? 'success' : progresso >= 80 ? 'warning' : 'danger'}
          showValueLabel={false}
        />
        <div className="text-xs mt-1 text-gray-500">{progresso}% da Meta</div>
      </div>
      {progresso < 100 ? (
        <div className="text-sm text-gray-700 mt-2">
          <span className="font-semibold text-yellow-600">⚡ Faltam {faltam} para a Meta!</span>
        </div>
      ) : null}
    </div>
  );
}