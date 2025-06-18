import { NextRequest, NextResponse } from 'next/server';
import { asaasService } from '@/lib/services/asaas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    
    console.log(`📊 Gerando linha do tempo para ${year}`);

    // Buscar dados anuais do Asaas
    const yearlyData = await asaasService.getYearlyRevenue(year);

    // Gerar dados mensais para a linha do tempo
    const monthlyTimeline = [];
    for (let month = 1; month <= 12; month++) {
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const monthRevenue = yearlyData.byMonth[monthKey] || 0;
      
      // Buscar dados específicos do mês para mais detalhes
      const monthData = await asaasService.getMonthlyRevenue(year, month);
      
      monthlyTimeline.push({
        month: month,
        year: year,
        monthName: new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long' }),
        revenue: monthRevenue,
        bySource: monthData.bySource,
        paymentsCount: monthData.payments.length,
        overdueCount: monthData.payments.filter(p => p.status === 'ATRASADO').length,
        goal: 50000, // Meta mensal padrão (será integrado com API de metas)
        goalAchievement: monthRevenue > 0 ? Math.round((monthRevenue / 50000) * 100) : 0
      });
    }

    // Calcular totais anuais
    const yearlyTotals = {
      totalRevenue: yearlyData.total,
      totalPayments: yearlyData.payments.length,
      totalOverdue: yearlyData.payments.filter(p => p.status === 'ATRASADO').length,
      averageMonthlyRevenue: Math.round(yearlyData.total / 12),
      bestMonth: monthlyTimeline.reduce((best, current) => 
        current.revenue > best.revenue ? current : best
      ),
      worstMonth: monthlyTimeline.reduce((worst, current) => 
        current.revenue < worst.revenue ? current : worst
      )
    };

    return NextResponse.json({
      success: true,
      year: year,
      timeline: monthlyTimeline,
      totals: yearlyTotals,
      bySource: yearlyData.bySource,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Erro ao gerar linha do tempo:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 