import React from 'react';
import { FiSearch } from 'react-icons/fi';

type Props = {
  busca: string;
  setBusca: (valor: string) => void;
};

export default function BarraFerramentas({ busca, setBusca }: Props) {
  return (
    <div className="flex items-center gap-2 w-full max-w-xl bg-white rounded-lg shadow px-3 py-2">
      <FiSearch className="w-5 h-5 text-gray-400" aria-hidden="true" />
      <input
        type="text"
        placeholder="Buscar assinante por nome ou e-mail..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
        className="flex-1 px-2 py-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
        aria-label="Buscar assinante por nome ou e-mail"
        autoFocus
      />
    </div>
  );
} 