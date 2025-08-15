"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type StockQuickEditProps = {
  value: number;
  onConfirm: (value: number) => Promise<void> | void;
};

export function StockQuickEdit({ value, onConfirm }: StockQuickEditProps) {
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState(String(value));
  const [loading, setLoading] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="secondary" aria-label="Editar estoque">{value}</Button>
      </PopoverTrigger>
      <PopoverContent className="w-60">
        <div className="space-y-2">
          <label className="text-sm">Novo estoque</label>
          <Input type="number" value={temp} onChange={(e) => setTemp(e.target.value)} min={0} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={async () => { setLoading(true); try { await onConfirm(Math.max(0, Number(temp))); setOpen(false); } finally { setLoading(false); } }} disabled={loading} aria-busy={loading}>Salvar</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}







