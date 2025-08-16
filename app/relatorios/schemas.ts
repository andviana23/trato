import { z } from 'zod';

export const periodSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type Period = z.infer<typeof periodSchema>;

export type PrincipalKpis = {
  faturamento: number;
  despesas: number;
  agendamentosOnline: number;
  saldo: number;
};

export type DailyPoint = { date: string; projetado: number; realizado: number };

export type StatusResumo = { status: string; quantidade: number; percentual: number; total?: number };

export type FormaPagamentoResumo = { forma_pagamento: string; valor: number };

export type PrincipalPayload = {
  kpis: PrincipalKpis;
  linha: DailyPoint[];
  agendamentosStatus: StatusResumo[];
  porFormaPagamento: FormaPagamentoResumo[];
  clientesEmAtendimento: Array<{ id: string; nome: string; horario: string }>; // opcional
};

















