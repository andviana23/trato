import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Instancia o client do Supabase com a service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rota para redefinir senha de um usuário pelo user_id
export async function POST(req: NextRequest) {
  try {
    const { user_id, novaSenha } = await req.json();
    if (!user_id || !novaSenha) {
      return NextResponse.json({ error: 'user_id e novaSenha são obrigatórios.' }, { status: 400 });
    }
    // Atualiza a senha do usuário no Auth
    const { error } = await supabase.auth.admin.updateUser(user_id, { password: novaSenha });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro inesperado.' }, { status: 500 });
  }
}