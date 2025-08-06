import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// Utilitário para extrair o mês de referência no formato YYYY-MM
function getMesReferencia(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// GET: Lista todos os lançamentos do mês de referência e unidade
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes'); // formato 'YYYY-MM'
    const unidade = searchParams.get('unidade');
    if (!mes) {
      return NextResponse.json({ success: false, error: 'Parâmetro mes é obrigatório.' }, { status: 400 });
    }
    if (!unidade) {
      return NextResponse.json({ success: false, error: 'Parâmetro unidade é obrigatório.' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('faturamento_assinatura')
      .select('*')
      .eq('mes_referencia', mes)
      .eq('unidade', unidade)
      .order('data', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Adiciona um novo lançamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { valor, descricao, data, unidade } = body;
    if (!valor || !data || !unidade) {
      return NextResponse.json({ success: false, error: 'Valor, data e unidade são obrigatórios.' }, { status: 400 });
    }
    const mes_referencia = getMesReferencia(data);
    const { data: inserted, error } = await supabase
      .from('faturamento_assinatura')
      .insert([{ valor, descricao, data, mes_referencia, unidade }])
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, data: inserted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove um lançamento pelo id
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Parâmetro id é obrigatório.' }, { status: 400 });
    }
    const { error } = await supabase
      .from('faturamento_assinatura')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 