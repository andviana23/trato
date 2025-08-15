"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isBetween from "dayjs/plugin/isBetween";
import { listEventos, type Evento } from "../actions";
import AgendaToolbar from "./AgendaToolbar";
import AgendamentoModal from "@/app/dashboard/agendamentos/components/AgendamentoModal";
import AgendaGrid from "./AgendaGrid";
import SideMonthCalendar from "./SideMonthCalendar";
import { Checkbox } from "@/components/ui/chakra-adapters";
import { createClient } from "@/lib/supabase/client";

dayjs.extend(utc); dayjs.extend(timezone); dayjs.extend(isBetween);
dayjs.tz.setDefault("America/Sao_Paulo");
type Resource = { resourceId: string | number; resourceTitle: string; color?: string };

export default function AgendaCalendar() {
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<"day"|"week">("day");
  const [events, setEvents] = useState<Evento[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [newDefault, setNewDefault] = useState<{ dateISO: string; profissionalId?: string } | null>(null);
  const [selectedProfIds, setSelectedProfIds] = useState<string[]>([]);
  const range = useMemo(() => {
    const start = view === "day" ? dayjs(date).startOf('day') : dayjs(date).startOf('week');
    const end = view === "day" ? dayjs(date).endOf('day') : dayjs(date).endOf('week');
    return { start: start.toISOString(), end: end.toISOString() };
  }, [date, view]);

  const load = useCallback(async () => {
    const { eventos, resources } = await listEventos({ start: range.start, end: range.end, view, profissionalIds: selectedProfIds.length ? selectedProfIds : undefined });
    setEvents(eventos);

    // Sempre buscar a lista completa de barbeiros da unidade e unificar com os resources vindos do server
    try {
      const supabase = createClient();
      const cookieSlug = typeof document !== 'undefined' ? (document.cookie.match(/(?:^|; )tb\.unidade=([^;]+)/)?.[1]) : null;
      const slug = cookieSlug ? decodeURIComponent(cookieSlug) : 'trato';
      const { data: profs } = await supabase
        .from('profissionais')
        .select('id, nome, cor, funcao, unidade')
        .eq('unidade', slug)
        .eq('funcao', 'barbeiro');
      type Row = { id: string; nome: string; cor?: string | null };
      const fromDb: Resource[] = ((profs || []) as Row[]).map((p) => ({ resourceId: String(p.id), resourceTitle: p.nome, color: p.cor ?? undefined }));
      const all = [...(resources || []), ...fromDb];
      const uniq: Resource[] = [];
      const seen = new Set<string>();
      for (const r of all) {
        const k = String(r.resourceId);
        if (!seen.has(k)) { seen.add(k); uniq.push(r); }
      }
      setResources(uniq);
      setSelectedProfIds((prev) => prev.length ? prev : uniq.map((r) => String(r.resourceId)));
    } catch {
      setResources(resources || []);
      setSelectedProfIds((prev) => prev.length ? prev : (resources || []).map((r) => String(r.resourceId)));
    }
  }, [range.start, range.end, view, selectedProfIds]);

  useEffect(() => { void load(); }, [load]);

  // estilos agora são tratados dentro do componente AgendaGrid

  return (
    <div className="p-4 h-[calc(100dvh-64px)] flex flex-col overflow-hidden">
      {/* Toolbar sticky no topo da área da agenda */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 text-[12px]">
        <div className="h-14 flex items-center">
          <AgendaToolbar
            date={date}
            view={view}
            onToday={() => setDate(new Date())}
            onPrev={() => setDate(dayjs(date).subtract(1, view === 'day' ? 'day':'week').toDate())}
            onNext={() => setDate(dayjs(date).add(1, view === 'day' ? 'day':'week').toDate())}
            onChangeView={(v) => setView(v)}
            onNew={() => setOpenModal(true)}
          />
        </div>
      </div>
      {/* Conteúdo abaixo da toolbar. Somente a grade (coluna direita) rola */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="grid grid-cols-[260px_1fr] gap-3 h-full text-[12px]">
          {/* Sidebar mês fixa */}
          <div className="hidden lg:block">
            <div className="sticky space-y-3" style={{ top: 56 }}>
              {/* top igual à altura da toolbar (h-16 = 64px) */}
              {/* Calendário do mês */}
              <SideMonthCalendar value={date} onChange={(d) => setDate(d)} />

              {/* Fila de Espera */}
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="text-xs font-semibold mb-2">Fila de Espera</div>
                <div className="text-[11px] text-muted-foreground mb-2">Agora você pode registrar clientes em fila de espera para encaixes futuros.</div>
                <button className="w-full rounded-md bg-primary text-primary-foreground py-1.5 text-xs">+ Adicionar</button>
              </div>

              {/* Lista de Profissionais */}
              <div className="rounded-lg border border-border bg-card p-2">
                <div className="px-2 py-2 text-xs font-semibold">Profissionais</div>
                <div className="divide-y divide-border/50">
                  {resources.map((r) => {
                    const id = String(r.resourceId);
                    const checked = selectedProfIds.includes(id);
                    return (
                      <label key={id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent/30 cursor-pointer">
                        <Checkbox checked={checked} onChange={() => {
                          setSelectedProfIds((prev) => prev.includes(id) ? prev.filter(p => p!==id) : [...prev, id]);
                        }} />
                        <span className="text-xs">{r.resourceTitle}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="p-2">
                  <button className="w-full rounded-md bg-secondary text-secondary-foreground py-1.5 text-xs">+ Novo Profissional</button>
                </div>
              </div>
            </div>
          </div>
          {/* Coluna rolável da agenda */}
          <div className="h-full overflow-y-auto overflow-x-auto">
              <div className="rounded-lg border border-border shadow-md bg-card p-4 h-full w-full">
                {/* Scroll está no contêiner pai; cabeçalhos sticky funcionam dentro deste contexto */}
                <AgendaGrid
            date={date}
            view={view}
                  events={events.map(e => ({ id: e.id, resourceId: e.resourceId, start: e.start, end: e.end, title: e.title, status: e.status }))}
                  resources={resources.filter(r => selectedProfIds.includes(String(r.resourceId)))}
            startHour={8}
            endHour={20}
            onEventClick={async (id) => {
              console.log('evento', id);
            }}
            onMove={async (id, newStartISO, newEndISO) => {
              await fetch('/api/agenda/move', { method: 'POST', body: JSON.stringify({ id, start: newStartISO, end: newEndISO }) }).catch(()=>{});
              void load();
            }}
            onResize={async (id, newEndISO) => {
              await fetch('/api/agenda/resize', { method: 'POST', body: JSON.stringify({ id, end: newEndISO }) }).catch(()=>{});
              void load();
            }}
            onSelectRange={(startISO, endISO, resourceId) => {
              // Persistir hora selecionada para o modal abrir já preenchido
              try {
                const h = dayjs(startISO).format('HH:mm');
                if (typeof window !== 'undefined') localStorage.setItem('agenda.defaultHour', h);
              } catch {}
              setNewDefault({ dateISO: startISO, profissionalId: resourceId ? String(resourceId) : undefined });
              setOpenModal(true);
            }}
                />
              </div>
          </div>
        </div>
      </div>
      {openModal && (
        <AgendamentoModal
          isOpen={openModal}
          onClose={() => setOpenModal(false)}
          onSaved={() => { setOpenModal(false); void load(); }}
          defaultDate={dayjs(date).format('YYYY-MM-DD')}
          defaultProfessionalId={newDefault?.profissionalId}
        />
      )}
    </div>
  );
}



