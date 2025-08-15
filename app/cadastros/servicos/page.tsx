"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type Servico = { id: number; nome: string; tempo_minutos: number; categoria?: string | null; preco?: number | null };

const supabase = createClient();

export default function PaginaServicos() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ativos" | "todos">("ativos");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<Servico[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Servico | null>(null);
  const [form, setForm] = useState({ nome: "", categoria: "", preco: "", tempo_minutos: "30" });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / perPage)), [total, perPage]);

  async function fetchServicos() {
    setLoading(true);
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    // tenta com categoria/preco; se não existir, retorna sem essas colunas
    let { data, error, count } = await supabase
      .from("servicos")
      .select("id,nome,tempo_minutos,categoria,preco", { count: "exact" })
      .ilike("nome", `%${search}%`)
      .order("id", { ascending: true })
      .range(from, to);
    if (error && (error as any).code === "42703") {
      const alt = await supabase
        .from("servicos")
        .select("id,nome,tempo_minutos", { count: "exact" })
        .ilike("nome", `%${search}%`)
        .order("id", { ascending: true })
        .range(from, to);
      data = alt.data as any[];
      count = alt.count ?? 0;
      error = alt.error as any;
    }
    if (error) {
      toast.error("Erro ao carregar serviços");
    }
    setRows((data as any[] | null ?? []).map(d => ({ id: d.id, nome: d.nome, tempo_minutos: d.tempo_minutos, categoria: d.categoria ?? null, preco: d.preco ?? null })));
    setTotal(count ?? 0);
    setLoading(false);
  }

  useEffect(() => { void fetchServicos(); }, [page, perPage]);

  function openNovo() {
    setEditing(null);
    setForm({ nome: "", categoria: "", preco: "", tempo_minutos: "30" });
    setModalOpen(true);
  }
  function openEditar(s: Servico) {
    setEditing(s);
    setForm({ nome: s.nome ?? "", categoria: s.categoria ?? "", preco: s.preco ? String(s.preco) : "", tempo_minutos: String(s.tempo_minutos ?? 30) });
    setModalOpen(true);
  }
  async function salvar() {
    if (!form.nome || !form.tempo_minutos) { toast.error("Preencha os campos obrigatórios"); return; }
    try {
      const payload = { nome: form.nome, tempo_minutos: Number(form.tempo_minutos || 0), categoria: form.categoria || null, preco: form.preco ? Number(String(form.preco).replace(',', '.')) : null } as any;
      if (editing) await supabase.from("servicos").update(payload).eq("id", editing.id);
      else await supabase.from("servicos").insert(payload);
      toast.success("Serviço salvo");
      setModalOpen(false); setEditing(null); void fetchServicos();
    } catch { toast.error("Erro ao salvar"); }
  }
  async function excluir(id: number) {
    if (!confirm("Confirma exclusão?")) return;
    await supabase.from("servicos").delete().eq("id", id);
    toast.success("Excluído");
    void fetchServicos();
  }
  async function exportCsv() {
    const { data } = await supabase.from("servicos").select("id,nome,categoria,preco,tempo_minutos").order("id");
    const header = ["Código", "Nome", "Categoria", "Preço", "Tempo(min)"];
    const body = (data ?? []).map((r: any) => [r.id, r.nome, r.categoria ?? "", r.preco ?? "", r.tempo_minutos ?? ""].join(";"));
    const csv = [header.join(";"), ...body].join("\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'servicos.csv'; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-[1200px] mx-auto p-4">
      {/* Filtros topo */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Input className="flex-1 min-w-[280px]" placeholder="Procurar por:" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={status} onValueChange={(v: "ativos" | "todos") => setStatus(v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ativos">Ativos</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => { setPage(1); void fetchServicos(); }}>Buscar</Button>
        <Button variant="ghost" onClick={() => { setSearch(""); setPage(1); void fetchServicos(); }}>Exibir todos</Button>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Button onClick={openNovo}>+ Novo Serviço</Button>
        <Button variant="destructive" disabled={selected.length === 0} onClick={async () => { await supabase.from('servicos').delete().in('id', selected); setSelected([]); void fetchServicos(); }}>Remover selecionados</Button>
        <Button variant="secondary" onClick={exportCsv}>Salvar no Excel</Button>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded shadow">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="p-2 w-10"><input type="checkbox" checked={selected.length>0 && selected.length===rows.length} onChange={(e)=> setSelected(e.target.checked? rows.map(r=>r.id): [])} /></th>
              <th className="p-2">Nome</th>
              <th className="p-2">Categoria</th>
              <th className="p-2">Preço</th>
              <th className="p-2">Tempo</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-2"><input type="checkbox" checked={selected.includes(s.id)} onChange={(e)=> setSelected(prev => e.target.checked ? [...prev, s.id] : prev.filter(id=>id!==s.id))} /></td>
                <td className="p-2"><button className="text-blue-600 hover:underline" onClick={()=> openEditar(s)}>{s.nome}</button></td>
                <td className="p-2">{s.categoria ?? "-"}</td>
                <td className="p-2">{s.preco != null ? Number(s.preco).toFixed(2) : "-"}</td>
                <td className="p-2">{s.tempo_minutos ? (s.tempo_minutos >= 60 ? `${Math.floor(s.tempo_minutos/60)} h` : `${s.tempo_minutos} min`) : "-"}</td>
                <td className="p-2 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={()=> openEditar(s)}>Editar</Button>
                  <Button size="sm" variant="destructive" onClick={()=> excluir(s.id)}>Excluir</Button>
                </td>
              </tr>
            ))}
            {rows.length===0 && !loading && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhum serviço encontrado</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">Mostrar</span>
          <select className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700" value={perPage} onChange={(e)=> { setPerPage(Number(e.target.value)); setPage(1); }}>
            {[10,25,50,100].map(n=> <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="text-sm">serviços</span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" disabled={page===1} onClick={()=> setPage(1)}>Primeira</Button>
          <Button size="sm" variant="outline" disabled={page===1} onClick={()=> setPage(p=> Math.max(1, p-1))}>{'<'}</Button>
          <Button size="sm">{page}</Button>
          <Button size="sm" variant="outline" disabled={page===totalPages} onClick={()=> setPage(p=> Math.min(totalPages, p+1))}>{'>'}</Button>
          <Button size="sm" variant="outline" disabled={page===totalPages} onClick={()=> setPage(totalPages)}>Última</Button>
        </div>
      </div>

      {/* Dialog de cadastro/edição */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing? "Editar Serviço" : "Novo Serviço"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm">Nome</label>
              <Input value={form.nome} onChange={(e)=> setForm(f=> ({...f, nome: e.target.value}))} />
            </div>
            <div>
              <label className="text-sm">Categoria</label>
              <Input value={form.categoria} onChange={(e)=> setForm(f=> ({...f, categoria: e.target.value}))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Preço (R$)</label>
                <Input type="number" step="0.01" value={form.preco} onChange={(e)=> setForm(f=> ({...f, preco: e.target.value}))} />
              </div>
              <div>
                <label className="text-sm">Tempo (min)</label>
                <Input type="number" min={1} value={form.tempo_minutos} onChange={(e)=> setForm(f=> ({...f, tempo_minutos: e.target.value}))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={()=> setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Caso sua tabela servicos não tenha as colunas categoria/preco, execute no Supabase:
// ALTER TABLE public.servicos ADD COLUMN IF NOT EXISTS categoria text;
// ALTER TABLE public.servicos ADD COLUMN IF NOT EXISTS preco numeric(12,2);


