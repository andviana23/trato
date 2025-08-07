import { useCallback, useEffect, useState } from 'react';
export function useFaturamentoAssinatura(mesReferencia, unidade) {
    const [dados, setDados] = useState([]);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState(null);
    const fetchDados = useCallback(async () => {
        setLoading(true);
        setErro(null);
        try {
            const res = await fetch(`/api/dashboard/faturamento-assinatura?mes=${mesReferencia}&unidade=${encodeURIComponent(unidade)}`);
            const json = await res.json();
            if (json.success) {
                setDados(json.data);
            }
            else {
                setErro(json.error || 'Erro ao buscar dados');
            }
        }
        catch (e) {
            setErro(e.message || 'Erro desconhecido');
        }
        finally {
            setLoading(false);
        }
    }, [mesReferencia, unidade]);
    useEffect(() => {
        fetchDados();
    }, [fetchDados]);
    const adicionar = async (novo) => {
        setLoading(true);
        setErro(null);
        try {
            const res = await fetch('/api/dashboard/faturamento-assinatura', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.assign(Object.assign({}, novo), { unidade })),
            });
            const json = await res.json();
            if (json.success) {
                setDados((prev) => [...prev, json.data]);
            }
            else {
                setErro(json.error || 'Erro ao adicionar');
            }
        }
        catch (e) {
            setErro(e.message || 'Erro desconhecido');
        }
        finally {
            setLoading(false);
        }
    };
    const excluir = async (id) => {
        setLoading(true);
        setErro(null);
        try {
            const res = await fetch(`/api/dashboard/faturamento-assinatura?id=${id}`, {
                method: 'DELETE',
            });
            const json = await res.json();
            if (json.success) {
                setDados((prev) => prev.filter((l) => l.id !== id));
            }
            else {
                setErro(json.error || 'Erro ao excluir');
            }
        }
        catch (e) {
            setErro(e.message || 'Erro desconhecido');
        }
        finally {
            setLoading(false);
        }
    };
    return { dados, loading, erro, adicionar, excluir, refetch: fetchDados };
}
