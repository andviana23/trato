import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ChartDataPoint } from '@/lib/types/dashboard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Buscar dados de faturamento e metas
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
      throw revenueData.error || goalsData.error
    }

    const revenues = revenueData.data || []
    const goals = goalsData.data || []

    // Criar array com todos os meses do ano
    const months = Array.from({ length: 12 }, (_, i) => i + 1)

    // Combinar dados de faturamento e metas
    const chartData: ChartDataPoint[] = months.map(month => {
      const revenue = revenues.find(r => r.month === month)
      const goal = goals.find(g => g.month === month)

      return {
        month,
        year,
        revenue: revenue?.total_revenue || 0,
        goal: goal?.goal_amount || 0
      }
    })

    return NextResponse.json({
      success: true,
      data: chartData
    })

  } catch (error) {
    console.error('💥 Erro ao buscar histórico:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
} 