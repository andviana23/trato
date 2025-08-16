"use client";
import { Button } from "@/components/ui/button";

export function LowStockBanner({ items, onExport }: { items: { id: string; nome: string; quantidade: number; estoque_minimo?: number }[]; onExport: () => void; }) {
  if (!items.length) return null;
  return (
    <div className="mb-3 p-3 rounded border bg-amber-50 text-amber-900 flex items-center justify-between">
      <div className="text-sm">
        Existem {items.length} produtos com estoque abaixo do mínimo.
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={onExport}>Exportar alertas</Button>
      </div>
    </div>
  );
}

















