import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from "@supabase/ssr";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
// Verificar se o usuário é admin
async function isAdmin(request) {
    var _a, _b;
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value, options));
            },
        },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user)
        return false;
    // Permitir admin por e-mail direto
    const adminEmails = [
        'admin@tratodebarbados.com',
        'admin@barbearia.com'
    ];
    if (adminEmails.includes(user.email))
        return true;
    // Buscar role no user_metadata
    const role = ((_a = user.user_metadata) === null || _a === void 0 ? void 0 : _a.role) || ((_b = user.raw_user_meta_data) === null || _b === void 0 ? void 0 : _b.role);
    if (role === 'admin' || role === 'barbershop_owner')
        return true;
    return false;
}
export async function GET() {
    // Dados mock temporários
    return NextResponse.json({
        success: true,
        goals: [
            { month: 1, year: 2025, goal_amount: 50000, description: 'Meta Janeiro' }
        ]
    });
}
export async function POST(request) {
    try {
        // Permitir sem autenticação em desenvolvimento
        const isDev = process.env.NODE_ENV !== 'production';
        if (!isDev && !await isAdmin(request)) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 403 });
        }
        const body = await request.json();
        const { year, month, goalAmount, description } = body;
        if (!year || !month || !goalAmount) {
            return NextResponse.json({ success: false, error: 'Dados incompletos' }, { status: 400 });
        }
        // Em dev, usar um valor mock
        let userId = 'dev-user';
        if (!isDev) {
            const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value, options));
                    },
                },
            });
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
            }
            userId = user.id;
        }
        console.log('[API] Salvando meta:', { year, month, goalAmount, description, userId });
        const { data, error } = await supabase
            .from('monthly_goals')
            .upsert({
            year,
            month,
            goal_amount: goalAmount,
            description,
            created_by: userId,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'year,month'
        })
            .select()
            .single();
        if (error)
            throw error;
        return NextResponse.json({
            success: true,
            goal: data
        });
    }
    catch (error) {
        console.error('💥 Erro ao salvar meta:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
export async function DELETE(request) {
    try {
        // Verificar permissões
        if (!await isAdmin(request)) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 403 });
        }
        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get('year') || '');
        const month = parseInt(searchParams.get('month') || '');
        if (!year || !month) {
            return NextResponse.json({ success: false, error: 'Ano e mês são obrigatórios' }, { status: 400 });
        }
        const { error } = await supabase
            .from('monthly_goals')
            .delete()
            .eq('year', year)
            .eq('month', month);
        if (error)
            throw error;
        return NextResponse.json({
            success: true
        });
    }
    catch (error) {
        console.error('💥 Erro ao deletar meta:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
