import { NextResponse } from 'next/server';
export async function GET() {
    var _a;
    console.log('🧪 Testando ASAAS...');
    console.log('🔑 API Key:', (_a = process.env.ASAAS_TRATO_API_KEY) === null || _a === void 0 ? void 0 : _a.substring(0, 20));
    try {
        const response = await fetch('https://www.asaas.com/api/v3/myAccount', {
            method: 'GET',
            headers: {
                'access_token': process.env.ASAAS_TRATO_API_KEY,
                'Content-Type': 'application/json',
                'User-Agent': 'Barbearia-System/1.0'
            }
        });
        console.log('📡 Status:', response.status);
        console.log('📡 Headers:', Object.fromEntries(response.headers.entries()));
        const data = await response.text();
        console.log('📊 Response:', data);
        return NextResponse.json({
            status: response.status,
            ok: response.ok,
            data: data,
            headers: Object.fromEntries(response.headers.entries())
        });
    }
    catch (error) {
        console.error('💥 Erro:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
