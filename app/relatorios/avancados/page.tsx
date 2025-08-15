"use client";

import PeriodFilters from "../components/PeriodFilters";

export default function RelatoriosAvancadosPage() {
  return (
    <div className="space-y-4">
      <div className="flex gap-6 border-b pb-2 text-xs font-bold uppercase tracking-wider">
        <a className="text-muted-foreground" href="/relatorios/principal">Principal</a>
        <a className="text-muted-foreground" href="/relatorios/agenda">Agenda</a>
        <a className="text-muted-foreground" href="/relatorios/financeiro">Financeiro</a>
        <a className="border-b-2 border-primary" href="#" aria-current="page">Avançados</a>
      </div>
      <PeriodFilters />
      <div className="text-sm text-muted-foreground">Em breve: indicadores avançados, LTV, churn, etc.</div>
    </div>
  );
}







