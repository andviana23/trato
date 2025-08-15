import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Tipos
export type Meta = {
  id: string;
  barbeiro_id: string;
  mes: string;
  ano: string;
  meta_venda_produto: number;
  meta_faturamento: number;
  tipo_bonificacao: 'fixo' | 'percentual';
  valor_bonificacao: number;
  foi_batida: boolean;
};

export type VendasBarbeiro = {
  barbeiro_id: string;
  total_vendas_produtos: number;
  total_faturamento: number;
};

// Calcular se meta foi batida
export async function verificarMetasBatidas(mes: string, ano: string, unidade: 'barberbeer' | 'trato') {
  const tabelaMetas = unidade === 'barberbeer' ? 'metas_barberbeer' : 'metas_trato';
  
  try {
    // Buscar todas as metas do mês/ano
    const { data: metas, error: errorMetas } = await supabase
      .from(tabelaMetas)
      .select('*')
      .eq('mes', mes)
      .eq('ano', ano);
    
    if (errorMetas) throw errorMetas;
    
    if (!metas || metas.length === 0) return;
    
    // Para cada meta, calcular vendas do barbeiro
    for (const meta of metas) {
      const vendas = await calcularVendasBarbeiro(meta.barbeiro_id, mes, ano);
      
      if (vendas) {
        const metaBatida = 
          vendas.total_vendas_produtos >= meta.meta_venda_produto &&
          vendas.total_faturamento >= meta.meta_faturamento;
        
        // Atualizar status da meta
        await supabase
          .from(tabelaMetas)
          .update({ foi_batida: metaBatida })
          .eq('id', meta.id);
      }
    }
  } catch (error) {
    console.error('Erro ao verificar metas batidas:', error);
  }
}

// Calcular vendas de um barbeiro no mês
async function calcularVendasBarbeiro(barbeiroId: string, mes: string, ano: string): Promise<VendasBarbeiro | null> {
  try {
    // Calcular vendas de produtos
    const { data: vendasProdutos } = await supabase
      .from('vendas_produtos')
      .select('valor_total')
      .eq('barbeiro_id', barbeiroId)
      .gte('data_venda', `${ano}-${mes}-01`)
      .lt('data_venda', `${ano}-${mes}-32`); // Próximo mês
    
    // Calcular faturamento de serviços
    const { data: vendasServicos } = await supabase
      .from('agendamentos')
      .select('valor_servico')
      .eq('barbeiro_id', barbeiroId)
      .eq('status', 'concluido')
      .gte('data_agendamento', `${ano}-${mes}-01`)
      .lt('data_agendamento', `${ano}-${mes}-32`);
    
    const totalVendasProdutos = vendasProdutos?.reduce((sum, venda) => sum + (venda.valor_total || 0), 0) || 0;
    const totalFaturamento = vendasServicos?.reduce((sum, servico) => sum + (servico.valor_servico || 0), 0) || 0;
    
    return {
      barbeiro_id: barbeiroId,
      total_vendas_produtos: totalVendasProdutos,
      total_faturamento: totalFaturamento
    };
  } catch (error) {
    console.error('Erro ao calcular vendas do barbeiro:', error);
    return null;
  }
}

// Calcular bonificação de um barbeiro
export async function calcularBonificacao(barbeiroId: string, mes: string, ano: string, unidade: 'barberbeer' | 'trato'): Promise<number> {
  const tabelaMetas = unidade === 'barberbeer' ? 'metas_barberbeer' : 'metas_trato';
  
  try {
    // Buscar meta do barbeiro
    const { data: meta } = await supabase
      .from(tabelaMetas)
      .select('*')
      .eq('barbeiro_id', barbeiroId)
      .eq('mes', mes)
      .eq('ano', ano)
      .single();
    
    if (!meta || !meta.foi_batida) return 0;
    
    // Calcular bonificação
    if (meta.tipo_bonificacao === 'fixo') {
      return meta.valor_bonificacao;
    } else {
      // Percentual sobre o faturamento total
      const vendas = await calcularVendasBarbeiro(barbeiroId, mes, ano);
      if (vendas) {
        return (vendas.total_faturamento * meta.valor_bonificacao) / 100;
      }
    }
    
    return 0;
  } catch (error) {
    console.error('Erro ao calcular bonificação:', error);
    return 0;
  }
}

// Aplicar bonificações no fechamento mensal
export async function aplicarBonificacoesFechamento(mes: string, ano: string, unidade: 'barberbeer' | 'trato') {
  try {
    // Primeiro, verificar todas as metas batidas
    await verificarMetasBatidas(mes, ano, unidade);
    
    // Buscar todos os barbeiros da unidade
    const { data: barbeiros } = await supabase
      .from('profissionais')
      .select('id')
      .eq('funcao', 'barbeiro')
      .eq('unidade_id', unidade === 'barberbeer' ? '87884040-cafc-4625-857b-6e0402ede7d7' : 'outro-id');
    
    if (!barbeiros) return;
    
    // Para cada barbeiro, calcular e aplicar bonificação
    for (const barbeiro of barbeiros) {
      const bonificacao = await calcularBonificacao(barbeiro.id, mes, ano, unidade);
      
      if (bonificacao > 0) {
        // Aqui você pode salvar a bonificação na tabela de comissões ou onde for apropriado
        // Por exemplo, na tabela de fechamento mensal
        await salvarBonificacao(barbeiro.id, mes, ano, bonificacao, unidade);
      }
    }
  } catch (error) {
    console.error('Erro ao aplicar bonificações:', error);
  }
}

// Salvar bonificação (implementar conforme sua estrutura de dados)
async function salvarBonificacao(barbeiroId: string, mes: string, ano: string, valor: number, unidade: 'barberbeer' | 'trato') {
  try {
    // Exemplo - ajuste conforme sua estrutura de dados
    const { error } = await supabase
      .from('comissoes_bonificacoes') // Tabela fictícia - ajuste conforme necessário
      .insert({
        barbeiro_id: barbeiroId,
        mes: mes,
        ano: ano,
        valor_bonificacao: valor,
        unidade: unidade,
        data_aplicacao: new Date().toISOString()
      });
    
    if (error) throw error;
  } catch (error) {
    console.error('Erro ao salvar bonificação:', error);
  }
}

// Buscar metas de um barbeiro
export async function buscarMetaBarbeiro(barbeiroId: string, unidade: 'barberbeer' | 'trato') {
  const tabelaMetas = unidade === 'barberbeer' ? 'metas_barberbeer' : 'metas_trato';
  
  try {
    const { data, error } = await supabase
      .from(tabelaMetas)
      .select('*')
      .eq('barbeiro_id', barbeiroId)
      .order('ano', { ascending: false })
      .order('mes', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar metas do barbeiro:', error);
    return [];
  }
}

// Formatar valor monetário
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
} 