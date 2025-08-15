import React from "react";
import type { Agendamento } from "../types";

export default function ScheduleEvent({ event }: { event: Agendamento }) {
  const base =
    event.tipo === "bloqueio"
      ? "bg-slate-600 border-slate-700"
      : event.tipo === "indisponivel"
      ? "bg-gray-300 text-gray-800 border-gray-400"
      : "bg-blue-600 border-blue-700";

  return (
    <div className={`h-full w-full rounded-md border px-2 py-1 text-xs leading-tight text-white shadow-sm ${base}`}>
      <div className="flex items-center gap-2">
        <span className="truncate font-semibold">{event.title}</span>
      </div>
      {event.meta?.servico && (
        <div className="opacity-95 truncate">{event.meta.servico}</div>
      )}
    </div>
  );
}




