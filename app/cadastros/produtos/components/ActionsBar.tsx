"use client";
import { Button } from "@/components/ui/button";

export type ActionsBarProps = {
  onNew: () => void;
  onBulkDelete: () => void;
  onImport: () => void;
  onExport: () => void;
  isLoading?: boolean;
};

export function ActionsBar({ onNew, onBulkDelete, onImport, onExport, isLoading }: ActionsBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={onNew} aria-label="Novo Produto" className="flex items-center gap-2">+ Novo Produto</Button>
      <Button variant="destructive" onClick={onBulkDelete} disabled={isLoading} aria-busy={isLoading} aria-label="Remover selecionados">Remover selecionados</Button>
      <Button variant="secondary" onClick={onImport} disabled={isLoading} aria-busy={isLoading} aria-label="Importar Produtos">Importar Produtos</Button>
      <Button variant="secondary" onClick={onExport} disabled={isLoading} aria-busy={isLoading} aria-label="Salvar no Excel">Salvar no Excel</Button>
    </div>
  );
}







