"use client";

import dayjs from "dayjs";
import React from "react";

type Props = {
  value: Date;
  onChange: (d: Date) => void;
};

export default function SideMonthCalendar({ value, onChange }: Props) {
  const base = dayjs(value).startOf('month');
  const start = base.startOf('week');
  const days: dayjs.Dayjs[] = [];
  for (let i = 0; i < 42; i++) days.push(start.add(i, 'day'));

  const isSameDay = (a: dayjs.Dayjs, b: dayjs.Dayjs) => a.isSame(b, 'day');
  const isToday = (d: dayjs.Dayjs) => d.isSame(dayjs(), 'day');
  const inMonth = (d: dayjs.Dayjs) => d.isSame(base, 'month');

  return (
    <div className="rounded-md border bg-card text-card-foreground w-[260px]">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="font-semibold text-sm">{base.format('MMMM YYYY')}</div>
        <div className="flex gap-1">
          <button className="px-2 py-1 text-xs rounded hover:bg-accent" onClick={() => onChange(dayjs(value).subtract(1,'month').toDate())}>{'<'}</button>
          <button className="px-2 py-1 text-xs rounded hover:bg-accent" onClick={() => onChange(dayjs(value).add(1,'month').toDate())}>{'>'}</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 p-2 text-[11px] text-muted-foreground">
        {["dom","seg","ter","qua","qui","sex","sáb"].map((w) => (
          <div key={w} className="text-center uppercase tracking-wider">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 p-2 pt-0">
        {days.map((d) => {
          const selected = isSameDay(d, dayjs(value));
          const muted = !inMonth(d);
          return (
            <button
              key={d.toString()}
              onClick={() => onChange(d.toDate())}
              className={
                "h-8 w-8 rounded-md text-sm mx-auto flex items-center justify-center " +
                (selected ? "bg-primary text-primary-foreground" : muted ? "text-muted-foreground" : "hover:bg-accent") +
                (isToday(d) && !selected ? " border border-primary" : "")
              }
            >
              {d.format('D')}
            </button>
          );
        })}
      </div>
    </div>
  );
}


