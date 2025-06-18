import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Verificar se o usuário é admin
async function isAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return false

  // Permitir admin por e-mail direto
  const adminEmails = [
    'admin@tratodebarbados.com',
    'admin@barbearia.com'
  ];
  if (adminEmails.includes(session.user.email)) return true;

  // Buscar role no Supabase
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .single()

  // Permitir admin, barbershop_owner
  if (userRole?.role === 'admin' || userRole?.role === 'barbershop_owner') return true;

  // Permitir roles para uso futuro
  if (userRole?.role === 'recepcao' || userRole?.role === 'barbeiro') return false;

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

export async function POST(request: NextRequest) {
  try {
    // Permitir sem autenticação em desenvolvimento
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev && !await isAdmin()) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { year, month, goalAmount, description } = body

    if (!year || !month || !goalAmount) {
      return NextResponse.json(
        { success: false, error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Em dev, usar um valor mock
    let userId = 'dev-user';
    if (!isDev) {
      const session = await getServerSession(authOptions)
      if (!session?.user) {
        return NextResponse.json(
          { success: false, error: 'Não autenticado' },
          { status: 401 }
        )
      }
      userId = session.user.id;
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
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      goal: data
    })

  } catch (error) {
    console.error('💥 Erro ao salvar meta:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verificar permissões
    if (!await isAdmin()) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || '')
    const month = parseInt(searchParams.get('month') || '')

    if (!year || !month) {
      return NextResponse.json(
        { success: false, error: 'Ano e mês são obrigatórios' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('monthly_goals')
      .delete()
      .eq('year', year)
      .eq('month', month)

    if (error) throw error

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('💥 Erro ao deletar meta:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
} 