"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast, { Toaster } from "react-hot-toast";
import { createClient } from "@supabase/supabase-js";

// Configure o Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Definição dos tipos

type Produto = {
  id?: string;
  nome: string;
  categoria: string;
  marca: string;
  quantidade: number;
  valor: number;
  comissao: number;
  valor_profissional: number;
  criado_em?: string;
};

type Unidade = {
  label: string;
  table: string;
};

const UNIDADES: Unidade[] = [
  { label: "BarberBeer", table: "produtos_barberbeer" },
  { label: "Trato de Barbados", table: "produtos_trato_de_barbados" },
];

export default function PaginaProdutos() {
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<Unidade>(UNIDADES[0]);
  const [modalEditar, setModalEditar] = useState<{ open: boolean, produto?: Produto }>({ open: false });
  const [modalMarcas, setModalMarcas] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [reload, setReload] = useState(0);

  // Carregar produtos da unidade selecionada
  useEffect(() => {
    async function fetchProdutos() {
      const { data } = await supabase
        .from(unidadeSelecionada.table)
        .select("*")
        .order("criado_em", { ascending: false });
      setProdutos((data as Produto[]) || []);
    }
    fetchProdutos();
  }, [unidadeSelecionada, reload]);

  // Filtro de produtos
  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.categoria.toLowerCase().includes(search.toLowerCase()) ||
    p.marca.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(produtosFiltrados.length / perPage);
  const produtosPaginados = produtosFiltrados.slice((page - 1) * perPage, page * perPage);

  // Funções dos botões + e -
  async function alterarQuantidade(produto: Produto, delta: number) {
    const novaQuantidade = Math.max(0, produto.quantidade + delta);
    const { error } = await supabase
      .from(unidadeSelecionada.table)
      .update({ quantidade: novaQuantidade })
      .eq('id', produto.id);
    if (error) {
      toast.error('Erro ao atualizar quantidade!');
    } else {
      toast.success('Quantidade atualizada!');
      setReload(r => r + 1);
    }
  }

  // Função de excluir produto
  async function excluirProduto(produto: Produto) {
    if (!window.confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"?`)) return;
    const { error } = await supabase
      .from(unidadeSelecionada.table)
      .delete()
      .eq('id', produto.id);
    if (error) {
      toast.error('Erro ao excluir produto!');
    } else {
      toast.success('Produto excluído!');
      setReload(r => r + 1);
    }
  }

  // Função de editar produto
  async function salvarEdicao(produtoEditado: Produto) {
    const { id, categoria, marca, valor, comissao } = produtoEditado;
    const { error } = await supabase
      .from(unidadeSelecionada.table)
      .update({ valor, comissao, marca, categoria })
      .eq('id', id);
    if (error) {
      toast.error('Erro ao editar produto!');
    } else {
      toast.success('Produto editado!');
      setModalEditar({ open: false });
      setReload(r => r + 1);
    }
  }

  // Dados de marcas para o modal
  const marcasResumo = produtos.reduce<Record<string, { quantidade: number, valorTotal: number }>>((acc, p) => {
    if (!acc[p.marca]) acc[p.marca] = { quantidade: 0, valorTotal: 0 };
    acc[p.marca].quantidade += p.quantidade;
    acc[p.marca].valorTotal += p.quantidade * p.valor;
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto p-4">
      <Toaster />
      {/* Filtro de unidade */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <span className="font-semibold text-gray-700 mr-2">Unidade:</span>
        {UNIDADES.map((u) => (
          <Button
            key={u.label}
            variant={unidadeSelecionada.label === u.label ? "default" : "outline"}
            className={
              unidadeSelecionada.label === u.label
                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                : "bg-white text-blue-600 border-blue-600 hover:bg-blue-50"
            }
            onClick={() => { setUnidadeSelecionada(u); setPage(1); }}
          >
            {u.label}
          </Button>
        ))}
      </div>
      {/* Topo com botões */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button className="bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-2 shadow-md">
          + Produto
        </Button>
        <Button className="bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-md" onClick={() => setModalMarcas(true)}>
          Marcas
        </Button>
        <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md">Fornecedores</Button>
        <Button className="bg-gray-600 hover:bg-gray-700 text-white font-bold shadow-md">Adicionar compra ao estoque</Button>
      </div>
      {/* Barra de exportação e filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-2 bg-gray-50 rounded px-3 py-2 shadow-sm">
        <Button className="bg-gray-200 text-gray-700 hover:bg-gray-300">Excel</Button>
        <Button className="bg-gray-200 text-gray-700 hover:bg-gray-300">PDF</Button>
        <Button className="bg-gray-200 text-gray-700 hover:bg-gray-300">Imprimir</Button>
        <Button className="bg-gray-200 text-gray-700 hover:bg-gray-300">Colunas</Button>
        <div className="ml-auto flex items-center gap-2">
          <select
            className="border rounded px-2 py-1 text-sm focus:ring focus:ring-blue-200"
            value={perPage}
            onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
          >
            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="text-sm">resultados por página</span>
          <Input
            className="w-48 border focus:ring focus:ring-blue-200"
            placeholder="Pesquisar"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>
      {/* Tabela de produtos */}
      <div className="overflow-x-auto bg-white rounded shadow mt-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 font-bold">Descrição</th>
              <th className="p-2 font-bold">Categoria</th>
              <th className="p-2 font-bold">Marca</th>
              <th className="p-2 font-bold">Qtde</th>
              <th className="p-2 font-bold">Valor (R$)</th>
              <th className="p-2 font-bold">Comissão</th>
              <th className="p-2 font-bold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtosPaginados.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center p-4">Nenhum produto cadastrado.</td>
              </tr>
            )}
            {produtosPaginados.map((p) => (
              <tr key={p.id} className="border-t hover:bg-blue-50 transition-colors">
                <td className="p-2">{p.nome}</td>
                <td className="p-2">{p.categoria}</td>
                <td className="p-2">{p.marca}</td>
                <td className="p-2">{p.quantidade}</td>
                <td className="p-2">{Number(p.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                <td className="p-2">{(Number(p.comissao) * 100).toFixed(2)}%</td>
                <td className="p-2 flex flex-wrap gap-1">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow" onClick={() => alterarQuantidade(p, +1)}>+</Button>
                  <Button size="sm" className="bg-pink-600 hover:bg-pink-700 text-white shadow" onClick={() => alterarQuantidade(p, -1)}>-</Button>
                  <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white shadow">Movimentações</Button>
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white shadow" onClick={() => setModalEditar({ open: true, produto: p })}>Editar</Button>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white shadow" onClick={() => excluirProduto(p)}>Excluir</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Paginação */}
      <div className="flex flex-wrap items-center justify-between mt-4">
        <span className="text-sm">
          Mostrando de {(produtosFiltrados.length === 0 ? 0 : (page - 1) * perPage + 1)} até {Math.min(page * perPage, produtosFiltrados.length)} de {produtosFiltrados.length} registros
        </span>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          {[...Array(totalPages)].map((_, i) => (
            <Button
              key={i}
              size="sm"
              variant={page === i + 1 ? "default" : "outline"}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
          <Button size="sm" variant="outline" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)}>Próximo</Button>
        </div>
      </div>
      {/* Modal de edição */}
      {modalEditar.open && modalEditar.produto && (
        <ModalEditarProduto
          produto={modalEditar.produto}
          onClose={() => setModalEditar({ open: false })}
          onSave={salvarEdicao}
        />
      )}
      {/* Modal de marcas */}
      {modalMarcas && (
        <ModalMarcas
          marcasResumo={marcasResumo}
          onClose={() => setModalMarcas(false)}
        />
      )}
    </div>
  );
}

// Modal de edição de produto
function ModalEditarProduto({ produto, onClose, onSave }: { produto: Produto, onClose: () => void, onSave: (p: Produto) => void }) {
  const [form, setForm] = useState({ ...produto });
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg relative" onClick={e => e.stopPropagation()}>
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={onClose}>×</button>
        <h2 className="text-xl font-bold mb-4">Editar Produto</h2>
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); onSave(form); }}>
          <Input
            placeholder="Nome do produto"
            value={form.nome}
            onChange={e => setForm({ ...form, nome: e.target.value })}
            disabled
          />
          <Input
            placeholder="Categoria"
            value={form.categoria}
            onChange={e => setForm({ ...form, categoria: e.target.value })}
            required
          />
          <Input
            placeholder="Marca"
            value={form.marca}
            onChange={e => setForm({ ...form, marca: e.target.value })}
            required
          />
          <Input
            type="number"
            placeholder="Valor (R$)"
            value={form.valor}
            onChange={e => setForm({ ...form, valor: Number(e.target.value) })}
            required
            min={0}
          />
          <Input
            type="number"
            placeholder="Comissão (%)"
            value={form.comissao}
            onChange={e => setForm({ ...form, comissao: Number(e.target.value) })}
            required
            min={0}
            max={1}
            step={0.01}
          />
          <Button type="submit" className="w-full">Salvar</Button>
        </form>
      </div>
    </div>
  );
}

// Modal de marcas
function ModalMarcas({ marcasResumo, onClose }: { marcasResumo: Record<string, { quantidade: number, valorTotal: number }>, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg relative" onClick={e => e.stopPropagation()}>
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={onClose}>×</button>
        <h2 className="text-xl font-bold mb-4">Resumo por Marca</h2>
        <table className="min-w-full text-sm mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 font-bold">Marca</th>
              <th className="p-2 font-bold">Quantidade</th>
              <th className="p-2 font-bold">Valor Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(marcasResumo).map(([marca, info]) => (
              <tr key={marca} className="border-t">
                <td className="p-2">{marca}</td>
                <td className="p-2">{info.quantidade}</td>
                <td className="p-2">{info.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Button className="w-full" onClick={onClose}>Fechar</Button>
      </div>
    </div>
  );
}