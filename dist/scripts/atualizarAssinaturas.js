import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from "../lib/supabase/client";
async function atualizarAssinaturas() {
    // Busca todas as assinaturas
    const supabase = createClient();
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
            console.error(`Erro ao buscar cliente ${assinatura.cliente_id}:`, errorCliente);
            continue;
        }
        // Atualiza o nome do cliente na assinatura
        const updates = { nome_cliente: (cliente === null || cliente === void 0 ? void 0 : cliente.nome) || null };
        // Lógica de status
        let novoStatus = assinatura.status;
        const agora = new Date();
        const dataPagamento = assinatura.updated_at
            ? new Date(assinatura.updated_at)
            : null;
        if (assinatura.status === "CONFIRMED" && dataPagamento) {
            // Se passaram 30 dias do pagamento, volta para aguardando pagamento
            const diffDias = Math.floor((agora.getTime() - dataPagamento.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDias >= 30) {
                novoStatus = "AGUARDANDO PAGAMENTO";
            }
        }
        else if (assinatura.status !== "CONFIRMED") {
            novoStatus = "AGUARDANDO PAGAMENTO";
        }
        updates.status = novoStatus;
        // Atualiza a assinatura
        const { error: errorUpdate } = await supabase
            .from("assinaturas")
            .update(updates)
            .eq("id", assinatura.id);
        if (errorUpdate) {
            console.error(`Erro ao atualizar assinatura ${assinatura.id}:`, errorUpdate);
        }
        else {
            console.log(`Assinatura ${assinatura.id} atualizada:`, updates);
        }
    }
}
atualizarAssinaturas();
