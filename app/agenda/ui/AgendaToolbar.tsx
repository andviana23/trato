"use client";

import dayjs from "dayjs";
import { Button } from "@/components/ui/button";

type View = "day" | "week";

export default function AgendaToolbar({ date, view, onToday, onPrev, onNext, onChangeView, onNew }: {
  date: Date;
  view: View;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onChangeView: (v: View) => void;
  onNew?: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" onClick={onToday}>Hoje</Button>
      <Button variant="secondary" onClick={onPrev}>{"<"}</Button>
      <Button variant="secondary" onClick={onNext}>{">"}</Button>
      <div className="font-semibold ml-2">{dayjs(date).format(view==='day' ? 'DD MMM YYYY' : '[Semana] DD/MM')}</div>
      <div className="ml-auto flex gap-1">
        <Button variant={view==='day'? 'default':'secondary'} onClick={() => onChangeView('day')}>Dia</Button>
        <Button variant={view==='week'? 'default':'secondary'} onClick={() => onChangeView('week')}>Semana</Button>
        {onNew ? <Button onClick={onNew}>Novo</Button> : null}
      </div>
    </div>
  );
}