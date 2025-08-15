import { createClient } from "@/lib/supabase/client";

export type AvulsaLancamento = {
  valor_comissao: number;
  quantidade: number;
  data_lancamento: string;
  unidade_id: string;
  servicos_avulsos?: { nome?: string };
};

export async function getComissoesAvulsas(
  profissionalId: string,
  unidadeId: string,
  startISO: string,
  endISO: string
): Promise<AvulsaLancamento[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("comissoes_avulsas")
    .select("valor_comissao, quantidade, data_lancamento, unidade_id, servicos_avulsos:servico_avulso_id(nome)")
    .eq("profissional_id", profissionalId)
    .eq("unidade_id", unidadeId)
    .gte("data_lancamento", startISO)
    .lte("data_lancamento", endISO);
  if (error) throw error;
  return (data || []) as AvulsaLancamento[];
}

export type VendaProduto = {
  quantidade: number;
  data_venda: string;
  unidade_id: string;
  barbeiro_id: string;
  produto_nome?: string; // opcional, pode não existir na tabela
  valor_total?: number;  // opcional, pode não existir na tabela
};

export async function getVendasProdutos(
  profissionalId: string,
  unidadeId: string,
  startISO: string,
  endISO: string
): Promise<VendaProduto[]> {
  const supabase = createClient();
  // Algumas instalações registram vendas por profissional diretamente em 'vendas_produtos' com barbeiro_id
  // e outras em uma view 'vendas_produtos_barbeiro'. Tentamos ambas para garantir compatibilidade.
  // Seleção mínima para evitar erros quando colunas opcionais não existem
  let { data, error } = await supabase
    .from("vendas_produtos_barbeiro")
    .select("quantidade, data_venda, unidade_id, barbeiro_id")
    .eq("barbeiro_id", profissionalId)
    .eq("unidade_id", unidadeId)
    .gte("data_venda", startISO)
    .lte("data_venda", endISO);
  if (error || !data || data.length === 0) {
    const fallback = await supabase
      .from("vendas_produtos")
      .select("quantidade, data_venda, unidade_id, barbeiro_id")
      .eq("barbeiro_id", profissionalId)
      .eq("unidade_id", unidadeId)
      .gte("data_venda", startISO)
      .lte("data_venda", endISO);
    data = fallback.data as any[] | null;
  }
  if (error) throw error;
  return (data || []) as VendaProduto[];
}


