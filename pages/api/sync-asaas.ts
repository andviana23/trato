console.log('DEBUG VAR:', process.env.ASAAS_TRATO_API_KEY);
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ASAAS_API_KEY = process.env.ASAAS_TRATO_API_KEY!;
const ASAAS_BASE_URL = "https://www.asaas.com/api/v3";

if (ASAAS_API_KEY) {
  const mask = (str: string) => str ? str.slice(0, 4) + '...' + str.slice(-4) : '';
  console.log('ASAAS_API_KEY carregada (parcial):', mask(ASAAS_API_KEY));
} else {
  console.log('ASAAS_API_KEY NÃO DEFINIDA!');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!ASAAS_API_KEY) {
    return res.status(401).json({ success: false, error: 'Chave de API do Asaas não configurada no backend.' });
  }
  try {
    const hoje = new Date();
    const startDate = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;
    const endDate = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;

    const url = `${ASAAS_BASE_URL}/payments?status=CONFIRMED&paymentDate[gte]=${startDate}&paymentDate[lte]=${endDate}&limit=100`;
    const { data } = await axios.get(url, {
      headers: { access_token: ASAAS_API_KEY },
    });
    const pagamentos = data.data || [];

    for (const pagamento of pagamentos) {
      const clienteUrl = `${ASAAS_BASE_URL}/customers/${pagamento.customer}`;
      const { data: cliente } = await axios.get(clienteUrl, {
        headers: { access_token: ASAAS_API_KEY },
      });
      const paymentDate =
        pagamento.paymentDate ||
        pagamento.effectiveDate ||
        pagamento.confirmedDate ||
        pagamento.dueDate;
      let nextDueDate = null;
      if (paymentDate) {
        const dt = new Date(paymentDate);
        dt.setDate(dt.getDate() + 30);
        nextDueDate = dt.toISOString().split("T")[0];
      }
      await supabase.from("pagamentos_asaas").upsert(
        [
          {
            payment_id: pagamento.id,
            customer_id: pagamento.customer,
            customer_name: cliente.name,
            customer_email: cliente.email,
            plano: pagamento.description,
            valor: pagamento.value,
            status: pagamento.status,
            payment_date: paymentDate,
            next_due_date: nextDueDate,
            billing_type: pagamento.billingType,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "payment_id" }
      );
    }
    res.status(200).json({ success: true, message: "Sincronização concluída!" });
  } catch (error: unknown) {
    let status = 500;
    let msg = 'Erro desconhecido';
    let details = undefined;
    if (typeof error === 'object' && error !== null) {
      // @ts-expect-error: AxiosError pode ter response.status não tipado
      status = (error.response && error.response.status) ? error.response.status : 500;
      // @ts-expect-error: AxiosError pode ter message não tipado
      msg = error.message || msg;
      // @ts-expect-error: AxiosError pode ter response.status não tipado
      if (status === 401) msg = 'Chave de API do Asaas inválida ou permissão insuficiente.';
      // @ts-expect-error: AxiosError pode ter response.data não tipado
      details = error.response?.data;
    }
    res.status(status).json({ success: false, error: msg, details });
  }
}