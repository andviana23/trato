import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log("🔍 Debug detalhado da função getClientesByUnidade...\n");

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

async function debugClientes() {
  try {
    console.log("1️⃣ Teste 1: Buscar TODOS os clientes (sem filtro)");
    const { data: todos, error: errorTodos } = await supabase
      .from("clientes")
      .select("id, nome, unidade, telefone");

    console.log("Resultado:", {
      data: todos?.length || 0,
      error: errorTodos?.message || "Nenhum",
    });

    if (todos && todos.length > 0) {
      console.log("📋 Primeiros 3 clientes:");
      todos.slice(0, 3).forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.nome} - unidade: "${c.unidade}"`);
      });
    }

    console.log('\n2️⃣ Teste 2: Buscar clientes com filtro exato "trato"');
    const { data: trato, error: errorTrato } = await supabase
      .from("clientes")
      .select("id, nome, unidade, telefone")
      .eq("unidade", "trato");

    console.log("Resultado:", {
      data: trato?.length || 0,
      error: errorTrato?.message || "Nenhum",
    });

    console.log('\n3️⃣ Teste 3: Buscar clientes com filtro exato "barberbeer"');
    const { data: barberbeer, error: errorBarberbeer } = await supabase
      .from("clientes")
      .select("id, nome, unidade, telefone")
      .eq("unidade", "barberbeer");

    console.log("Resultado:", {
      data: barberbeer?.length || 0,
      error: errorBarberbeer?.message || "Nenhum",
    });

    console.log("\n4️⃣ Teste 4: Verificar valores únicos de unidade");
    const { data: unidades, error: errorUnidades } = await supabase
      .from("clientes")
      .select("unidade");

    if (!errorUnidades && unidades) {
      const valoresUnicos = [...new Set(unidades.map((u) => u.unidade))];
      console.log("Valores únicos de unidade:", valoresUnicos);

      // Contar por unidade
      const contagem = {};
      unidades.forEach((u) => {
        contagem[u.unidade] = (contagem[u.unidade] || 0) + 1;
      });

      console.log("Contagem por unidade:", contagem);
    }

    console.log("\n5️⃣ Teste 5: Simular a função getClientesByUnidade");

    // Simular exatamente o que a função faz
    const unidadeNome = "Trato de Barbados";
    console.log(`Testando com: "${unidadeNome}"`);

    let unidadeDB = unidadeNome.toLowerCase();
    if (unidadeNome.includes("TRATO") || unidadeNome.includes("BARBADOS")) {
      unidadeDB = "trato";
    } else if (unidadeNome.includes("BARBER") || unidadeNome.includes("BEER")) {
      unidadeDB = "barberbeer";
    }

    console.log(`Mapeado para: "${unidadeDB}"`);

    const { data: resultado, error: errorResultado } = await supabase
      .from("clientes")
      .select("id, nome, telefone")
      .eq("unidade", unidadeDB);

    console.log("Resultado final:", {
      data: resultado?.length || 0,
      error: errorResultado?.message || "Nenhum",
    });

    if (resultado && resultado.length > 0) {
      console.log("📋 Clientes encontrados:");
      resultado.forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.nome} - ${c.telefone || "Sem telefone"}`);
      });
    }
  } catch (error) {
    console.log("❌ Erro:", error.message);
  }
}

debugClientes();










