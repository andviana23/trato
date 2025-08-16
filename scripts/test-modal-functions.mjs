import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log("🧪 Testando funções do modal de agendamento...\n");

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

// Simular as funções do modal
async function getClientesByUnidade(unidadeNome) {
  console.log(`🔍 Testando getClientesByUnidade("${unidadeNome}")...`);

  const query = supabase.from("clientes").select("id, nome, telefone");

  // Mapear nomes de unidade para valores do banco
  if (unidadeNome) {
    let unidadeDB = unidadeNome.toLowerCase();
    if (unidadeNome.includes("TRATO") || unidadeNome.includes("BARBADOS")) {
      unidadeDB = "trato";
    } else if (unidadeNome.includes("BARBER") || unidadeNome.includes("BEER")) {
      unidadeDB = "barberbeer";
    }
    console.log(`  Mapeado para: "${unidadeDB}"`);
    query.eq("unidade", unidadeDB);
  }

  const { data, error } = await query;

  if (error) {
    console.log(`  ❌ Erro:`, error.message);
    return [];
  }

  const clientes = (data || []).map((c) => ({
    id: c.id,
    nome: c.nome,
    telefone: c.telefone,
  }));

  console.log(`  ✅ ${clientes.length} clientes encontrados`);
  clientes.forEach((c, i) => {
    console.log(`    ${i + 1}. ${c.nome} - ${c.telefone || "Sem telefone"}`);
  });

  return clientes;
}

async function testarModal() {
  try {
    // Testar com diferentes nomes de unidade
    const unidadesTeste = [
      "Trato de Barbados",
      "BARBER BEER SPORT CLUB",
      "trato",
      "barberbeer",
    ];

    for (const unidade of unidadesTeste) {
      console.log(`\n${"=".repeat(50)}`);
      await getClientesByUnidade(unidade);
    }

    console.log(`\n${"=".repeat(50)}`);
    console.log("\n🎉 Teste das funções concluído!");

    console.log("\n💡 Próximos passos:");
    console.log("1. Inicie o servidor: npm run dev");
    console.log("2. Abra o modal de agendamento");
    console.log("3. Verifique se os clientes aparecem no dropdown");
    console.log("4. Teste a troca de unidade no seletor");
  } catch (error) {
    console.log("❌ Erro:", error.message);
  }
}

testarModal();









