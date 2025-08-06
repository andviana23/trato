import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Use as variáveis do seu .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface PagamentoAsaas {
  payment_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  plano: string;
  valor: number;
  status: string;
  payment_date: string;
  next_due_date: string;
  billing_type: string;
}

interface UsePagamentosAsaasProps {
  dataInicio: string; // formato YYYY-MM-DD
  dataFim: string;    // formato YYYY-MM-DD
}

export function usePagamentosAsaas({ dataInicio, dataFim }: UsePagamentosAsaasProps) {
  const [pagamentos, setPagamentos] = useState<PagamentoAsaas[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPagamentos() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("pagamentos_asaas")
          .select("*")
          .eq("status", "CONFIRMED")
          .gte("payment_date", dataInicio)
          .lte("payment_date", dataFim)
          .order("payment_date", { ascending: false });

        if (error) throw error;
        setPagamentos(data || []);
      } catch (e: any) {
        setError(e.message || "Erro ao buscar pagamentos");
        setPagamentos([]);
      } finally {
        setLoading(false);
      }
    }
    if (dataInicio && dataFim) fetchPagamentos();
  }, [dataInicio, dataFim]);

  return { pagamentos, loading, error };
}