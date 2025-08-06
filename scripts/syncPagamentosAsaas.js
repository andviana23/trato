import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import axios from "axios";
import { createClient } from "@supabase/supabase-js";

// Config das variáveis
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
let ASAAS_API_KEY = process.env.ASAAS_TRATO_API_KEY || "";
if (ASAAS_API_KEY.startsWith("\\")) {
  ASAAS_API_KEY = ASAAS_API_KEY.slice(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ASAAS_BASE_URL = "https://www.asaas.com/api/v3";

// Período para buscar os pagamentos
const startDate = "2024-08-01";
const endDate = "2024-08-31";
const LIMIT = 50; // Limite máximo da API do Asaas

async function fetchPagamentosConfirmados() {
  let page = 0;
  let allPayments = [];
  let totalCount = 0;
  do {
    const url = `${ASAAS_BASE_URL}/payments?status=CONFIRMED&paymentDate[gte]=${startDate}&paymentDate[lte]=${endDate}&limit=${LIMIT}&offset=${
      page * LIMIT
    }`;
    const { data } = await axios.get(url, {
      headers: { access_token: ASAAS_API_KEY },
    });

    if (data && data.data) {
      allPayments.push(...data.data);
      totalCount = data.totalCount || 0;
      page++;
      if (data.data.length < LIMIT) break; // Sai do loop se não vier página cheia
    } else {
      break;
    }
  } while (allPayments.length < totalCount);

  return allPayments;
}

async function fetchCliente(customerId) {
  try {
    const url = `${ASAAS_BASE_URL}/customers/${customerId}`;
    const { data } = await axios.get(url, {
      headers: { access_token: ASAAS_API_KEY },
    });
    return data;
  } catch {
    console.warn("Erro ao buscar cliente:", customerId);
    return { name: "Desconhecido", email: "" };
  }
}

async function sync() {
  console.log("Buscando pagamentos confirmados do Asaas...");
  const pagamentos = await fetchPagamentosConfirmados();
  console.log(`Total de pagamentos encontrados: ${pagamentos.length}`);

  for (const pagamento of pagamentos) {
    const cliente = await fetchCliente(pagamento.customer);
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

    // Upsert no Supabase
    const { error } = await supabase.from("pagamentos_asaas").upsert(
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
      { onConflict: ["payment_id"] }
    );

    if (error) {
      console.error("Erro ao salvar pagamento:", pagamento.id, error.message);
    } else {
      console.log(`Sincronizado pagamento ${pagamento.id} - ${cliente.name}`);
    }
  }
  console.log("Sincronização concluída!");
}

sync().catch(console.error);
