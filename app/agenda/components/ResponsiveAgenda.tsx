"use client";

import React, { useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/useMediaQuery";
import AgendaGrid, { GridEvent, GridResource } from "../ui/AgendaGrid";
import AgendaGridMobile from "../ui/AgendaGridMobile";
import AgendaToolbar from "../ui/AgendaToolbar";
import dayjs from "dayjs";

// Mock data - replace with actual data fetching
const mockResources: GridResource[] = [
  { resourceId: "1", resourceTitle: "João Silva", color: "#3b82f6" },
  { resourceId: "2", resourceTitle: "Maria Santos", color: "#ef4444" },
  { resourceId: "3", resourceTitle: "Pedro Costa", color: "#22c55e" },
];

const mockEvents: GridEvent[] = [
  {
    id: "1",
    resourceId: "1",
    start: dayjs().hour(9).minute(0).toISOString(),
    end: dayjs().hour(10).minute(0).toISOString(),
    title: "Corte + Barba",
    status: "confirmado",
    clientName: "João Pereira",
    serviceName: "Corte + Barba",
    isNewClient: false,
  },
  {
    id: "2",
    resourceId: "2",
    start: dayjs().hour(10).minute(30).toISOString(),
    end: dayjs().hour(11).minute(30).toISOString(),
    title: "Sobrancelha",
    status: "agendado",
    clientName: "Ana Silva",
    serviceName: "Design de Sobrancelha",
    isNewClient: true,
  },
  {
    id: "3",
    resourceId: "1",
    start: dayjs().hour(14).minute(0).toISOString(),
    end: dayjs().hour(15).minute(0).toISOString(),
    title: "Corte",
    status: "atendido",
    clientName: "Carlos Santos",
    serviceName: "Corte Masculino",
    isNewClient: false,
  },
  {
    id: "4",
    resourceId: "3",
    start: dayjs().hour(16).minute(0).toISOString(),
    end: dayjs().hour(17).minute(0).toISOString(),
    title: "Bloqueado",
    status: "bloqueado",
    clientName: "Horário Bloqueado",
    serviceName: "Indisponível",
    isNewClient: false,
  },
];

interface ResponsiveAgendaProps {
  initialDate?: Date;
  initialView?: "day" | "week";
}

export default function ResponsiveAgenda({ 
  initialDate = new Date(), 
  initialView = "day" 
}: ResponsiveAgendaProps) {
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [currentView, setCurrentView] = useState<"day" | "week">(initialView);

  // Filter events for current date (mobile) or week (desktop)
  const filteredEvents = useMemo(() => {
    if (isMobile || currentView === "day") {
      // For mobile or day view, show events for current date
      return mockEvents.filter(event => 
        dayjs(event.start).isSame(dayjs(currentDate), 'day')
      );
    } else {
      // For week view, show events for current week
      const startOfWeek = dayjs(currentDate).startOf('week');
      const endOfWeek = dayjs(currentDate).endOf('week');
      return mockEvents.filter(event => 
        dayjs(event.start).isBetween(startOfWeek, endOfWeek, null, '[]')
      );
    }
  }, [currentDate, currentView, isMobile]);

  const handleEventClick = (eventId: string) => {
    console.log("Event clicked:", eventId);
    // Implement event details modal or navigation
  };

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleViewChange = (newView: "day" | "week") => {
    setCurrentView(newView);
  };

  const handleEventMove = (id: string, newStartISO: string, newEndISO: string) => {
    console.log("Move event:", { id, newStartISO, newEndISO });
    // Implement event move logic
  };

  const handleEventResize = (id: string, newEndISO: string) => {
    console.log("Resize event:", { id, newEndISO });
    // Implement event resize logic
  };

  const handleSelectRange = (startISO: string, endISO: string, resourceId?: string | number) => {
    console.log("Select range:", { startISO, endISO, resourceId });
    // Implement new event creation
  };

  const handleSelectTimeSlot = (startISO: string, endISO: string, resourceId?: string | number) => {
    console.log("Select time slot:", { startISO, endISO, resourceId });
    // Implement new event creation for mobile
  };

  if (isMobile) {
    return (
      <div className="h-screen bg-background">
        <AgendaGridMobile
          date={currentDate}
          events={filteredEvents}
          resources={mockResources}
          startHour={8}
          endHour={21}
          slotMinutes={30}
          onEventClick={handleEventClick}
          onDateChange={handleDateChange}
          onSelectTimeSlot={handleSelectTimeSlot}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Toolbar - Hidden on mobile */}
      <div className="flex-shrink-0">
        <AgendaToolbar
          date={currentDate}
          view={currentView}
          onDateChange={handleDateChange}
          onViewChange={handleViewChange}
          onToday={() => setCurrentDate(new Date())}
          onPrevious={() => {
            const unit = currentView === "week" ? "week" : "day";
            setCurrentDate(dayjs(currentDate).subtract(1, unit).toDate());
          }}
          onNext={() => {
            const unit = currentView === "week" ? "week" : "day";
            setCurrentDate(dayjs(currentDate).add(1, unit).toDate());
          }}
        />
      </div>

      {/* Agenda Grid */}
      <div className="flex-1 min-h-0">
        <AgendaGrid
          date={currentDate}
          view={currentView}
          events={filteredEvents}
          resources={mockResources}
          startHour={8}
          endHour={21}
          slotMinutes={30}
          onEventClick={handleEventClick}
          onMove={handleEventMove}
          onResize={handleEventResize}
          onSelectRange={handleSelectRange}
        />
      </div>
    </div>
  );
}
