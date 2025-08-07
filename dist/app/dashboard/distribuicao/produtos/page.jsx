"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, Button, Input, Select } from '@nextui-org/react';
// Removido: import { useUnidade } from '@/contexts/UnidadeContext';
const UNIDADES = [
    { id: '244c0543-7108-4892-9eac-48186ad1d5e7', nome: 'Trato de Barbados' },
    { id: '87884040-cafc-4625-857b-6e0402ede7d7', nome: 'Barber Beer Sport Club' },
];
export default function ProdutosDistribuicao() {
    const [unidadeSelecionada, setUnidadeSelecionada] = useState(UNIDADES[0].id);
    const [quantidade, setQuantidade] = useState('1');
    const [vendas, setVendas] = useState([]);
    const [loading, setLoading] = useState(false);
    const fetchVendas = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('vendas_produtos')
            .select('*')
            .eq('unidade_id', unidadeSelecionada)
            .order('created_at', { ascending: false });
        setVendas(data || []);
        setLoading(false);
    };
    useEffect(() => {
        fetchVendas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unidadeSelecionada]);
    async function adicionarVenda() {
        if (!quantidade || Number(quantidade) < 1)
            return;
        setLoading(true);
        await supabase.from('vendas_produtos').insert({
            unidade_id: unidadeSelecionada,
            quantidade: Number(quantidade),
        });
        setQuantidade('1');
        await fetchVendas();
        setLoading(false);
    }
    return (<div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Registro de Vendas de Produtos</h1>
      <Card className="p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Unidade</label>
            <Select value={unidadeSelecionada} onChange={e => setUnidadeSelecionada(e.target.value)} className="w-full">
              {UNIDADES.map(u => (<option key={u.id} value={u.id}>{u.nome}</option>))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantidade</label>
            <Input type="number" min={1} value={quantidade} onChange={e => setQuantidade(e.target.value)} className="w-28"/>
          </div>
          <Button color="primary" onClick={adicionarVenda} isLoading={loading} className="h-12 mt-4 md:mt-0">Adicionar Venda</Button>
        </div>
      </Card>
      <h2 className="text-lg font-semibold mb-4">Vendas Registradas</h2>
      <div className="grid gap-4">
        {loading ? (<div className="text-center text-gray-400">Carregando...</div>) : vendas.length === 0 ? (<div className="text-center text-gray-400">Nenhuma venda registrada ainda.</div>) : (vendas.map((v, idx) => {
            var _a;
            return (<Card key={v.id || idx} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{((_a = UNIDADES.find(u => u.id === v.unidade_id)) === null || _a === void 0 ? void 0 : _a.nome) || '-'}</div>
                <div className="text-sm text-gray-500">{v.quantidade} un. - {v.created_at ? new Date(v.created_at).toLocaleString('pt-BR') : ''}</div>
              </div>
            </Card>);
        }))}
      </div>
    </div>);
}
