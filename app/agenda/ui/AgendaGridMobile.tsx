"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isBetween from "dayjs/plugin/isBetween";
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useDrag } from "@use-gesture/react";
import { getSlotHeightPx } from "../utils/gridHelpers";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin
} from "lucide-react";

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

export type GridResource = {
  resourceId: string | number;
  resourceTitle: string;
  color?: string;
};

interface AgendaGridMobileProps {
  date: Date;
  events: GridEvent[];
  resources: GridResource[];
  startHour?: number;
  endHour?: number;
  slotMinutes?: number;
  onEventClick?: (id: string) => void;
  onDateChange?: (newDate: Date) => void;
  onSelectTimeSlot?: (startISO: string, endISO: string, resourceId?: string | number) => void;
}

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

function MobileEventCard({ 
  event, 
  onClick 
}: { 
  event: GridEvent; 
  onClick?: (id: string) => void; 
}) {
  const start = dayjs(event.start);
  const end = dayjs(event.end);
  const colors = statusColor(event.status);
  const duration = end.diff(start, 'minute');
  const isBlocked = event.status === 'bloqueado';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card 
        className={`mb-3 border transition-all duration-200 ${isBlocked ? 'opacity-60' : 'hover:shadow-md cursor-pointer'}`}
        style={{ borderColor: colors.border }}
        onClick={() => !isBlocked && onClick?.(event.id)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors.bg }}
              />
              <CardTitle className="text-sm font-medium">
                {start.format("HH:mm")} - {end.format("HH:mm")}
              </CardTitle>
              {event.isNewClient && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  ⭐ Novo
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {duration}min
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {event.clientName || event.title || "Cliente"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {event.serviceName || "Serviço"}
              </span>
            </div>
            {isBlocked && (
              <div className="flex items-center gap-2 text-amber-600">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Horário bloqueado</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ResourceSection({ 
  resource, 
  events, 
  date, 
  startHour, 
  endHour, 
  slotMinutes,
  onEventClick,
  onSelectTimeSlot 
}: {
  resource: GridResource;
  events: GridEvent[];
  date: Date;
  startHour: number;
  endHour: number;
  slotMinutes: number;
  onEventClick?: (id: string) => void;
  onSelectTimeSlot?: (startISO: string, endISO: string, resourceId?: string | number) => void;
}) {
  const slots = useTimeSlots(startHour, endHour, slotMinutes);
  const resourceEvents = events.filter(e => 
    String(e.resourceId) === String(resource.resourceId) && 
    dayjs(e.start).isSame(dayjs(date), "day")
  );

  const handleTimeSlotClick = (slot: { minutesFromStart: number }) => {
    const base = dayjs(date).startOf('day').hour(startHour).minute(0).second(0);
    const startTime = base.add(slot.minutesFromStart, 'minute');
    const endTime = startTime.add(slotMinutes, 'minute');
    
    // Check for conflicts
    const hasConflict = resourceEvents.some(event => {
      const eventStart = dayjs(event.start);
      const eventEnd = dayjs(event.end);
      return startTime.isBefore(eventEnd) && endTime.isAfter(eventStart);
    });
    
    if (hasConflict) {
      toast.error('Horário ocupado');
      return;
    }
    
    onSelectTimeSlot?.(startTime.toISOString(), endTime.toISOString(), resource.resourceId);
  };

  return (
    <div className="mb-6">
      {/* Resource Header */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
        <span
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: resource.color || '#22c55e' }}
        />
        <span className="font-medium text-lg">{resource.resourceTitle}</span>
        <span className="text-sm text-muted-foreground ml-auto">
          {resourceEvents.length} agendamento{resourceEvents.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Events */}
      <div className="space-y-2">
        {resourceEvents.length > 0 ? (
          resourceEvents
            .sort((a, b) => dayjs(a.start).diff(dayjs(b.start)))
            .map(event => (
              <MobileEventCard 
                key={event.id} 
                event={event} 
                onClick={onEventClick}
              />
            ))
        ) : (
          <Card className="border-dashed border-muted-foreground/30">
            <CardContent className="p-6 text-center">
              <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                Nenhum agendamento para hoje
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleTimeSlotClick({ minutesFromStart: 0 })}
              >
                Adicionar Agendamento
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Time Slots */}
      <div className="mt-4">
        <p className="text-sm font-medium mb-2">Horários disponíveis:</p>
        <div className="grid grid-cols-4 gap-2">
          {slots
            .filter((_, index) => index % 6 === 0) // Show every hour
            .slice(0, 8) // Show first 8 hours
            .map(slot => {
              const base = dayjs(date).startOf('day').hour(startHour).minute(0).second(0);
              const slotTime = base.add(slot.minutesFromStart, 'minute');
              const slotEndTime = slotTime.add(60, 'minute');
              
              const hasConflict = resourceEvents.some(event => {
                const eventStart = dayjs(event.start);
                const eventEnd = dayjs(event.end);
                return slotTime.isBefore(eventEnd) && slotEndTime.isAfter(eventStart);
              });
              
              const isPastTime = slotTime.isBefore(dayjs());
              
              return (
                <Button
                  key={slot.label}
                  variant={hasConflict || isPastTime ? "secondary" : "outline"}
                  size="sm"
                  disabled={hasConflict || isPastTime}
                  onClick={() => handleTimeSlotClick(slot)}
                  className="text-xs h-8"
                >
                  {slot.label}
                </Button>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default function AgendaGridMobile({
  date,
  events,
  resources,
  startHour = 8,
  endHour = 21,
  slotMinutes = 10,
  onEventClick,
  onDateChange,
  onSelectTimeSlot
}: AgendaGridMobileProps) {
  const [currentDate, setCurrentDate] = useState(date);
  const [direction, setDirection] = useState(0);

  // Handle date navigation
  const navigateDate = (delta: number) => {
    const newDate = dayjs(currentDate).add(delta, 'day').toDate();
    setDirection(delta);
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  // Swipe gesture handling
  const bind = useDrag(
    ({ movement: [mx], direction: [dx], velocity: [vx], last }) => {
      if (last && Math.abs(mx) > 50) {
        if (dx > 0) {
          navigateDate(-1); // Swipe right = previous day
        } else {
          navigateDate(1); // Swipe left = next day
        }
      }
    },
    {
      axis: 'x',
      threshold: 50
    }
  );

  const formatDate = (date: Date) => {
    const today = dayjs();
    const targetDate = dayjs(date);
    
    if (targetDate.isSame(today, 'day')) {
      return 'Hoje';
    } else if (targetDate.isSame(today.add(1, 'day'), 'day')) {
      return 'Amanhã';
    } else if (targetDate.isSame(today.subtract(1, 'day'), 'day')) {
      return 'Ontem';
    } else {
      return targetDate.format('dddd, DD/MM');
    }
  };

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  const totalEvents = events.filter(e => dayjs(e.start).isSame(dayjs(currentDate), "day")).length;

  return (
    <div className="h-full bg-background" {...bind()}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateDate(-1)}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h2 className="font-semibold text-lg">
              {formatDate(currentDate)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {totalEvents} agendamento{totalEvents !== 1 ? 's' : ''}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateDate(1)}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="relative overflow-hidden h-[calc(100vh-120px)]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentDate.toISOString()}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0 overflow-y-auto px-4 py-4"
          >
            <div className="space-y-6">
              {resources.map(resource => (
                <ResourceSection
                  key={String(resource.resourceId)}
                  resource={resource}
                  events={events}
                  date={currentDate}
                  startHour={startHour}
                  endHour={endHour}
                  slotMinutes={slotMinutes}
                  onEventClick={onEventClick}
                  onSelectTimeSlot={onSelectTimeSlot}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        <div className="w-2 h-2 bg-muted-foreground/30 rounded-full" />
        <div className="w-6 h-2 bg-primary rounded-full" />
        <div className="w-2 h-2 bg-muted-foreground/30 rounded-full" />
      </div>

      {/* Swipe Instruction */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-xs text-muted-foreground bg-background/80 px-3 py-1 rounded-full">
          Deslize para navegar entre os dias
        </p>
      </div>
    </div>
  );
}
