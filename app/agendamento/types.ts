// Tipos para React Big Calendar
export type Profissional = { id: string; nome: string; avatarUrl?: string; cor?: string };

export type AgendamentoTipo = "servico" | "bloqueio" | "indisponivel";

export type Agendamento = {
  id: string;
  title: string; // "João — Corte + Barba"
  start: Date;
  end: Date;
  resourceId: string; // id do profissional
  tipo: AgendamentoTipo;
  meta?: { cliente?: string; servico?: string; observacao?: string };
};




