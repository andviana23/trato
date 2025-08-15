import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const appointmentId = params.id;
    const body = await request.json();
    const channel = body.channel || 'whatsapp';
    
    // Chamar a função do banco para agendar notificações
    const { error } = await supabase.rpc('schedule_appointment_notifications', {
      p_appointment_id: appointmentId,
      p_channel: channel
    });
    
    if (error) {
      console.error('Erro ao agendar notificações:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notificações agendadas com sucesso' 
    });
    
  } catch (error) {
    console.error('Erro no endpoint de notificações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
}
