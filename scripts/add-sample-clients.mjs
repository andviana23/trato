import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log("📝 Adicionando clientes de exemplo...\n");

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

const clientesExemplo = [
  {
    nome: "João Silva",
    email: "joao.silva@email.com",
    telefone: "(11) 99999-1111",
    unidade: "Trato de Barbados",
    cpf_cnpj: "123.456.789-00",
    endereco: "Rua A, 123 - São Paulo, SP",
  },
  {
    nome: "Maria Santos",
    email: "maria.santos@email.com",
    telefone: "(11) 99999-2222",
    unidade: "Trato de Barbados",
    cpf_cnpj: "234.567.890-11",
    endereco: "Rua B, 456 - São Paulo, SP",
  },
  {
    nome: "Pedro Oliveira",
    email: "pedro.oliveira@email.com",
    telefone: "(11) 99999-3333",
    unidade: "BARBER BEER SPORT CLUB",
    cpf_cnpj: "345.678.901-22",
    endereco: "Rua C, 789 - São Paulo, SP",
  },
  {
    nome: "Ana Costa",
    email: "ana.costa@email.com",
    telefone: "(11) 99999-4444",
    unidade: "BARBER BEER SPORT CLUB",
    cpf_cnpj: "456.789.012-33",
    endereco: "Rua D, 321 - São Paulo, SP",
  },
  {
    nome: "Carlos Mendes",
    email: "carlos.mendes@email.com",
    telefone: "(11) 99999-5555",
    unidade: "Trato de Barbados",
    cpf_cnpj: "567.890.123-44",
    endereco: "Rua E, 654 - São Paulo, SP",
  },
  {
    nome: "Fernanda Lima",
    email: "fernanda.lima@email.com",
    telefone: "(11) 99999-6666",
    unidade: "BARBER BEER SPORT CLUB",
    cpf_cnpj: "678.901.234-55",
    endereco: "Rua F, 987 - São Paulo, SP",
  },
];

async function adicionarClientes() {
  try {
    console.log("🔍 Verificando clientes existentes...");

    const { data: existentes, error: checkError } = await supabase
      .from("clientes")
      .select("id, nome, unidade");

    if (checkError) {
      console.log("❌ Erro ao verificar clientes:", checkError.message);
      return;
    }

    console.log(`📊 Clientes existentes: ${existentes?.length || 0}`);

    if (existentes && existentes.length > 0) {
      console.log("📋 Clientes já cadastrados:");
      existentes.forEach((cliente, i) => {
        console.log(`  ${i + 1}. ${cliente.nome} (${cliente.unidade})`);
      });

      console.log("\n❓ Deseja adicionar mais clientes mesmo assim? (s/n)");
      // Para este script, vamos adicionar anyway
    }

    console.log("\n📝 Inserindo novos clientes...");

    const { data: inseridos, error: insertError } = await supabase
      .from("clientes")
      .insert(clientesExemplo)
      .select("id, nome, unidade");

    if (insertError) {
      console.log("❌ Erro ao inserir clientes:", insertError.message);

      // Se der erro de duplicata, vamos tentar inserir um por vez
      if (insertError.code === "23505") {
        console.log("\n🔄 Tentando inserir individualmente...");

        for (const cliente of clientesExemplo) {
          const { error: singleError } = await supabase
            .from("clientes")
            .insert([cliente]);

          if (singleError) {
            if (singleError.code === "23505") {
              console.log(`⚠️  Cliente ${cliente.nome} já existe`);
            } else {
              console.log(
                `❌ Erro ao inserir ${cliente.nome}:`,
                singleError.message
              );
            }
          } else {
            console.log(`✅ ${cliente.nome} inserido com sucesso`);
          }
        }
      }
    } else {
      console.log(
        `✅ ${inseridos?.length || 0} clientes inseridos com sucesso!`
      );

      inseridos?.forEach((cliente, i) => {
        console.log(`  ${i + 1}. ${cliente.nome} (${cliente.unidade})`);
      });
    }

    // Verificar resultado final
    console.log("\n📊 Verificando resultado final...");
    const { data: todos, error: finalError } = await supabase
      .from("clientes")
      .select("id, nome, unidade")
      .order("unidade, nome");

    if (finalError) {
      console.log("❌ Erro ao verificar resultado:", finalError.message);
    } else {
      console.log(`✅ Total de clientes no banco: ${todos?.length || 0}`);

      // Agrupar por unidade
      const porUnidade = {};
      todos?.forEach((cliente) => {
        if (!porUnidade[cliente.unidade]) {
          porUnidade[cliente.unidade] = [];
        }
        porUnidade[cliente.unidade].push(cliente.nome);
      });

      console.log("\n📋 Distribuição por unidade:");
      Object.entries(porUnidade).forEach(([unidade, nomes]) => {
        console.log(`\n${unidade} (${nomes.length} clientes):`);
        nomes.forEach((nome, i) => {
          console.log(`  ${i + 1}. ${nome}`);
        });
      });
    }

    console.log("\n🎉 Processo concluído!");
    console.log("\n💡 Agora você pode:");
    console.log("1. Testar o modal de agendamento");
    console.log("2. Verificar se os clientes aparecem separados por unidade");
    console.log("3. Fazer um novo agendamento");
  } catch (error) {
    console.log("❌ Erro geral:", error.message);
  }
}

adicionarClientes();









