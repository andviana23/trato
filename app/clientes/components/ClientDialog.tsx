"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const schema = z.object({
  nome: z.string().min(1, "Informe o nome"),
  telefone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  cpf_cnpj: z.string().optional().or(z.literal("")),
  data_nascimento: z.string().optional().or(z.literal("")),
  sexo: z.enum(["M","F"]).optional(),
  bloqueado: z.boolean().optional().default(false),
  endereco: z.string().optional().or(z.literal("")),
  observacoes: z.string().optional().or(z.literal("")),
});

type Values = z.infer<typeof schema>;

export default function ClientDialog({ open, onOpenChange, id, onSaved }: { open: boolean; onOpenChange: (v: boolean)=>void; id: string | null; onSaved: ()=>void }) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", telefone: "", email: "", cpf_cnpj: "", data_nascimento: "", sexo: undefined, bloqueado: false, endereco: "", observacoes: "" }
  });
  const [saldo, setSaldo] = useState(0);
  const [totalGasto, setTotalGasto] = useState(0);
  const [visitas, setVisitas] = useState(0);
  const [faltas, setFaltas] = useState(0);
  const [ultimaVisita, setUltimaVisita] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // TODO: carregar dados quando id (consultar vw_clientes_resumo)
    // por ora, mantemos métricas como 0
  }, [open, id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{id ? "Editar Ficha" : "Novo Cliente"}</DialogTitle>
        </DialogHeader>
        <form className="grid grid-cols-1 lg:grid-cols-2 gap-6" onSubmit={form.handleSubmit(async () => { onSaved(); onOpenChange(false); })}>
          {/* Coluna esquerda - Dados Cadastrais */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Nome *</label>
              <Input {...form.register('nome')} required />
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-2 items-end">
              <div>
                <label className="text-xs text-muted-foreground">DDI</label>
                <Input value={"+55"} readOnly />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Telefone *</label>
                <Input placeholder="(99) 99999-9999" {...form.register('telefone')} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Email</label>
              <Input type="email" {...form.register('email')} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">CPF</label>
                <Input placeholder="___.___.___-__" {...form.register('cpf_cnpj')} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Aniversário</label>
                <Input type="date" {...form.register('data_nascimento')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 items-end">
              <div>
                <label className="text-xs text-muted-foreground">Sexo</label>
                <Select value={form.watch('sexo') ?? undefined} onValueChange={(v)=> form.setValue('sexo', v as 'M'|'F') }>
                  <SelectTrigger>
                    <SelectValue placeholder="---" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <Switch checked={form.watch('bloqueado')} onCheckedChange={(v)=> form.setValue('bloqueado', Boolean(v))} />
                <span className="text-sm">Bloquear cliente?</span>
              </div>
            </div>

            <Accordion type="single" collapsible defaultValue="endereco">
              <AccordionItem value="endereco">
                <AccordionTrigger>Endereço</AccordionTrigger>
                <AccordionContent>
                  <Input placeholder="Rua, número, bairro, cidade" {...form.register('endereco')} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="dados">
                <AccordionTrigger>Dados Adicionais</AccordionTrigger>
                <AccordionContent>
                  <label className="text-xs text-muted-foreground">Descrição</label>
                  <Textarea rows={5} {...form.register('observacoes')} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Foto Antes</label>
                      <Input type="file" accept="image/*" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Foto Depois</label>
                      <Input type="file" accept="image/*" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Coluna direita - Informações Avançadas */}
          <div className="space-y-3">
            <Accordion type="multiple" defaultValue={["comp","comandas","ag","msg"]}>
              <AccordionItem value="comp">
                <AccordionTrigger>Comportamento</AccordionTrigger>
                <AccordionContent>
                  <div className="text-sm grid grid-cols-2 gap-2">
                    <div className="col-span-2 flex items-center justify-between">
                      <div>
                        <div className="text-muted-foreground">Saldo do Cliente</div>
                        <div className="text-lg font-semibold">{saldo.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</div>
                      </div>
                      <Button type="button" variant="secondary">Registrar Pagamento</Button>
                    </div>
                    <div className="col-span-2">
                      <div className="text-muted-foreground">Total Gasto</div>
                      <div className="font-semibold">{totalGasto.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</div>
                    </div>
                    <div className="col-span-2 mt-2">
                      <div className="text-muted-foreground">Operação:</div>
                      <div>Visitas: {visitas}</div>
                      <div>Faltas: {faltas}</div>
                      <div>Última Visita: {ultimaVisita ?? '--'}</div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="comandas">
                <AccordionTrigger>Comandas</AccordionTrigger>
                <AccordionContent>
                  <div className="text-sm text-muted-foreground">Sem registros.</div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="ag">
                <AccordionTrigger>Agendamentos</AccordionTrigger>
                <AccordionContent>
                  <div className="text-sm text-muted-foreground">Sem registros.</div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="msg">
                <AccordionTrigger>Mensagens</AccordionTrigger>
                <AccordionContent>
                  <div className="text-sm text-muted-foreground">Sem registros.</div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="lg:col-span-2 flex justify-between pt-3">
            <div />
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={()=> window.print()}>Imprimir</Button>
              <Button type="submit">Salvar</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


