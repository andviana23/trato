import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log("🚀 Verificando Supabase Database...\n");

// Ler .env.local
const envPath = join(__dirname, "..", ".env.local");

if (!existsSync(envPath)) {
  console.log("❌ Arquivo .env.local não encontrado!");
  process.exit(1);
}

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

console.log("📋 Credenciais:");
console.log("URL:", supabaseUrl ? "✅" : "❌");
console.log("Key:", supabaseKey ? "✅" : "❌");

if (!supabaseUrl || !supabaseKey) {
  console.log("\n❌ Configure as variáveis no .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  try {
    console.log("\n🔍 Verificando conexão...");

    // Teste de conexão
    const { data: healthCheck, error: healthError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .limit(1);

    if (healthError) {
      console.log("❌ Erro de conexão:", healthError.message);
      return;
    }

    console.log("✅ Conectado ao Supabase!");

    // Verificar tabela clientes
    console.log('\n🔍 Checando tabela "clientes"...');

    const { data: tableExists, error: tableError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "clientes")
      .single();

    if (tableError && tableError.code !== "PGRST116") {
      console.log("❌ Erro ao verificar tabela:", tableError.message);
      return;
    }

    if (!tableExists) {
      console.log('❌ Tabela "clientes" não existe!');
      console.log("\n💡 Criando tabela...");

      // Tentar criar usando uma função SQL
      const createTableSQL = `
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
      `;

      console.log("📝 SQL para criar a tabela:");
      console.log(createTableSQL);
      console.log(
        "\n📋 Copie e execute este SQL no Supabase Dashboard > SQL Editor"
      );
    } else {
      console.log('✅ Tabela "clientes" existe!');

      // Verificar estrutura
      const { data: columns, error: columnsError } = await supabase
        .from("information_schema.columns")
        .select("column_name, data_type, is_nullable")
        .eq("table_schema", "public")
        .eq("table_name", "clientes")
        .order("ordinal_position");

      if (columnsError) {
        console.log("❌ Erro ao verificar colunas:", columnsError.message);
      } else {
        console.log("\n📋 Estrutura da tabela:");
        columns.forEach((col) => {
          console.log(
            `  - ${col.column_name}: ${col.data_type} ${
              col.is_nullable === "NO" ? "(NOT NULL)" : ""
            }`
          );
        });
      }

      // Verificar dados
      const {
        data: clientes,
        error: dataError,
        count,
      } = await supabase
        .from("clientes")
        .select("id, nome, unidade", { count: "exact" })
        .limit(5);

      if (dataError) {
        console.log("❌ Erro ao buscar dados:", dataError.message);
      } else {
        console.log(`\n📊 Total de clientes: ${count || 0}`);
        if (clientes && clientes.length > 0) {
          console.log("📋 Exemplos:");
          clientes.forEach((cliente, i) => {
            console.log(`  ${i + 1}. ${cliente.nome} (${cliente.unidade})`);
          });
        } else {
          console.log("📋 Tabela vazia - inserindo dados de exemplo...");

          const { error: insertError } = await supabase
            .from("clientes")
            .insert([
              {
                nome: "João Silva",
                telefone: "(11) 99999-9999",
                unidade: "Trato de Barbados",
              },
              {
                nome: "Maria Santos",
                telefone: "(11) 88888-8888",
                unidade: "Trato de Barbados",
              },
              {
                nome: "Pedro Costa",
                telefone: "(11) 77777-7777",
                unidade: "BARBER BEER SPORT CLUB",
              },
            ]);

          if (insertError) {
            console.log("❌ Erro ao inserir:", insertError.message);
          } else {
            console.log("✅ Dados de exemplo inseridos!");
          }
        }
      }
    }

    // Listar outras tabelas
    console.log("\n📋 Outras tabelas no banco:");
    const { data: allTables, error: allTablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .order("table_name");

    if (allTablesError) {
      console.log("❌ Erro ao listar tabelas:", allTablesError.message);
    } else if (allTables) {
      allTables.forEach((table, i) => {
        console.log(`  ${i + 1}. ${table.table_name}`);
      });
    }

    console.log("\n🎉 Verificação concluída!");
  } catch (error) {
    console.log("❌ Erro geral:", error.message);
  }
}

checkDatabase();









