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
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testeSimples() {
  console.log("🧪 Teste simples de inserção...\n");

  try {
    // Primeiro, verificar se a tabela existe e está acessível
    console.log("1️⃣ Testando acesso à tabela...");
    const { data: test, error: testError } = await supabase
      .from("clientes")
      .select("count")
      .single();

    console.log("Resultado do teste:", { data: test, error: testError });

    // Tentar inserir apenas um cliente
    console.log("\n2️⃣ Inserindo um cliente de teste...");
    const { data: insertData, error: insertError } = await supabase
      .from("clientes")
      .insert([
        {
          nome: "Cliente Teste",
          telefone: "(11) 99999-0000",
          unidade: "Trato de Barbados",
        },
      ])
      .select();

    console.log("Resultado da inserção:", {
      data: insertData,
      error: insertError,
    });

    // Verificar se foi inserido
    console.log("\n3️⃣ Verificando se foi inserido...");
    const { data: checkData, error: checkError } = await supabase
      .from("clientes")
      .select("*")
      .eq("nome", "Cliente Teste");

    console.log("Resultado da verificação:", {
      data: checkData,
      error: checkError,
    });

    // Tentar buscar todos os clientes
    console.log("\n4️⃣ Buscando todos os clientes...");
    const { data: allData, error: allError } = await supabase
      .from("clientes")
      .select("*");

    console.log("Todos os clientes:", { data: allData, error: allError });
  } catch (error) {
    console.log("❌ Erro:", error.message);
  }
}

testeSimples();









