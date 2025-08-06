import { Card, CardHeader, CardBody, Avatar, Tooltip } from "@nextui-org/react";
import { ReactNode } from "react";

interface Props {
  nome: string;
  avatarUrl: string;
  minutos: number;
  percentual: number;
  comissao: number;
  ticketMedio: number;
  tipos: Record<string, number>;
  tipoServicoIcone: Record<string, ReactNode>;
  onClick: () => void;
}

export function ComissaoBarbeiroCard({
  nome, avatarUrl, minutos, percentual, comissao, ticketMedio, tipos, tipoServicoIcone, onClick
}: Props) {
  return (
    <div className="rounded-2xl shadow-md bg-white p-6 flex flex-col items-center border border-gray-100 hover:shadow-xl transition-shadow mb-2">
      <Avatar src={avatarUrl} name={nome} size="lg" className="mb-2 shadow" />
      <button
        className="font-bold text-lg text-blue-900 bg-transparent border border-transparent rounded-lg px-3 py-1 mb-1 focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-gray-100 transition-all"
        onClick={onClick}
        type="button"
        title="Ver detalhes da comissão"
        tabIndex={0}
        style={{ display: 'inline-block', textAlign: 'center' }}
      >
        {nome}
      </button>
      <span className="text-xs text-gray-500 mb-2">{minutos} min • {(percentual * 100).toFixed(1)}% do mês</span>
      <span className="text-3xl font-extrabold text-green-700 mb-1">R$ {comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
      <span className="text-sm text-gray-500 mb-2">Comissão Total</span>
      <span className="text-base font-semibold text-blue-600 mb-4">Ticket Médio: R$ {ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
      <div className="w-full border-t border-gray-100 pt-3 mt-2">
        <div className="grid grid-cols-4 gap-1 text-center">
          {Object.entries(tipos).map(([tipo, qtd]) => (
            <div key={tipo} className="flex flex-col items-center min-w-0">
              <span className="font-medium text-gray-600 text-[11px] leading-tight break-words mb-0.5">
                {tipo.length > 10 ? tipo.split(' ').map((w, i) => <span key={i}>{w}<br/></span>) : tipo}
              </span>
              <span className="text-base text-green-700 font-bold">{qtd}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}