import { createClient } from "@/lib/supabase/client";

export type PagamentoAsaas = {
  valor: number;
  status: string;
  payment_date: string;
};

export async function getConfirmedAsaasPayments(startISO: string, endISO: string): Promise<PagamentoAsaas[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pagamentos_asaas")
    .select("valor, status, payment_date")
    .eq("status", "CONFIRMED")
    .gte("payment_date", startISO)
    .lte("payment_date", endISO)
    .order("payment_date", { ascending: false });
  if (error) throw error;
  return (data || []) as PagamentoAsaas[];
}


