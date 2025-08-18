"use client";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type FiltersProps = {
  search: string;
  onSearchChange: (v: string) => void;
  status: "ativos" | "todos";
  onStatusChange: (v: "ativos" | "todos") => void;
  onSubmit: () => void;
  onReset: () => void;
  isLoading?: boolean;
};

export function Filters({ search, onSearchChange, status, onStatusChange, onSubmit, onReset, isLoading }: FiltersProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex-1 min-w-[280px]">
        <Input ref={ref} value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Procurar por produto:" aria-label="Procurar por produto" />
      </div>
      <div className="w-[220px]">
        <Select value={status} onValueChange={(v: "ativos" | "todos") => onStatusChange(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ativos">Ativos</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={onSubmit} disabled={isLoading} aria-busy={isLoading} aria-label="Buscar">Buscar</Button>
      <Button variant="ghost" onClick={onReset} disabled={isLoading} aria-label="Exibir todos">Exibir todos</Button>
    </div>
  );
}


















