"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Mail, Plus, Trash2, Upload, Users, Merge, Search } from "lucide-react";
import { toast } from "sonner";
import ClientesTable from "./components/Table";
import { listClients, exportCsv, deleteClients } from "./server/actions";
import ClientDialog from "./components/ClientDialog";

type SortBy = "codigo" | "nome" | "pagamentos" | "pendencias" | "ultima_visita";

export default function ClientesPage() {
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<"nome" | "telefone" | "codigo">("nome");
  const [status, setStatus] = useState<"ativos" | "inativos" | "todos">("ativos");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<SortBy>("nome");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listClients({ search, searchField, status, page, perPage, sortBy, sortDir });
      setRows(res.rows);
      setTotal(res.total);
      setSelected([]);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  }, [search, searchField, status, page, perPage, sortBy, sortDir]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const totalLine = useMemo(() => `Cadastrados no sistema: ${total} / ∞`, [total]);

  async function handleExport() {
    const csv = await exportCsv({ search, searchField, status, sortBy, sortDir });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "clientes.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleBulkDelete() {
    if (selected.length === 0) return;
    if (!confirm(`Remover ${selected.length} registro(s)?`)) return;
    await deleteClients(selected);
    toast.success("Registros removidos");
    void fetchData();
  }

  return (
    <div className="px-4 py-4 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground" aria-live="polite">{totalLine}</div>

      <Card className="mb-3">
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[240px]">
              <label className="text-xs text-muted-foreground">Procurar por:</label>
              <div className="relative">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome, telefone ou código" aria-label="Procurar clientes" className="pl-8" />
                <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block">&nbsp;</label>
              <Select value={searchField} onValueChange={(v: any) => setSearchField(v)}>
                <SelectTrigger className="w-[170px]"><SelectValue placeholder="Filtrar por Nome" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nome">Filtrar por Nome</SelectItem>
                  <SelectItem value="telefone">Filtrar por Telefone</SelectItem>
                  <SelectItem value="codigo">Filtrar por Código</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block">&nbsp;</label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Ativos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativos">Ativos</SelectItem>
                  <SelectItem value="inativos">Inativos</SelectItem>
                  <SelectItem value="todos">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => { setPage(1); void fetchData(); }} aria-label="Buscar">Buscar</Button>
              <Button variant="secondary" onClick={() => { setSearch(""); setStatus("ativos"); setSearchField("nome"); setSortBy("nome"); setSortDir("asc"); setPage(1); }} aria-label="Exibir todos">Exibir todos</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 mb-3">
        <Button onClick={() => { setEditingId(null); setOpenDialog(true); }} aria-label="Novo Cliente"><Plus className="w-4 h-4 mr-1" />Novo Cliente</Button>
        <Button variant="destructive" disabled={selected.length===0} onClick={handleBulkDelete} aria-label="Remover selecionados"><Trash2 className="w-4 h-4 mr-1" />Remover selecionados</Button>
        <Button variant="secondary" aria-label="Importar Clientes"><Upload className="w-4 h-4 mr-1" />Importar Clientes</Button>
        <Button variant="secondary" aria-label="Mesclar duplicados"><Merge className="w-4 h-4 mr-1" />Mesclar duplicados</Button>
        <Button variant="secondary" onClick={handleExport} aria-label="Salvar no Excel"><Download className="w-4 h-4 mr-1" />Salvar no Excel</Button>
        <Button variant="secondary" disabled={selected.length===0} aria-label="Enviar Email"><Mail className="w-4 h-4 mr-1" />Enviar Email</Button>
      </div>

      <ClientesTable
        rows={rows}
        loading={loading}
        selected={selected}
        setSelected={setSelected}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={(sb, sd) => { setSortBy(sb as SortBy); setSortDir(sd); setPage(1); }}
        onEdit={(id) => { setEditingId(id); setOpenDialog(true); }}
        page={page}
        perPage={perPage}
        total={total}
        onChangePage={setPage}
        onChangePerPage={(n) => { setPerPage(n); setPage(1); }}
      />

      <ClientDialog open={openDialog} id={editingId} onOpenChange={setOpenDialog} onSaved={() => void fetchData()} />
    </div>
  );
}
