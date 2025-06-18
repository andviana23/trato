import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const ASAAS_API_URL = "https://www.asaas.com/api/v3";
const ASAAS_API_KEY = process.env.ASAAS_TRATO_API_KEY;

async function consultarCliente(email: string, telefone: string) {
  const url = `${ASAAS_API_URL}/customers?email=${encodeURIComponent(email)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "access_token": ASAAS_API_KEY as string,
    },
  });
  const data = await response.json();
  return data.data?.length > 0 ? data.data[0].id : null;
}

async function criarCliente(dadosCliente: any) {
  const payload = {
    name: dadosCliente.nome,
    email: dadosCliente.email,
    mobilePhone: dadosCliente.telefone,
    cpfCnpj: dadosCliente.cpf_cnpj,
  };
  const response = await fetch(`${ASAAS_API_URL}/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "access_token": ASAAS_API_KEY as string,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  return data.id;
}

async function obterOuCriarCliente(dadosCliente: any) {
  let customerId = await consultarCliente(dadosCliente.email, dadosCliente.telefone);
  if (!customerId) {
    customerId = await criarCliente(dadosCliente);
  }
  return customerId;
}

async function criarAssinaturaAsaas(customerId: string, dadosAssinatura: any) {
  const payload = {
    customer: customerId,
    billingType: "CREDIT_CARD",
    value: dadosAssinatura.valor,
    nextDueDate: dadosAssinatura.proximaCobranca,
    cycle: "MONTHLY",
    description: dadosAssinatura.descricao,
    discount: {
      value: dadosAssinatura.desconto || 0,
      dueDateLimitDays: 10,
      type: "PERCENTAGE",
    },
    fine: {
      value: 2,
      type: "PERCENTAGE",
    },
    interest: {
      value: 1,
      type: "PERCENTAGE",
    },
  };
  const response = await fetch(`${ASAAS_API_URL}/subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "access_token": ASAAS_API_KEY as string,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  return data;
}

async function obterLinkPrimeiraCobranca(subscriptionId: string) {
  const response = await fetch(`${ASAAS_API_URL}/subscriptions/${subscriptionId}/payments`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "access_token": ASAAS_API_KEY as string,
    },
  });
  const data = await response.json();
  if (data.data && data.data.length > 0) {
    return data.data[0].invoiceUrl;
  }
  return null;
}

async function salvarAssinaturaLocal(clienteId: string, assinaturaAsaasId: string, customerAsaasId: string, dadosAssinatura: any) {
  const { data, error } = await supabase
    .from("subscriptions")
    .insert([
      {
        client_id: clienteId,
        asaas_subscription_id: assinaturaAsaasId,
        asaas_customer_id: customerAsaasId,
        status: "active",
        plan_name: dadosAssinatura.descricao,
        price: dadosAssinatura.valor,
        payment_method: "asaas",
        barbershop_id: "41abae7d-ac5f-410f-a2e8-9c027a25d60d",
        current_period_start: new Date().toISOString().split("T")[0],
        current_period_end: dadosAssinatura.proximaCobranca,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  if (error) throw error;
  return data;
}

export async function processarAssinatura(dadosCliente: any, dadosPlano: any) {
  try {
    // 1. Obter ou criar cliente no Asaas
    const customerId = await obterOuCriarCliente(dadosCliente);

    // 2. Preparar dados da assinatura
    const dadosAssinatura = {
      valor: dadosPlano.valor,
      proximaCobranca: dadosPlano.dataVencimento,
      descricao: `${dadosPlano.nome} - ${dadosPlano.barbearia}`,
      desconto: dadosPlano.desconto || 0,
    };

    // 3. Criar assinatura no Asaas
    const assinatura = await criarAssinaturaAsaas(customerId, dadosAssinatura);

    // 4. Obter link da primeira cobrança
    const linkPagamento = await obterLinkPrimeiraCobranca(assinatura.id);

    // 5. Salvar no banco local
    await salvarAssinaturaLocal(dadosCliente.id, assinatura.id, customerId, dadosAssinatura);

    // 6. Retornar dados
    return {
      success: true,
      assinaturaId: assinatura.id,
      linkPagamento,
      customerId,
      valor: assinatura.value,
      proximaCobranca: assinatura.nextDueDate,
    };
  } catch (error: any) {
    console.error("Erro ao processar assinatura:", error);
    return {
      success: false,
      error: error.message || error,
    };
  }
}

// Nova função para cancelar assinatura no Asaas
export async function cancelarAssinaturaAsaas(subscriptionId: string) {
  try {
    const response = await fetch(`${ASAAS_API_URL}/subscriptions/${subscriptionId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_API_KEY as string,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erro ao cancelar assinatura no Asaas");
    }

    // Atualizar status no banco local
    const { error } = await supabase
      .from("subscriptions")
      .update({ 
        status: "CANCELADA",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("asaas_subscription_id", subscriptionId);

    if (error) {
      console.error("Erro ao atualizar status no banco:", error);
      // Não falhar se não conseguir atualizar o banco local
    }

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao cancelar assinatura:", error);
    return {
      success: false,
      error: error.message || "Erro ao cancelar assinatura",
    };
  }
}

// Nova função para obter link de pagamento pendente
export async function obterLinkPagamentoPendente(subscriptionId: string) {
  try {
    const response = await fetch(`${ASAAS_API_URL}/subscriptions/${subscriptionId}/payments?status=PENDING`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_API_KEY as string,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erro ao buscar pagamentos pendentes");
    }

    const data = await response.json();
    
    // Retornar link da próxima cobrança pendente
    if (data.data && data.data.length > 0) {
      const proximaCobranca = data.data[0];
      return {
        success: true,
        linkPagamento: proximaCobranca.invoiceUrl,
        dataVencimento: proximaCobranca.dueDate,
        valor: proximaCobranca.value,
      };
    }
    
    return {
      success: false,
      error: "Nenhum pagamento pendente encontrado",
    };
  } catch (error: any) {
    console.error("Erro ao obter link de pagamento:", error);
    return {
      success: false,
      error: error.message || "Erro ao obter link de pagamento",
    };
  }
} 