"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ProductsTable } from "./components/Table";
import { Filters } from "./components/Filters";
import { ActionsBar } from "./components/ActionsBar";
import { listProducts, deleteProducts, exportCsv, Product, createProduct, updateProduct, updateStock, updateMinStock } from "./actions";
import { ProductDialog } from "./components/ProductDialog";
import { StockQuickEdit } from "./components/StockQuickEdit";
import { LowStockBanner } from "./components/LowStockBanner";


// Definição dos tipos

type Produto = Product;

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
  const [unidadeSelecionada] = useState<Unidade>(UNIDADES[0]);
  const [modalEditar, setModalEditar] = useState<{ open: boolean, produto?: Produto }>({ open: false });
  const [modalMarcas, setModalMarcas] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [reload, setReload] = useState(0);
  const [status, setStatus] = useState<"ativos" | "todos">("ativos");
  const [sortBy, setSortBy] = useState<"nome" | "valor" | "quantidade">("nome");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchProdutos() {
    setLoading(true);
    try {
      const { rows, total } = await listProducts({ search, status, page, perPage, sortBy, sortDir });
      setProdutos(rows as Produto[]);
      setTotal(total);
      setSelected([]);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao carregar produtos");
    } finally { setLoading(false); }
  }
  useEffect(() => { void fetchProdutos(); }, [reload, page, perPage, sortBy, sortDir]);

  // Filtro de produtos
  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.categoria.toLowerCase().includes(search.toLowerCase()) ||
    p.marca.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(total / perPage);
  const produtosPaginados = produtos; // já vem paginado do servidor

  // Funções dos botões + e -
  async function alterarQuantidade(produto: Produto, delta: number) {
    const nova = Math.max(0, (produto.quantidade || 0) + delta);
    await updateStock(produto.id as string, nova);
    toast.success("Estoque atualizado");
    setReload(r => r + 1);
  }

  // Função de excluir produto
  async function excluirProduto(produto: Produto) {
    if (!window.confirm(`Excluir "${produto.nome}"?`)) return;
    await deleteProducts([produto.id as string]);
    toast.success("Produto excluído");
    setReload(r => r + 1);
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
      {/* Filtros superiores */}
      <Filters
        search={search}
        onSearchChange={(v) => setSearch(v)}
        status={status}
        onStatusChange={(v) => setStatus(v)}
        onSubmit={() => { setPage(1); void fetchProdutos(); }}
        onReset={() => { setSearch(""); setStatus("todos"); setPage(1); void fetchProdutos(); }}
        isLoading={loading}
      />
      {/* Topo com botões */}
      <div className="flex flex-wrap gap-2 mb-3 mt-3">
        <ActionsBar
          onNew={() => setModalEditar({ open: true })}
          onBulkDelete={async () => { if (selected.length && window.confirm("Remover selecionados?")) { await deleteProducts(selected); toast.success("Removidos"); setReload(r=>r+1);} }}
          onImport={() => setModalMarcas(true)}
          onExport={async () => { const csv = await exportCsv({ search, status, page, perPage, sortBy, sortDir }); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'produtos.csv'; a.click(); URL.revokeObjectURL(url); }}
          isLoading={loading}
        />
      </div>
      <LowStockBanner
        items={produtosPaginados.filter(p => (p.quantidade || 0) <= ((p as any).estoque_minimo || 0)).map(p => ({ id: String(p.id), nome: p.nome, quantidade: p.quantidade, estoque_minimo: (p as any).estoque_minimo }))}
        onExport={async () => { const csv = await exportCsv({ search, status, page, perPage, sortBy, sortDir, onlyLowStock: true }); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'estoque-baixo.csv'; a.click(); URL.revokeObjectURL(url); }}
      />
      {/* Barra de exportação e filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-2 rounded px-3 py-2 shadow-sm bg-card border border-border">
        <Button variant="secondary">Excel</Button>
        <Button variant="secondary">PDF</Button>
        <Button variant="secondary">Imprimir</Button>
        <Button variant="secondary">Colunas</Button>
        <div className="ml-auto flex items-center gap-2">
          <select
            className="border border-border rounded px-2 py-1 text-sm bg-background"
            value={perPage}
            onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
          >
            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="text-sm">resultados por página</span>
          <Input
            className="w-48"
            placeholder="Pesquisar"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>
      <ProductsTable
        rows={produtosPaginados.map(p => ({ id: p.id as string, nome: p.nome, categoria: p.categoria, valor: p.valor, custo: p.custo ?? 0, quantidade: p.quantidade, estoque_minimo: (p as any).estoque_minimo ?? 0 }))}
        selectedIds={selected}
        onToggleRow={(id) => setSelected((arr) => arr.includes(id) ? arr.filter(i => i !== id) : [...arr, id])}
        onToggleAll={() => setSelected((prev) => prev.length === produtosPaginados.length ? [] : produtosPaginados.map(p => p.id as string))}
        onEdit={(id) => { const p = produtosPaginados.find(x => x.id === id); if (p) setModalEditar({ open: true, produto: p }); }}
        onDelete={(id) => { const p = produtosPaginados.find(x => x.id === id); if (p) void excluirProduto(p); }}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={(by) => { if (sortBy === by) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(by); setSortDir('asc'); } setPage(1); void fetchProdutos(); }}
        onUpdateStock={async (id, v) => { await updateStock(id, v); toast.success('Estoque atualizado'); setReload(r=>r+1); }}
        onUpdateMin={async (id, v) => { await updateMinStock(id, v); toast.success('Mínimo atualizado'); setReload(r=>r+1); }}
      />
      {/* Paginação */}
      <div className="flex flex-wrap items-center justify-between mt-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">Mostrar</span>
            <select className="border border-border rounded px-2 py-1 text-sm bg-background" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>
              {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="text-sm">registros</span>
          </div>
          <span className="text-sm">Mostrando de {(total === 0 ? 0 : (page - 1) * perPage + 1)} até {Math.min(page * perPage, total)} de {total} registros</span>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(1)}>Primeira</Button>
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>{'<'}</Button>
          <Button size="sm" variant="default">{page}</Button>
          <Button size="sm" variant="outline" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>{'>'}</Button>
          <Button size="sm" variant="outline" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(totalPages)}>Última</Button>
        </div>
      </div>
      <ProductDialog
        open={modalEditar.open}
        onOpenChange={(v) => setModalEditar({ open: v, produto: v ? modalEditar.produto : undefined })}
        initial={modalEditar.produto}
        onSubmit={async (data) => {
          if (data.id) { await updateProduct(data as any); toast.success('Produto atualizado'); }
          else { await createProduct(data as any); toast.success('Produto criado'); }
          setReload(r => r + 1);
        }}
      />
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
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md shadow-lg relative" onClick={e => e.stopPropagation()}>
        <button className="absolute top-2 right-2 text-muted-foreground hover:opacity-80" onClick={onClose}>×</button>
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
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md shadow-lg relative" onClick={e => e.stopPropagation()}>
        <button className="absolute top-2 right-2 text-muted-foreground hover:opacity-80" onClick={onClose}>×</button>
        <h2 className="text-xl font-bold mb-4">Resumo por Marca</h2>
        <table className="min-w-full text-sm mb-4">
          <thead>
            <tr className="bg-muted/40">
              <th className="p-2 font-bold">Marca</th>
              <th className="p-2 font-bold">Quantidade</th>
              <th className="p-2 font-bold">Valor Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(marcasResumo).map(([marca, info]) => (
              <tr key={marca} className="border-t border-border">
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