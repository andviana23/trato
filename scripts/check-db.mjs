import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log("🚀 Conectando ao Supabase...\n");

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
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("📋 Credenciais encontradas:", supabaseUrl ? "✅" : "❌");

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  try {
    console.log("🔍 Testando conexão...");

    // Teste simples - tentar acessar a tabela clientes diretamente
    const {
      data: clientes,
      error: clientesError,
      count,
    } = await supabase
      .from("clientes")
      .select("*", { count: "exact" })
      .limit(5);

    if (clientesError) {
      if (clientesError.code === "42P01") {
        console.log('❌ Tabela "clientes" não existe!');
        console.log("\n🛠️  Vou criar a tabela para você...");

        // Usar SQL direto para criar a tabela
        const { data, error } = await supabase.rpc("exec", {
          sql: `
            CREATE TABLE IF NOT EXISTS public.clientes (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              nome VARCHAR(200) NOT NULL,
              email VARCHAR(255),
              telefone VARCHAR(20),
              cpf_cnpj VARCHAR(18),
              endereco TEXT,
              data_nascimento DATE,
              observacoes TEXT,
              unidade TEXT NOT NULL,
              is_active BOOLEAN DEFAULT true,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            CREATE INDEX IF NOT EXISTS idx_clientes_unidade ON public.clientes(unidade);
            CREATE INDEX IF NOT EXISTS idx_clientes_nome ON public.clientes(nome);
          `,
        });

        if (error) {
          console.log("❌ Erro ao criar tabela:", error.message);
          console.log("\n📝 Execute manualmente no Supabase SQL Editor:");
          console.log(`
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  cpf_cnpj VARCHAR(18),
  endereco TEXT,
  data_nascimento DATE,
  observacoes TEXT,
  unidade TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_unidade ON public.clientes(unidade);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON public.clientes(nome);
          `);
        } else {
          console.log("✅ Tabela criada com sucesso!");

          // Inserir dados de exemplo
          console.log("📝 Inserindo dados de exemplo...");
          const { error: insertError } = await supabase
            .from("clientes")
            .insert([
              {
                nome: "João Silva",
                email: "joao@teste.com",
                telefone: "(11) 99999-9999",
                unidade: "Trato de Barbados",
              },
              {
                nome: "Maria Santos",
                email: "maria@teste.com",
                telefone: "(11) 88888-8888",
                unidade: "Trato de Barbados",
              },
              {
                nome: "Pedro Costa",
                email: "pedro@teste.com",
                telefone: "(11) 77777-7777",
                unidade: "BARBER BEER SPORT CLUB",
              },
              {
                nome: "Ana Oliveira",
                email: "ana@teste.com",
                telefone: "(11) 66666-6666",
                unidade: "BARBER BEER SPORT CLUB",
              },
            ]);

          if (insertError) {
            console.log("❌ Erro ao inserir dados:", insertError.message);
          } else {
            console.log("✅ Dados de exemplo inseridos!");
          }
        }
      } else {
        console.log(
          "❌ Erro ao acessar tabela clientes:",
          clientesError.message
        );
      }
    } else {
      console.log('✅ Tabela "clientes" existe!');
      console.log(`📊 Total de clientes: ${count || 0}`);

      if (clientes && clientes.length > 0) {
        console.log("\n📋 Clientes encontrados:");
        clientes.forEach((cliente, i) => {
          console.log(
            `  ${i + 1}. ${cliente.nome} - ${cliente.unidade} - ${
              cliente.telefone || "Sem telefone"
            }`
          );
        });

        // Verificar distribuição por unidade
        const { data: porUnidade, error: unidadeError } = await supabase
          .from("clientes")
          .select("unidade")
          .not("unidade", "is", null);

        if (!unidadeError && porUnidade) {
          const contagem = {};
          porUnidade.forEach((c) => {
            contagem[c.unidade] = (contagem[c.unidade] || 0) + 1;
          });

          console.log("\n📊 Distribuição por unidade:");
          Object.entries(contagem).forEach(([unidade, total]) => {
            console.log(`  - ${unidade}: ${total} clientes`);
          });
        }
      } else {
        console.log("📋 Tabela está vazia");
      }
    }

    console.log("\n🎉 Verificação concluída!");
    console.log("\n💡 Próximos passos:");
    console.log("1. Reinicie o servidor Next.js: npm run dev");
    console.log("2. Teste o modal de agendamento");
    console.log("3. Verifique se os clientes aparecem no dropdown");
  } catch (error) {
    console.log("❌ Erro:", error.message);
  }
}

main();









