import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
export function usePagamentosAsaas({ dataInicio, dataFim }) {
    const [pagamentos, setPagamentos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
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
                if (error)
                    throw error;
                setPagamentos(data || []);
            }
            catch (e) {
                setError(e);
                setPagamentos([]);
            }
            finally {
                setLoading(false);
            }
        }
        if (dataInicio && dataFim)
            fetchPagamentos();
    }, [dataInicio, dataFim]);
    return { pagamentos, loading, error };
}
