"use client";

import React from "react";
import { Button } from "@/components/ui/chakra-adapters";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

type ToolbarProps = {
  label: string;
  view: string;
  views: string[];
  onNavigate: (action: "TODAY" | "PREV" | "NEXT" | Date) => void;
  onView: (view: string) => void;
  onNew?: () => void;
};

export default function ScheduleToolbar({ label, view, views, onNavigate, onView, onNew }: ToolbarProps) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button isIconOnly variant="flat" onPress={() => onNavigate("PREV")} aria-label="Anterior">
          <ChevronLeftIcon className="h-5 w-5" />
        </Button>
        <div className="rounded-md bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm">
          {label}
        </div>
        <Button isIconOnly variant="flat" onPress={() => onNavigate("NEXT")} aria-label="Próximo">
          <ChevronRightIcon className="h-5 w-5" />
        </Button>
        <Button size="sm" variant="flat" onPress={() => onNavigate("TODAY")}>Hoje</Button>
      </div>
      <div className="flex items-center gap-2">
        {onNew && (
          <Button size="sm" color="primary" onPress={onNew}>Novo Agendamento</Button>
        )}
        {views.includes("day") || views.includes("DAY") ? (
          <Button size="sm" color={view.toLowerCase() === "day" ? "primary" : "default"} variant={view.toLowerCase() === "day" ? "solid" : "flat"} onPress={() => onView("day")}>Dia</Button>
        ) : null}
        {views.includes("week") || views.includes("WEEK") ? (
          <Button size="sm" color={view.toLowerCase() === "week" ? "primary" : "default"} variant={view.toLowerCase() === "week" ? "solid" : "flat"} onPress={() => onView("week")}>Semana</Button>
        ) : null}
      </div>
    </div>
  );
}



