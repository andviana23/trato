"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAppToast } from "@/hooks/useAppToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dayjs from "dayjs";

type FaixaRow = { id: string; meta_id: string; quantidade: number; bonificacao: number; tipo: "produtos" | "servicos"; barbeiro_nome?: string; barbeiro_id?: string };

// Ícones inline (sem depender do Chakra Icon)
const EditSvg = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
);
const TrashSvg = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
);
// CloseSvg removido (não utilizado)

export default function MetasTratoPage() {
  const supabase = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);
  const toast = useAppToast();

  const [faixas, setFaixas] = useState<FaixaRow[]>([]);
  const [barbeiroIdToNome, setBarbeiroIdToNome] = useState<Record<string, string>>({});
  const [buscaBarbeiroId, setBuscaBarbeiroId] = useState("all");
  const [buscaTipo, setBuscaTipo] = useState<"all" | "produtos" | "servicos">("all");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FaixaRow | null>(null);
  const [form, setForm] = useState<Omit<FaixaRow, "id">>({ meta_id: "", quantidade: 0, bonificacao: 0, tipo: "produtos" });

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("metas_trato_faixas")
      .select("id, meta_id, quantidade, bonificacao, tipo, barbeiro_nome, barbeiro_id")
      .order("meta_id");
    if (error) { console.warn(error); return; }
    type Row = { id: string | number; meta_id: string | number; quantidade: number; bonificacao: number; tipo: string; barbeiro_nome?: string | null; barbeiro_id?: string | null };
    const parsed: FaixaRow[] = (data as Row[] | null ?? []).map((d) => ({
      id: String(d.id),
      meta_id: String(d.meta_id),
      quantidade: Number(d.quantidade) || 0,
      bonificacao: Number(d.bonificacao) || 0,
      tipo: (d.tipo === "servicos" ? "servicos" : "produtos") as "produtos" | "servicos",
      barbeiro_nome: d.barbeiro_nome ?? undefined,
      barbeiro_id: d.barbeiro_id ?? String(d.meta_id),
    }));
    setFaixas(parsed);

    // Construir mapa id->nome a partir das próprias linhas (preferindo a coluna barbeiro_nome)
    const map: Record<string, string> = {};
    parsed.forEach((f) => {
      const id = f.barbeiro_id ?? f.meta_id;
      if (id) { map[id] = f.barbeiro_nome ?? map[id] ?? ''; }
    });
    setBarbeiroIdToNome(map);
  }, [supabase]);
  useEffect(() => { void load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm({ meta_id: "", quantidade: 0, bonificacao: 0, tipo: "produtos" }); setOpen(true); };
  const openEdit = (row: FaixaRow) => { setEditing(row); setForm({ meta_id: row.meta_id, quantidade: row.quantidade, bonificacao: row.bonificacao, tipo: row.tipo }); setOpen(true); };

  const save = async () => {
    try {
      if (!form.meta_id) { toast.error({ title: "Informe meta_id" }); return; }
      if (editing) {
        const { error } = await supabase.from("metas_trato_faixas").update(form).eq("id", editing.id);
        if (error) throw error;
        toast.success({ title: "Faixa atualizada" });
      } else {
        const { error } = await supabase.from("metas_trato_faixas").insert(form);
        if (error) throw error;
        toast.success({ title: "Faixa criada" });
      }
      setOpen(false);
      await load();
    } catch (e) { console.warn(e); toast.error({ title: "Erro ao salvar" }); }
  };

  const remove = async (row: FaixaRow) => {
    try {
      const { error } = await supabase.from("metas_trato_faixas").delete().eq("id", row.id);
      if (error) throw error;
      toast.success({ title: "Faixa removida" });
      await load();
    } catch (e) { console.warn(e); toast.error({ title: "Erro ao excluir" }); }
  };

  const filtered = faixas.filter(f => (buscaBarbeiroId === "all" || (f.barbeiro_id ?? f.meta_id) === buscaBarbeiroId) && (buscaTipo === "all" || f.tipo === buscaTipo));
  const periodoStr = `${dayjs().startOf("month").format("DD/MM/YYYY")} - ${dayjs().endOf("month").format("DD/MM/YYYY")}`;
  const profissionaisList = useMemo(() => {
    const entries = Object.entries(barbeiroIdToNome).map(([id, nome]) => ({ id, nome: nome || `Barbeiro ${id.slice(0,6)}…` }));
    return entries.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [barbeiroIdToNome]);

  // Agrupamento por profissional
  const gruposPorProfissional = useMemo(() => {
    const mapa = new Map<string, { id: string; nome: string; rows: FaixaRow[] }>();
    filtered.forEach((f) => {
      const id = f.barbeiro_id ?? f.meta_id;
      const nome = f.barbeiro_nome || barbeiroIdToNome[id] || `Barbeiro ${id.slice(0,6)}…`;
      const grupo = mapa.get(id) ?? { id, nome, rows: [] };
      grupo.rows.push(f);
      mapa.set(id, grupo);
    });
    return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [filtered, barbeiroIdToNome]);

  const [limPorProf, setLimPorProf] = useState<Record<string, number>>({});
  const getLimite = (id: string) => limPorProf[id] ?? 10;
  const carregarMaisDoProf = (id: string) => setLimPorProf((prev) => ({ ...prev, [id]: getLimite(id) + 10 }));
  const [filtroTipoPorProf, setFiltroTipoPorProf] = useState<Record<string, 'all' | 'produtos' | 'servicos'>>({});
  const getFiltroTipo = (id: string): 'all' | 'produtos' | 'servicos' => filtroTipoPorProf[id] ?? 'all';
  const setFiltroTipo = (id: string, v: 'all' | 'produtos' | 'servicos') => setFiltroTipoPorProf((prev) => ({ ...prev, [id]: v }));

  const renderTable = (rows: FaixaRow[], limit?: number) => (
    <div className="border border-border rounded-md bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-3 py-2">tipo</th>
            <th className="text-right px-3 py-2">quantidade</th>
            <th className="text-right px-3 py-2">bonificação (R$)</th>
            <th className="text-left px-3 py-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {(limit ? rows.slice(0, limit) : rows).map((f) => (
            <tr key={f.id} className="border-b border-border last:border-0">
              <td className="px-3 py-2">{f.tipo}</td>
              <td className="px-3 py-2 text-right">{f.quantidade}</td>
              <td className="px-3 py-2 text-right">{Number(f.bonificacao).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(f)} aria-label="Editar"><EditSvg /></Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(f)} aria-label="Excluir"><TrashSvg /></Button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-3 text-center text-muted-foreground">Nenhum registro encontrado.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div data-page="metas-trato" className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Faixas de Metas</h1>
            <p className="text-sm text-muted-foreground">Gerencie registros na tabela metas_trato_faixas</p>
          </div>
          <Button onClick={openCreate}>Nova Faixa</Button>
        </div>

        {/* Cards de contexto: Profissional e Período vigente */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="border rounded-lg p-4">
            <div className="text-xs text-muted-foreground">Profissional</div>
              <div className="text-xl font-semibold mt-1">{buscaBarbeiroId !== "all" ? (barbeiroIdToNome[buscaBarbeiroId] ?? `Barbeiro ${buscaBarbeiroId.slice(0,6)}…`) : "Todos"}</div>
          </div>
          <div className="border rounded-lg p-4 md:col-span-2">
            <div className="text-xs text-muted-foreground">Período vigente da meta</div>
            <div className="text-xl font-semibold mt-1">{periodoStr}</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6 p-4 border border-border rounded-md bg-card">
          <div className="flex gap-3 items-end flex-wrap">
            <div className="min-w-[260px]">
              <div className="text-sm mb-1">Barbeiro</div>
              <Select value={buscaBarbeiroId} onValueChange={setBuscaBarbeiroId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar barbeiro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {profissionaisList.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[180px]">
              <div className="text-sm mb-1">Tipo</div>
              <Select value={buscaTipo} onValueChange={(v: "all" | "produtos" | "servicos") => setBuscaTipo(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="produtos">Produtos</SelectItem>
                  <SelectItem value="servicos">Serviços</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Cards por profissional */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {gruposPorProfissional
            .filter((g) => g.rows.length > 0)
            .map((g) => {
            const rows = g.rows;
            const tipoLocal = getFiltroTipo(g.id);
            const rowsFiltradas = rows.filter(r => tipoLocal === 'all' || r.tipo === tipoLocal);
            const totalQ = rowsFiltradas.reduce((s, r) => s + (r.quantidade || 0), 0);
            const totalB = rowsFiltradas.reduce((s, r) => s + (r.bonificacao || 0), 0);
            const lim = getLimite(g.id);
            const podeCarregar = lim < rowsFiltradas.length;
            return (
              <Card key={g.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">{g.nome}</CardTitle>
                    <div className="min-w-[150px]">
                      <Select value={tipoLocal} onValueChange={(v: 'all' | 'produtos' | 'servicos') => setFiltroTipo(g.id, v)}>
                        <SelectTrigger className="w-full h-8">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="produtos">Produtos</SelectItem>
                          <SelectItem value="servicos">Serviços</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">Metas: {rowsFiltradas.length} • Quantidade: {totalQ} • Bonificação: {totalB.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </CardHeader>
                <CardContent>
                  {renderTable(rowsFiltradas, lim)}
                  {podeCarregar && (
                    <div className="flex justify-center pt-3">
                      <Button variant="secondary" onClick={() => carregarMaisDoProf(g.id)}>Carregar mais</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {gruposPorProfissional.length === 0 && (
            <div className="col-span-full text-center text-sm text-gray-500 border rounded-md p-6">Nenhum registro encontrado.</div>
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Faixa" : "Nova Faixa"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <div className="text-sm mb-1">meta_id</div>
                <Input value={form.meta_id} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, meta_id: e.target.value })} placeholder="uuid ou identificador" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="text-sm mb-1">Tipo</div>
                  <Select value={form.tipo} onValueChange={(v: 'produtos' | 'servicos') => setForm({ ...form, tipo: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="produtos">Produtos</SelectItem>
                      <SelectItem value="servicos">Serviços</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="text-sm mb-1">Quantidade</div>
                  <Input type="number" value={form.quantidade} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, quantidade: Number(e.target.value) })} />
                </div>
                <div>
                  <div className="text-sm mb-1">Bonificação (R$)</div>
                  <Input type="number" value={form.bonificacao} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, bonificacao: Number(e.target.value) })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save}>{editing ? "Atualizar" : "Salvar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

