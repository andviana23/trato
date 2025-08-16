import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Ler .env.local
const envPath = join(__dirname, "..", ".env.local");
const envContent = readFileSync(envPath, "utf8");
const envVars = {};

envContent.split("\n").forEach((line) => {
  if (line.includes("=") && !line.startsWith("#")) {
    const [key, value] = line.split("=");
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function verificarConstraints() {
  console.log("🔍 Analisando clientes existentes...\n");

  try {
    // Buscar todos os clientes
    const { data: clientes, error } = await supabase
      .from("clientes")
      .select("nome, unidade, telefone")
      .order("unidade, nome");

    if (error) {
      console.log("❌ Erro:", error.message);
      return;
    }

    console.log(`📊 Total de clientes: ${clientes.length}`);

    // Analisar valores únicos de unidade
    const unidadesUnicas = [...new Set(clientes.map((c) => c.unidade))];
    console.log("\n📋 Unidades encontradas:");
    unidadesUnicas.forEach((unidade, i) => {
      const count = clientes.filter((c) => c.unidade === unidade).length;
      console.log(`  ${i + 1}. "${unidade}" (${count} clientes)`);
    });

    // Listar todos os clientes por unidade
    console.log("\n👥 Clientes por unidade:");
    unidadesUnicas.forEach((unidade) => {
      console.log(`\n📍 ${unidade}:`);
      const clientesUnidade = clientes.filter((c) => c.unidade === unidade);
      clientesUnidade.forEach((cliente, i) => {
        console.log(
          `  ${i + 1}. ${cliente.nome} - ${cliente.telefone || "Sem telefone"}`
        );
      });
    });

    console.log("\n💡 Para adicionar novos clientes, use exatamente:");
    unidadesUnicas.forEach((unidade) => {
      console.log(`  - "${unidade}"`);
    });

    // Testar inserção com valor correto
    console.log("\n🧪 Testando inserção com valores corretos...");
    const { data: teste, error: erroTeste } = await supabase
      .from("clientes")
      .insert([
        {
          nome: "Cliente Teste Novo",
          telefone: "(11) 99999-9999",
          unidade: "trato", // Usando o valor que já existe
        },
      ])
      .select();

    if (erroTeste) {
      console.log("❌ Erro no teste:", erroTeste.message);
    } else {
      console.log("✅ Teste de inserção funcionou!");

      // Remover o teste
      if (teste && teste.length > 0) {
        await supabase.from("clientes").delete().eq("id", teste[0].id);
        console.log("🗑️ Cliente de teste removido");
      }
    }
  } catch (error) {
    console.log("❌ Erro:", error.message);
  }
}

verificarConstraints();









