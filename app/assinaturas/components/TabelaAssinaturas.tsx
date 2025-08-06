import React, { useEffect, useState } from 'react';
import { FiExternalLink, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

function formatCurrency(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

type Cliente = {
  nome: string;
  email: string;
};

type Assinatura = {
  id: string;
  cliente: Cliente;
  status: string;
  data_vencimento: string;
  dias_restantes: number;
  valor_mensal: number;
};

type Props = {
  busca: string;
  refresh: boolean;
  onPagamentoExterno: () => void;
};

export default function TabelaAssinaturas({ busca, refresh, onPagamentoExterno }: Props) {
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; assinatura?: Assinatura }>({ open: false });
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/clientes-assinaturas')
      .then(res => res.json())
      .then(data => {
        setAssinaturas(data);
        setLoading(false);
      });
  }, [refresh]);

  const assinaturasFiltradas = assinaturas.filter(a => {
    const termo = busca.toLowerCase();
    return (
      a.cliente.nome.toLowerCase().includes(termo) ||
      a.cliente.email.toLowerCase().includes(termo)
    );
  });

  const abrirModal = (assinatura: Assinatura) => setModal({ open: true, assinatura });
  const fecharModal = () => setModal({ open: false });

  const confirmarPagamentoExterno = async () => {
    if (!modal.assinatura) return;
    setConfirmando(true);
    await fetch(`/api/assinaturas/${modal.assinatura.id}/pagamento-externo`, { method: 'POST' });
    setConfirmando(false);
    fecharModal();
    onPagamentoExterno();
  };

  return (
    <div className="bg-white rounded-xl shadow p-0 overflow-x-auto">
      <table className="min-w-full table-auto text-sm">
        <thead className="sticky top-0 bg-gray-100 z-10">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Cliente</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Vencimento</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Dias Restantes</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Valor</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Ações</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} className="text-center py-12 text-gray-400">Carregando assinaturas...</td></tr>
          ) : assinaturasFiltradas.length === 0 ? (
            <tr><td colSpan={6} className="text-center py-12 text-gray-400">Nenhuma assinatura encontrada.</td></tr>
          ) : (
            assinaturasFiltradas.map((a, idx) => (
              <tr key={a.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{a.cliente.nome}</div>
                  <div className="text-xs text-gray-500">{a.cliente.email}</div>
                </td>
                <td className="px-4 py-3">
                  {a.dias_restantes >= 0 ? (
                    <span className="flex items-center gap-2 text-green-600 font-semibold" title="Assinatura ativa">
                      <FiCheckCircle className="w-4 h-4" /> ATIVA
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-red-600 font-semibold" title="Assinatura inativa">
                      <FiAlertCircle className="w-4 h-4" /> INATIVA
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{formatDate(a.data_vencimento)}</td>
                <td className="px-4 py-3">
                  <span className={
                    a.dias_restantes < 0
                      ? 'text-red-600 font-bold'
                      : a.dias_restantes <= 5
                        ? 'text-yellow-600 font-bold animate-pulse'
                        : 'text-gray-700'
                  } title={a.dias_restantes < 0 ? 'Vencida' : a.dias_restantes <= 5 ? 'Próximo do vencimento' : 'Em dia'}>
                    {a.dias_restantes}
                  </span>
                </td>
                <td className="px-4 py-3">{formatCurrency(a.valor_mensal)}</td>
                <td className="px-4 py-3">
                  <button
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded shadow text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                    onClick={() => abrirModal(a)}
                    aria-label={`Registrar pagamento externo para ${a.cliente.nome}`}
                  >
                    <FiExternalLink className="w-4 h-4" /> Pagamento Externo
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal de confirmação */}
      {modal.open && modal.assinatura && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full border border-purple-100 animate-fade-in">
            <h2 className="text-xl font-bold mb-4 text-purple-700 flex items-center gap-2">
              <FiExternalLink className="w-5 h-5" /> Confirmar Pagamento Externo
            </h2>
            <p className="mb-6 text-gray-700">
              Você confirma o registro de um pagamento externo para <b>{modal.assinatura.cliente.nome}</b>?<br />
              <span className="text-sm text-gray-500">A assinatura será renovada por mais 30 dias.</span>
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium"
                onClick={fecharModal}
                disabled={confirmando}
              >Cancelar</button>
              <button
                className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white font-medium shadow"
                onClick={confirmarPagamentoExterno}
                disabled={confirmando}
                autoFocus
              >{confirmando ? 'Confirmando...' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 