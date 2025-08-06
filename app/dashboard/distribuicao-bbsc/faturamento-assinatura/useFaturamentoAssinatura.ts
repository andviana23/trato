import { useCallback, useEffect, useState } from 'react';

export interface Lancamento {
  id: string;
  valor: number;
  descricao?: string;
  data: string;
  mes_referencia: string;
  criado_em?: string;
  unidade: string;
}

export function useFaturamentoAssinatura(mesReferencia: string, unidade: string) {
  const [dados, setDados] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const fetchDados = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch(`/api/dashboard/faturamento-assinatura?mes=${mesReferencia}&unidade=${encodeURIComponent(unidade)}`);
      const json = await res.json();
      if (json.success) {
        setDados(json.data);
      } else {
        setErro(json.error || 'Erro ao buscar dados');
      }
    } catch (e: any) {
      setErro(e.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [mesReferencia, unidade]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  const adicionar = async (novo: Omit<Lancamento, 'id' | 'mes_referencia' | 'criado_em' | 'unidade'>) => {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch('/api/dashboard/faturamento-assinatura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...novo, unidade }),
      });
      const json = await res.json();
      if (json.success) {
        setDados((prev) => [...prev, json.data]);
      } else {
        setErro(json.error || 'Erro ao adicionar');
      }
    } catch (e: any) {
      setErro(e.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const excluir = async (id: string) => {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch(`/api/dashboard/faturamento-assinatura?id=${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setDados((prev) => prev.filter((l) => l.id !== id));
      } else {
        setErro(json.error || 'Erro ao excluir');
      }
    } catch (e: any) {
      setErro(e.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return { dados, loading, erro, adicionar, excluir, refetch: fetchDados };
} 