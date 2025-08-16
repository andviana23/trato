'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ActionResult, ActionResultPaginated } from '@/lib/types/action';
import {
  createMetaSchema,
  updateMetaSchema,
  searchMetasSchema,
  calculateMetaProgressSchema,
  calculateCommissionSchema,
  type CreateMetaInput,
  type UpdateMetaInput,
  type SearchMetasInput,
  type CalculateMetaProgressInput,
  type CalculateCommissionInput,
} from '@/lib/validators';

// ============================================================================
// TIPOS DE DADOS
// ============================================================================

export interface Meta {
  id: string;
  professionalId: string;
  unidadeId: string;
  month: number;
  year: number;
  targetRevenue: number;
  targetAppointments: number;
  targetServices: number;
  commissionRate: number;
  notes?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetaWithProgress extends Meta {
  professional: {
    id: string;
    name: string;
    specialty: string;
  };
  progress: {
    currentRevenue: number;
    currentAppointments: number;
    currentServices: number;
    revenuePercentage: number;
    appointmentsPercentage: number;
    servicesPercentage: number;
    commissionEarned: number;
    bonusEarned: number;
    totalEarnings: number;
  };
}

export interface Bonus {
  id: string;
  metaId: string;
  professionalId: string;
  unidadeId: string;
  month: number;
  year: number;
  baseAmount: number;
  bonusAmount: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetaProgress {
  currentRevenue: number;
  currentAppointments: number;
  currentServices: number;
  revenuePercentage: number;
  appointmentsPercentage: number;
  servicesPercentage: number;
  commissionEarned: number;
  bonusEarned: number;
  totalEarnings: number;
  isTargetReached: boolean;
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Cria uma nova meta no banco de dados
 */
export async function createMeta(
  input: CreateMetaInput
): Promise<ActionResult<Meta>> {
  try {
    // Validação com Zod
    const validation = createMetaSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Verificar se já existe meta para este profissional no mês/ano
    const { data: existingMeta, error: checkError } = await supabase
      .from('metas')
      .select('id')
      .eq('professionalId', validatedData.professionalId)
      .eq('month', validatedData.month)
      .eq('year', validatedData.year)
      .eq('isActive', true)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erro ao verificar meta existente:', checkError);
      return {
        success: false,
        error: 'Erro interno ao verificar meta existente'
      };
    }

    if (existingMeta) {
      return {
        success: false,
        error: 'Já existe uma meta ativa para este profissional neste período'
      };
    }

    // Criar meta
    const { data: meta, error } = await supabase
      .from('metas')
      .insert([{
        ...validatedData,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar meta:', error);
      return {
        success: false,
        error: 'Erro interno ao criar meta'
      };
    }

    // Revalidar cache
    revalidatePath('/metas');
    revalidatePath('/dashboard/metas');
    revalidatePath(`/dashboard/metas/${validatedData.unidadeId}`);

    return {
      success: true,
      data: meta as Meta
    };
  } catch (error) {
    console.error('Erro inesperado ao criar meta:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Modifica os detalhes de uma meta existente
 */
export async function updateMeta(
  input: UpdateMetaInput
): Promise<ActionResult<Meta>> {
  try {
    // Validação com Zod
    const validation = updateMetaSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Verificar se a meta existe
    const { data: existing, error: fetchError } = await supabase
      .from('metas')
      .select('id, isActive')
      .eq('id', validatedData.id)
      .single();

    if (fetchError || !existing) {
      return {
        success: false,
        error: 'Meta não encontrada'
      };
    }

    if (!existing.isActive) {
      return {
        success: false,
        error: 'Não é possível alterar uma meta inativa'
      };
    }

    // Atualizar meta
    const { data: meta, error } = await supabase
      .from('metas')
      .update({
        ...validatedData,
        updatedAt: new Date().toISOString()
      })
      .eq('id', validatedData.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar meta:', error);
      return {
        success: false,
        error: 'Erro interno ao atualizar meta'
      };
    }

    // Revalidar cache
    revalidatePath('/metas');
    revalidatePath('/dashboard/metas');
    revalidatePath(`/dashboard/metas/${meta.unidadeId}`);

    return {
      success: true,
      data: meta as Meta
    };
  } catch (error) {
    console.error('Erro inesperado ao atualizar meta:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Calcula o valor do bônus para uma meta com base no progresso
 */
export async function calculateBonus(
  metaId: string
): Promise<ActionResult<{ bonusAmount: number; isEligible: boolean; details: string }>> {
  try {
    if (!metaId) {
      return {
        success: false,
        error: 'ID da meta é obrigatório'
      };
    }

    const supabase = await createClient();

    // Obter meta
    const { data: meta, error: metaError } = await supabase
      .from('metas')
      .select('*')
      .eq('id', metaId)
      .eq('isActive', true)
      .single();

    if (metaError || !meta) {
      return {
        success: false,
        error: 'Meta não encontrada ou inativa'
      };
    }

    // Calcular progresso da meta
    const progressResult = await getMetaProgress(metaId);
    if (!progressResult.success || !progressResult.data) {
      return {
        success: false,
        error: 'Erro ao calcular progresso da meta'
      };
    }

    const progress = progressResult.data;
    
    // Lógica de cálculo do bônus
    let bonusAmount = 0;
    let isEligible = false;
    let details = '';

    // Bônus por atingir 100% da meta de faturamento
    if (progress.revenuePercentage >= 100) {
      bonusAmount += meta.targetRevenue * 0.1; // 10% do valor da meta
      isEligible = true;
      details += 'Meta de faturamento atingida (100%+). ';
    }

    // Bônus por atingir 100% da meta de agendamentos
    if (progress.appointmentsPercentage >= 100) {
      bonusAmount += meta.targetRevenue * 0.05; // 5% do valor da meta
      isEligible = true;
      details += 'Meta de agendamentos atingida (100%+). ';
    }

    // Bônus por atingir 100% da meta de serviços
    if (progress.servicesPercentage >= 100) {
      bonusAmount += meta.targetRevenue * 0.03; // 3% do valor da meta
      isEligible = true;
      details += 'Meta de serviços atingida (100%+). ';
    }

    // Bônus extra por superar 120% da meta de faturamento
    if (progress.revenuePercentage >= 120) {
      bonusAmount += meta.targetRevenue * 0.15; // 15% extra
      details += 'Meta superada (120%+). ';
    }

    if (!isEligible) {
      details = 'Nenhuma meta foi atingida ainda.';
    }

    return {
      success: true,
      data: {
        bonusAmount: Math.round(bonusAmount * 100) / 100, // Arredondar para 2 casas decimais
        isEligible,
        details: details.trim()
      }
    };
  } catch (error) {
    console.error('Erro inesperado ao calcular bônus:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Processa e aplica bônus mensalmente
 */
export async function applyMonthlyBonus(): Promise<ActionResult<{ processed: number; totalBonus: number }>> {
  try {
    const supabase = await createClient();
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Buscar todas as metas ativas do mês anterior
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const { data: metas, error: metasError } = await supabase
      .from('metas')
      .select('*')
      .eq('month', previousMonth)
      .eq('year', previousYear)
      .eq('isActive', true);

    if (metasError) {
      console.error('Erro ao buscar metas:', metasError);
      return {
        success: false,
        error: 'Erro interno ao buscar metas'
      };
    }

    if (!metas || metas.length === 0) {
      return {
        success: true,
        data: {
          processed: 0,
          totalBonus: 0
        }
      };
    }

    let processed = 0;
    let totalBonus = 0;

    // Processar cada meta
    for (const meta of metas) {
      try {
        // Calcular bônus para a meta
        const bonusResult = await calculateBonus(meta.id);
        if (!bonusResult.success || !bonusResult.data) {
          console.error(`Erro ao calcular bônus para meta ${meta.id}:`, bonusResult.error);
          continue;
        }

        const { bonusAmount, isEligible } = bonusResult.data;

        if (isEligible && bonusAmount > 0) {
          // Verificar se já existe bônus para esta meta
          const { data: existingBonus } = await supabase
            .from('bonus')
            .select('id')
            .eq('metaId', meta.id)
            .single();

          if (!existingBonus) {
            // Criar registro de bônus
            const { error: insertError } = await supabase
              .from('bonus')
              .insert([{
                metaId: meta.id,
                professionalId: meta.professionalId,
                unidadeId: meta.unidadeId,
                month: previousMonth,
                year: previousYear,
                baseAmount: meta.targetRevenue,
                bonusAmount: bonusAmount,
                totalAmount: bonusAmount,
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }]);

            if (!insertError) {
              processed++;
              totalBonus += bonusAmount;
            } else {
              console.error(`Erro ao inserir bônus para meta ${meta.id}:`, insertError);
            }
          }
        }
      } catch (metaError) {
        console.error(`Erro ao processar meta ${meta.id}:`, metaError);
      }
    }

    // Revalidar cache
    revalidatePath('/metas');
    revalidatePath('/dashboard/metas');
    revalidatePath('/dashboard/bonus');

    return {
      success: true,
      data: {
        processed,
        totalBonus: Math.round(totalBonus * 100) / 100
      }
    };
  } catch (error) {
    console.error('Erro inesperado ao aplicar bônus mensal:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Obtém o progresso atual de uma meta específica para exibição
 */
export async function getMetaProgress(
  metaId: string
): Promise<ActionResult<MetaProgress>> {
  try {
    if (!metaId) {
      return {
        success: false,
        error: 'ID da meta é obrigatório'
      };
    }

    const supabase = await createClient();

    // Obter meta
    const { data: meta, error: metaError } = await supabase
      .from('metas')
      .select('*')
      .eq('id', metaId)
      .eq('isActive', true)
      .single();

    if (metaError || !meta) {
      return {
        success: false,
        error: 'Meta não encontrada ou inativa'
      };
    }

    // Calcular período
    const startDate = new Date(meta.year, meta.month - 1, 1);
    const endDate = new Date(meta.year, meta.month, 0, 23, 59, 59);

    // Buscar agendamentos completados no período
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        startTime,
        services:services(name, price),
        payments:payments(amount)
      `)
      .eq('professionalId', meta.professionalId)
      .eq('status', 'atendido')
      .gte('startTime', startDate.toISOString())
      .lte('startTime', endDate.toISOString());

    if (appointmentsError) {
      console.error('Erro ao buscar agendamentos:', appointmentsError);
      return {
        success: false,
        error: 'Erro interno ao buscar agendamentos'
      };
    }

    // Calcular métricas atuais
    const currentAppointments = appointments?.length || 0;
    let currentRevenue = 0;
    let currentServices = 0;

    if (appointments) {
      appointments.forEach(appointment => {
        // Calcular receita
        if (appointment.payments && appointment.payments.length > 0) {
          currentRevenue += appointment.payments[0].amount || 0;
        } else if (appointment.services && appointment.services.length > 0) {
          currentRevenue += appointment.services[0].price || 0;
        }

        // Contar serviços
        if (appointment.services && appointment.services.length > 0) {
          currentServices += appointment.services.length;
        }
      });
    }

    // Calcular percentuais
    const revenuePercentage = meta.targetRevenue > 0 ? (currentRevenue / meta.targetRevenue) * 100 : 0;
    const appointmentsPercentage = meta.targetAppointments > 0 ? (currentAppointments / meta.targetAppointments) * 100 : 0;
    const servicesPercentage = meta.targetServices > 0 ? (currentServices / meta.targetServices) * 100 : 0;

    // Calcular comissão
    const commissionEarned = (currentRevenue * meta.commissionRate);

    // Calcular bônus (simplificado)
    const bonusEarned = revenuePercentage >= 100 ? meta.targetRevenue * 0.1 : 0;
    
    const totalEarnings = commissionEarned + bonusEarned;
    const isTargetReached = revenuePercentage >= 100;

    return {
      success: true,
      data: {
        currentRevenue: Math.round(currentRevenue * 100) / 100,
        currentAppointments,
        currentServices,
        revenuePercentage: Math.round(revenuePercentage * 100) / 100,
        appointmentsPercentage: Math.round(appointmentsPercentage * 100) / 100,
        servicesPercentage: Math.round(servicesPercentage * 100) / 100,
        commissionEarned: Math.round(commissionEarned * 100) / 100,
        bonusEarned: Math.round(bonusEarned * 100) / 100,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        isTargetReached
      }
    };
  } catch (error) {
    console.error('Erro inesperado ao obter progresso da meta:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Busca metas com filtros e paginação
 */
export async function searchMetas(
  input: SearchMetasInput
): Promise<ActionResultPaginated<MetaWithProgress>> {
  try {
    // Validação com Zod
    const validation = searchMetasSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    let query = supabase
      .from('metas')
      .select(`
        *,
        professional:professionals(id, name, specialty)
      `, { count: 'exact' })
      .eq('unidadeId', validatedData.unidadeId);

    // Aplicar filtros
    if (validatedData.professionalId) {
      query = query.eq('professionalId', validatedData.professionalId);
    }
    if (validatedData.month) {
      query = query.eq('month', validatedData.month);
    }
    if (validatedData.year) {
      query = query.eq('year', validatedData.year);
    }
    if (validatedData.isActive !== undefined) {
      query = query.eq('isActive', validatedData.isActive);
    }

    // Aplicar paginação
    const from = (validatedData.page - 1) * validatedData.limit;
    const to = from + validatedData.limit - 1;
    query = query.range(from, to);

    // Ordenar por ano e mês (mais recente primeiro)
    query = query.order('year', { ascending: false });
    query = query.order('month', { ascending: false });

    const { data: metas, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar metas:', error);
      return {
        success: false,
        error: 'Erro interno ao buscar metas'
      };
    }

    // Calcular progresso para cada meta
    const metasWithProgress = await Promise.all(
      (metas || []).map(async (meta) => {
        const progress = await getMetaProgress(meta.id);
        return {
          ...meta,
          progress: progress.success ? progress.data : {
            currentRevenue: 0,
            currentAppointments: 0,
            currentServices: 0,
            revenuePercentage: 0,
            appointmentsPercentage: 0,
            servicesPercentage: 0,
            commissionEarned: 0,
            bonusEarned: 0,
            totalEarnings: 0,
            isTargetReached: false
          }
        };
      })
    );

    return {
      success: true,
      data: {
        data: metasWithProgress as MetaWithProgress[],
        pagination: {
          page: validatedData.page,
          limit: validatedData.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / validatedData.limit),
        },
      },
    };
  } catch (error) {
    console.error('Erro inesperado ao buscar metas:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}
