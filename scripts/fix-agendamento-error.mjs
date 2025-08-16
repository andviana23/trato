import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log("🔧 Corrigindo erro de agendamento...\n");

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

if (!serviceKey) {
  console.log("❌ SUPABASE_SERVICE_ROLE_KEY não encontrada!");
  console.log(
    "💡 Adicione a service key ao .env.local para corrigir automaticamente"
  );
  process.exit(1);
}

// Usar service key (bypass RLS)
const supabase = createClient(supabaseUrl, serviceKey);

async function corrigirErroAgendamento() {
  try {
    console.log("🔍 Verificando estrutura da tabela profissionais...");

    // 1. Tentar acessar a tabela profissionais para ver se a coluna existe
    const { data: testProf, error: testError } = await supabase
      .from("profissionais")
      .select("capacidade_concorrente")
      .limit(1);

    if (testError) {
      if (testError.code === "42703") {
        console.log(
          "❌ Coluna capacidade_concorrente não encontrada. Criando..."
        );
      } else {
        console.log("❌ Erro ao verificar tabela:", testError.message);
        return;
      }
    } else {
      console.log("✅ Coluna capacidade_concorrente já existe");
      return;
    }

    // 2. Adicionar a coluna via SQL
    console.log("📝 Executando ALTER TABLE...");

    const { error: alterError } = await supabase.rpc("exec", {
      sql: `
        ALTER TABLE public.profissionais 
        ADD COLUMN IF NOT EXISTS capacidade_concorrente INTEGER NOT NULL DEFAULT 1;
        
        ALTER TABLE public.profissionais 
        ADD COLUMN IF NOT EXISTS unidade TEXT CHECK (unidade IN ('trato', 'barberbeer'));
        
        ALTER TABLE public.profissionais 
        ADD COLUMN IF NOT EXISTS cor TEXT;
        
        ALTER TABLE public.profissionais 
        ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;
      `,
    });

    if (alterError) {
      console.log("❌ Erro ao adicionar colunas:", alterError.message);
      console.log("\n💡 Execute manualmente no Supabase SQL Editor:");
      console.log(`
ALTER TABLE public.profissionais 
ADD COLUMN IF NOT EXISTS capacidade_concorrente INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.profissionais 
ADD COLUMN IF NOT EXISTS unidade TEXT CHECK (unidade IN ('trato', 'barberbeer'));

ALTER TABLE public.profissionais 
ADD COLUMN IF NOT EXISTS cor TEXT;

ALTER TABLE public.profissionais 
ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;
      `);
      return;
    }

    console.log("✅ Colunas adicionadas com sucesso!");

    // 3. Verificar dados na tabela profissionais
    console.log("\n🔍 Verificando dados na tabela profissionais...");
    const { data: profissionais, error: profError } = await supabase
      .from("profissionais")
      .select("id, nome, unidade, capacidade_concorrente, ativo")
      .limit(5);

    if (profError) {
      console.log("❌ Erro ao buscar profissionais:", profError.message);
    } else {
      console.log(
        `📊 ${profissionais?.length || 0} profissionais encontrados:`
      );
      if (profissionais && profissionais.length > 0) {
        profissionais.forEach((prof, i) => {
          console.log(
            `  ${i + 1}. ${prof.nome} - unidade: ${
              prof.unidade || "N/A"
            } - capacidade: ${prof.capacidade_concorrente || "N/A"}`
          );
        });
      }
    }

    // 4. Testar se o agendamento funciona agora
    console.log("\n🧪 Testando se o erro foi resolvido...");

    // Verificar se há pelo menos um profissional e um cliente
    const { data: profCount, error: profCountError } = await supabase
      .from("profissionais")
      .select("*", { count: "exact" });

    const { data: clientesCount, error: clientesCountError } = await supabase
      .from("clientes")
      .select("*", { count: "exact" });

    if (profCountError || clientesCountError) {
      console.log(
        "❌ Erro ao verificar contagens:",
        profCountError?.message || clientesCountError?.message
      );
    } else {
      console.log(`📊 Profissionais: ${profCount || 0}`);
      console.log(`📊 Clientes: ${clientesCount || 0}`);

      if ((profCount || 0) > 0 && (clientesCount || 0) > 0) {
        console.log("✅ Dados suficientes para testar agendamento");
        console.log("\n💡 Agora teste criar um agendamento no modal");
      } else {
        console.log("⚠️ Dados insuficientes para agendamento");
        if ((profCount || 0) === 0) {
          console.log("   - Adicione profissionais na tabela profissionais");
        }
        if ((clientesCount || 0) === 0) {
          console.log("   - Adicione clientes na tabela clientes");
        }
      }
    }

    console.log("\n🎉 Correção concluída!");
  } catch (error) {
    console.log("❌ Erro:", error.message);
  }
}

corrigirErroAgendamento();
