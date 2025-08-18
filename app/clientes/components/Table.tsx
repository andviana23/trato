"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

type Row = {
  id: string;
  codigo: number;
  nome: string;
  telefone_e164?: string | null;
  nascimento?: string | null;
  sexo?: "M" | "F" | null;
  pagamentos: number;
  pendencias: number;
  visitas: number;
  ultima_visita?: string | null;
  faltas: number;
};

export default function ClientesTable({
  rows,
  loading,
  selected,
  setSelected,
  sortBy,
  sortDir,
  onSort,
  onEdit,
  page,
  perPage,
  total,
  onChangePage,
  onChangePerPage,
}: {
  rows: Row[];
  loading: boolean;
  selected: string[];
  setSelected: (ids: string[]) => void;
  sortBy: string;
  sortDir: "asc" | "desc";
  onSort: (by: string, dir: "asc" | "desc") => void;
  onEdit: (id: string) => void;
  page: number;
  perPage: number;
  total: number;
  onChangePage: (p: number) => void;
  onChangePerPage: (n: number) => void;
}) {
  const allSelected = selected.length > 0 && selected.length === rows.length;

  const formatBRL = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function caret(col: string) {
    const active = sortBy === col;
    const dir = active ? sortDir : undefined;
    return (
      <button className="inline-flex items-center gap-1 text-xs" onClick={() => onSort(col, dir === "asc" ? "desc" : "asc")}
        aria-label={`Ordenar por ${col}`}>
        <span className="underline">ordenar</span>
        {active && <span>{dir === "asc" ? "▲" : "▼"}</span>}
      </button>
    );
  }

  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded shadow">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800">
            <th className="p-2 w-8">
              <Checkbox checked={allSelected} onCheckedChange={(v) => setSelected(v ? rows.map(r=>r.id) : [])} aria-label="Selecionar todos" />
            </th>
            <th className="p-2 font-bold">Código {caret('codigo')}</th>
            <th className="p-2 font-bold">Nome {caret('nome')}</th>
            <th className="p-2 font-bold">Telefone</th>
            <th className="p-2 font-bold">Nascimento</th>
            <th className="p-2 font-bold">Sexo</th>
            <th className="p-2 font-bold">Pagamentos (R$) {caret('pagamentos')}</th>
            <th className="p-2 font-bold">Pendências (R$) {caret('pendencias')}</th>
            <th className="p-2 font-bold">Visitas</th>
            <th className="p-2 font-bold">Última Visita {caret('ultima_visita')}</th>
            <th className="p-2 font-bold">Faltas</th>
            <th className="p-2 font-bold">Ações</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && !loading && (
            <tr><td colSpan={12} className="text-center p-6 text-gray-500">Nenhum registro encontrado.</td></tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="p-2"><Checkbox checked={selected.includes(r.id)} onCheckedChange={(v)=> setSelected(v? [...selected, r.id] : selected.filter(id=>id!==r.id))} aria-label={`Selecionar ${r.nome}`} /></td>
              <td className="p-2">{r.codigo}</td>
              <td className="p-2"><button className="text-blue-600 dark:text-blue-400 hover:underline" onClick={()=> onEdit(r.id)} aria-label={`Abrir ${r.nome}`}>{r.nome}</button></td>
              <td className="p-2">{r.telefone_e164 ?? "--"}</td>
              <td className="p-2">{r.nascimento ? format(new Date(r.nascimento), 'dd/MM/yyyy') : "--"}</td>
              <td className="p-2">{r.sexo ?? "--"}</td>
              <td className="p-2 text-right">{formatBRL(r.pagamentos)}</td>
              <td className="p-2 text-right">{formatBRL(r.pendencias)}</td>
              <td className="p-2">{r.visitas}</td>
              <td className="p-2">{r.ultima_visita ? format(new Date(r.ultima_visita), 'dd/MM/yyyy') : "--"}</td>
              <td className="p-2">{r.faltas}</td>
              <td className="p-2">{/* Ícones/ações implementados no diálogo/linha depois */}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginação */}
      <div className="flex items-center justify-between p-3 text-sm">
        <div className="flex items-center gap-2">
          <span>Mostrar</span>
          <select className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700" value={perPage} onChange={(e)=> onChangePerPage(Number(e.target.value))}>
            {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span>clientes</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="underline" onClick={()=> onChangePage(1)}>Primeira</button>
          <button className="underline" onClick={()=> onChangePage(Math.max(1, page-1))}>{'<'}</button>
          <div className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700">{page}</div>
          <button className="underline" onClick={()=> onChangePage(Math.min(Math.ceil(total/perPage)||1, page+1))}>{'>'}</button>
          <button className="underline" onClick={()=> onChangePage(Math.max(1, Math.ceil(total/perPage)||1))}>Última</button>
        </div>
      </div>
    </div>
  );
}


















