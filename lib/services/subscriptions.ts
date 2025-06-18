import { createClient } from "../supabase/client";

const supabase = createClient();

export async function criarAssinatura({ cliente_id, plano_id, vencimento, forma_pagamento, plan_name, price }: { cliente_id: string, plano_id: string, vencimento: string, forma_pagamento: string, plan_name: string, price: number }) {
  const hoje = new Date();
  const fim = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const { data, error } = await supabase.from("subscriptions").insert([
    {
      client_id: cliente_id,
      plan_id: plano_id,
      plan_name: plan_name,
      price: price,
      due_date: vencimento,
      payment_method: forma_pagamento,
      barbershop_id: "41abae7d-ac5f-410f-a2e8-9c027a25d60d",
      current_period_start: hoje.toISOString().split('T')[0],
      current_period_end: fim.toISOString().split('T')[0]
    }
  ]).select();
  if (error) throw error;
  return data?.[0];
} 