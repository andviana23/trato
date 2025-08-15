"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { listProfessionals, upsertProfessional, deleteProfessional } from "./actions";

type Profissional = { id: string; nome: string; email?: string | null; telefone?: string | null; data_nascimento?: string | null; funcao: "barbeiro" | "recepcionista" | "gerente"; unidade?: string | null; unidade_id?: string | null };

export default function ProfissionaisPage() {
  const [rows, setRows] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Profissional | null>(null);
  const [form, setForm] = useState<Omit<Profissional, "id">>({ nome: "", email: "", telefone: "", data_nascimento: "", funcao: "barbeiro" });

  async function fetchRows() {
    setLoading(true);
    try {
      const data = await listProfessionals();
      // Filtro defensivo também no client (caso o cookie ainda não esteja 100% disponível no servidor)
      const slug = (typeof document !== 'undefined' && document.cookie.match(/(?:^|; )tb\.unidade=([^;]+)/)?.[1]) ? decodeURIComponent(document.cookie.match(/(?:^|; )tb\.unidade=([^;]+)/)![1]) : 'trato';
      const uid = (typeof document !== 'undefined' && document.cookie.match(/(?:^|; )tb\.unidade_id=([^;]+)/)?.[1]) ? decodeURIComponent(document.cookie.match(/(?:^|; )tb\.unidade_id=([^;]+)/)![1]) : null;
      const filtered = (data || []).filter((r) => (r.unidade === slug) || (uid && r.unidade_id === uid));
      setRows(filtered);
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar profissionais");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void fetchRows(); }, []);

  function openNovo() {
    setEditing(null);
    setForm({ nome: "", email: "", telefone: "", data_nascimento: "", funcao: "barbeiro" });
    setOpen(true);
  }
  function openEditar(p: Profissional) {
    setEditing(p);
    setForm({ nome: p.nome, email: p.email || "", telefone: p.telefone || "", data_nascimento: p.data_nascimento || "", funcao: p.funcao });
    setOpen(true);
  }
  async function salvar() {
    try {
      if (!form.nome.trim()) throw new Error("Informe o nome");
      await upsertProfessional(editing ? { ...form, id: editing.id } : form);
      setOpen(false);
      toast.success("Salvo com sucesso");
      void fetchRows();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    }
  }
  async function deletar(id: string) {
    try {
      await deleteProfessional(id);
      toast.success("Excluído");
      void fetchRows();
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir");
    }
  }

  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">Profissionais</h2>
        <Button onClick={openNovo}><Plus className="w-4 h-4 mr-1"/>Novo Profissional</Button>
      </div>

      <Card>
        <CardContent className="p-3">
          <Tabs defaultValue="barbeiros">
            <TabsList>
              <TabsTrigger value="barbeiros">Barbeiros</TabsTrigger>
              <TabsTrigger value="recepcionistas">Recepcionistas</TabsTrigger>
            </TabsList>

            <TabsContent value="barbeiros">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead className="w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.filter(r=> r.funcao === 'barbeiro').map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/50">
                        <TableCell>{p.nome}</TableCell>
                        <TableCell>{p.email || "-"}</TableCell>
                        <TableCell>{p.telefone || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={()=> openEditar(p)}>Editar</Button>
                            <Button variant="destructive" size="sm" onClick={()=> deletar(p.id)}>Excluir</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && rows.filter(r=> r.funcao === 'barbeiro').length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum barbeiro cadastrado.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="recepcionistas">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead className="w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.filter(r=> r.funcao === 'recepcionista').map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/50">
                        <TableCell>{p.nome}</TableCell>
                        <TableCell>{p.email || "-"}</TableCell>
                        <TableCell>{p.telefone || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={()=> openEditar(p)}>Editar</Button>
                            <Button variant="destructive" size="sm" onClick={()=> deletar(p.id)}>Excluir</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && rows.filter(r=> r.funcao === 'recepcionista').length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum recepcionista cadastrado.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Profissional" : "Novo Profissional"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Nome</label>
              <Input value={form.nome} onChange={(e)=> setForm({...form, nome: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Email</label>
              <Input type="email" value={form.email ?? ""} onChange={(e)=> setForm({...form, email: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Telefone</label>
              <Input value={form.telefone ?? ""} onChange={(e)=> setForm({...form, telefone: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Aniversário</label>
              <Input type="date" value={form.data_nascimento ?? ""} onChange={(e)=> setForm({...form, data_nascimento: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Função</label>
              <Select value={form.funcao} onValueChange={(v)=> setForm({...form, funcao: v as any})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="barbeiro">Barbeiro</SelectItem>
                  <SelectItem value="recepcionista">Recepcionista</SelectItem>
                  <SelectItem value="gerente">Gerente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={()=> setOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
