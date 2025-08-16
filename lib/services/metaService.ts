/**
 * Serviço de Metas
 * 
 * Este serviço centraliza toda a lógica de negócio relacionada a metas,
 * incluindo cálculos de bônus, validações e regras de negócio.
 */

import { createClient } from '@/lib/supabase/server';
import { AppError } from '@/lib/errors';
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

/**
 * Cria uma nova meta
 */
export async function createMetaService(input: CreateMetaInput): Promise<Meta> {
  try {
    // Validação com Zod
    const validation = createMetaSchema.safeParse(input);
    if (!validation.success) {
      throw AppError.validationError(
        `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`,
        { input, validationErrors: validation.error.errors }
      );
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Verificar se já existe meta para o profissional no período
    const { data: existingMeta, error: checkError } = await supabase
      .from('metas')
      .select('id')
      .eq('professionalId', validatedData.professionalId)
      .eq('month', validatedData.month)
      .eq('year', validatedData.year)
      .eq('unidadeId', validatedData.unidadeId)
      .eq('isActive', true)
      .single();

    if (existingMeta) {
      throw AppError.conflictError(
        'Já existe uma meta ativa para este profissional neste período',
        { 
          professionalId: validatedData.professionalId,
          month: validatedData.month,
          year: validatedData.year,
          unidadeId: validatedData.unidadeId
        }
      );
    }

    if (checkError && checkError.code !== 'PGRST116') {
      throw AppError.internalError(
        'Erro ao verificar meta existente',
        { supabaseError: checkError }
      );
    }

    // Criar nova meta
    const { data: newMeta, error: insertError } = await supabase
      .from('metas')
      .insert({
        ...validatedData,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      throw AppError.internalError(
        'Erro ao criar meta',
        { supabaseError: insertError }
      );
    }

    return newMeta;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw AppError.internalError(
      'Erro inesperado ao criar meta',
      { originalError: error }
    );
  }
}

/**
 * Atualiza uma meta existente
 */
export async function updateMetaService(input: UpdateMetaInput): Promise<Meta> {
  try {
    // Validação com Zod
    const validation = updateMetaSchema.safeParse(input);
    if (!validation.success) {
      throw AppError.validationError(
        `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`,
        { input, validationErrors: validation.error.errors }
      );
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Verificar se a meta existe
    const { data: existingMeta, error: checkError } = await supabase
      .from('metas')
      .select('*')
      .eq('id', validatedData.metaId)
      .single();

    if (checkError || !existingMeta) {
      throw AppError.notFoundError(
        'Meta',
        { metaId: validatedData.metaId }
      );
    }

    // Atualizar meta
    const { data: updatedMeta, error: updateError } = await supabase
      .from('metas')
      .update({
        ...validatedData,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', validatedData.metaId)
      .select()
      .single();

    if (updateError) {
      throw AppError.internalError(
        'Erro ao atualizar meta',
        { supabaseError: updateError }
      );
    }

    return updatedMeta;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw AppError.internalError(
      'Erro inesperado ao atualizar meta',
      { originalError: error }
    );
  }
}

/**
 * Busca metas com filtros
 */
export async function searchMetasService(input: SearchMetasInput): Promise<{ data: Meta[]; total: number; page: number; limit: number }> {
  try {
    // Validação com Zod
    const validation = searchMetasSchema.safeParse(input);
    if (!validation.success) {
      throw AppError.validationError(
        `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`,
        { input, validationErrors: validation.error.errors }
      );
    }

    const validatedData = validation.data;
    const supabase = await createClient();

    // Construir query base
    let query = supabase
      .from('metas')
      .select('*', { count: 'exact' });

    // Aplicar filtros
    if (validatedData.professionalId) {
      query = query.eq('professionalId', validatedData.professionalId);
    }

    if (validatedData.unidadeId) {
      query = query.eq('unidadeId', validatedData.unidadeId);
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
    const offset = (validatedData.page - 1) * validatedData.limit;
    query = query.range(offset, offset + validatedData.limit - 1);

    // Aplicar ordenação
    query = query.order(validatedData.sortBy, { ascending: validatedData.sortOrder === 'asc' });

    // Executar query
    const { data: metas, error, count } = await query;

    if (error) {
      throw AppError.internalError(
        'Erro ao buscar metas',
        { supabaseError: error }
      );
    }

    return {
      data: metas || [],
      total: count || 0,
      page: validatedData.page,
      limit: validatedData.limit,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw AppError.internalError(
      'Erro inesperado ao buscar metas',
      { originalError: error }
    );
  }
}

/**
 * Calcula o progresso de uma meta
 */
export async function calculateMetaProgressService(input: CalculateMetaProgressInput): Promise<MetaProgress> {
  try {
    // Validação com Zod
    const validation = calculateMetaProgressSchema.safeParse(input);
    if (!validation.success) {
      throw AppError.validationError(
        `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`,
        { input, validationErrors: validation.error.errors }
      );
    }

    const { metaId } = validation.data;
    const supabase = await createClient();

    // Buscar meta
    const { data: meta, error: metaError } = await supabase
      .from('metas')
      .select('*')
      .eq('id', metaId)
      .single();

    if (metaError || !meta) {
      throw AppError.notFoundError(
        'Meta',
        { metaId }
      );
    }

    // Buscar dados de progresso (agendamentos, receita, etc.)
    const { data: progressData, error: progressError } = await supabase
      .from('appointments')
      .select('id, serviceId, startTime, endTime')
      .eq('professionalId', meta.professionalId)
      .eq('unidadeId', meta.unidadeId)
      .gte('startTime', `${meta.year}-${String(meta.month).padStart(2, '0')}-01`)
      .lt('startTime', `${meta.year}-${String(meta.month + 1).padStart(2, '0')}-01`)
      .eq('status', 'atendido');

    if (progressError) {
      throw AppError.internalError(
        'Erro ao buscar dados de progresso',
        { supabaseError: progressError }
      );
    }

    // Calcular métricas de progresso
    const currentAppointments = progressData?.length || 0;
    const currentServices = progressData?.length || 0; // Simplificado - pode ser expandido
    
    // Calcular receita atual (simplificado)
    const currentRevenue = 0; // Implementar cálculo real baseado nos serviços
    
    // Calcular percentuais
    const appointmentsPercentage = meta.targetAppointments > 0 
      ? (currentAppointments / meta.targetAppointments) * 100 
      : 0;
    
    const servicesPercentage = meta.targetServices > 0 
      ? (currentServices / meta.targetServices) * 100 
      : 0;
    
    const revenuePercentage = meta.targetRevenue > 0 
      ? (currentRevenue / meta.targetRevenue) * 100 
      : 0;

    // Calcular comissões e bônus
    const commissionEarned = (currentRevenue * meta.commissionRate) / 100;
    const bonusEarned = 0; // Implementar cálculo de bônus
    const totalEarnings = commissionEarned + bonusEarned;

    // Verificar se a meta foi atingida
    const isTargetReached = revenuePercentage >= 100 && appointmentsPercentage >= 100;

    return {
      currentRevenue,
      currentAppointments,
      currentServices,
      revenuePercentage,
      appointmentsPercentage,
      servicesPercentage,
      commissionEarned,
      bonusEarned,
      totalEarnings,
      isTargetReached,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw AppError.internalError(
      'Erro inesperado ao calcular progresso da meta',
      { originalError: error }
    );
  }
}

/**
 * Calcula comissão para uma meta
 */
export async function calculateCommissionService(input: CalculateCommissionInput): Promise<{ commission: number; bonus: number; total: number }> {
  try {
    // Validação com Zod
    const validation = calculateCommissionSchema.safeParse(input);
    if (!validation.success) {
      throw AppError.validationError(
        `Dados inválidos: ${validation.error.errors.map(e => e.message).join(', ')}`,
        { input, validationErrors: validation.error.errors }
      );
    }

    const { metaId, professionalId, month, year } = validation.data;
    const supabase = await createClient();

    // Buscar meta
    const { data: meta, error: metaError } = await supabase
      .from('metas')
      .select('*')
      .eq('id', metaId)
      .single();

    if (metaError || !meta) {
      throw AppError.notFoundError(
        'Meta',
        { metaId }
      );
    }

    // Buscar dados de receita do período
    const { data: revenueData, error: revenueError } = await supabase
      .from('appointments')
      .select('id, serviceId, startTime, endTime')
      .eq('professionalId', professionalId || meta.professionalId)
      .eq('unidadeId', meta.unidadeId)
      .gte('startTime', `${year || meta.year}-${String(month || meta.month).padStart(2, '0')}-01`)
      .lt('startTime', `${year || meta.year}-${String((month || meta.month) + 1).padStart(2, '0')}-01`)
      .eq('status', 'atendido');

    if (revenueError) {
      throw AppError.internalError(
        'Erro ao buscar dados de receita',
        { supabaseError: revenueError }
      );
    }

    // Calcular receita total (simplificado)
    const totalRevenue = 0; // Implementar cálculo real baseado nos serviços
    
    // Calcular comissão
    const commission = (totalRevenue * meta.commissionRate) / 100;
    
    // Calcular bônus (implementar lógica de bônus)
    const bonus = 0;
    
    const total = commission + bonus;

    return {
      commission,
      bonus,
      total,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw AppError.internalError(
      'Erro inesperado ao calcular comissão',
      { originalError: error }
    );
  }
}
