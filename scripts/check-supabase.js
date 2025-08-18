const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

console.log("🚀 Verificando conexão com Supabase...\n");

// Ler arquivo .env.local
const envPath = path.join(__dirname, "..", ".env.local");

if (!fs.existsSync(envPath)) {
  console.log("❌ Arquivo .env.local não encontrado!");
  console.log("📝 Crie o arquivo .env.local baseado no env-exemplo.txt");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf8");
const envLines = envContent.split("\n");

let supabaseUrl = "";
let supabaseKey = "";

envLines.forEach((line) => {
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
    supabaseUrl = line.split("=")[1];
  }
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) {
    supabaseKey = line.split("=")[1];
  }
});

console.log("📋 Verificando credenciais:");
console.log("URL:", supabaseUrl ? "✅ Configurada" : "❌ Não encontrada");
console.log("Key:", supabaseKey ? "✅ Configurada" : "❌ Não encontrada");

if (!supabaseUrl || !supabaseKey) {
  console.log("\n❌ Credenciais não configuradas corretamente!");
  process.exit(1);
}

async function verificarSupabase() {
  try {
    console.log("\n🔌 Conectando ao Supabase...");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Teste 1: Verificar conexão
    console.log("🔍 Testando conexão...");
    const { data: test, error: testError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .limit(1);

    if (testError) {
      console.log("❌ Erro na conexão:", testError.message);
      return;
    }

    console.log("✅ Conexão estabelecida!");

    // Teste 2: Verificar tabela clientes
    console.log('\n🔍 Verificando tabela "clientes"...');
    const { data: colunas, error: colunasError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type")
      .eq("table_schema", "public")
      .eq("table_name", "clientes");

    if (colunasError) {
      console.log("❌ Erro ao verificar tabela:", colunasError.message);
    } else if (colunas && colunas.length > 0) {
      console.log(
        '✅ Tabela "clientes" existe com',
        colunas.length,
        "colunas:"
      );
      colunas.forEach((col) => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });

      // Verificar dados
      console.log("\n📊 Verificando dados...");
      const { data: clientes, error: dadosError } = await supabase
        .from("clientes")
        .select("id, nome, unidade")
        .limit(5);

      if (dadosError) {
        console.log("❌ Erro ao buscar dados:", dadosError.message);
      } else {
        console.log(
          `✅ ${clientes ? clientes.length : 0} clientes encontrados`
        );
        if (clientes && clientes.length > 0) {
          clientes.forEach((cliente, i) => {
            console.log(`  ${i + 1}. ${cliente.nome} (${cliente.unidade})`);
          });
        }
      }
    } else {
      console.log('❌ Tabela "clientes" não existe!');
      console.log("\n💡 Vamos criar a tabela...");

      // Criar tabela clientes
      const createSQL = `
        CREATE TABLE IF NOT EXISTS public.clientes (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          nome VARCHAR(200) NOT NULL,
          email VARCHAR(255),
          telefone VARCHAR(20),
          cpf_cnpj VARCHAR(18),
          endereco TEXT,
          data_nascimento DATE,
          observacoes TEXT,
          unidade TEXT NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_clientes_unidade ON public.clientes(unidade);
        CREATE INDEX IF NOT EXISTS idx_clientes_nome ON public.clientes(nome);
      `;

      const { error: createError } = await supabase.rpc("exec", {
        sql: createSQL,
      });

      if (createError) {
        console.log("❌ Erro ao criar tabela:", createError.message);
        console.log("\n📝 Execute manualmente no SQL Editor do Supabase:");
        console.log(createSQL);
      } else {
        console.log('✅ Tabela "clientes" criada com sucesso!');

        // Inserir dados de exemplo
        console.log("\n📝 Inserindo dados de exemplo...");
        const { error: insertError } = await supabase.from("clientes").insert([
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
            nome: "Pedro Oliveira",
            email: "pedro@teste.com",
            telefone: "(11) 77777-7777",
            unidade: "BARBER BEER SPORT CLUB",
          },
        ]);

        if (insertError) {
          console.log("❌ Erro ao inserir dados:", insertError.message);
        } else {
          console.log("✅ Dados de exemplo inseridos!");
        }
      }
    }

    // Teste 3: Listar todas as tabelas
    console.log("\n📋 Tabelas disponíveis:");
    const { data: tabelas, error: tabelasError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .order("table_name");

    if (tabelasError) {
      console.log("❌ Erro ao listar tabelas:", tabelasError.message);
    } else if (tabelas) {
      console.log(`✅ ${tabelas.length} tabelas encontradas:`);
      tabelas.forEach((t, i) => {
        console.log(`  ${i + 1}. ${t.table_name}`);
      });
    }

    console.log("\n🎉 Verificação concluída!");
  } catch (error) {
    console.log("❌ Erro:", error.message);
  }
}

verificarSupabase();










