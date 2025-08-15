"use client";

import clsx from "clsx";
import { Evento, LaidOutEvento } from "../types";
import { INICIO_DIA, PX_POR_MIN, SLOT_MIN, minutosDesde, duracaoMin } from "../utils/time";

type Props = {
  profissionalId: string;
  profissionalNome: string;
  eventos: Evento[];
  onSlotClick?: (iso: string, proId: string) => void;
};

// Cálculo de overlaps: varredura simples por início
export function layoutEventos(eventos: Evento[]): LaidOutEvento[] {
  const sorted = [...eventos].sort((a, b) => a.inicio.localeCompare(b.inicio));
  const active: LaidOutEvento[] = [];
  const laid: LaidOutEvento[] = [];

  for (const ev of sorted) {
    // remove eventos que já terminaram
    for (let i = active.length - 1; i >= 0; i -= 1) {
      if (active[i].fim <= ev.inicio) active.splice(i, 1);
    }
    // adicionar atual
    const top = minutosDesde(INICIO_DIA, ev.inicio) * PX_POR_MIN;
    const height = Math.max(1, duracaoMin(ev.inicio, ev.fim)) * PX_POR_MIN;
    const sameLayer = [...active, { ...ev, top, height, widthPct: 100, leftPct: 0 } as LaidOutEvento];
    const cols = sameLayer.length;
    sameLayer.forEach((e, idx) => {
      e.widthPct = Math.max(20, 100 / cols); // proteção visual
      e.leftPct = (idx * 100) / cols;
    });
    const current = sameLayer[sameLayer.length - 1];
    active.push(current);
    laid.push(current);
  }
  return laid;
}

export default function SchedulerColumn({ profissionalId, profissionalNome, eventos, onSlotClick }: Props) {
  const totalMin = 17 * 60; // altura máxima de referência visual
  const laid = layoutEventos(eventos);

  return (
    <div className="relative border-l border-gray-200 bg-white">
      {/* Header do profissional */}
      <div className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b border-gray-200 px-2 py-2 text-sm font-semibold">
        {profissionalNome}
      </div>
      {/* Área de eventos */}
      <div className="relative" style={{ height: totalMin * PX_POR_MIN }}>
        {/* slots clicáveis (a cada 15 min) */}
        {Array.from({ length: Math.ceil((17 * 60) / SLOT_MIN) }).map((_, i) => {
          const minutes = i * SLOT_MIN;
          const top = minutes * PX_POR_MIN;
          return (
            <div
              key={i}
              className="absolute left-0 right-0 h-[1px] border-t border-gray-100"
              style={{ top }}
              onClick={() => {
                const hh = String(Math.floor(minutes / 60) + 5).padStart(2, "0");
                const mm = String(minutes % 60).padStart(2, "0");
                const iso = `${new Date().toISOString().slice(0, 10)}T${hh}:${mm}:00`;
                onSlotClick?.(iso, profissionalId);
              }}
            />
          );
        })}

        {laid.map((ev) => (
          <div
            key={ev.id}
            className={clsx(
              "absolute rounded-md shadow-sm text-white text-xs p-2 overflow-hidden border",
              ev.tipo === "bloqueio"
                ? "bg-slate-600/90 border-slate-700"
                : ev.tipo === "indisponivel"
                ? "bg-gray-200 text-gray-700 border-gray-300 [background-image:repeating-linear-gradient(135deg,theme(colors.gray.300)_0px,theme(colors.gray.300)_8px,theme(colors.gray.200)_8px,theme(colors.gray.200)_16px)]"
                : "bg-blue-600 border-blue-700"
            )}
            style={{
              top: ev.top,
              height: ev.height,
              width: `${ev.widthPct}%`,
              left: `${ev.leftPct}%`,
              minHeight: 22,
            }}
            title={ev.titulo}
          >
            <div className="flex items-center gap-2">
              {ev.tipo !== "indisponivel" && (
                <span className="text-[10px] opacity-90">
                  {new Date(ev.inicio).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {" – "}
                  {new Date(ev.fim).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              <span className="truncate">{ev.titulo}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}




