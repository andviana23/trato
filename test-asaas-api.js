// Script para testar as APIs ASAAS
require("dotenv").config({ path: ".env.local" });

const ASAAS_TRATO_API_KEY = process.env.ASAAS_TRATO_API_KEY;

console.log("=== Teste de API ASAAS ===\n");

// Função para testar uma API
async function testAsaasAPI(apiName, apiKey) {
  console.log(`\n📋 Testando ${apiName}...`);
  console.log(
    `API Key: ${apiKey ? apiKey.substring(0, 20) + "..." : "NÃO DEFINIDA"}`
  );

  if (!apiKey) {
    console.log("❌ API Key não está definida!");
    return;
  }

  try {
    // Teste 1: Buscar clientes
    console.log("\n1️⃣ Buscando clientes...");
    const customersResponse = await fetch(
      "https://www.asaas.com/api/v3/customers?limit=5",
      {
        headers: {
          access_token: apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (customersResponse.ok) {
      const customersData = await customersResponse.json();
      console.log(
        `✅ Clientes encontrados: ${
          customersData.totalCount || customersData.data?.length || 0
        }`
      );
      if (customersData.data && customersData.data.length > 0) {
        console.log(
          `   Exemplo: ${
            customersData.data[0].name || customersData.data[0].email
          }`
        );
      }
    } else {
      console.log(
        `❌ Erro ao buscar clientes: ${customersResponse.status} - ${customersResponse.statusText}`
      );
      const errorText = await customersResponse.text();
      console.log(`   Detalhes: ${errorText.substring(0, 200)}`);
    }

    // Teste 2: Buscar pagamentos
    console.log("\n2️⃣ Buscando pagamentos confirmados...");
    const paymentsResponse = await fetch(
      "https://www.asaas.com/api/v3/payments?status=CONFIRMED&limit=5",
      {
        headers: {
          access_token: apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (paymentsResponse.ok) {
      const paymentsData = await paymentsResponse.json();
      console.log(
        `✅ Pagamentos encontrados: ${
          paymentsData.totalCount || paymentsData.data?.length || 0
        }`
      );
      if (paymentsData.data && paymentsData.data.length > 0) {
        console.log(`   Valor do primeiro: R$ ${paymentsData.data[0].value}`);
      }
    } else {
      console.log(
        `❌ Erro ao buscar pagamentos: ${paymentsResponse.status} - ${paymentsResponse.statusText}`
      );
      const errorText = await paymentsResponse.text();
      console.log(`   Detalhes: ${errorText.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`❌ Erro de conexão: ${error.message}`);
  }
}

// Executar testes
async function runTests() {
  await testAsaasAPI("ASAAS Trato", ASAAS_TRATO_API_KEY);
  console.log("\n✅ Teste concluído!");
}

runTests();
