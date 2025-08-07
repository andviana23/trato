import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";

// Config das variáveis
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use a service key para update
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function atualizarAssinaturas() {
  const { data: assinaturas, error } = await supabase
    .from("assinaturas")
    .select("*");
  if (error) {
    console.error("Erro ao buscar assinaturas:", error);
    return;
  }

  for (const assinatura of assinaturas) {
    // Busca o nome do cliente
    const { data: cliente, error: errorCliente } = await supabase
      .from("clientes")
      .select("nome")
      .eq("id", assinatura.cliente_id)
      .single();

    if (errorCliente) {
      console.error(
        `Erro ao buscar cliente ${assinatura.cliente_id}:`,
        errorCliente
      );
      continue;
    }

    // Atualiza o nome do cliente na assinatura
    const updates = { nome_cliente: cliente?.nome || null };

    // Lógica de status
    let novoStatus = assinatura.status;
    const agora = new Date();
    const dataPagamento = assinatura.updated_at
      ? new Date(assinatura.updated_at)
      : null;

    if (assinatura.status === "CONFIRMED" && dataPagamento) {
      const diffDias = Math.floor(
        (agora.getTime() - dataPagamento.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDias >= 30) {
        novoStatus = "AGUARDANDO PAGAMENTO";
      }
    } else if (assinatura.status !== "CONFIRMED") {
      novoStatus = "AGUARDANDO PAGAMENTO";
    }

    updates.status = novoStatus;

    // Atualiza a assinatura
    const { error: errorUpdate } = await supabase
      .from("assinaturas")
      .update(updates)
      .eq("id", assinatura.id);

    if (errorUpdate) {
      console.error(
        `Erro ao atualizar assinatura ${assinatura.id}:`,
        errorUpdate
      );
    } else {
      console.log(`Assinatura ${assinatura.id} atualizada:`, updates);
    }
  }
}

atualizarAssinaturas().catch(console.error);
