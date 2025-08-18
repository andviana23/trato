import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log("🔧 Usando credenciais de admin para inserir dados...\n");

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

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log("📋 Credenciais:");
console.log("URL:", supabaseUrl ? "✅" : "❌");
console.log("Service Key:", serviceKey ? "✅" : "❌");

if (!serviceKey) {
  console.log("\n❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env.local");
  console.log(
    "💡 Adicione a service role key do Supabase ao arquivo .env.local"
  );
  process.exit(1);
}

// Usar service key (bypass RLS)
const supabase = createClient(supabaseUrl, serviceKey);

const clientes = [
  {
    nome: "João Silva",
    email: "joao.silva@email.com",
    telefone: "(11) 99999-1111",
    unidade: "Trato de Barbados",
  },
  {
    nome: "Maria Santos",
    email: "maria.santos@email.com",
    telefone: "(11) 99999-2222",
    unidade: "Trato de Barbados",
  },
  {
    nome: "Pedro Oliveira",
    email: "pedro.oliveira@email.com",
    telefone: "(11) 99999-3333",
    unidade: "BARBER BEER SPORT CLUB",
  },
  {
    nome: "Ana Costa",
    email: "ana.costa@email.com",
    telefone: "(11) 99999-4444",
    unidade: "BARBER BEER SPORT CLUB",
  },
  {
    nome: "Carlos Mendes",
    email: "carlos.mendes@email.com",
    telefone: "(11) 99999-5555",
    unidade: "Trato de Barbados",
  },
  {
    nome: "Fernanda Lima",
    email: "fernanda.lima@email.com",
    telefone: "(11) 99999-6666",
    unidade: "BARBER BEER SPORT CLUB",
  },
];

async function inserirComAdmin() {
  try {
    console.log("🔍 Verificando estado atual...");

    const { data: existentes, error: checkError } = await supabase
      .from("clientes")
      .select("*");

    console.log("Clientes existentes:", existentes?.length || 0);

    if (checkError) {
      console.log("❌ Erro ao verificar:", checkError.message);
      return;
    }

    console.log("\n📝 Inserindo clientes...");

    const { data: inseridos, error: insertError } = await supabase
      .from("clientes")
      .insert(clientes)
      .select();

    if (insertError) {
      console.log("❌ Erro ao inserir:", insertError.message);

      // Tentar inserir um por um
      console.log("\n🔄 Tentando inserção individual...");
      for (const cliente of clientes) {
        const { data, error } = await supabase
          .from("clientes")
          .insert([cliente])
          .select();

        if (error) {
          console.log(`❌ ${cliente.nome}:`, error.message);
        } else {
          console.log(`✅ ${cliente.nome} inserido`);
        }
      }
    } else {
      console.log(`✅ ${inseridos?.length || 0} clientes inseridos!`);
    }

    // Verificar resultado final
    console.log("\n📊 Estado final:");
    const { data: final, error: finalError } = await supabase
      .from("clientes")
      .select("nome, unidade")
      .order("unidade, nome");

    if (finalError) {
      console.log("❌ Erro na verificação final:", finalError.message);
    } else {
      console.log(`📋 Total: ${final?.length || 0} clientes`);

      const porUnidade = {};
      final?.forEach((c) => {
        if (!porUnidade[c.unidade]) porUnidade[c.unidade] = [];
        porUnidade[c.unidade].push(c.nome);
      });

      Object.entries(porUnidade).forEach(([unidade, nomes]) => {
        console.log(`\n${unidade}:`);
        nomes.forEach((nome) => console.log(`  - ${nome}`));
      });
    }

    console.log("\n🎉 Processo concluído!");
  } catch (error) {
    console.log("❌ Erro:", error.message);
  }
}

inserirComAdmin();










