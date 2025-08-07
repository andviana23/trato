import { NextResponse } from 'next/server';
import { asaasService } from '@/lib/services/asaas';
import { createClient } from '@supabase/supabase-js';
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
        const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
        console.log(`📊 Calculando faturamento para ${month}/${year}`);
        // Buscar dados do Asaas
        const revenueData = await asaasService.getMonthlyRevenue(year, month);
        // Buscar pagamentos externos ativos do mês no Supabase
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        // Calcular o primeiro e último dia do mês
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];
        // Buscar pagamentos externos ativos cujo início do período está dentro do mês
        const { data: externalPayments, error: externalError } = await supabase
            .from('subscriptions')
            .select('price, current_period_start, status, payment_method')
            .eq('payment_method', 'externo')
            .eq('status', 'active')
            .gte('current_period_start', startDate)
            .lte('current_period_start', endDate);
        let externalSum = 0;
        if (externalPayments && Array.isArray(externalPayments)) {
            externalSum = externalPayments.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
        }
        if (externalError) {
            console.error('Erro ao buscar pagamentos externos:', externalError);
        }
        // Contar inadimplentes
        const overdueCount = revenueData.payments.filter(p => p.status === 'ATRASADO').length;
        // Buscar meta do mês no Supabase
        const { data: goalData, error: goalError } = await supabase
            .from('monthly_goals')
            .select('goal_amount, description')
            .eq('year', year)
            .eq('month', month)
            .single();
        const monthlyGoal = (goalData === null || goalData === void 0 ? void 0 : goalData.goal_amount) || 0;
        const goalDescription = (goalData === null || goalData === void 0 ? void 0 : goalData.description) || `Meta ${month}/${year}`;
        return NextResponse.json({
            success: true,
            month: month,
            year: year,
            revenue: {
                asaasTrato: revenueData.bySource.asaasTrato,
                external: externalSum,
                total: revenueData.bySource.asaasTrato + externalSum
            },
            overdueCount: overdueCount,
            goal: {
                amount: monthlyGoal,
                description: goalDescription
            },
            updatedAt: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('💥 Erro ao calcular faturamento:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
