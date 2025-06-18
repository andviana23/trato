import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { nome, email, funcao, senha, telefone, data_nascimento } = await req.json();
    if (!nome || !email || !funcao || !senha || !telefone) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 });
    }
    // 1. Cria usuário no Auth
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        full_name: nome,
        role: funcao,
        telefone: telefone
      }
    });
    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }
    // 2. Salva profissional na tabela
    const { data: profData, error: profError } = await supabase
      .from('profissionais')
      .insert([{
        nome,
        email,
        funcao,
        telefone,
        data_nascimento: data_nascimento || null,
        user_id: userData.user.id
      }])
      .select();
    if (profError) {
      return NextResponse.json({ error: profError.message }, { status: 400 });
    }
    return NextResponse.json({ success: true, profissional: profData[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro inesperado.' }, { status: 500 });
  }
} 