import { NextRequest, NextResponse } from 'next/server';
import { cancelarAssinaturaAsaas } from '@/lib/services/asaas/asaasService';

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'ID da assinatura é obrigatório' },
        { status: 400 }
      );
    }

    const resultado = await cancelarAssinaturaAsaas(subscriptionId);

    if (resultado.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: resultado.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Erro na API de cancelar assinatura:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 