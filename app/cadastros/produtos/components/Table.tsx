"use client";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { StockQuickEdit } from "./StockQuickEdit";

export type Row = {
  id: string;
  nome: string;
  categoria: string;
  valor: number;
  custo?: number;
  quantidade: number;
  estoque_minimo?: number;
};

export type TableProps = {
  rows: Row[];
  selectedIds: string[];
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  sortBy: "nome" | "valor" | "quantidade";
  sortDir: "asc" | "desc";
  onSort: (by: "nome" | "valor" | "quantidade") => void;
  onUpdateStock: (id: string, value: number) => Promise<void> | void;
  onUpdateMin: (id: string, value: number) => Promise<void> | void;
};

function formatBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);
}

export function ProductsTable({ rows, selectedIds, onToggleRow, onToggleAll, onEdit, onDelete, sortBy, sortDir, onSort, onUpdateStock, onUpdateMin }: TableProps) {
  const allSelected = useMemo(() => rows.length > 0 && rows.every(r => selectedIds.includes(r.id)), [rows, selectedIds]);
  const caret = (key: "nome" | "valor" | "quantidade") => (
    <button className="inline-flex items-center gap-1" onClick={() => onSort(key)} aria-label={`Ordenar por ${key}`}>
      <span className="w-3 h-3 border-b border-r rotate-45" style={{ borderColor: sortBy === key && sortDir === 'asc' ? '#111' : '#bbb' }} />
    </button>
  );
  return (
    <div className="overflow-x-auto rounded shadow border border-border bg-card">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-card">
            <th className="p-2 w-8"><input type="checkbox" checked={allSelected} onChange={onToggleAll} aria-label="Selecionar todos" /></th>
            <th className="p-2 font-bold">Nome {caret('nome')}</th>
            <th className="p-2 font-bold">Categoria</th>
            <th className="p-2 font-bold">Preço R$ {caret('valor')}</th>
            <th className="p-2 font-bold">Custo R$</th>
            <th className="p-2 font-bold">Estoque {caret('quantidade')}</th>
            <th className="p-2 font-bold">Ações</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={7} className="text-center p-6 text-muted-foreground">Nenhum registro encontrado.</td></tr>
          )}
          {rows.map((p) => (
            <tr key={p.id} className="border-t border-border hover:bg-accent/30">
              <td className="p-2"><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => onToggleRow(p.id)} aria-label={`Selecionar ${p.nome}`} /></td>
              <td className="p-2"><button className="text-primary hover:underline" onClick={() => onEdit(p.id)} aria-label={`Abrir ${p.nome}`}>{p.nome}</button></td>
              <td className="p-2">{p.categoria}</td>
              <td className="p-2">{formatBRL(p.valor)}</td>
              <td className="p-2">{formatBRL(p.custo ?? 0)}</td>
              <td className="p-2">
                <div className="flex items-center gap-2">
                  <StockQuickEdit value={p.quantidade} onConfirm={(v) => onUpdateStock(p.id, v)} />
                  <button className="text-xs underline text-muted-foreground" onClick={async () => {
                    const v = window.prompt('Novo mínimo', String(p.estoque_minimo ?? 0));
                    if (v == null) return;
                    const num = Math.max(0, Number(v));
                    await onUpdateMin(p.id, num);
                  }}>min: {p.estoque_minimo ?? 0}</button>
                </div>
              </td>
              <td className="p-2 flex flex-wrap gap-1">
                <Button size="sm" variant="secondary" onClick={() => onEdit(p.id)} aria-label="Editar">Editar</Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(p.id)} aria-label="Excluir">Excluir</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


