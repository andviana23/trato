import { NextResponse } from 'next/server';
export async function GET() {
    const apiKey = process.env.ASAAS_TRATO_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Chave ASAAS_TRATO_API_KEY não encontrada' }, { status: 400 });
    }
    const response = await fetch('https://www.asaas.com/api/v3/myAccount', {
        headers: {
            'access_token': apiKey,
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    return NextResponse.json(data);
}
