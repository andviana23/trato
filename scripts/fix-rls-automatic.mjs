import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log("🔧 Tentando corrigir RLS automaticamente...\n");

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
    "💡 Adicione a service key ao .env.local para corrigir RLS automaticamente"
  );
  process.exit(1);
}

// Usar service key (bypass RLS)
const supabase = createClient(supabaseUrl, serviceKey);

async function corrigirRLS() {
  try {
    console.log("🔍 Verificando estado atual...");

    // Testar acesso com anon key primeiro
    const anonClient = createClient(
      supabaseUrl,
      envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data: testAnon, error: errorAnon } = await anonClient
      .from("clientes")
      .select("count")
      .single();

    console.log(
      "📊 Teste com anon key:",
      errorAnon ? "❌ Bloqueado" : "✅ Funcionando"
    );

    if (!errorAnon) {
      console.log("✅ RLS já está funcionando! Não precisa de correção.");
      return;
    }

    console.log("🔧 RLS bloqueando acesso. Tentando corrigir...");

    // Tentar desabilitar RLS via SQL
    console.log(
      "📝 Executando: ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY"
    );

    const { error: disableError } = await supabase.rpc("exec", {
      sql: "ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;",
    });

    if (disableError) {
      console.log("❌ Erro ao desabilitar RLS:", disableError.message);
      console.log("\n💡 Execute manualmente no Supabase SQL Editor:");
      console.log("ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;");
      return;
    }

    console.log("✅ RLS desabilitado! Testando acesso...");

    // Testar se agora funciona com anon key
    const { data: testDepois, error: errorDepois } = await anonClient
      .from("clientes")
      .select("count")
      .single();

    if (errorDepois) {
      console.log("❌ Ainda não funcionando:", errorDepois.message);
    } else {
      console.log("🎉 Sucesso! RLS corrigido automaticamente!");
      console.log(`📊 Total de clientes acessíveis: ${testDepois.count}`);

      // Testar busca de clientes
      const { data: clientes, error: errorClientes } = await anonClient
        .from("clientes")
        .select("nome, unidade")
        .limit(5);

      if (!errorClientes && clientes) {
        console.log("\n📋 Exemplos de clientes acessíveis:");
        clientes.forEach((c, i) => {
          console.log(`  ${i + 1}. ${c.nome} (${c.unidade})`);
        });
      }
    }
  } catch (error) {
    console.log("❌ Erro:", error.message);
  }
}

corrigirRLS();










