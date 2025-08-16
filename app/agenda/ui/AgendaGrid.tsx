"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isBetween from "dayjs/plugin/isBetween";
import React, { useMemo } from "react";
import { getSlotHeightPx } from "../utils/gridHelpers";
import { toast } from "react-hot-toast";

// Configurar dayjs com plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);
dayjs.tz.setDefault('America/Sao_Paulo');

export type GridEvent = {
	id: string;
	resourceId?: string | number;
	start: string; // ISO
	end: string;   // ISO
	title?: string;
	status?: string;
	clientName?: string;
	serviceName?: string;
	isNewClient?: boolean;
};

export type BlockedRange = {
	id: string;
	resourceId?: string | number;
	startISO: string;
	endISO: string;
	reason?: string;
};

export type GridResource = {
	resourceId: string | number;
	resourceTitle: string;
	color?: string;
};

type View = "day" | "week";

type Props = {
	date: Date;
	view: View;
	events: GridEvent[];
	resources: GridResource[];
	blockedRanges?: BlockedRange[];
	startHour?: number; // 0-23
	endHour?: number;   // 1-24
	slotMinutes?: number; // tamanho do intervalo, ex.: 10
	slotHeightPx?: number; // altura visual de cada slot em px, ex.: 31
	onEventClick?: (id: string) => void;
	onMove?: (id: string, newStartISO: string, newEndISO: string) => void;
	onResize?: (id: string, newEndISO: string) => void;
	onSelectRange?: (startISO: string, endISO: string, resourceId?: string | number) => void;
};

function useTimeSlots(startHour: number, endHour: number, slotMinutes: number) {
	return useMemo(() => {
		const slots: { label: string; minutesFromStart: number; isHour: boolean }[] = [];
		for (let h = startHour; h < endHour; h++) {
			for (let m = 0; m < 60; m += slotMinutes) {
				const minutesFromStart = (h - startHour) * 60 + m;
				slots.push({
					label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
					minutesFromStart,
					isHour: m === 0,
				});
			}
		}
		return slots;
	}, [startHour, endHour, slotMinutes]);
}

function statusColor(status?: string): { bg: string; text: string; border: string } {
    // Cores AppBarber-like
    switch (status) {
        case "agendado": 
        case "confirmado": 
            return { bg: "#22c55e", text: "#ffffff", border: "#16a34a" }; // verde
        case "atendido": 
            return { bg: "#3b82f6", text: "#ffffff", border: "#2563eb" }; // azul
        case "cancelado": 
        case "no_show": 
            return { bg: "#ef4444", text: "#ffffff", border: "#dc2626" }; // vermelho
        case "bloqueado": 
            return { bg: "#374151", text: "#ffffff", border: "#1f2937" }; // cinza escuro
        default: 
            return { bg: "#22c55e", text: "#ffffff", border: "#16a34a" }; // verde padrão
    }
}

// Função de validação de conflitos
function hasConflictWith(events: GridEvent[], resourceId: string | number | undefined, startISO: string, endISO: string, ignoreId?: string): { hasConflict: boolean; conflictingEvent?: GridEvent } {
    const overlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) => 
        dayjs(aStart).isBefore(bEnd) && dayjs(aEnd).isAfter(bStart);

    for (const event of events) {
        if (event.id === ignoreId) continue;
        if (String(event.resourceId) !== String(resourceId)) continue;
        if (overlap(startISO, endISO, event.start, event.end)) {
            return { hasConflict: true, conflictingEvent: event };
        }
    }
    return { hasConflict: false };
}

// Função para quantizar minutos
const quantizeMinutes = (minutes: number, slotMinutes: number) => 
    Math.round(minutes / slotMinutes) * slotMinutes;

function EventBlock({ event, date, startHour, pxPerMinute, onClick, onDragStart, onResizeStart }: {
	event: GridEvent;
	date: Date;
	startHour: number;
	pxPerMinute: number;
	onClick?: (id: string) => void;
	onDragStart?: (e: React.MouseEvent, eventId: string) => void;
	onResizeStart?: (e: React.MouseEvent, eventId: string) => void;
}) {
	const start = dayjs(event.start);
	const end = dayjs(event.end);
	// Base única do dia para evitar drift (PONTO 5 - BASE TEMPORAL ÚNICA)
	const base = dayjs(date).startOf('day').hour(startHour).minute(0).second(0);
	const minutesFromStart = start.diff(base, 'minute');
	const duration = Math.max(5, end.diff(start, 'minute'));
	const top = minutesFromStart * pxPerMinute;
	const height = Math.max(18, duration * pxPerMinute);
	const colors = statusColor(event.status);
	
	const isBlocked = event.status === 'bloqueado';
	const isNewClient = event.isNewClient;

	return (
		<div
			data-event={event.id}
			role="button"
			tabIndex={0}
			onClick={() => onClick?.(event.id)}
			onMouseDown={(e) => !isBlocked && onDragStart?.(e, event.id)}
			className={`
				absolute rounded-lg border transition-all duration-200 
				${isBlocked ? 'cursor-not-allowed' : 'cursor-grab hover:z-30 focus:z-30'}
				focus:outline-none focus:ring-2 focus:ring-white/20 
				hover:outline hover:outline-2 hover:outline-white/15
				group
			`}
			style={{
				position: "absolute",
				top,
				left: 8,
				right: 8,
				height,
				background: colors.bg,
				color: colors.text,
				border: `1px solid ${colors.border}`,
				zIndex: 20,
			}}
		>
			{/* Header com horário - Estilo AppBarber */}
			<div className="px-2 py-1 text-xs font-semibold flex items-center justify-between border-b" style={{
				backgroundColor: 'hsl(var(--agenda-zebra))',
				borderColor: 'hsl(var(--agenda-border))'
			}}>
				<span style={{ color: 'hsl(var(--agenda-text))' }}>{start.format("HH:mm")} – {end.format("HH:mm")}</span>
				<div className="flex items-center gap-1">
					{isNewClient && <span>⭐</span>}
					{isBlocked && <span>🔒</span>}
				</div>
			</div>
			
			{/* Corpo do cartão */}
			<div className="p-2 text-xs">
				<div className="font-medium truncate" style={{ color: 'hsl(var(--agenda-text))' }}>{event.clientName || event.title || "Cliente"}</div>
				<div className="truncate" style={{ color: 'hsl(var(--agenda-text-muted))' }}>{event.serviceName || "Serviço"}</div>
			</div>
			
			{/* Handles de resize - Estilo AppBarber */}
			{!isBlocked && (
				<>
					{/* Handle superior */}
					<div
						className="absolute left-2 right-2 top-0 h-1 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
						style={{ background: "repeating-linear-gradient(to right, transparent, transparent 2px, white 2px, white 4px)" }}
						onMouseDown={(e) => onResizeStart?.(e, event.id)}
					/>
					{/* Handle inferior */}
					<div
						className="absolute left-2 right-2 bottom-0 h-1 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
						style={{ background: "repeating-linear-gradient(to right, transparent, transparent 2px, white 2px, white 4px)" }}
						onMouseDown={(e) => onResizeStart?.(e, event.id)}
					/>
				</>
			)}
		</div>
	);
}

function BlockedRangeBlock({ blockedRange, date, startHour, pxPerMinute }: {
	blockedRange: BlockedRange;
	date: Date;
	startHour: number;
	pxPerMinute: number;
}) {
	const start = dayjs(blockedRange.startISO);
	const end = dayjs(blockedRange.endISO);
	const base = dayjs(date).startOf('day').hour(startHour).minute(0).second(0);
	const minutesFromStart = start.diff(base, 'minute');
	const duration = end.diff(start, 'minute');
	const top = minutesFromStart * pxPerMinute;
	const height = Math.max(10, duration * pxPerMinute);

	return (
		<div
			className="absolute bg-gray-600/80 border border-gray-500/50 rounded-lg pointer-events-none"
			style={{
				position: "absolute",
				top,
				left: 8,
				right: 8,
				height,
				zIndex: 10,
			}}
		>
			<div className="p-2 text-xs text-white/80 flex items-center gap-1">
				<span>🔒</span>
				<span className="truncate">{blockedRange.reason || "Bloqueado"}</span>
			</div>
		</div>
	);
}

function NowLine({ startHour, endHour, pxPerMinute }: {
	startHour: number;
	endHour: number;
	pxPerMinute: number;
}) {
	const now = dayjs();
	const todayStart = now.startOf('day').hour(startHour).minute(0).second(0);
	const todayEnd = now.startOf('day').hour(endHour).minute(0).second(0);
	
	// Só mostra se estiver no horário de funcionamento
	if (now.isBefore(todayStart) || now.isAfter(todayEnd)) {
		return null;
	}
	
	const minutesFromStart = now.diff(todayStart, 'minute');
	const top = minutesFromStart * pxPerMinute;
	
	return (
		<div
			className="absolute left-0 right-0 z-30 pointer-events-none"
			style={{ top }}
		>
			{/* Linha vermelha */}
			<div className="h-0.5 bg-red-500 relative">
				{/* Label "Agora" no gutter */}
				<div className="absolute -left-16 -top-2 text-xs text-red-500 font-medium bg-[#0F1115] px-1 rounded">
					Agora
				</div>
			</div>
		</div>
	);
}

export default function AgendaGrid({ date, view, events, resources, blockedRanges = [], startHour = 8, endHour = 21, slotMinutes = 10, slotHeightPx, onEventClick, onMove, onResize, onSelectRange }: Props) {
	const slots = useTimeSlots(startHour, endHour, slotMinutes);
	
	// Helper já implementado na função quantizeMinutes
	
	// Obter altura real do slot (CSS var ou prop)
	const realSlotHeight = getSlotHeightPx(slotHeightPx, slotMinutes);
	const pxPerMinute = realSlotHeight / slotMinutes;
	
	// Interações: drag, resize, seleção
	const [dragState, setDragState] = React.useState<null | { id: string; resourceId?: string | number; startY: number; originStart: string; originEnd: string }>(null);
	const [resizeState, setResizeState] = React.useState<null | { id: string; startY: number; originEnd: string }>(null);
	const [selectState, setSelectState] = React.useState<null | { resourceId?: string | number; startY: number; currentY: number; colTop: number }>(null);

	const minutesPerPx = 1 / pxPerMinute; // 1px => minutes

	const handleMouseMove = (e: React.MouseEvent) => {
        if (dragState) {
            // Somente visual; cálculo aplicado no mouseup
        }
		if (resizeState) {
			// idem
		}
		if (selectState) {
			setSelectState({ ...selectState, currentY: e.clientY });
		}
	};

	const handleMouseUp = (colTop: number, resourceId?: string | number) => (e: React.MouseEvent) => {
		if (dragState && onMove) {
			const deltaY = e.clientY - dragState.startY;
			const deltaMin = quantizeMinutes(deltaY * minutesPerPx, slotMinutes);
			const newStart = dayjs(dragState.originStart).add(deltaMin, "minute");
			const newEnd = dayjs(dragState.originEnd).add(deltaMin, "minute");
			
			// PONTO 3 - VALIDAÇÃO DE CONFLITOS
			const conflict = hasConflictWith(events, dragState.resourceId, newStart.toISOString(), newEnd.toISOString(), dragState.id);
			if (conflict.hasConflict) {
				toast.error(`Conflito com agendamento existente`);
			} else {
				onMove(dragState.id, newStart.toISOString(), newEnd.toISOString());
			}
		}
		if (resizeState && onResize) {
			const deltaY = e.clientY - resizeState.startY;
			const deltaMin = quantizeMinutes(deltaY * minutesPerPx, slotMinutes);
			const newEnd = dayjs(resizeState.originEnd).add(deltaMin, "minute");
			
			// Obter evento original para validação
			const originalEvent = events.find(e => e.id === resizeState.id);
			if (originalEvent) {
				// PONTO 3 - VALIDAÇÃO DE CONFLITOS
				const conflict = hasConflictWith(events, originalEvent.resourceId, originalEvent.start, newEnd.toISOString(), resizeState.id);
				if (conflict.hasConflict) {
					toast.error('Conflito ao redimensionar agendamento');
				} else {
					onResize(resizeState.id, newEnd.toISOString());
				}
			}
		}
		if (selectState && onSelectRange) {
			// PONTO 6 - SELEÇÃO COM COORDENADAS CORRETAS
			const startColY = selectState.startY - selectState.colTop;
			const endColY = (selectState.currentY ?? selectState.startY) - selectState.colTop;
			const topY = Math.min(startColY, endColY);
			const bottomY = Math.max(startColY, endColY);
			const startMin = quantizeMinutes(topY * minutesPerPx, slotMinutes);
			const endMin = Math.max(startMin + slotMinutes, quantizeMinutes(bottomY * minutesPerPx, slotMinutes));
			const base = dayjs(date).startOf("day").hour(startHour).minute(0).second(0);
			const startISO = base.add(startMin, "minute").toISOString();
			const endISO = base.add(endMin, "minute").toISOString();
			
			// PONTO 3 - VALIDAÇÃO DE CONFLITOS
			const conflict = hasConflictWith(events, resourceId, startISO, endISO);
			if (conflict.hasConflict) {
				toast.error(`Conflito com agendamento existente`);
			} else {
				onSelectRange(startISO, endISO, resourceId);
			}
		}
		setDragState(null);
		setResizeState(null);
		setSelectState(null);
	};

	if (view === "week") {
		// Semana simples: colunas por dia (sem resources)
		const startOfWeek = dayjs(date).startOf("week");
		const days = new Array(7).fill(0).map((_, i) => startOfWeek.add(i, "day"));
		return (
			<div className="h-[calc(100vh-220px)] overflow-y-auto rounded-2xl border bg-[#0F1115] border-white/10">
				{/* Cabeçalho dias */}
				<div className="grid sticky top-0 z-30 bg-[#0F1115] border-b border-white/10" style={{ gridTemplateColumns: `64px repeat(${days.length}, 1fr)` }}>
                    <div className="border-b bg-card sticky top-0 z-10" />
					{days.map((d) => (
						<div key={d.toString()} className="px-2 py-2 font-semibold text-xs border-b bg-card text-foreground sticky top-0 z-10">{d.format("ddd DD/MM")}</div>
					))}
				</div>
				{/* Corpo com linhas horizontais perfeitas */}
				<div className="relative" style={{ height: (endHour - startHour) * (realSlotHeight * (60 / slotMinutes)) }}>
					{/* Background com linhas horizontais para toda a área */}
					<div 
						className="absolute inset-0 pointer-events-none"
						style={{
							background: `
								repeating-linear-gradient(
									to bottom,
									rgba(255,255,255,.08) 0,
									rgba(255,255,255,.08) 1px,
									transparent 1px,
									transparent ${realSlotHeight}px
								),
								repeating-linear-gradient(
									to bottom,
									rgba(255,255,255,.15) 0,
									rgba(255,255,255,.15) 2px,
									transparent 2px,
									transparent ${realSlotHeight * 6}px
								)
							`
						}}
					/>
					<div className="absolute inset-0 grid" style={{ gridTemplateColumns: `64px repeat(${days.length}, 1fr)` }}>
						{/* Gutter de horas com mesmo background */}
						<div 
							className="relative bg-card sticky left-0 z-10"
							style={{
								background: `
									repeating-linear-gradient(
										to bottom,
										rgba(255,255,255,.08) 0,
										rgba(255,255,255,.08) 1px,
										transparent 1px,
										transparent ${realSlotHeight}px
									),
									repeating-linear-gradient(
										to bottom,
										rgba(255,255,255,.15) 0,
										rgba(255,255,255,.15) 2px,
										transparent 2px,
										transparent ${realSlotHeight * 6}px
									)
								`
							}}
						>
						{slots.map((s, idx) => (
							<div key={idx} className="text-[10px] leading-4 text-muted-foreground pr-2 pt-[2px] text-right select-none" style={{ height: realSlotHeight }}>
								{s.label}
							</div>
						))}
						</div>
						{/* Colunas de dias */}
						{days.map((d) => (
							<div key={d.toString()} className="relative border-l bg-background"
								onMouseMove={handleMouseMove}
								onMouseUp={(e) => {
									const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
									handleMouseUp(rect.top)(e);
								}}
		>
								{/* Remover linhas individuais - agora são background */}
								{/* Eventos do dia */}
					{events.filter(e => dayjs(e.start).isSame(d, "day")).map(e => (
						<EventBlock
							key={e.id}
							event={e}
							date={d.toDate()}
							startHour={startHour}
							pxPerMinute={pxPerMinute}
							onClick={onEventClick}
							onDragStart={(ev, id) => {
								ev.stopPropagation();
								setDragState({ id, startY: ev.clientY, originStart: e.start, originEnd: e.end });
							}}
							onResizeStart={(ev, id) => {
								ev.stopPropagation();
								setResizeState({ id, startY: ev.clientY, originEnd: e.end });
							}}
						/>
					))}
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	// Dia com colunas por profissional - Estilo AppBarber
	return (
		<div className="h-[calc(100vh-220px)] overflow-y-auto rounded-2xl border" style={{
			borderColor: 'hsl(var(--agenda-border))',
			backgroundColor: 'hsl(var(--agenda-bg))'
		}}>
			{/* Cabeçalho recursos - PONTO 2 - GRID E STICKY */}
			<div className="grid sticky top-0 z-30 border-b" style={{ 
				gridTemplateColumns: `64px repeat(${resources.length}, minmax(240px,1fr))`,
				backgroundColor: 'hsl(var(--agenda-card-bg))',
				borderColor: 'hsl(var(--agenda-border))'
			}}>
                {/* Coluna de horas fixa */}
                <div className="p-3 text-xs font-semibold" style={{
					color: 'hsl(var(--agenda-text-muted))',
					backgroundColor: 'hsl(var(--agenda-card-bg))'
				}}>Horário</div>
                {resources.map((r) => (
					<div key={String(r.resourceId)} className="px-3 py-3 font-semibold text-sm border-l flex items-center gap-2" style={{
						borderColor: 'hsl(var(--agenda-border))',
						backgroundColor: 'hsl(var(--agenda-card-bg))',
						color: 'hsl(var(--agenda-text))'
					}}>
                        <span
                            className={`inline-block w-3 h-3 rounded-full ${r.color ? '' : 'bg-green-500'}`}
                            style={r.color ? { background: r.color } : undefined}
                        />
						<span className="truncate">{r.resourceTitle}</span>
					</div>
				))}
			</div>
			{/* Corpo com linhas e zebra - PONTO 1 - BACKGROUNDS DAS LINHAS/ZEBRA */}
			<div 
				className="relative"
				style={{ 
					height: (endHour - startHour) * (realSlotHeight * (60 / slotMinutes)),
					// Background com linhas finas a cada 10min usando CSS vars para tema
					background: `repeating-linear-gradient(to bottom, hsl(var(--agenda-grid-line)) 0 1px, transparent 1px ${realSlotHeight}px)`
				}}
			>
				{/* Zebra de fundo a cada 30min - PONTO 1 */}
				<div 
					className="absolute inset-0 pointer-events-none"
					style={{
						background: `repeating-linear-gradient(to bottom, hsl(var(--agenda-zebra)) 0 ${realSlotHeight * 3}px, transparent ${realSlotHeight * 3}px ${realSlotHeight * 6}px)`
					}}
				/>
				{/* Linhas da hora cheia - PONTO 1 */}
				<div 
					className="absolute inset-0 pointer-events-none"
					style={{
						background: `repeating-linear-gradient(to bottom, hsl(var(--agenda-grid-line-strong)) 0 2px, transparent 2px ${realSlotHeight * 6}px)`
					}}
				/>
				<div className="absolute inset-0 grid" style={{ gridTemplateColumns: `64px repeat(${resources.length}, minmax(240px,1fr))` }}>
					{/* Gutter de horas - PONTO 4 - GUTTER DE HORAS */}
					<div className="relative sticky left-0 z-20 border-r" style={{ 
						backgroundColor: 'hsl(var(--agenda-card-bg))',
						borderColor: 'hsl(var(--agenda-border))'
					}}>
						{slots.map((s, idx) => (
							<div key={idx} className="pr-3 pt-1 select-none text-right font-medium" style={{ 
								height: realSlotHeight,
								fontSize: '13px',
								color: 'hsl(var(--agenda-text-muted))'
							}}>
								{s.label}
							</div>
						))}
					</div>
					{/* Colunas dos profissionais */}
                    {resources.map((r) => (
                        <div
                            key={String(r.resourceId)}
                            className="relative border-l bg-transparent"
                            style={{ borderColor: 'hsl(var(--agenda-border))' }}
                            onMouseDown={(e) => {
                                // PONTO 6 - SELEÇÃO/DRAG/RESIZE
                                if (!(e.target as HTMLElement).closest('[data-event]')) {
                                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                                    setSelectState({ resourceId: r.resourceId, startY: e.clientY, currentY: e.clientY, colTop: rect.top });
                                }
                            }}
							onMouseMove={handleMouseMove}
							onMouseUp={(e) => {
								const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
								handleMouseUp(rect.top, r.resourceId)(e);
							}}
						>
							{/* PONTO 5 - BLOQUEIOS - Períodos bloqueados desta coluna */}
							{blockedRanges
								.filter(br => String(br.resourceId) === String(r.resourceId) && dayjs(br.startISO).isSame(dayjs(date), "day"))
								.map(br => (
									<BlockedRangeBlock
										key={br.id}
										blockedRange={br}
										date={date}
										startHour={startHour}
										pxPerMinute={pxPerMinute}
									/>
								))
							}
							
							{/* Eventos desta coluna */}
							{events.filter(e => String(e.resourceId) === String(r.resourceId) && dayjs(e.start).isSame(dayjs(date), "day")).map(e => (
								<EventBlock
									key={e.id}
									event={e}
									date={date}
									startHour={startHour}
									pxPerMinute={pxPerMinute}
									onClick={onEventClick}
									onDragStart={(ev, id) => {
										ev.stopPropagation();
										setDragState({ id, resourceId: r.resourceId, startY: ev.clientY, originStart: e.start, originEnd: e.end });
									}}
									onResizeStart={(ev, id) => {
										ev.stopPropagation();
										setResizeState({ id, startY: ev.clientY, originEnd: e.end });
									}}
								/>
							))}

							{/* Seleção visual - PONTO 6 */}
						{selectState && String(selectState.resourceId) === String(r.resourceId) ? (
							<div
								className="bg-green-500/20 border border-green-500/50 rounded-md pointer-events-none"
								style={{ 
									position: 'absolute', 
									left: 8, 
									right: 8, 
									top: Math.min(selectState.startY, selectState.currentY) - selectState.colTop, 
									height: Math.abs(selectState.currentY - selectState.startY),
									zIndex: 15
								}}
							/>
						) : null}
						</div>
					))}
					
					{/* PONTO 4 - LINHA DO AGORA */}
					<NowLine 
						startHour={startHour}
						endHour={endHour}
						pxPerMinute={pxPerMinute}
					/>
				</div>
			</div>
			
			{/* PONTO 2 - FOOTER STICKY - Rodapé com nomes dos barbeiros */}
			<div className="grid sticky bottom-0 z-30 border-t" style={{ 
				gridTemplateColumns: `64px repeat(${resources.length}, minmax(240px,1fr))`,
				backgroundColor: 'hsl(var(--agenda-card-bg))',
				borderColor: 'hsl(var(--agenda-border))'
			}}>
                {/* Coluna de horas fixa */}
                <div className="p-2 text-xs font-semibold" style={{ 
					color: 'hsl(var(--agenda-text-muted))',
					backgroundColor: 'hsl(var(--agenda-card-bg))'
				}}></div>
                {resources.map((r) => (
					<div key={`footer-${String(r.resourceId)}`} className="px-3 py-2 font-medium text-xs border-l text-center" style={{
						borderColor: 'hsl(var(--agenda-border))',
						backgroundColor: 'hsl(var(--agenda-card-bg))',
						color: 'hsl(var(--agenda-text))'
					}}>
						<span className="truncate">{r.resourceTitle}</span>
					</div>
				))}
			</div>
		</div>
	);
}


