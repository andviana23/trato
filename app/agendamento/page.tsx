import React from "react";
import Schedule from "./components/Schedule";
import type { Agendamento, Profissional } from "./types";

export default function Page() {
  const data = new Date();
  const profissionais: Profissional[] = [
    { id: "p1", nome: "Andrey" },
    { id: "p2", nome: "Lala" },
    { id: "p3", nome: "Pedro Lucas" },
  ];
  const eventos: Agendamento[] = [
    { id:"1", title:"João — Corte + Barba", start:new Date(data.getFullYear(), data.getMonth(), data.getDate(), 7, 0), end:new Date(data.getFullYear(), data.getMonth(), data.getDate(), 8, 0), resourceId:"p1", tipo:"servico", meta:{servico:"Combo Cabelo e Barba"} },
    { id:"2", title:"Bloqueio", start:new Date(data.getFullYear(), data.getMonth(), data.getDate(), 7, 0), end:new Date(data.getFullYear(), data.getMonth(), data.getDate(), 10, 30), resourceId:"p2", tipo:"bloqueio" },
    { id:"3", title:"Modelagem + Corte + Barba", start:new Date(data.getFullYear(), data.getMonth(), data.getDate(), 7, 0), end:new Date(data.getFullYear(), data.getMonth(), data.getDate(), 9, 30), resourceId:"p3", tipo:"servico" },
    { id:"4", title:"Indisponível", start:new Date(data.getFullYear(), data.getMonth(), data.getDate(), 5, 0), end:new Date(data.getFullYear(), data.getMonth(), data.getDate(), 6, 0), resourceId:"p1", tipo:"indisponivel" },
  ];

  return (
    <main className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Agendamento</h1>
      </div>
      <Schedule profissionais={profissionais} eventos={eventos} />
    </main>
  );
}




