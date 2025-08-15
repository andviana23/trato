"use client";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: keyof T | string;
  header: ReactNode;
  isNumeric?: boolean;
  width?: string | number;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
};

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[] | undefined;
  isLoading?: boolean;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  onCreateClick?: () => void;
  createLabel?: string;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSortChange?: (key: string, dir: "asc" | "desc") => void;
}

export default function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyTitle = "Sem dados",
  emptyDescription = "Cadastre um novo item para começar.",
  onCreateClick,
  createLabel = "Novo",
  total,
  page = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  sortKey,
  sortDir = "asc",
  onSortChange,
}: DataTableProps<T>) {
  const totalPages = total && pageSize ? Math.max(1, Math.ceil(total / pageSize)) : undefined;

  const handleSort = (key: string) => {
    if (!onSortChange) return;
    const next = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    onSortChange(key, next);
  };

  return (
    <div>
      <div className="border rounded-xl bg-background overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th
                  key={i}
                  onClick={() => c.sortable && handleSort(String(c.key))}
                  className={cn("px-3 py-2 text-left select-none", c.isNumeric && "text-right", c.sortable && "cursor-pointer")}
                >
                  <div className="flex items-center gap-1">
                    <span>{c.header}</span>
                    {c.sortable && sortKey === c.key && (
                      <span>{sortDir === "asc" ? "▲" : "▼"}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-2">Carregando...</td>
              </tr>
            )}
            {!isLoading && (!data || data.length === 0) && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-3">
                  <div className="text-center text-muted-foreground">
                    <div className="font-medium">{emptyTitle}</div>
                    <div className="text-sm">{emptyDescription}</div>
                    {onCreateClick && (
                      <Button className="mt-3" onClick={onCreateClick}>{createLabel}</Button>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && data && data.length > 0 && data.map((row, ri) => (
              <tr key={ri}>
                {columns.map((c, ci) => (
                  <td key={ci} className={cn("px-3 py-2", c.isNumeric && "text-right")}>{c.render ? c.render(row) : (row as any)[c.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(totalPages && onPageChange) && (
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Itens por página</span>
            <select value={String(pageSize)} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onPageSizeChange && onPageSizeChange(Number(e.target.value))} className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700">
              {[10, 20, 50, 100].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onPageChange && onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>Anterior</Button>
            <span>{page} {totalPages ? `/ ${totalPages}` : ""}</span>
            <Button variant="outline" onClick={() => onPageChange && totalPages && onPageChange(Math.min(totalPages, page + 1))} disabled={!!totalPages && page >= totalPages!}>Próxima</Button>
          </div>
        </div>
      )}
    </div>
  );
}


