'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit';
import { ActionResult, ActionResultStats } from '@/lib/types/action';
import { z } from 'zod';

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

const periodSchema = z.object({
  from: z.string().refine((val) => !isNaN(Date.parse(val)), "Data de início inválida"),
  to: z.string().refine((val) => !isNaN(Date.parse(val)), "Data de fim inválida"),
});

const dreRequestSchema = z.object({
  period: periodSchema,
  unidade_id: z.string().min(1, "ID da unidade é obrigatório").optional(),
  include_audit_trail: z.boolean().default(false),
});

const dreComparisonSchema = z.object({
  current: periodSchema,
  previous: periodSchema,
  unidade_id: z.string().min(1, "ID da unidade é obrigatório").optional(),
});

const cashFlowRequestSchema = z.object({
  period: periodSchema,
  unidade_id: z.string().min(1, "ID da unidade é obrigatório").optional(),
  group_by: z.enum(['day', 'week', 'month']).default('month'),
});

// ============================================================================
// TIPOS DE DADOS
// ============================================================================

export interface Period {
  from: string;
  to: string;
}

export interface DREData {
  periodo: {
    data_inicio: string;
    data_fim: string;
    unidade_id: string;
  };
  receitas: {
    receita_bruta: number;
    deducoes: number;
    receita_liquida: number;
    detalhes: DREAccountDetail[];
  };
  custos: {
    custos_servicos: number;
    detalhes: DREAccountDetail[];
  };
  despesas: {
    despesas_operacionais: number;
    despesas_financeiras: number;
    total_despesas: number;
    detalhes: DREAccountDetail[];
  };
  resultado: {
    lucro_bruto: number;
    lucro_operacional: number;
    lucro_antes_ir: number;
    provisao_ir: number;
    lucro_liquido: number;
  };
  margem: {
    margem_bruta: number;
    margem_operacional: number;
    margem_liquida: number;
  };
  audit_trail?: DREAuditDetail[];
}

export interface DREAccountDetail {
  conta_id: string;
  conta_codigo: string;
  conta_nome: string;
  conta_tipo: string;
  saldo_debito: number;
  saldo_credito: number;
  saldo_final: number;
}

export interface DREAuditDetail {
  conta_id: string;
  conta_nome: string;
  total_lancamentos: number;
  lancamentos_ids: string[];
  valores_individuais: number[];
}

export interface DREComparison {
  current: DREData;
  previous: DREData;
  variations: {
    receita_liquida: {
      absolute: number;
      percentage: number;
    };
    lucro_bruto: {
      absolute: number;
      percentage: number;
    };
    lucro_operacional: {
      absolute: number;
      percentage: number;
    };
    lucro_liquido: {
      absolute: number;
      percentage: number;
    };
  };
}

export interface FinancialSummary {
  periodo: {
    data_inicio: string;
    data_fim: string;
    unidade_id: string;
  };
  resumo: {
    total_receitas: number;
    total_despesas: number;
    lucro_prejuizo: number;
    margem_liquida: number;
  };
  indicadores: {
    liquidez_atual: number;
    rentabilidade: number;
    crescimento_periodo: number;
  };
}

export interface CashFlowData {
  periodo: {
    data_inicio: string;
    data_fim: string;
    unidade_id: string;
    agrupamento: string;
  };
  fluxo: {
    entradas: CashFlowEntry[];
    saidas: CashFlowEntry[];
    saldo_liquido: CashFlowEntry[];
  };
  resumo: {
    total_entradas: number;
    total_saidas: number;
    saldo_final: number;
    saldo_medio: number;
  };
}

export interface CashFlowEntry {
  data: string;
  valor: number;
  descricao: string;
  tipo: 'entrada' | 'saida' | 'saldo';
}

export interface ProfitabilityAnalysis {
  periodo: {
    data_inicio: string;
    data_fim: string;
    unidade_id: string;
  };
  metricas: {
    margem_bruta: number;
    margem_operacional: number;
    margem_liquida: number;
    roa: number; // Return on Assets
    roe: number; // Return on Equity
    ebitda: number;
  };
  tendencias: {
    crescimento_receita: number;
    crescimento_lucro: number;
    eficiencia_operacional: number;
  };
}

// ============================================================================
// SERVER ACTIONS - DRE
// ============================================================================

/**
 * Busca e processa dados do DRE para um período específico
 */
export async function getDREData(input: {
  period: Period;
  unidade_id?: string;
  include_audit_trail?: boolean;
}): Promise<ActionResult<DREData>> {
  try {
    console.log('🔄 Processando dados do DRE para período:', input.period);
    
    // Validar entrada
    const validation = dreRequestSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const { period, unidade_id, include_audit_trail } = validation.data;
    const supabase = await createClient();
    
    // Verificar permissões do usuário
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Chamar função SQL calculate_dre
    const { data: rawData, error: dreError } = await supabase
      .rpc('calculate_dre', {
        p_data_inicio: period.from,
        p_data_fim: period.to,
        p_unidade_id: unidade_id || 'trato'
      });

    if (dreError) {
      console.error('❌ Erro ao executar calculate_dre:', dreError);
      return { success: false, error: 'Erro ao calcular DRE: ' + dreError.message };
    }

    if (!rawData || rawData.length === 0) {
      return {
        success: true,
        data: createEmptyDRE(period.from, period.to, unidade_id || 'trato')
      };
    }

    // Processar dados da função SQL
    const accountDetails: DREAccountDetail[] = rawData.map((item: any) => ({
      conta_id: item.conta_id,
      conta_codigo: item.conta_codigo,
      conta_nome: item.conta_nome,
      conta_tipo: item.conta_tipo,
      saldo_debito: parseFloat(item.saldo_debito) || 0,
      saldo_credito: parseFloat(item.saldo_credito) || 0,
      saldo_final: parseFloat(item.saldo_final) || 0,
    }));

    // Agrupar contas por tipo
    const receitas = accountDetails.filter(c => c.conta_tipo === 'receita');
    const custos = accountDetails.filter(c => c.conta_tipo === 'custo' || c.conta_codigo.startsWith('3.'));
    const despesas = accountDetails.filter(c => c.conta_tipo === 'despesa');

    // Calcular totais
    const receita_bruta = receitas.reduce((sum, c) => sum + c.saldo_final, 0);
    const deducoes = receitas.filter(c => c.conta_codigo.includes('deducao')).reduce((sum, c) => sum + Math.abs(c.saldo_final), 0);
    const receita_liquida = receita_bruta - deducoes;
    
    const custos_servicos = custos.reduce((sum, c) => sum + Math.abs(c.saldo_final), 0);
    const despesas_operacionais = despesas.filter(c => !c.conta_codigo.includes('financeira')).reduce((sum, c) => sum + Math.abs(c.saldo_final), 0);
    const despesas_financeiras = despesas.filter(c => c.conta_codigo.includes('financeira')).reduce((sum, c) => sum + Math.abs(c.saldo_final), 0);
    
    const lucro_bruto = receita_liquida - custos_servicos;
    const lucro_operacional = lucro_bruto - despesas_operacionais;
    const lucro_antes_ir = lucro_operacional - despesas_financeiras;
    const provisao_ir = lucro_antes_ir > 0 ? lucro_antes_ir * 0.25 : 0; // 25% estimado
    const lucro_liquido = lucro_antes_ir - provisao_ir;

    // Calcular margens
    const margem_bruta = receita_liquida > 0 ? (lucro_bruto / receita_liquida) * 100 : 0;
    const margem_operacional = receita_liquida > 0 ? (lucro_operacional / receita_liquida) * 100 : 0;
    const margem_liquida = receita_liquida > 0 ? (lucro_liquido / receita_liquida) * 100 : 0;

    // Buscar trilha de auditoria se solicitado
    let audit_trail: DREAuditDetail[] | undefined;
    if (include_audit_trail) {
      audit_trail = await buildAuditTrail(supabase, accountDetails, period, unidade_id || 'trato');
    }

    const dreData: DREData = {
      periodo: {
        data_inicio: period.from,
        data_fim: period.to,
        unidade_id: unidade_id || 'trato',
      },
      receitas: {
        receita_bruta,
        deducoes,
        receita_liquida,
        detalhes: receitas,
      },
      custos: {
        custos_servicos,
        detalhes: custos,
      },
      despesas: {
        despesas_operacionais,
        despesas_financeiras,
        total_despesas: despesas_operacionais + despesas_financeiras,
        detalhes: despesas,
      },
      resultado: {
        lucro_bruto,
        lucro_operacional,
        lucro_antes_ir,
        provisao_ir,
        lucro_liquido,
      },
      margem: {
        margem_bruta,
        margem_operacional,
        margem_liquida,
      },
      audit_trail,
    };

    // Validar consistência dos dados
    const consistencyCheck = validateDREConsistency(dreData);
    if (!consistencyCheck.isValid) {
      console.warn('⚠️ Inconsistência detectada no DRE:', consistencyCheck.errors);
      // Não falhar, apenas logar
    }

    // Log de auditoria
    try {
      await logAuditEvent(
        {
          userId: user.id,
          userEmail: user.email || '',
          userRole: 'user',
          ipAddress: '127.0.0.1',
          userAgent: 'Server Action',
          sessionId: `dre_${Date.now()}`,
        },
        'DRE_GENERATED',
        'FINANCIAL',
        {
          periodo: period,
          unidade_id: unidade_id || 'trato',
          receita_liquida: receita_liquida,
          lucro_liquido: lucro_liquido,
          include_audit_trail,
        }
      );
    } catch (auditError) {
      console.warn('⚠️ Erro ao registrar log de auditoria:', auditError);
    }

    console.log(`✅ DRE gerado com sucesso para período ${period.from} a ${period.to}`);

    return { success: true, data: dreData };

  } catch (error) {
    console.error('❌ Erro inesperado ao gerar DRE:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro inesperado ao gerar DRE'
    };
  }
}

/**
 * Compara DRE de dois períodos diferentes
 */
export async function getDREComparison(input: {
  current: Period;
  previous: Period;
  unidade_id?: string;
}): Promise<ActionResult<DREComparison>> {
  try {
    console.log('🔄 Gerando comparação de DRE');

    // Validar entrada
    const validation = dreComparisonSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const { current, previous, unidade_id } = validation.data;

    // Buscar DRE do período atual
    const currentResult = await getDREData({
      period: current,
      unidade_id,
      include_audit_trail: false,
    });

    if (!currentResult.success || !currentResult.data) {
      return { success: false, error: 'Erro ao buscar DRE do período atual: ' + currentResult.error };
    }

    // Buscar DRE do período anterior
    const previousResult = await getDREData({
      period: previous,
      unidade_id,
      include_audit_trail: false,
    });

    if (!previousResult.success || !previousResult.data) {
      return { success: false, error: 'Erro ao buscar DRE do período anterior: ' + previousResult.error };
    }

    // Calcular variações
    const variations = {
      receita_liquida: calculateVariation(
        currentResult.data.receitas.receita_liquida,
        previousResult.data.receitas.receita_liquida
      ),
      lucro_bruto: calculateVariation(
        currentResult.data.resultado.lucro_bruto,
        previousResult.data.resultado.lucro_bruto
      ),
      lucro_operacional: calculateVariation(
        currentResult.data.resultado.lucro_operacional,
        previousResult.data.resultado.lucro_operacional
      ),
      lucro_liquido: calculateVariation(
        currentResult.data.resultado.lucro_liquido,
        previousResult.data.resultado.lucro_liquido
      ),
    };

    const comparison: DREComparison = {
      current: currentResult.data,
      previous: previousResult.data,
      variations,
    };

    console.log('✅ Comparação de DRE gerada com sucesso');

    return { success: true, data: comparison };

  } catch (error) {
    console.error('❌ Erro inesperado ao comparar DRE:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro inesperado ao comparar DRE'
    };
  }
}

/**
 * Exporta relatório DRE em formato estruturado
 */
export async function exportDREReport(input: {
  period: Period;
  unidade_id?: string;
  format?: 'json' | 'csv';
}): Promise<ActionResult<{ content: string; filename: string; mimeType: string }>> {
  try {
    console.log('🔄 Exportando relatório DRE');

    const format = input.format || 'json';

    // Buscar dados do DRE
    const dreResult = await getDREData({
      period: input.period,
      unidade_id: input.unidade_id,
      include_audit_trail: true,
    });

    if (!dreResult.success || !dreResult.data) {
      return { success: false, error: 'Erro ao buscar dados do DRE: ' + dreResult.error };
    }

    const dreData = dreResult.data;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `DRE_${dreData.periodo.data_inicio}_${dreData.periodo.data_fim}_${timestamp}`;

    let content: string;
    let mimeType: string;

    if (format === 'csv') {
      content = convertDREToCSV(dreData);
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify(dreData, null, 2);
      mimeType = 'application/json';
    }

    console.log(`✅ Relatório DRE exportado em formato ${format}`);

    return {
      success: true,
      data: {
        content,
        filename: `${filename}.${format}`,
        mimeType,
      }
    };

  } catch (error) {
    console.error('❌ Erro inesperado ao exportar DRE:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro inesperado ao exportar DRE'
    };
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Cria um DRE vazio para períodos sem dados
 */
function createEmptyDRE(data_inicio: string, data_fim: string, unidade_id: string): DREData {
  return {
    periodo: { data_inicio, data_fim, unidade_id },
    receitas: { receita_bruta: 0, deducoes: 0, receita_liquida: 0, detalhes: [] },
    custos: { custos_servicos: 0, detalhes: [] },
    despesas: { despesas_operacionais: 0, despesas_financeiras: 0, total_despesas: 0, detalhes: [] },
    resultado: { lucro_bruto: 0, lucro_operacional: 0, lucro_antes_ir: 0, provisao_ir: 0, lucro_liquido: 0 },
    margem: { margem_bruta: 0, margem_operacional: 0, margem_liquida: 0 },
  };
}

/**
 * Constrói trilha de auditoria para o DRE
 */
async function buildAuditTrail(
  supabase: any,
  accountDetails: DREAccountDetail[],
  period: Period,
  unidade_id: string
): Promise<DREAuditDetail[]> {
  const auditTrail: DREAuditDetail[] = [];

  for (const account of accountDetails) {
    if (account.saldo_final === 0) continue;

    try {
      const { data: lancamentos, error } = await supabase
        .from('lancamentos_contabeis')
        .select('id, valor, historico')
        .or(`conta_debito_id.eq.${account.conta_id},conta_credito_id.eq.${account.conta_id}`)
        .gte('data_competencia', period.from)
        .lte('data_competencia', period.to)
        .eq('unidade_id', unidade_id)
        .eq('status', 'confirmado');

      if (!error && lancamentos && lancamentos.length > 0) {
        auditTrail.push({
          conta_id: account.conta_id,
          conta_nome: account.conta_nome,
          total_lancamentos: lancamentos.length,
          lancamentos_ids: lancamentos.map((l: any) => l.id),
          valores_individuais: lancamentos.map((l: any) => parseFloat(l.valor)),
        });
      }
    } catch (error) {
      console.warn(`⚠️ Erro ao buscar trilha de auditoria para conta ${account.conta_nome}:`, error);
    }
  }

  return auditTrail;
}

/**
 * Calcula variação absoluta e percentual entre dois valores
 */
function calculateVariation(current: number, previous: number): { absolute: number; percentage: number } {
  const absolute = current - previous;
  const percentage = previous !== 0 ? (absolute / Math.abs(previous)) * 100 : 0;
  
  return { absolute, percentage };
}

/**
 * Valida consistência dos dados do DRE
 */
function validateDREConsistency(dreData: DREData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Verificar se receita líquida = receita bruta - deduções
  const expectedReceitaLiquida = dreData.receitas.receita_bruta - dreData.receitas.deducoes;
  if (Math.abs(dreData.receitas.receita_liquida - expectedReceitaLiquida) > 0.01) {
    errors.push(`Receita líquida inconsistente: esperado ${expectedReceitaLiquida}, atual ${dreData.receitas.receita_liquida}`);
  }

  // Verificar se lucro bruto = receita líquida - custos
  const expectedLucroBruto = dreData.receitas.receita_liquida - dreData.custos.custos_servicos;
  if (Math.abs(dreData.resultado.lucro_bruto - expectedLucroBruto) > 0.01) {
    errors.push(`Lucro bruto inconsistente: esperado ${expectedLucroBruto}, atual ${dreData.resultado.lucro_bruto}`);
  }

  // Verificar se lucro operacional = lucro bruto - despesas operacionais
  const expectedLucroOperacional = dreData.resultado.lucro_bruto - dreData.despesas.despesas_operacionais;
  if (Math.abs(dreData.resultado.lucro_operacional - expectedLucroOperacional) > 0.01) {
    errors.push(`Lucro operacional inconsistente: esperado ${expectedLucroOperacional}, atual ${dreData.resultado.lucro_operacional}`);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Converte dados do DRE para formato CSV
 */
function convertDREToCSV(dreData: DREData): string {
  const lines: string[] = [];
  
  // Header
  lines.push('Seção,Item,Valor');
  
  // Receitas
  lines.push(`Receitas,Receita Bruta,${dreData.receitas.receita_bruta}`);
  lines.push(`Receitas,Deduções,${dreData.receitas.deducoes}`);
  lines.push(`Receitas,Receita Líquida,${dreData.receitas.receita_liquida}`);
  
  // Custos
  lines.push(`Custos,Custos de Serviços,${dreData.custos.custos_servicos}`);
  
  // Resultado Bruto
  lines.push(`Resultado,Lucro Bruto,${dreData.resultado.lucro_bruto}`);
  
  // Despesas
  lines.push(`Despesas,Despesas Operacionais,${dreData.despesas.despesas_operacionais}`);
  lines.push(`Despesas,Despesas Financeiras,${dreData.despesas.despesas_financeiras}`);
  
  // Resultado Final
  lines.push(`Resultado,Lucro Operacional,${dreData.resultado.lucro_operacional}`);
  lines.push(`Resultado,Lucro Antes IR,${dreData.resultado.lucro_antes_ir}`);
  lines.push(`Resultado,Provisão IR,${dreData.resultado.provisao_ir}`);
  lines.push(`Resultado,Lucro Líquido,${dreData.resultado.lucro_liquido}`);
  
  // Margens
  lines.push(`Margens,Margem Bruta %,${dreData.margem.margem_bruta}`);
  lines.push(`Margens,Margem Operacional %,${dreData.margem.margem_operacional}`);
  lines.push(`Margens,Margem Líquida %,${dreData.margem.margem_liquida}`);
  
  return lines.join('\n');
}

// ============================================================================
// SERVER ACTIONS - RELATÓRIOS ADICIONAIS
// ============================================================================

/**
 * Retorna resumo financeiro rápido
 */
export async function getFinancialSummary(input: {
  period: Period;
  unidade_id?: string;
}): Promise<ActionResult<FinancialSummary>> {
  try {
    console.log('🔄 Gerando resumo financeiro');

    // Validar entrada
    const validation = z.object({
      period: periodSchema,
      unidade_id: z.string().optional(),
    }).safeParse(input);

    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const { period, unidade_id } = validation.data;

    // Buscar DRE simplificado
    const dreResult = await getDREData({
      period,
      unidade_id,
      include_audit_trail: false,
    });

    if (!dreResult.success || !dreResult.data) {
      return { success: false, error: 'Erro ao buscar dados para resumo: ' + dreResult.error };
    }

    const dreData = dreResult.data;

    // Calcular período anterior para comparação (mesmo intervalo, período anterior)
    const daysDiff = Math.ceil((new Date(period.to).getTime() - new Date(period.from).getTime()) / (1000 * 60 * 60 * 24));
    const previousFrom = new Date(new Date(period.from).getTime() - (daysDiff * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const previousTo = new Date(new Date(period.to).getTime() - (daysDiff * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

    const previousDreResult = await getDREData({
      period: { from: previousFrom, to: previousTo },
      unidade_id,
      include_audit_trail: false,
    });

    const crescimento_periodo = previousDreResult.success && previousDreResult.data
      ? calculateVariation(dreData.receitas.receita_liquida, previousDreResult.data.receitas.receita_liquida).percentage
      : 0;

    // Buscar dados para calcular liquidez (simplificado)
    const supabase = await createClient();
    const { data: ativoCirculante } = await supabase
      .rpc('calculate_dre', {
        p_data_inicio: period.from,
        p_data_fim: period.to,
        p_unidade_id: unidade_id || 'trato'
      });

    const liquidez_atual = ativoCirculante
      ? ativoCirculante.filter((c: any) => c.conta_tipo === 'ativo' && c.conta_codigo.startsWith('1.1')).reduce((sum: number, c: any) => sum + parseFloat(c.saldo_final), 0) / Math.max(dreData.despesas.total_despesas, 1)
      : 1;

    const rentabilidade = dreData.receitas.receita_liquida > 0 
      ? (dreData.resultado.lucro_liquido / dreData.receitas.receita_liquida) * 100 
      : 0;

    const summary: FinancialSummary = {
      periodo: {
        data_inicio: period.from,
        data_fim: period.to,
        unidade_id: unidade_id || 'trato',
      },
      resumo: {
        total_receitas: dreData.receitas.receita_liquida,
        total_despesas: dreData.despesas.total_despesas + dreData.custos.custos_servicos,
        lucro_prejuizo: dreData.resultado.lucro_liquido,
        margem_liquida: dreData.margem.margem_liquida,
      },
      indicadores: {
        liquidez_atual,
        rentabilidade,
        crescimento_periodo,
      },
    };

    console.log('✅ Resumo financeiro gerado com sucesso');
    return { success: true, data: summary };

  } catch (error) {
    console.error('❌ Erro inesperado ao gerar resumo financeiro:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro inesperado ao gerar resumo financeiro'
    };
  }
}

/**
 * Análise de fluxo de caixa
 */
export async function getCashFlow(input: {
  period: Period;
  unidade_id?: string;
  group_by?: 'day' | 'week' | 'month';
}): Promise<ActionResult<CashFlowData>> {
  try {
    console.log('🔄 Gerando análise de fluxo de caixa');

    // Validar entrada
    const validation = cashFlowRequestSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const { period, unidade_id, group_by } = validation.data;
    const supabase = await createClient();

    // Buscar lançamentos de contas de caixa/bancos (códigos 1.1.x.x)
    const { data: lancamentos, error } = await supabase
      .from('lancamentos_contabeis')
      .select(`
        id,
        data_competencia,
        valor,
        tipo_lancamento,
        historico,
        conta_debito_id,
        conta_credito_id,
        contas_debito:conta_debito_id(codigo, nome),
        contas_credito:conta_credito_id(codigo, nome)
      `)
      .gte('data_competencia', period.from)
      .lte('data_competencia', period.to)
      .eq('unidade_id', unidade_id || 'trato')
      .eq('status', 'confirmado')
      .order('data_competencia', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar lançamentos:', error);
      return { success: false, error: 'Erro ao buscar dados do fluxo de caixa: ' + error.message };
    }

    // Filtrar apenas lançamentos que envolvem contas de caixa/bancos
    const cashFlowLancamentos = (lancamentos || []).filter((l: any) => {
      const debitoIsCash = l.contas_debito?.codigo?.startsWith('1.1');
      const creditoIsCash = l.contas_credito?.codigo?.startsWith('1.1');
      return debitoIsCash || creditoIsCash;
    });

    // Agrupar por período
    const groupedData = groupCashFlowByPeriod(cashFlowLancamentos, group_by);

    // Processar entradas e saídas
    const entradas: CashFlowEntry[] = [];
    const saidas: CashFlowEntry[] = [];
    const saldo_liquido: CashFlowEntry[] = [];

    let saldoAcumulado = 0;

    for (const [data, lancamentosGrupo] of Object.entries(groupedData)) {
      let entradasDia = 0;
      let saidasDia = 0;

      for (const lancamento of lancamentosGrupo as any[]) {
        const valor = parseFloat(lancamento.valor);
        const debitoIsCash = lancamento.contas_debito?.codigo?.startsWith('1.1');
        const creditoIsCash = lancamento.contas_credito?.codigo?.startsWith('1.1');

        if (debitoIsCash && !creditoIsCash) {
          // Entrada de caixa (débito em conta de caixa)
          entradasDia += valor;
        } else if (!debitoIsCash && creditoIsCash) {
          // Saída de caixa (crédito em conta de caixa)
          saidasDia += valor;
        }
      }

      const saldoDia = entradasDia - saidasDia;
      saldoAcumulado += saldoDia;

      entradas.push({
        data,
        valor: entradasDia,
        descricao: `Entradas do ${formatDateGroup(data, group_by)}`,
        tipo: 'entrada',
      });

      saidas.push({
        data,
        valor: saidasDia,
        descricao: `Saídas do ${formatDateGroup(data, group_by)}`,
        tipo: 'saida',
      });

      saldo_liquido.push({
        data,
        valor: saldoAcumulado,
        descricao: `Saldo acumulado até ${formatDateGroup(data, group_by)}`,
        tipo: 'saldo',
      });
    }

    const cashFlowData: CashFlowData = {
      periodo: {
        data_inicio: period.from,
        data_fim: period.to,
        unidade_id: unidade_id || 'trato',
        agrupamento: group_by,
      },
      fluxo: {
        entradas,
        saidas,
        saldo_liquido,
      },
      resumo: {
        total_entradas: entradas.reduce((sum, e) => sum + e.valor, 0),
        total_saidas: saidas.reduce((sum, s) => sum + s.valor, 0),
        saldo_final: saldoAcumulado,
        saldo_medio: saldo_liquido.length > 0 
          ? saldo_liquido.reduce((sum, s) => sum + s.valor, 0) / saldo_liquido.length 
          : 0,
      },
    };

    console.log('✅ Análise de fluxo de caixa gerada com sucesso');
    return { success: true, data: cashFlowData };

  } catch (error) {
    console.error('❌ Erro inesperado ao gerar fluxo de caixa:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro inesperado ao gerar fluxo de caixa'
    };
  }
}

/**
 * Análise de lucratividade
 */
export async function getProfitabilityAnalysis(input: {
  period: Period;
  unidade_id?: string;
}): Promise<ActionResult<ProfitabilityAnalysis>> {
  try {
    console.log('🔄 Gerando análise de lucratividade');

    // Validar entrada
    const validation = z.object({
      period: periodSchema,
      unidade_id: z.string().optional(),
    }).safeParse(input);

    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const { period, unidade_id } = validation.data;

    // Buscar DRE atual
    const dreResult = await getDREData({
      period,
      unidade_id,
      include_audit_trail: false,
    });

    if (!dreResult.success || !dreResult.data) {
      return { success: false, error: 'Erro ao buscar dados para análise: ' + dreResult.error };
    }

    const dreData = dreResult.data;

    // Calcular período anterior
    const daysDiff = Math.ceil((new Date(period.to).getTime() - new Date(period.from).getTime()) / (1000 * 60 * 60 * 24));
    const previousFrom = new Date(new Date(period.from).getTime() - (daysDiff * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const previousTo = new Date(new Date(period.to).getTime() - (daysDiff * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

    const previousDreResult = await getDREData({
      period: { from: previousFrom, to: previousTo },
      unidade_id,
      include_audit_trail: false,
    });

    // Calcular métricas de lucratividade
    const receita = dreData.receitas.receita_liquida;
    const margem_bruta = dreData.margem.margem_bruta;
    const margem_operacional = dreData.margem.margem_operacional;
    const margem_liquida = dreData.margem.margem_liquida;

    // ROA e ROE simplificados (seria necessário dados do balanço patrimonial para cálculo completo)
    const ativo_total = receita * 2; // Estimativa simplificada
    const patrimonio_liquido = ativo_total * 0.3; // Estimativa simplificada
    const roa = ativo_total > 0 ? (dreData.resultado.lucro_liquido / ativo_total) * 100 : 0;
    const roe = patrimonio_liquido > 0 ? (dreData.resultado.lucro_liquido / patrimonio_liquido) * 100 : 0;

    // EBITDA aproximado (Lucro + Impostos + Depreciação + Amortização)
    const ebitda = dreData.resultado.lucro_antes_ir + dreData.resultado.provisao_ir;

    // Tendências (comparação com período anterior)
    const crescimento_receita = previousDreResult.success && previousDreResult.data
      ? calculateVariation(receita, previousDreResult.data.receitas.receita_liquida).percentage
      : 0;

    const crescimento_lucro = previousDreResult.success && previousDreResult.data
      ? calculateVariation(dreData.resultado.lucro_liquido, previousDreResult.data.resultado.lucro_liquido).percentage
      : 0;

    const eficiencia_operacional = receita > 0 
      ? (dreData.resultado.lucro_operacional / receita) * 100 
      : 0;

    const analysis: ProfitabilityAnalysis = {
      periodo: {
        data_inicio: period.from,
        data_fim: period.to,
        unidade_id: unidade_id || 'trato',
      },
      metricas: {
        margem_bruta,
        margem_operacional,
        margem_liquida,
        roa,
        roe,
        ebitda,
      },
      tendencias: {
        crescimento_receita,
        crescimento_lucro,
        eficiencia_operacional,
      },
    };

    console.log('✅ Análise de lucratividade gerada com sucesso');
    return { success: true, data: analysis };

  } catch (error) {
    console.error('❌ Erro inesperado ao gerar análise de lucratividade:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro inesperado ao gerar análise de lucratividade'
    };
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES PARA FLUXO DE CAIXA
// ============================================================================

/**
 * Agrupa lançamentos por período
 */
function groupCashFlowByPeriod(lancamentos: any[], groupBy: string): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  for (const lancamento of lancamentos) {
    const date = new Date(lancamento.data_competencia);
    let key: string;

    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      default:
        key = date.toISOString().split('T')[0];
    }

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(lancamento);
  }

  return grouped;
}

/**
 * Formata data para exibição baseada no agrupamento
 */
function formatDateGroup(dateStr: string, groupBy: string): string {
  const date = new Date(dateStr);

  switch (groupBy) {
    case 'day':
      return date.toLocaleDateString('pt-BR');
    case 'week':
      const weekEnd = new Date(date);
      weekEnd.setDate(date.getDate() + 6);
      return `${date.toLocaleDateString('pt-BR')} - ${weekEnd.toLocaleDateString('pt-BR')}`;
    case 'month':
      return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    default:
      return date.toLocaleDateString('pt-BR');
  }
}

// ============================================================================
// SISTEMA DE VALIDAÇÃO E AUDITORIA DE DADOS
// ============================================================================

export interface DataValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: {
    total_checks: number;
    passed_checks: number;
    failed_checks: number;
    warning_checks: number;
  };
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affected_data: any;
  suggested_fix?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  affected_data: any;
  impact: 'performance' | 'accuracy' | 'completeness';
}

export interface AuditReport {
  periodo: {
    data_inicio: string;
    data_fim: string;
    unidade_id: string;
  };
  validations: DataValidationResult;
  data_quality: {
    completeness_score: number;
    accuracy_score: number;
    consistency_score: number;
    overall_score: number;
  };
  reconciliation: {
    total_debits: number;
    total_credits: number;
    balance_difference: number;
    is_balanced: boolean;
  };
  suspicious_entries: SuspiciousEntry[];
}

export interface SuspiciousEntry {
  lancamento_id: string;
  reason: string;
  severity: 'high' | 'medium' | 'low';
  details: any;
}

/**
 * Executa validação completa de dados financeiros
 */
export async function validateFinancialData(input: {
  period: Period;
  unidade_id?: string;
  include_detailed_audit?: boolean;
}): Promise<ActionResult<DataValidationResult>> {
  try {
    console.log('🔍 Executando validação de dados financeiros');

    const { period, unidade_id, include_detailed_audit } = input;
    const supabase = await createClient();

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let totalChecks = 0;

    // 1. Validar integridade referencial
    totalChecks++;
    console.log('  🔍 Verificando integridade referencial...');
    const referentialErrors = await validateReferentialIntegrity(supabase, period, unidade_id || 'trato');
    errors.push(...referentialErrors);

    // 2. Validar balanceamento contábil
    totalChecks++;
    console.log('  ⚖️ Verificando balanceamento contábil...');
    const balanceErrors = await validateAccountingBalance(supabase, period, unidade_id || 'trato');
    errors.push(...balanceErrors);

    // 3. Validar consistência de valores
    totalChecks++;
    console.log('  💰 Verificando consistência de valores...');
    const valueErrors = await validateValueConsistency(supabase, period, unidade_id || 'trato');
    errors.push(...valueErrors);

    // 4. Validar datas e períodos
    totalChecks++;
    console.log('  📅 Verificando consistência de datas...');
    const dateErrors = await validateDateConsistency(supabase, period, unidade_id || 'trato');
    errors.push(...dateErrors);

    // 5. Detectar anomalias e valores suspeitos
    totalChecks++;
    console.log('  🚨 Detectando anomalias...');
    const anomalyWarnings = await detectAnomalies(supabase, period, unidade_id || 'trato');
    warnings.push(...anomalyWarnings);

    // 6. Validar completude dos dados
    totalChecks++;
    console.log('  📊 Verificando completude dos dados...');
    const completenessWarnings = await validateDataCompleteness(supabase, period, unidade_id || 'trato');
    warnings.push(...completenessWarnings);

    const failedChecks = errors.filter(e => e.severity === 'critical' || e.severity === 'high').length;
    const passedChecks = totalChecks - errors.length;
    const warningChecks = warnings.length;

    const result: DataValidationResult = {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      errors,
      warnings,
      summary: {
        total_checks: totalChecks,
        passed_checks: passedChecks,
        failed_checks: failedChecks,
        warning_checks: warningChecks,
      },
    };

    console.log(`✅ Validação concluída: ${passedChecks}/${totalChecks} checks passaram`);

    return { success: true, data: result };

  } catch (error) {
    console.error('❌ Erro inesperado na validação:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro inesperado na validação'
    };
  }
}

/**
 * Gera relatório completo de auditoria
 */
export async function generateAuditReport(input: {
  period: Period;
  unidade_id?: string;
}): Promise<ActionResult<AuditReport>> {
  try {
    console.log('📋 Gerando relatório de auditoria completo');

    const { period, unidade_id } = input;
    const supabase = await createClient();

    // Executar validação completa
    const validationResult = await validateFinancialData({
      period,
      unidade_id,
      include_detailed_audit: true,
    });

    if (!validationResult.success || !validationResult.data) {
      return { success: false, error: 'Erro na validação: ' + validationResult.error };
    }

    // Calcular scores de qualidade
    const dataQuality = await calculateDataQualityScores(supabase, period, unidade_id || 'trato');

    // Verificar reconciliação contábil
    const reconciliation = await performAccountingReconciliation(supabase, period, unidade_id || 'trato');

    // Detectar lançamentos suspeitos
    const suspiciousEntries = await detectSuspiciousEntries(supabase, period, unidade_id || 'trato');

    const auditReport: AuditReport = {
      periodo: {
        data_inicio: period.from,
        data_fim: period.to,
        unidade_id: unidade_id || 'trato',
      },
      validations: validationResult.data,
      data_quality: dataQuality,
      reconciliation,
      suspicious_entries: suspiciousEntries,
    };

    console.log('✅ Relatório de auditoria gerado com sucesso');

    return { success: true, data: auditReport };

  } catch (error) {
    console.error('❌ Erro inesperado no relatório de auditoria:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro inesperado no relatório de auditoria'
    };
  }
}

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO ESPECÍFICAS
// ============================================================================

/**
 * Valida integridade referencial
 */
async function validateReferentialIntegrity(
  supabase: any, 
  period: Period, 
  unidade_id: string
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  try {
    // Verificar lançamentos com contas inexistentes
    const { data: invalidAccounts } = await supabase
      .from('lancamentos_contabeis')
      .select(`
        id, 
        conta_debito_id, 
        conta_credito_id,
        contas_debito:conta_debito_id(id),
        contas_credito:conta_credito_id(id)
      `)
      .gte('data_competencia', period.from)
      .lte('data_competencia', period.to)
      .eq('unidade_id', unidade_id);

    if (invalidAccounts) {
      for (const lancamento of invalidAccounts) {
        if (!lancamento.contas_debito) {
          errors.push({
            code: 'INVALID_DEBIT_ACCOUNT',
            message: `Lançamento com conta de débito inexistente`,
            severity: 'critical',
            affected_data: { lancamento_id: lancamento.id, conta_debito_id: lancamento.conta_debito_id },
            suggested_fix: 'Verificar e corrigir referência da conta de débito',
          });
        }

        if (!lancamento.contas_credito) {
          errors.push({
            code: 'INVALID_CREDIT_ACCOUNT',
            message: `Lançamento com conta de crédito inexistente`,
            severity: 'critical',
            affected_data: { lancamento_id: lancamento.id, conta_credito_id: lancamento.conta_credito_id },
            suggested_fix: 'Verificar e corrigir referência da conta de crédito',
          });
        }
      }
    }

  } catch (error) {
    console.warn('⚠️ Erro ao validar integridade referencial:', error);
  }

  return errors;
}

/**
 * Valida balanceamento contábil
 */
async function validateAccountingBalance(
  supabase: any, 
  period: Period, 
  unidade_id: string
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  try {
    // Calcular totais de débito e crédito
    const { data: totals } = await supabase
      .from('lancamentos_contabeis')
      .select('valor, tipo_lancamento')
      .gte('data_competencia', period.from)
      .lte('data_competencia', period.to)
      .eq('unidade_id', unidade_id)
      .eq('status', 'confirmado');

    if (totals && totals.length > 0) {
      const totalDebitos = totals
        .filter(l => l.tipo_lancamento === 'debito')
        .reduce((sum, l) => sum + parseFloat(l.valor), 0);

      const totalCreditos = totals
        .filter(l => l.tipo_lancamento === 'credito')
        .reduce((sum, l) => sum + parseFloat(l.valor), 0);

      const diferenca = Math.abs(totalDebitos - totalCreditos);

      if (diferenca > 0.01) { // Tolerância de 1 centavo
        errors.push({
          code: 'ACCOUNTING_IMBALANCE',
          message: `Desbalanceamento contábil detectado: diferença de R$ ${diferenca.toFixed(2)}`,
          severity: 'critical',
          affected_data: { 
            total_debitos: totalDebitos, 
            total_creditos: totalCreditos, 
            diferenca 
          },
          suggested_fix: 'Revisar lançamentos contábeis para identificar inconsistências',
        });
      }
    }

  } catch (error) {
    console.warn('⚠️ Erro ao validar balanceamento:', error);
  }

  return errors;
}

/**
 * Valida consistência de valores
 */
async function validateValueConsistency(
  supabase: any, 
  period: Period, 
  unidade_id: string
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  try {
    // Verificar valores negativos ou zero
    const { data: invalidValues } = await supabase
      .from('lancamentos_contabeis')
      .select('id, valor, historico')
      .gte('data_competencia', period.from)
      .lte('data_competencia', period.to)
      .eq('unidade_id', unidade_id)
      .lte('valor', 0);

    if (invalidValues && invalidValues.length > 0) {
      for (const lancamento of invalidValues) {
        errors.push({
          code: 'INVALID_VALUE',
          message: `Lançamento com valor inválido: R$ ${lancamento.valor}`,
          severity: 'high',
          affected_data: { 
            lancamento_id: lancamento.id, 
            valor: lancamento.valor,
            historico: lancamento.historico 
          },
          suggested_fix: 'Corrigir valor do lançamento para um valor positivo',
        });
      }
    }

    // Verificar valores muito altos (possível erro de digitação)
    const { data: highValues } = await supabase
      .from('lancamentos_contabeis')
      .select('id, valor, historico')
      .gte('data_competencia', period.from)
      .lte('data_competencia', period.to)
      .eq('unidade_id', unidade_id)
      .gt('valor', 100000); // Valores acima de R$ 100.000

    if (highValues && highValues.length > 0) {
      for (const lancamento of highValues) {
        errors.push({
          code: 'UNUSUALLY_HIGH_VALUE',
          message: `Valor excepcionalmente alto detectado: R$ ${parseFloat(lancamento.valor).toLocaleString('pt-BR')}`,
          severity: 'medium',
          affected_data: { 
            lancamento_id: lancamento.id, 
            valor: lancamento.valor,
            historico: lancamento.historico 
          },
          suggested_fix: 'Verificar se o valor está correto ou se há erro de digitação',
        });
      }
    }

  } catch (error) {
    console.warn('⚠️ Erro ao validar valores:', error);
  }

  return errors;
}

/**
 * Valida consistência de datas
 */
async function validateDateConsistency(
  supabase: any, 
  period: Period, 
  unidade_id: string
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  try {
    // Verificar lançamentos com data de competência diferente de data de lançamento por mais de 30 dias
    const { data: dateMismatches } = await supabase
      .rpc('validate_date_consistency', {
        p_data_inicio: period.from,
        p_data_fim: period.to,
        p_unidade_id: unidade_id,
        p_max_days_diff: 30
      });

    if (dateMismatches && dateMismatches.length > 0) {
      for (const mismatch of dateMismatches) {
        errors.push({
          code: 'DATE_MISMATCH',
          message: `Grande diferença entre data de lançamento e competência`,
          severity: 'medium',
          affected_data: mismatch,
          suggested_fix: 'Verificar se as datas estão corretas',
        });
      }
    }

  } catch (error) {
    // Se a função RPC não existir, não considerar como erro crítico
    console.warn('⚠️ Função de validação de datas não disponível:', error);
  }

  return errors;
}

/**
 * Detecta anomalias nos dados
 */
async function detectAnomalies(
  supabase: any, 
  period: Period, 
  unidade_id: string
): Promise<ValidationWarning[]> {
  const warnings: ValidationWarning[] = [];

  try {
    // Detectar padrões anômalos nos valores
    const { data: lancamentos } = await supabase
      .from('lancamentos_contabeis')
      .select('id, valor, data_competencia, historico')
      .gte('data_competencia', period.from)
      .lte('data_competencia', period.to)
      .eq('unidade_id', unidade_id)
      .eq('status', 'confirmado');

    if (lancamentos && lancamentos.length > 0) {
      const valores = lancamentos.map(l => parseFloat(l.valor));
      const media = valores.reduce((sum, v) => sum + v, 0) / valores.length;
      const desvio = Math.sqrt(valores.reduce((sum, v) => sum + Math.pow(v - media, 2), 0) / valores.length);

      // Detectar outliers (valores que estão além de 2 desvios padrão)
      for (const lancamento of lancamentos) {
        const valor = parseFloat(lancamento.valor);
        if (Math.abs(valor - media) > 2 * desvio && desvio > 0) {
          warnings.push({
            code: 'STATISTICAL_OUTLIER',
            message: `Valor estatisticamente atípico detectado`,
            affected_data: {
              lancamento_id: lancamento.id,
              valor,
              media: media.toFixed(2),
              desvio_padrao: desvio.toFixed(2),
            },
            impact: 'accuracy',
          });
        }
      }
    }

  } catch (error) {
    console.warn('⚠️ Erro ao detectar anomalias:', error);
  }

  return warnings;
}

/**
 * Valida completude dos dados
 */
async function validateDataCompleteness(
  supabase: any, 
  period: Period, 
  unidade_id: string
): Promise<ValidationWarning[]> {
  const warnings: ValidationWarning[] = [];

  try {
    // Verificar lançamentos sem histórico
    const { data: emptyHistorico } = await supabase
      .from('lancamentos_contabeis')
      .select('id')
      .gte('data_competencia', period.from)
      .lte('data_competencia', period.to)
      .eq('unidade_id', unidade_id)
      .or('historico.is.null,historico.eq.');

    if (emptyHistorico && emptyHistorico.length > 0) {
      warnings.push({
        code: 'MISSING_HISTORICO',
        message: `${emptyHistorico.length} lançamento(s) sem histórico`,
        affected_data: { count: emptyHistorico.length, lancamentos: emptyHistorico },
        impact: 'completeness',
      });
    }

    // Verificar gaps de datas (dias sem lançamentos)
    const startDate = new Date(period.from);
    const endDate = new Date(period.to);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff > 7) { // Só verificar para períodos maiores que uma semana
      const { data: dailyCounts } = await supabase
        .rpc('get_daily_transaction_counts', {
          p_data_inicio: period.from,
          p_data_fim: period.to,
          p_unidade_id: unidade_id
        });

      // Se a função não existir, não consideramos como problema
      if (dailyCounts && dailyCounts.length > 0) {
        const daysWithoutTransactions = daysDiff - dailyCounts.length;
        if (daysWithoutTransactions > daysDiff * 0.3) { // Mais de 30% dos dias sem transações
          warnings.push({
            code: 'DATA_GAPS',
            message: `${daysWithoutTransactions} dias sem lançamentos no período`,
            affected_data: { 
              days_without_transactions: daysWithoutTransactions,
              total_days: daysDiff,
              percentage: ((daysWithoutTransactions / daysDiff) * 100).toFixed(1)
            },
            impact: 'completeness',
          });
        }
      }
    }

  } catch (error) {
    console.warn('⚠️ Erro ao validar completude:', error);
  }

  return warnings;
}

/**
 * Calcula scores de qualidade dos dados
 */
async function calculateDataQualityScores(
  supabase: any, 
  period: Period, 
  unidade_id: string
): Promise<{ completeness_score: number; accuracy_score: number; consistency_score: number; overall_score: number }> {
  let completeness_score = 100;
  let accuracy_score = 100;
  let consistency_score = 100;

  try {
    // Calcular score de completude
    const { data: totalLancamentos } = await supabase
      .from('lancamentos_contabeis')
      .select('id, historico', { count: 'exact', head: true })
      .gte('data_competencia', period.from)
      .lte('data_competencia', period.to)
      .eq('unidade_id', unidade_id);

    const { data: lancamentosSemHistorico } = await supabase
      .from('lancamentos_contabeis')
      .select('id', { count: 'exact', head: true })
      .gte('data_competencia', period.from)
      .lte('data_competencia', period.to)
      .eq('unidade_id', unidade_id)
      .or('historico.is.null,historico.eq.');

    if (totalLancamentos && lancamentosSemHistorico) {
      const total = totalLancamentos.count || 0;
      const semHistorico = lancamentosSemHistorico.count || 0;
      completeness_score = total > 0 ? Math.max(0, 100 - (semHistorico / total) * 100) : 100;
    }

    // Calcular score de precisão (baseado em validações)
    const validationResult = await validateFinancialData({
      period,
      unidade_id,
      include_detailed_audit: false,
    });

    if (validationResult.success && validationResult.data) {
      const criticalErrors = validationResult.data.errors.filter(e => e.severity === 'critical').length;
      const highErrors = validationResult.data.errors.filter(e => e.severity === 'high').length;
      
      accuracy_score = Math.max(0, 100 - (criticalErrors * 25) - (highErrors * 10));
    }

    // Calcular score de consistência (baseado em balanceamento)
    const { data: totals } = await supabase
      .from('lancamentos_contabeis')
      .select('valor, tipo_lancamento')
      .gte('data_competencia', period.from)
      .lte('data_competencia', period.to)
      .eq('unidade_id', unidade_id)
      .eq('status', 'confirmado');

    if (totals && totals.length > 0) {
      const totalDebitos = totals.filter(l => l.tipo_lancamento === 'debito').reduce((sum, l) => sum + parseFloat(l.valor), 0);
      const totalCreditos = totals.filter(l => l.tipo_lancamento === 'credito').reduce((sum, l) => sum + parseFloat(l.valor), 0);
      const diferenca = Math.abs(totalDebitos - totalCreditos);
      const percentualDiferenca = totalDebitos > 0 ? (diferenca / totalDebitos) * 100 : 0;
      
      consistency_score = Math.max(0, 100 - percentualDiferenca);
    }

  } catch (error) {
    console.warn('⚠️ Erro ao calcular scores de qualidade:', error);
  }

  const overall_score = (completeness_score + accuracy_score + consistency_score) / 3;

  return {
    completeness_score: Math.round(completeness_score * 100) / 100,
    accuracy_score: Math.round(accuracy_score * 100) / 100,
    consistency_score: Math.round(consistency_score * 100) / 100,
    overall_score: Math.round(overall_score * 100) / 100,
  };
}

/**
 * Executa reconciliação contábil
 */
async function performAccountingReconciliation(
  supabase: any, 
  period: Period, 
  unidade_id: string
): Promise<{ total_debits: number; total_credits: number; balance_difference: number; is_balanced: boolean }> {
  try {
    const { data: totals } = await supabase
      .from('lancamentos_contabeis')
      .select('valor, tipo_lancamento')
      .gte('data_competencia', period.from)
      .lte('data_competencia', period.to)
      .eq('unidade_id', unidade_id)
      .eq('status', 'confirmado');

    let total_debits = 0;
    let total_credits = 0;

    if (totals) {
      total_debits = totals.filter(l => l.tipo_lancamento === 'debito').reduce((sum, l) => sum + parseFloat(l.valor), 0);
      total_credits = totals.filter(l => l.tipo_lancamento === 'credito').reduce((sum, l) => sum + parseFloat(l.valor), 0);
    }

    const balance_difference = Math.abs(total_debits - total_credits);
    const is_balanced = balance_difference < 0.01; // Tolerância de 1 centavo

    return {
      total_debits: Math.round(total_debits * 100) / 100,
      total_credits: Math.round(total_credits * 100) / 100,
      balance_difference: Math.round(balance_difference * 100) / 100,
      is_balanced,
    };

  } catch (error) {
    console.warn('⚠️ Erro na reconciliação:', error);
    return { total_debits: 0, total_credits: 0, balance_difference: 0, is_balanced: false };
  }
}

/**
 * Detecta lançamentos suspeitos
 */
async function detectSuspiciousEntries(
  supabase: any, 
  period: Period, 
  unidade_id: string
): Promise<SuspiciousEntry[]> {
  const suspicious: SuspiciousEntry[] = [];

  try {
    // Detectar lançamentos com valores muito altos
    const { data: highValues } = await supabase
      .from('lancamentos_contabeis')
      .select('id, valor, historico, data_competencia')
      .gte('data_competencia', period.from)
      .lte('data_competencia', period.to)
      .eq('unidade_id', unidade_id)
      .gt('valor', 50000);

    if (highValues) {
      for (const entry of highValues) {
        suspicious.push({
          lancamento_id: entry.id,
          reason: 'Valor excepcionalmente alto',
          severity: 'medium',
          details: {
            valor: entry.valor,
            historico: entry.historico,
            data_competencia: entry.data_competencia,
          },
        });
      }
    }

    // Detectar lançamentos duplicados (mesmo valor, mesma data, mesmo histórico)
    const { data: possibleDuplicates } = await supabase
      .rpc('detect_duplicate_transactions', {
        p_data_inicio: period.from,
        p_data_fim: period.to,
        p_unidade_id: unidade_id
      });

    if (possibleDuplicates) {
      for (const duplicate of possibleDuplicates) {
        suspicious.push({
          lancamento_id: duplicate.id,
          reason: 'Possível lançamento duplicado',
          severity: 'high',
          details: duplicate,
        });
      }
    }

  } catch (error) {
    console.warn('⚠️ Erro ao detectar lançamentos suspeitos:', error);
  }

  return suspicious;
}
