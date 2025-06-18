import { createClient } from '@supabase/supabase-js'
import { MonthlyRevenue, MonthlyGoal, ChartDataPoint } from '../types/dashboard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getCurrentMonthRevenue(): Promise<MonthlyRevenue | null> {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1

  const { data, error } = await supabase
    .from('monthly_revenue')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .single()

  if (error) {
    console.error('Erro ao buscar faturamento do mês:', error)
    return null
  }

  return data
}

export async function getMonthlyGoals(year: number): Promise<MonthlyGoal[]> {
  const { data, error } = await supabase
    .from('monthly_goals')
    .select('*')
    .eq('year', year)
    .order('month', { ascending: true })

  if (error) {
    console.error('Erro ao buscar metas:', error)
    return []
  }

  return data || []
}

export async function getChartData(year: number): Promise<ChartDataPoint[]> {
  const [revenueData, goalsData] = await Promise.all([
    supabase
      .from('monthly_revenue')
      .select('*')
      .eq('year', year)
      .order('month', { ascending: true }),
    supabase
      .from('monthly_goals')
      .select('*')
      .eq('year', year)
      .order('month', { ascending: true })
  ])

  if (revenueData.error || goalsData.error) {
    console.error('Erro ao buscar dados do gráfico:', revenueData.error || goalsData.error)
    return []
  }

  const revenues = revenueData.data || []
  const goals = goalsData.data || []

  // Criar array com todos os meses do ano
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return months.map(month => {
    const revenue = revenues.find(r => r.month === month)
    const goal = goals.find(g => g.month === month)

    return {
      month,
      year,
      revenue: revenue?.total_revenue || 0,
      goal: goal?.goal_amount || 0
    }
  })
}

export async function saveMonthlyRevenue(revenue: Omit<MonthlyRevenue, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('monthly_revenue')
    .upsert({
      ...revenue,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'year,month'
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao salvar faturamento:', error)
    throw error
  }

  return data
}

export async function saveMonthlyGoal(goal: Omit<MonthlyGoal, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('monthly_goals')
    .upsert({
      ...goal,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'year,month'
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao salvar meta:', error)
    throw error
  }

  return data
}

export async function deleteMonthlyGoal(year: number, month: number) {
  const { error } = await supabase
    .from('monthly_goals')
    .delete()
    .eq('year', year)
    .eq('month', month)

  if (error) {
    console.error('Erro ao deletar meta:', error)
    throw error
  }
} 