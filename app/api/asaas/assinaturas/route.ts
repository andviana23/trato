import { NextRequest, NextResponse } from 'next/server';
import { processarAssinatura } from '@/lib/services/asaas/asaasService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dadosCliente, dadosPlano } = body;
    const resultado = await processarAssinatura(dadosCliente, dadosPlano);
    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || error }, { status: 500 });
  }
} 