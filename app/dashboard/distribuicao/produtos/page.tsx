"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, Button, Input, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Autocomplete, AutocompleteItem } from '@/components/ui/chakra-adapters';
import { PlusIcon } from '@heroicons/react/24/solid';
import CardProfissionalHeroUI from './components/CardProfissionalHeroUI';
import dayjs from 'dayjs';

// Tipos auxiliares
interface VendaProduto {
  id?: string;
  unidade_id: string;
  quantidade: number;
  created_at?: string;
}
interface Cliente { id: string; nome: string; }
interface Produto { id: string; nome: string; }
interface Barbeiro { id: string; nome: string; avatar_url?: string; }
interface ItemComanda { produto: Produto; barbeiro: Barbeiro; quantidade: number; }
type VendaUnificada = VendaProduto & {
  tipo?: 'barbeiro';
  produto_nome?: string;
  barbeiro_nome?: string;
};

export default function ProdutosDistribuicao() {
  const UNIDADES = [
    { label: 'Trato de Barbados', id: '244c0543-7108-4892-9eac-48186ad1d5e7', table: 'produtos_trato_de_barbados' },
    { label: 'BarberBeer', id: '87884040-cafc-4625-857b-6e0402ede7d7', table: 'produtos_barberbeer' },
  ];
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<typeof UNIDADES[0]>(UNIDADES[0]);
  const [vendas, setVendas] = useState<VendaProduto[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<string>('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<string>('');
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState<string>('');
  const [quantidadeProduto, setQuantidadeProduto] = useState<string>('1');
  const [itensComanda, setItensComanda] = useState<ItemComanda[]>([]);
  // Agora corrigido: metasMes
  const [metasMes, setMetasMes] = useState<Record<string, { quantidade: number }[]>>({});
  const produtoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDadosModal();
    fetchVendas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidadeSelecionada]);

  useEffect(() => {
    if (modalOpen && produtoInputRef.current) {
      produtoInputRef.current.focus();
    }
  }, [modalOpen]);

  // Buscar todas as metas do mês/ano atual ao trocar unidade ou barbeiros
  useEffect(() => {
    async function fetchMetasMes() {
      const { data: metaData } = await supabase
        .from('metas_trato_faixas')
        .select('barbeiro_id, quantidade, tipo')
        .eq('tipo', 'produtos')
        .in('barbeiro_id', barbeiros.map(b => b.id));
      const meta: Record<string, { quantidade: number }[]> = {};
      (metaData || []).forEach((m: any) => {
        if (!meta[m.barbeiro_id]) meta[m.barbeiro_id] = [];
        meta[m.barbeiro_id].push({ quantidade: m.quantidade });
      });
      setMetasMes(meta); // CORRIGIDO!
    }
    if (unidadeSelecionada.label === 'Trato de Barbados') fetchMetasMes();
    else setMetasMes({});
  }, [unidadeSelecionada, barbeiros]);

  const fetchVendas = async () => {
    setLoading(true);
    const { data: vendasSimples } = await supabase
      .from('vendas_produtos')
      .select('*')
      .eq('unidade_id', unidadeSelecionada.id)
      .order('created_at', { ascending: false });
    const { data: vendasBarbeiro } = await supabase
      .from('vendas_produtos_barbeiro')
      .select('id, unidade_id, produto_id, barbeiro_id, quantidade, data_venda')
      .eq('unidade_id', unidadeSelecionada.id)
      .order('data_venda', { ascending: false });
    setVendas([
      ...(vendasSimples || []),
      ...(vendasBarbeiro || []) as VendaUnificada[]
    ]);
    setLoading(false);
  };

  const fetchDadosModal = async () => {
    const { data: clientesData } = await supabase.from('clientes').select('id, nome');
    setClientes(clientesData || []);
    const { data: produtosData } = await supabase.from(unidadeSelecionada.table).select('id, nome');
    setProdutos(produtosData || []);
    const { data: barbeirosData } = await supabase
      .from('profissionais')
      .select('id, nome, avatar_url')
      .eq('unidade_id', unidadeSelecionada.id)
      .eq('funcao', 'barbeiro');
    setBarbeiros(barbeirosData || []);
  };

  const abrirModal = () => {
    setModalOpen(true);
    fetchDadosModal();
  };
  const fecharModal = () => {
    setModalOpen(false);
    setItensComanda([]);
    setClienteSelecionado('');
  };

  const adicionarItemComanda = () => {
    if (!produtoSelecionado || !barbeiroSelecionado || !quantidadeProduto) return;
    const produto = produtos.find(p => p.id === produtoSelecionado);
    const barbeiro = barbeiros.find(b => b.id === barbeiroSelecionado);
    if (!produto || !barbeiro) return;
    setItensComanda([...itensComanda, {
      produto,
      barbeiro,
      quantidade: Number(quantidadeProduto)
    }]);
    setProdutoSelecionado('');
    setBarbeiroSelecionado('');
    setQuantidadeProduto('1');
  };

  const removerItemComanda = (idx: number) => {
    setItensComanda(itensComanda.filter((_, i) => i !== idx));
  };

  const finalizarComanda = async () => {
    if (!clienteSelecionado || itensComanda.length === 0) return;
    for (const item of itensComanda) {
      await supabase.from('vendas_produtos_barbeiro').insert({
        unidade_id: unidadeSelecionada.id,
        barbeiro_id: item.barbeiro.id,
        produto_id: item.produto.id,
        quantidade: item.quantidade,
        cliente_id: clienteSelecionado
      });
    }
    fecharModal();
    fetchVendas();
  };

  const canAdd = produtoSelecionado && barbeiroSelecionado && quantidadeProduto && Number(quantidadeProduto) > 0;
  const canFinish = itensComanda.length > 0;

  const produtosVendidosPorBarbeiro: Record<string, number> = {};
  vendas.forEach((v: any) => {
    if (v.barbeiro_id && v.data_venda) {
      const mes = dayjs(v.data_venda).format('MM');
      const ano = dayjs(v.data_venda).format('YYYY');
      const mesAtual = dayjs().format('MM');
      const anoAtual = dayjs().format('YYYY');
      if (mes === mesAtual && ano === anoAtual) {
        produtosVendidosPorBarbeiro[v.barbeiro_id] = (produtosVendidosPorBarbeiro[v.barbeiro_id] || 0) + (v.quantidade || 1);
      }
    }
  });

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-2">
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <span className="font-semibold text-gray-700 mr-2">Unidade:</span>
        {UNIDADES.map((u) => (
          <Button
            key={u.label}
            variant={unidadeSelecionada.label === u.label ? "solid" : "outline"}
            className={
              unidadeSelecionada.label === u.label
                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                : "bg-white text-blue-600 border-blue-600 hover:bg-blue-50"
            }
            onClick={() => setUnidadeSelecionada(u)}
          >
            {u.label}
          </Button>
        ))}
      </div>
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Registro de Vendas de Produtos</h1>
      <Card.Root className="w-full p-8 mb-8">
        <div className="flex justify-end mb-4">
          <Button color="primary" onClick={abrirModal} className="flex items-center gap-2">
            <PlusIcon className="w-5 h-5" /> Adicionar Produtos
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 justify-center items-stretch mt-8">
          {barbeiros.map(b => (
            <CardProfissionalHeroUI
              key={b.id}
              nome={b.nome}
              avatarUrl={b.avatar_url}
              produtosVendidos={produtosVendidosPorBarbeiro[b.id] || 0}
              metas={(metasMes[b.id] || []).slice(0, 3)}
              barbeiroId={b.id}
              unidadeId={unidadeSelecionada.id}
            />
          ))}
        </div>
      </Card.Root>
      <Modal isOpen={modalOpen} onOpenChange={(open:boolean)=>!open&&fecharModal()} size="xl">
        <ModalContent>
          <ModalHeader>Adicionar Produtos - Comanda</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-6">
              <Autocomplete
                placeholder="Selecione ou busque o cliente..."
                selectedKey={clienteSelecionado}
                onSelectionChange={(key:any) => setClienteSelecionado(key ? String(key) : '')}
                className="w-full"
              >
                {clientes.map(c => (
                  <AutocompleteItem key={c.id} item={{ id: c.id, label: c.nome }}>{c.nome}</AutocompleteItem>
                ))}
              </Autocomplete>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <Autocomplete
                  placeholder="Escolha o produto"
                  selectedKey={produtoSelecionado}
                  onSelectionChange={(key:any) => setProdutoSelecionado(key ? String(key) : '')}
                  className="w-full md:w-1/3"
                >
                  {produtos.map(p => (
                    <AutocompleteItem key={p.id} item={{ id: p.id, label: p.nome }}>{p.nome}</AutocompleteItem>
                  ))}
                </Autocomplete>
                <select className="border rounded px-3 py-2 w-full md:w-1/3" value={barbeiroSelecionado} onChange={(e)=>setBarbeiroSelecionado(e.target.value)}>
                  <option value="">Escolha o barbeiro</option>
                  {barbeiros.map(b => (<option key={b.id} value={b.id}>{b.nome}</option>))}
                </select>
                <Input
                  type="number"
                  min={1}
                  value={quantidadeProduto}
                  onChange={e => setQuantidadeProduto(e.target.value)}
                  className="w-24"
                  placeholder="1"
                />
                <Button color="success" onClick={adicionarItemComanda} disabled={!canAdd} className="h-12 flex items-center gap-2">
                  <PlusIcon className="w-5 h-5" /> Adicionar
                </Button>
              </div>
              <div>
                <table className="min-w-full text-sm mt-4">
                  <thead>
                    <tr className="bg-gray-100 text-center">
                      <th>Produto</th>
                      <th>Barbeiro</th>
                      <th>Qtd</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itensComanda.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-gray-400 py-4">Nenhum produto adicionado à comanda.</td>
                      </tr>
                    ) : (
                      itensComanda.map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="text-center font-medium">{item.produto.nome}</td>
                          <td className="text-center">{item.barbeiro.nome}</td>
                          <td className="text-center">{item.quantidade}</td>
                          <td className="text-center"><Button color="danger" size="sm" onClick={() => removerItemComanda(idx)}>Remover</Button></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="flex justify-between items-center">
            <Button color="danger" variant="ghost" onClick={fecharModal}>Cancelar</Button>
            <Button color="primary" onClick={finalizarComanda} disabled={!canFinish}>Finalizar Comanda</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}




