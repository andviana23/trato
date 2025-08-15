"use client";

import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import 'moment/locale/pt-br';
import { useMemo } from 'react';

moment.locale('pt-br');
const localizer = momentLocalizer(moment);

type Event = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: any;
};

type Resource = { id: string; title: string };

type Props = {
  events: Event[];
  resources: Resource[];
  onSelectSlot?: (start: Date, resourceId?: string) => void;
  defaultDate?: Date;
};

export default function WeekCalendar({ events, resources, onSelectSlot, defaultDate }: Props) {
  const formats = useMemo(() => ({
    dayFormat: (date: Date) => moment(date).format('ddd'),
    timeGutterFormat: (date: Date) => moment(date).format('HH:mm'),
    eventTimeRangeFormat: ({ start, end }: any) => `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`,
  }), []);

  return (
    <div className="rbc-calendar-theme">
      <Calendar
        localizer={localizer}
        events={events}
        defaultView={Views.WEEK}
        views={[Views.WEEK, Views.DAY]}
        step={30}
        timeslots={1}
        defaultDate={defaultDate || new Date()}
        selectable
        onSelectSlot={(slotInfo: any) => onSelectSlot?.(slotInfo.start, slotInfo.resourceId)}
        toolbar={false}
        formats={formats}
        resources={resources}
        resourceIdAccessor="id"
        resourceTitleAccessor="title"
        style={{ height: 680 }}
      />
      <style jsx global>{`
        .rbc-calendar-theme .rbc-time-view, .rbc-calendar-theme .rbc-day-slot {
          background: white;
        }
        .rbc-calendar-theme .rbc-timeslot-group { border-color: #e5e7eb; }
        .rbc-calendar-theme .rbc-time-header { border-color: #e5e7eb; }
        .rbc-calendar-theme .rbc-header { font-size: 12px; padding: 6px 8px; }
        .rbc-calendar-theme .rbc-time-gutter .rbc-timeslot-group { color: #6b7280; font-size: 11px; }
        .rbc-calendar-theme .rbc-event { background: #eff6ff; border: 1px solid #93c5fd; color: #1e3a8a; border-radius: 6px; }
      `}</style>
    </div>
  );
}


