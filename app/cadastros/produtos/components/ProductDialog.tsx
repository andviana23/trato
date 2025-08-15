"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(1, "Informe o nome"),
  categoria: z.string().min(1, "Informe a especialidade"),
  marca: z.string().optional().default(""),
  valor: z.coerce.number().nonnegative(),
  custo: z.coerce.number().nonnegative().default(0),
  quantidade: z.coerce.number().int().nonnegative(),
  estoque_minimo: z.coerce.number().int().nonnegative().default(0),
});

export type ProductForm = z.infer<typeof schema>;

export function ProductDialog({ open, onOpenChange, initial, onSubmit }: { open: boolean; onOpenChange: (v: boolean) => void; initial?: Partial<ProductForm>; onSubmit: (data: ProductForm) => Promise<void> | void; }) {
  const form = useForm<ProductForm>({ resolver: zodResolver(schema), defaultValues: { nome: "", categoria: "", marca: "", valor: 0, custo: 0, quantidade: 0, estoque_minimo: 0, ...initial } });
  useEffect(() => { form.reset({ nome: "", categoria: "", marca: "", valor: 0, custo: 0, quantidade: 0, estoque_minimo: 0, ...initial }); }, [initial]);
  const submitting = form.formState.isSubmitting;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial?.id ? 'Editar Produto' : 'Novo Produto'}</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={form.handleSubmit(async (data) => { await onSubmit(data); onOpenChange(false); })}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm">Nome</label>
              <Input {...form.register('nome')} aria-invalid={!!form.formState.errors.nome} />
            </div>
            <div>
              <label className="text-sm">Categoria</label>
              <Input {...form.register('categoria')} aria-invalid={!!form.formState.errors.categoria} />
            </div>
            <div>
              <label className="text-sm">Marca</label>
              <Input {...form.register('marca')} />
            </div>
            <div>
              <label className="text-sm">Preço (R$)</label>
              <Input type="text" inputMode="decimal" placeholder="0,00" {...form.register('valor')} />
            </div>
            <div>
              <label className="text-sm">Custo (R$)</label>
              <Input type="text" inputMode="decimal" placeholder="0,00" {...form.register('custo')} />
            </div>
            <div>
              <label className="text-sm">Estoque</label>
              <Input type="number" {...form.register('quantidade', { valueAsNumber: true })} min={0} />
            </div>
            <div>
              <label className="text-sm">Estoque mínimo</label>
              <Input type="number" {...form.register('estoque_minimo', { valueAsNumber: true })} min={0} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting} aria-busy={submitting}>Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


